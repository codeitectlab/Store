let fs = require('fs');
let path = require('path');
let curFile = path.basename(__filename);

module.exports = function(app) {
  app.locals.middlewares = {};
  fs.readdirSync(__dirname).filter(f => f !== curFile).sort().forEach((file) => {
    var middleware = require(`./${file}`);
    if(middleware.isGlobal) {
      app.use(middleware.handler);
    } else {
      app.locals.middlewares[path.basename(file, path.extname(file))] = middleware;
    }
  })
}