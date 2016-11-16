var mongoose = require('mongoose');
var dbURI = process.env.MONGODB_URI || 'mongodb://localhost/sip-webrtcDB';
var Account = require('../models/account');

mongoose.connect(dbURI);

//Check for demo user for testing purposes
Account.findOne({email: "demo.user@sip2webr.tc"}, function (err, demoAccount) {
  if (!demoAccount) {
    console.log("Generating demo user...");
    demoAccount = new Account(
      {
        email: "demo.user@sip2webr.tc",
        verified: true,
        first_name: "Demo",
        last_name: "User",
        company: "Voxbone",
        phone: "+5555555",
        referrer: "no-referer",
        temporary: false
      }
    );
    demoAccount.password = demoAccount.generateHash("password");
    demoAccount.save(function (err) {
      if(err)
          console.log("Demo user couldnt be generated");
    });
  }
});

module.exports = dbURI;
