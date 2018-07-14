let fs = require('fs');
let path = require('path');
let curFile = path.basename(__filename);

module.exports = (app, express) => {
  fs.readdir(__dirname, (err, files) => {
    // filter current file
    files = files.filter(f => f !== curFile);

    files.forEach((file) => {
      let route = require(`./${file}`)(app, express.Router());

      if (route.prefixes) {
        app.use(route.prefixes, route.router);
      }
    });

    // set up 500 route
    app.use(app.locals.throwGenericException);
    
    // set up 404 route
    app.all('*', (req, res) => {
      req.app.locals.throwNotFoundException(req, res);
    });
  });
}