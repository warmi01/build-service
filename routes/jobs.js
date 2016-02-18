var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var parser = require('xml2json');

var jenkinsPort = process.env.JENKINS_SERVICE_PORT || 8080;
var jenkinsHost = process.env.JENKINS_SERVICE_HOST || '127.0.0.1';
var host = 'http://' + jenkinsHost + ':' + jenkinsPort;
var jenkins = require('jenkins')(host);

var colorMap = {
	notbuilt: 'CI_New',
	notbuilt_anim: 'CI_Running',
	aborted: 'CI_Aborting',
	blue: 'CI_Passing',
	red: 'CI_Failing'
};

var resultMap = {
	ABORTED: 'CI_Aborting',
	SUCCESS: 'CI_Passing',
	FAILURE: 'CI_Failing',
	RUNNING: 'CI_Running', // note: actual result value will be null when running
	null: 'CI_Running'
};

// get protocol+host+port
function getHostPath(req) {
	return req.protocol + '://' + req.get('Host');
}

// get job root
function getJobPath(req, name) {
	return getHostPath(req) + '/jobs/' + name;
}

// get get build root
function getBuildPath(req, name, number) {
	return getJobPath(req, name) + '/builds/' + number;
}

// GET list of jobs
router.get('/', function(req, res, next) {
	
  var json = { jobs: [], 'jenkins-jobs': [] };

  jenkins.job.list(function(err, data) {
    if (err) next(err);
    
    console.log('job list', data);
    
    // Build json result
    data.forEach(function(item) {
    	var job = {};
    	job.name = item.name;
    	job.url = getJobPath(req, item.name);
    	job['build-status'] = (colorMap[item.color] === undefined ? colorMap.notbuilt : colorMap[item.color]);
    	json.jobs.push(job);
    });
    
    json['jenkins-jobs'] = data;
    
    res.send(json);
  });

});

// POST job (create)
/*
  examples of properties and jobparm
		"properties":{
		  "hudson.model.ParametersDefinitionProperty":{
		    "parameterDefinitions":{
		      "hudson.model.StringParameterDefinition":{
		         "name":{"$t":"CI_EVENT_CALLBACK"},
		         "description":{"$t":"Build event callback URL"},
		         "defaultValue":{"$t":"http://platformcentral/buildevent"}
		      }
		    }
		  }
		},

		 "jobparms": [
				{
					"type": "string",
					"name": "CI_EVENT_CALLBACK",
					"description": "Build event callback URL",
					"value": "https://platformcentral/buildevent123/"
				}
         ]
*/
router.post('/:name', function(req, res, next) {
	var hudsonModelParm = "hudson.model.ParametersDefinitionProperty";
    var hudsonModelStrParm = "hudson.model.StringParameterDefinition";
    var hudsonModelTextParm = "hudson.model.TextParameterDefinition"
    var jobparms = req.body.jobparms;
    var defStatement;

	if (req.body.giturl == null || req.body.scriptpath == null || req.body.jobparms == null) {
		var err = new Error('Invalid or missing required parameter');
		err.status = 400;
		return next(err);
	}
	
    var sampleXml = path.join(__dirname, 'config.xml');

    fs.stat(sampleXml, function(err, stats) { 
	    if (err) return next(err);
    
	    var xmlOutput = fs.readFileSync(sampleXml);
		var jsonOutput = parser.toJson(xmlOutput, {reversible: true, sanitize: false, coerce: true, object: true});
	
		//replace url and scriptpath with values from request
		jsonOutput["flow-definition"].definition.scm.userRemoteConfigs["hudson.plugins.git.UserRemoteConfig"].url.$t = req.body.giturl;
		jsonOutput["flow-definition"].definition.scriptPath.$t = req.body.scriptpath;
	
		 if (jobparms.length > 0 && jsonOutput["flow-definition"].properties[hudsonModelParm] == null) {
        	jsonOutput["flow-definition"].properties[hudsonModelParm] = {"parameterDefinitions" : {}};
        }
        //replace jobparms with values from request
		for (var i = 0; i < jobparms.length; i++) {
			var defStatement = {"name":{"$t":jobparms[i].name},
		                        "description":{"$t":jobparms[i].description},
		                        "defaultValue":{"$t":jobparms[i].value}};

		    if (jobparms[i].type == "string") {
		    	if (jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelStrParm] == null) {
					jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelStrParm] = [defStatement];		
				}
				else {
					jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelStrParm].push(defStatement);
				}			
		    }
		    else if (jobparms[i].type == "text") {
		    	if (jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelTextParm] == null) {
						jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelTextParm] = [defStatement];
				}
				else {
					jsonOutput["flow-definition"].properties[hudsonModelParm].parameterDefinitions[hudsonModelTextParm].push(defStatement);
				}
		    }
			
		}

		xmlOutput = parser.toXml(jsonOutput);
	
		// create job
		jenkins.job.create(req.params.name, xmlOutput, function(err, data) {
			if (err) return next(err);
	
			// run job
		    runJob(req.params.name, function(err, data) {
				if (err) return next(err);
			    
			    var json = {job: {}, build: {}};
			    
			    json.job.url = getJobPath(req, req.params.name);
		    	json.build.url = getBuildPath(req, req.params.name, data.nextBuildNumber);				    	

				res.send(json);
		    });
	   	});
    });
 });

// start a job build (run)
/*
example of property from job data
"property":[
      {"parameterDefinitions":
         [{"defaultParameterValue":{"name":"CI_EVENT_CALLBACK","value":"http://platformcentral/buildevent"},
           "description":"Build event callback URL",
           "name":"CI_EVENT_CALLBACK",
           "type":"StringParameterDefinition"}
         ]
      }
  ],
*/
function runJob (jobname, callback) {

	// get job next build number
	jenkins.job.get(jobname, function(err, data) {		
		if (err) return callback(err, data);

        var dataproperty = data.property;

		var pset = {};

		for (var i = 0; i < dataproperty.length; i++) {
			var pdefinitions = data.property[i].parameterDefinitions;

            if (pdefinitions != null) {
            	for (var j = 0; j < pdefinitions.length; j++) {
					var parmName = data.property[i].parameterDefinitions[0].defaultParameterValue.name;
	        		var parmValue = data.property[i].parameterDefinitions[0].defaultParameterValue.value;
	        		pset.parmName = parmValue;
	        	}
            }
		}

		var options = {
			parameters : pset
			
		};

		jenkins.job.build(jobname, options, function(err) {
			callback(err, data);
		});
	});
}

// POST job build (run)
router.post('/:name/builds', function(req, res, next) {

    runJob(req.params.name, function(err, data) {
	    if (err) return next(err); 

	    var json = {build: {}};

	    json.build.url = getBuildPath(req, req.params.name, data.nextBuildNumber);				    	

		res.send(json);
    });
});

// DELETE job
router.delete('/:name', function(req, res, next) {

	jenkins.job.destroy(req.params.name, function(err) {
		if (err) return next(err);
		
		res.send();
	});
});

// GET job
router.get('/:name', function(req, res, next) {

    var json = { 'job': {}, builds: [], 'config': {}, 'jenkins-job': {} };
    
	jenkins.job.get(req.params.name, function(err, data) {		
		if (err) return next(err);

		json.job.name = data.name;
    	json['builds'] = data.builds;
    	json['jenkins-job'] = data;
	    //json['config'] =

	    res.send(json);
	});
});

// GET job build
router.get('/:name/builds/:number', function(req, res, next) {

	var json = { 'number': '', status: '', 'jenkins-build': [] };

    //console.log('get build:' + req.params.name + "/" + req.params.number);
	jenkins.build.get(req.params.name, req.params.number, function(err, data) {
		if (err) return next(err);

        json.number = data.number;
        json.status = (resultMap[data.result] === undefined ? resultMap.RUNNING : resultMap[data.result]);
        json['jenkins-build'] = data;
        
	    //console.log('build:' + req.params.name + "/" + req.params.number, data);
	    res.send(json);
	});

});

module.exports = router;
