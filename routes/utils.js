var _ = require('lodash');

// Here it goes only utility methods
module.exports = {

  sip2webrtcApiHeaders: {
    'Authorization': 'Basic ' + process.env.SIP_TO_WEBRTC_API_BASIC_AUTH,
    'Content-Type': 'application/json'
  },

  isLoggedIn: function(req, res, next) {
    if (req.isAuthenticated())
      return next();
    res.redirect('/');
  },

  redirectIfLoggedIn: function(req, res, next) {
    if (req.isAuthenticated())
      return res.redirect('/edit-sip');
    return next();
  },

  accountLoggedIn: function(req) {
    return req.isAuthenticated();
  },

  userGravatarUrl: function(res) {
    var crypto = require('crypto');
    var md5_email = crypto.createHash('md5').update(res.locals.currentUser.email).digest("hex");
    return "https://www.gravatar.com/avatar/" + md5_email + "/?s=20&d=mm";
  },

  objectNotFound: function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  },

  uuid4: function() {
    // I leave this approach commented out just for general culture :)
    // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    //     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    //     return v.toString(16);
    // });

    function b(a) {
      return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
    }
    return b();
  },

  createUser: function(account) {
    var request = require('request');
    var async = require('async');
    var utils = this;
    var apiBrowserUsername = utils.uuid4();
    var userData = { browserUsername: apiBrowserUsername  };
    account.apiBrowsername = apiBrowserUsername;

    var url = process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users';
    request.post(url, {
        headers: utils.sip2webrtcApiHeaders,
        body: JSON.stringify(userData)
      },
      function(err, response, body) {
        console.log(apiBrowserUsername);
        account.api_browser_username = apiBrowserUsername;
        account.save();
      }
    );
  },

  getVoxRoutes: function() {
    var app = require('../app');
    var routes = [];

    _.each(app._voxPaths, function(used) {
      // On each route of the router
      _.each(used.router.stack, function(stackElement) {
        if (stackElement.route) {
          var base = used.urlBase;
          var path = stackElement.route.path;

          routes.push({
            method: stackElement.route.stack[0].method,
            path: (used.urlBase === '/') ? path : (base + path)
          });
        }
      });
    });

    return routes;
  }
};
