let fs = require('fs');
let path = require('path');
let vash = require('vash');

module.exports = function (dir = '/home') {
  let viewPath = __dirname + dir;

  let readDir = path => {
    fs.readdir(path, (err, list) => {
      list.forEach(file => {
        let statPath = `${path}/${file}`;
        getStat(statPath);
      })
    })
  }

  let getStat = path => {
    fs.stat(path, (err, stats) => {
      if (stats.isDirectory()) {
        readDir(path);
      } else if (stats.isFile()) {
        cacheTemplate(path);
      }
    })
  }

  let cacheTemplate = file => {
    let name = file.replace(`${viewPath}/`, '');
    name = name.substring(0, name.lastIndexOf('.'));

    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      
      vash.helpers.tplcache[name] = vash.compile(data);
    })
  }

  readDir(viewPath)
}