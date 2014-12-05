//
// a mechanism to intercept emails sent to addressing including
// the string "intercept", storing them in an array that can then
// be retrieved using the getInterceptedEmails method
//
var interceptedEmails = {}; // (email address) -> (array of options)

// add html email templates that just contain the url
Accounts.emailTemplates.resetPassword.html = 
  Accounts.emailTemplates.enrollAccount.html =
  Accounts.emailTemplates.verifyEmail.html = function (user, url) {
    return url;
  };

// override the from address and return the users email
Accounts.emailTemplates.resetPassword.from =
  Accounts.emailTemplates.enrollAccount.from =
    Accounts.emailTemplates.verifyEmail.from = function (user) {
      return user.emails[0].address;
    };

EmailTest.hookSend(function (options) {
  var to = options.to;
  if (to.indexOf('intercept') === -1) {
    return true; // go ahead and send
  } else {
    if (!interceptedEmails[to])
      interceptedEmails[to] = [];

    interceptedEmails[to].push(options);
    return false; // skip sending
  }
});

Meteor.methods({
  getInterceptedEmails: function (email) {
    check(email, String);
    return interceptedEmails[email];
  },

  addEmailForTestAndVerify: function (email) {
    check(email, String);
    Meteor.users.update(
      {_id: this.userId},
      {$push: {emails: {address: email, verified: false}}});
    Accounts.sendVerificationEmail(this.userId, email);
  },

  createUserOnServer: function (email) {
    check(email, String);
    var userId = Accounts.createUser({email: email});
    Accounts.sendEnrollmentEmail(userId);
    return Meteor.users.findOne(userId);
  }
});
