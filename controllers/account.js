let getBaseModel = require('../models/baseModel');
let basePartial = require('../models/basePartial');
let config = require('../config/config');
let alasql = require('alasql');
let soap = require('./soap');
let ses = require('./aws/ses');

let controller = {
  accounts: {
    'm.honnatti@gmail.com': {
      email: 'm.honnatti@gmail.com',
      tenantId: 1234567,
      password: 'leanburn',
      firstName: 'Manish',
      lastName: 'Honnatti'
    }
  },
  checkSession: (req, res, next) => {
    if(!req.session || !req.session.user) {
      req.flash('loginMessage', 'Please Login.');
      req.flash('loginSuccessRedirect', req.app.locals.getSameDomainCurrentUrl(req));
      res.redirect('/account/login');
    } else if((new Date()).getTime() - req.session.user.ts > config.session.cookieTTL) {
      req.flash('loginMessage', 'Your session has expired. Please login again.');
      req.flash('loginSuccessRedirect', req.app.locals.getSameDomainCurrentUrl(req));
      res.redirect('/account/login');
    } else {
      next();
    }


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
  login: (req, res) => {
    let model = baseModel(req);

    let partial1 = basePartial('account/login');
    partial1.model.imgSrc = 'man-store-space-box.jpg';
    if(req.flash('loginMessage')) partial1.model.msg = req.flash('loginMessage');
    if(req.flash('loginSuccessRedirect')) partial1.model.r = req.flash('loginSuccessRedirect');
//    req.flash('loginSuccessRedirect', req.app.locals.getSameDomainCurrentUrl(req));

//    if(message) partial1.model.msg = message;
    model.body.push(partial1);

    res.render('home/index', model);
  },
  doLogin: (req, res) => {
    console.log(req.body);
    let user = controller.accounts[req.body.email];

    if(user && req.body.password === user.password){
      req.session.user = {
        email: user.email,
        tenantId: user.tenantId,
        ts: (new Date()).getTime()
      }

      res.redirect(req.body.r ? req.body.r : '/');
    } else {
      console.logger.debug('invalid login');
      req.flash('loginMessage', 'Invalid Login. Please try again.');
      req.flash('loginSuccessRedirect', req.query.r);
      return res.redirect('/account/login')
    }
  },
  create: (req, res) => {
    let model = baseModel(req);

    let partialModel = {
      mode: 'create',
      heading: 'Create Account'
    };

    let partial1 = basePartial('account/createEdit', partialModel);
    partial1.model.imgSrc = 'man-store-space-box.jpg';
//    if(req.flash('loginMessage')) partial1.model.msg = req.flash('loginMessage');
//    if(req.flash('loginSuccessRedirect')) partial1.model.r = req.flash('loginSuccessRedirect');
//    req.flash('loginSuccessRedirect', req.app.locals.getSameDomainCurrentUrl(req));

//    if(message) partial1.model.msg = message;
    model.body.push(partial1);

    res.render('home/index', model);
  },
  doCreate: (req, res) => {
    let model = baseModel(req);

    let partial1 = basePartial('account/createEditThanks');
    partial1.model.imgSrc = 'man-store-space-box.jpg';
    partial1.model.heading = 'Create Account';
    model.body.push(partial1);

    res.render('home/index', model);
  },

  logout: (req, res) => {
    if (req.session) {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
          return res.redirect('/account');
        }
      });
    }
  },
  index: (req, res) => {
    res.json(req.session);
  },
  underConstruction: (req, res) => {
    let model = {
      metaKeywords: "",
      metaDescription: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogUrl: "",
      pageTitle: "Store Space",
      disableHeader: false,
      disableFooter: false
    }
    return res.render('home/underConstruction', model);
  }
}

module.exports = controller;
