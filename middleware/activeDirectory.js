var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
var passport = require('passport');
var config = require('../config/config');
var url = require('url');

var getCurrentUrl = function(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}

passport.serializeUser(function(user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
  findByOid(oid, function (err, user) {
    done(err, user);
  });
});

//var users = [{oid: 'b4763d35-d4d6-42a3-98d9-91e5793564c3'}];
var users = [];

var findByOid = function(oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    console.logger.info('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

var findByEmail = function(email, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
   log.info('we are using user: ', user);
    if (user.email === email) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

passport.use(new OIDCStrategy({
  identityMetadata: config.azuread.identityMetadata,
  clientID: config.azuread.clientID,
  responseType: config.azuread.responseType,
  responseMode: config.azuread.responseMode,
  redirectUrl: `https://${config.host}${config.azuread.redirectUri}`,
  allowHttpForRedirectUrl: config.azuread.allowHttpForRedirectUrl,
  clientSecret: config.azuread.clientSecret,
  validateIssuer: config.azuread.validateIssuer,
  isB2C: config.azuread.isB2C,
  issuer: config.azuread.issuer,
  passReqToCallback: config.azuread.passReqToCallback,
  scope: config.azuread.scope,
  loggingLevel: config.azuread.loggingLevel,
  nonceLifetime: config.azuread.nonceLifetime,
  nonceMaxAmount: config.azuread.nonceMaxAmount,
  useCookieInsteadOfSession: config.azuread.useCookieInsteadOfSession,
  cookieEncryptionKeys: config.azuread.cookieEncryptionKeys,
  clockSkew: config.azuread.clockSkew,
},
function(iss, sub, profile, accessToken, refreshToken, done) {
  if (!profile.oid) {
    return done(new Error("No oid found"), null);
  }
  // asynchronous verification, for effect...
  process.nextTick(function () {
    findByOid(profile.oid, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        console.logger.debug("Auto-registration");
        users.push(profile);
        user = profile;
      }

      return done(null, user);
    });
  });
}
));


module.exports = {
  isGlobal: false,
  handler: (req, res, next) => {
    if(req.isAuthenticated()) return next();

    return res.redirect('/nimda/login?u=' + getCurrentUrl(req));
  },
  loginHandler: passport.authenticate('azuread-openidconnect', {failureRedirect: '/nimda/login'}),
  authReturnHandler: passport.authenticate('azuread-openidconnect', {failureRedirect: '/nimda'})
}
