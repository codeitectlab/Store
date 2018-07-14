let controller = require('../controllers/account');

module.exports = (app, router) => {
  router.all('/login', controller.login);
  router.all('/doLogin', controller.doLogin);
  router.all(['/', '/index', '/home'], controller.checkSession, controller.index);
  router.all('/logout', controller.logout);
  router.all('/create', controller.create);
  router.all(['/thanks', '/doCreate'], controller.doCreate);

  return {
    prefixes: ['/account/'],
    router: router
  }
}
