var express = require('express');
var router = express.Router();
var request = require('request');
var callingCountries = require('country-data').callingCountries;
var async = require('async');
var utils = require('./utils');
var NodeCache = require("node-cache");
var _ = require('underscore');

router.get('/userInfo', utils.isLoggedIn, function(req, res, next) {
  var apiUserId = res.locals.currentUser.apiBrowsername;
  var options = {
    url: process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users/' + apiUserId,
    method: 'GET',
    headers: utils.sip2webrtcApiHeaders
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      return res.status(200).json(body);
    } else {
      console.log(error);
      return res.status(400).json();
    }
  }

  request(options, callback);
});

router.post('/createUser', utils.isLoggedIn, function(req, res, next) {
  var apiBrowserUsername;
  var account = res.locals.currentUser;

  if(req.body)
    apiBrowserUsername = req.body.apiBrowserUsername;
  else
    return res.status(400).json();

  utils.createUser(account, apiBrowserUsername, function(){
    console.log("insidecallbaaaaaaaaack");
    return res.status(200).json();
  });


});

router.put('/editUser', utils.isLoggedIn, function(req, res, next) {
  var apiUserId = res.locals.currentUser.apiBrowsername;
  var options = {
    url: process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users/' + apiUserId,
    method: 'PUT',
    headers: utils.sip2webrtcApiHeaders,
    json: req.body
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      return res.status(200).json(body);
    } else {
      return res.status(400).json();
    }
  }

  request(options, callback);
});

module.exports = router;
