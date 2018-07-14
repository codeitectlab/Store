let config = require('../config/config');
let dynamo = require('../controllers/aws/dynamodb');

let middleware = {
  isGlobal: false,
  sessionCookieTTL: 60 * 1000, // 1minute in ms
  handler: (req, res, next) => {
    if(
      !req.session
      || !req.session.user
      || (new Date()).getTime() - req.session.user.ts > config.session.cookieTTL) {
      return res.redirect('/account/login?r=' + req.app.locals.getSameDomainCurrentUrl(req));
//      return middleware.loginHandler(req, res, next);
    }

    next();

/*
    if (req.session && req.session.user) {
      dynamo.find
      User.findOne({ email: req.session.user.email }, function(err, user) {
        if (user) {
          req.user = user;
          delete req.user.password; // delete the password from the session
          req.session.user = user;  //refresh the session value
          res.locals.user = user;
        }
        // finishing processing the middleware and run the route
        next();
      });
    } else {
      next();
    }
  */  },
  loginHandler : (req, res, next) => {
    if (!req.user) {
      res.redirect('/account/login?r=' + req.app.locals.getSameDomainCurrentUrl(req));
    } else {
      next();
    }
  }
}

module.exports = middleware;
