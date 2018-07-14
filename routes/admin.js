let controller = require('../controllers/admin');
let passport = require('passport');

module.exports = (app, router) => {
//  router.use(app.locals.middlewares['activeDirectory'].handler);

  router.all('/login', app.locals.middlewares['activeDirectory'].loginHandler, controller.login);
  router.all('/refreshCaches', app.locals.middlewares['activeDirectory'].handler, controller.refreshCaches);
  router.all('/getCaches', app.locals.middlewares['activeDirectory'].handler, controller.getCaches);
/*
  router.all('/find/:term?', controller.find);
  router.all('/discounts', controller.discounts);
  router.all('/unitTypePriceList', controller.unitTypePriceList);
  router.all('/siteInfo', controller.siteInfo);
*/

  router.get('/auth/openid',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    function(req, res) {
      log.info('Authentication was called in the Sample');
      res.redirect('/');
  });
  router.all('/auth/openid/return', app.locals.middlewares['activeDirectory'].authReturnHandler, controller.authReturn);
  router.all(['/', '/index', '/home'], app.locals.middlewares['activeDirectory'].handler, controller.index);

  router.post('/saveLocationInfo', app.locals.middlewares['activeDirectory'].handler, controller.saveLocationInfo);
  router.post('/signS3', app.locals.middlewares['activeDirectory'].handler, controller.signS3);

  router.all('/logout', controller.logout);


  return {
    prefixes: ['/nimda/'],
    router: router
  }
}
