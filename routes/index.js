var pjson = require('../package.json');
var express = require('express');
var router = express.Router();
var utils = require('./utils');
var Account = require('../models/account');
var request = require('request');
var Voxbone = require('voxbone-webrtc');

//Your Voxbone WebRTC credentials
var voxrtc_username = process.env.VOXBONE_WEBRTC_USERNAME;
var voxrtc_secret = process.env.VOXBONE_WEBRTC_PASSWORD;

//Agent WebRTC credentials
var agent_username = process.env.AGENT_WEBRTC_USERNAME;
var agent_password = process.env.AGENT_WEBRTC_PASSWORD;

//New Voxbone Object used for authentication
var voxbone = new Voxbone({
    voxrtcUsername: voxrtc_username,
    voxrtcSecret: voxrtc_secret
});

// Redirects if not HTTPS
router.get('*', function (req, res, next) {
  if (process.env.FORCE_HTTPS == 'true' && process.env.APP_URL && req.headers['x-forwarded-proto'] != 'https')
    res.redirect(process.env.APP_URL + req.url);
  else
    next();
});

router.get('/', function (req, res, next) {
  res.render('home');
});

router.get('/ping', function (req, res, next) {
  res.json({ 'ping': Date.now(), 'version': pjson.version });
});

router.get('/edit-SIP', utils.isLoggedIn, function (req, res, next) {
  res.render('edit-sip');
});

router.get('/edit-notifications', utils.isLoggedIn, function (req, res, next) {
  res.render('edit-notifications');
});

router.get('/phone', utils.isLoggedIn, function (req, res, next) {
  var ringtone = res.locals.currentUser.ringtone;
  voxrtc_config = voxbone.generate();
  vox_username = voxrtc_username;
  vox_password = voxrtc_secret;
  res.render('phone', {
    ringtone: ringtone,
    agent_username: agent_username,
    agent_password: agent_password
  });
});

module.exports = router;
