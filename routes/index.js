var pjson = require('../package.json');
var express = require('express');
var router = express.Router();
var utils = require('./utils');
var Account = require('../models/account');
var Demo = require('../models/demo');
var request = require('request');
var Voxbone = require('voxbone-webrtc');

//Your Voxbone WebRTC credentials
var voxrtc_username = process.env.VOXBONE_WEBRTC_USERNAME;
var voxrtc_secret = process.env.VOXBONE_WEBRTC_PASSWORD;

//New Voxbone Object used for authentication
var voxbone = new Voxbone({
    voxrtcUsername: voxrtc_username,
    voxrtcSecret: voxrtc_secret
});

// Required for auto Let's Encrypt cert generation
// https://github.com/dmathieu/sabayon
router.get('/.well-known/acme-challenge/:acmeToken', function(req, res, next) {
  var acmeToken = req.params.acmeToken;
  var acmeKey;

  if (process.env.ACME_KEY && process.env.ACME_TOKEN) {
    if (acmeToken === process.env.ACME_TOKEN) {
      acmeKey = process.env.ACME_KEY;
    }
  }

  for (var key in process.env) {
    if (key.startsWith('ACME_TOKEN_')) {
      var num = key.split('ACME_TOKEN_')[1];
      if (acmeToken === process.env['ACME_TOKEN_' + num]) {
        acmeKey = process.env['ACME_KEY_' + num];
      }
    }
  }

  if (acmeKey) res.send(acmeKey);
  else res.status(404).send();
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
  res.render('edit-sip', {
    voxbone_webrtc_username: voxrtc_username
  });
});

router.get('/edit-notifications', utils.isLoggedIn, function (req, res, next) {
  res.render('edit-notifications');
});

router.get('/phone', utils.isLoggedIn, function (req, res, next) {
  var ringtone = res.locals.currentUser.ringtone;
  var uemail = res.locals.currentUser.email;
  voxrtc_config = voxbone.generate();
  vox_username = voxrtc_username;
  vox_password = voxrtc_secret;
  res.render('phone', {
    voxbone_webrtc_username: voxrtc_username,
    ringtone: ringtone,
    apiBrowsername: res.locals.currentUser.apiBrowsername,
    email: uemail
  });
});

router.get('/demo', function (req, res, next) {
  Demo
    .findOne({})
    .sort({'updated_at': 1})
    .exec(function (err, theDemo) {

      if (!theDemo) {
        return res.status(400).json("Demo does not exist");
      }

      theDemo.save(function (err) {
        if (err) throw err;
      });
      voxrtc_config = voxbone.generate();
      vox_username = voxrtc_username;
      vox_password = voxrtc_secret;
      res.render('demo', {
        voxbone_webrtc_username: voxrtc_username,
        apiBrowsername: theDemo.name,
        ringtone: 'office',
        widget_id: theDemo.widget_id,
        internal_sip: theDemo.sip
      });
  });
});

module.exports = router;
