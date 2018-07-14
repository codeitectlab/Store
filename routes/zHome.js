let controller = require('../controllers/home');
let passport = require('passport');

module.exports = (app, router) => {
  router.all('/find-by-zip', controller.findByZip);
  router.all('/locations/:locationCode?', controller.locationsIndex);
//  router.all('/locations/:siteId?', controller.locationsIndex);
  router.all(['/privacy', '/privacy-policy'], controller.privacy);
  router.all('/terms', controller.terms);
  router.all(['/', '/index', '/home'], controller.index);
  router.all('/:page?', controller.underConstruction);

  return {
    prefixes: ['/'],
    router: router
  }
}
