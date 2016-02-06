var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var parser = require('xml2json');
var jenkins = require('jenkins')('http://localhost:8080');

// GET list of jobs
router.get('/', function(req, res, next) {

  jenkins.job.list(function(err, data) {
    if (err) next(err);
    
    console.log('job list', data);
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.send(data);
  });

});

//POST job (create)
router.post('/:name', function(req, res, next) {
    var sampleXml = path.join(__dirname, 'config.xml');
	var data = fs.readFileSync(sampleXml);

	var jsonOutput = parser.toJson(data, {reversible: true, sanitize: false, coerce: true, object: true});
	
	//replace with values from request
	jsonOutput["flow-definition"].definition.scm.userRemoteConfigs["hudson.plugins.git.UserRemoteConfig"].url.$t = req.body.giturl;
    jsonOutput["flow-definition"].definition.scriptPath.$t = req.body.scriptpath;
	
	var xmlOutput = parser.toXml(jsonOutput);

	jenkins.job.create(req.params.name, xmlOutput, function(err, data) {
	    if (err) throw err;

	    //console.log('create job data:', data);
	    res.setHeader("Content-Type", "application/xml");
	    res.send(data);
   	});
});


//POST job build (run)
router.post('/:name/builds', function(req, res, next) {

	jenkins.job.build(req.params.name, function(err) {
    	    if (err) next(err);
	    //console.log('job:' + req.params.name, data);
	    //res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    //res.send(data);
	  });

	});

// DELETE job
router.delete('/:name', function(req, res, next) {

	  jenkins.job.destroy(req.params.name, function(err) {
	    if (err) next(err);
	    //console.log('job:' + req.params.name, data);
	    //res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    //res.send(data);
	  });

	});

// GET job
router.get('/:name', function(req, res, next) {

	  jenkins.job.get(req.params.name, function(err, data) {
    	    if (err) next(err);

	    console.log('job:' + req.params.name, data);
	    res.setHeader("Content-Type", "application/json;charset=UTF-8");
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

/*
router.get('/config/:name', function(req, res, next) {

  jenkins.job.config(req.params.name, function(err, data) {
    if (err) next(err);

    console.log('xml:' + req.params.name, data);
    res.setHeader('Content-Type', 'application/xml');
    res.send(data);
  });

});
*/

module.exports = router;
