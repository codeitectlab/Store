let fs = require('fs');
let path = require('path');
let curFile = path.basename(__filename);
let vash = require('vash');

module.exports = function(app) {
  fs.readdirSync(__dirname).filter(f => f !== curFile).forEach((file) => {
    let ext = path.extname(file);
    let name = path.basename(file, ext);
    let func = require(`./${file}`)

    // add helpers to vash and app
    vash.helpers[name] = func;
    app.locals[name] = func;
  });
}