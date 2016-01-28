var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var http = require('http');
var jenkins = require('jenkins')('http://localhost:8080');

router.get('/', function(req, res, next) {

  jenkins.job.list(function(err, data) {
    if (err) throw err;

    console.log('job list', data);
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.send(data);
  });

});

router.get('/:name', function(req, res, next) {

  jenkins.job.get(req.params.name, function(err, data) {
    if (err) throw err;

    console.log('job:' + req.params.name, data);
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.send(data);
  });

});

router.get('/config/:name', function(req, res, next) {

  jenkins.job.config(req.params.name, function(err, data) {
    if (err) throw err;

    console.log('xml:' + req.params.name, data);
    res.setHeader('Content-Type', 'application/xml');
    res.send(data);
  });

});



module.exports = router;
