var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var jenkins = require('jenkins')('http://localhost:8080');

// GET list of jobs
router.get('/', function(req, res, next) {

  jenkins.job.list(function(err, data) {
    if (err) throw err;

    console.log('job list', data);
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.send(data);
  });

});

//POST job (create)
router.post('/:name', function(req, res, next) {
	var xml = "";

	jenkins.job.create(req.params.name, xml, function(err) {
		  if (err) throw err;
	    //console.log('job:' + req.params.name, data);
	    //res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    //res.send(data);
	  });

	});

//POST job build (run)
router.post('/:name/builds', function(req, res, next) {

	jenkins.job.build(req.params.name, function(err) {
	    if (err) throw err;
	    //console.log('job:' + req.params.name, data);
	    //res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    //res.send(data);
	  });

	});

// DELETE job
router.delete('/:name', function(req, res, next) {

	  jenkins.job.destroy(req.params.name, function(err) {
	    if (err) throw err;
	    //console.log('job:' + req.params.name, data);
	    //res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    //res.send(data);
	  });

	});

// GET job
router.get('/:name', function(req, res, next) {

	  jenkins.job.get(req.params.name, function(err, data) {
	    if (err) throw err;

	    console.log('job:' + req.params.name, data);
	    res.setHeader("Content-Type", "application/json;charset=UTF-8");
	    res.send(data);
	  });

	});

// GET job build
router.get('/:name/builds/:number', function(req, res, next) {

	  jenkins.build.get(req.params.name, req.params.number, function(err, data) {
	    if (err) throw err;

	    console.log('build:' + req.params.name + "/" + req.params.number, data);
	    res.send(data);
	  });

	});

/*
router.get('/config/:name', function(req, res, next) {

  jenkins.job.config(req.params.name, function(err, data) {
    if (err) throw err;

    console.log('xml:' + req.params.name, data);
    res.setHeader('Content-Type', 'application/xml');
    res.send(data);
  });

});
*/

module.exports = router;
