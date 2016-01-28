var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var http = require('http');
var jenkins = require('jenkins')('http://localhost:8080');

router.get('/:name/:number', function(req, res, next) {
console.log('name:' + req.params.name);
console.log('number:' +req.params.number);

  jenkins.build.get(req.params.name, req.params.number, function(err, data) {
    if (err) throw err;

    console.log('build:' + req.params.name + "/" + req.params.number, data);
    res.send(data);
  });

});


module.exports = router;
