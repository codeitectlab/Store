let controller = require('../controllers/reserve');

module.exports = (app, router) => {
  router.all(['/', '/index', '/home'], controller.index);
  router.all('/info', controller.baseInfo);
  router.all('/insurance', controller.insurance);
//  router.all('/date', controller.dates);
  router.all('/online', controller.online);
  router.all('/online-esign', controller.esign);
  router.all('/done-signing/:id?', controller.doneSigning);
  router.post('/check-signed', controller.checkSigned);
  router.all('/online-summary', controller.onlineSummary);
  router.all('/at-location', controller.atLocation);
  router.all('/confirm', controller.confirm);

  return {
    prefixes: ['/reserve'],
    router: router
  }
}
