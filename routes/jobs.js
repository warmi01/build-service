var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var parser = require('xml2json');
var host = "http://localhost:8080";
var jenkins = require('jenkins')(host);
//var jenkins = require('jenkins')('http://192.168.99.100:8080');

var CI_NEW 	   = 'CI_New',
	CI_RUNNING = 'CI_Running',
	CI_PASSING = 'CI_Passing',
	CI_FAILING = 'CI_Failing';

var NOTBUILT   	  = 'notbuilt',
	NOTBUILT_ANIM = 'notbuilt_anim',
	BLUE	   	  = 'blue',
	RED	   		  = 'red',
	ABORTED	   	  = 'aborted';

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
    	job.url = host + '/jobs/' + item.name;
    	job['build-status'] = buildStatus(item.color);
    	json.jobs.push(job);
    });
    
    json['jenkins-jobs'] = data;
    
    res.send(json);
  });

});

function buildStatus(color) {
	switch (color) {
	case NOTBUILT:
		return CI_NEW;
	case NOTBUILT_ANIM:
		return CI_RUNNING;
	case BLUE:
		return CI_PASSING;
	case RED:
		return CI_FAILING;
	case ABORTED:
		return CI_FAILING;
	default:
		return CI_NEW;
	}
}

//POST job (create)
router.post('/:name', function(req, res, next) {
	if (req.body.giturl == null || req.body.scriptpath == null) {
		throw new Error('git url or scriptpath is not defined');
	}
    var sampleXml = path.join(__dirname, 'config.xml');

    try
    {
        fs.statSync(sampleXml);
    }
    catch (e)
    {
        console.log(e);
        throw new Error('template file config.xml is not found');
    }
    var data = fs.readFileSync(sampleXml);

	var jsonOutput = parser.toJson(data, {reversible: true, sanitize: false, coerce: true, object: true});

	//replace with values from request
	jsonOutput["flow-definition"].definition.scm.userRemoteConfigs["hudson.plugins.git.UserRemoteConfig"].url.$t = req.body.giturl;
	jsonOutput["flow-definition"].definition.scriptPath.$t = req.body.scriptpath;

	var xmlOutput = parser.toXml(jsonOutput);

	jenkins.job.create(req.params.name, xmlOutput, function(err, data) {
	    if (err) throw err;

	    //res.send(data);

	    //start a job build
	    runJob(req.params.name);
   	});
});

//start a job build (run)
function runJob (jobname) {
	//console.log('in runJob jobname=', jobname);
	jenkins.job.build(jobname, function(err) {
  		if (err) throw err;
	});
}


//POST job build (run)
router.post('/:name/builds', function(req, res, next) {

	jenkins.job.build(req.params.name, function(err) {
    	    if (err) next(err);
	  });

	});

// DELETE job
router.delete('/:name', function(req, res, next) {

	  jenkins.job.destroy(req.params.name, function(err) {
	    if (err) next(err);
	  });

	});

// GET job
router.get('/:name', function(req, res, next) {

	  jenkins.job.get(req.params.name, function(err, data) {
    	    if (err) next(err);

	    console.log('job:' + req.params.name, data);
	    res.send(data);
	  });

	});

// GET job build
router.get('/:name/builds/:number', function(req, res, next) {

	  jenkins.build.get(req.params.name, req.params.number, function(err, data) {
    	    if (err) next(err);

	    console.log('build:' + req.params.name + "/" + req.params.number, data);
	    res.send(data);
	  });

	});

module.exports = router;
