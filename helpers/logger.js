const stackTrace = require('stack-trace');
let path = require('path');
let debug = require('debug');

var logger = {
  log: function(msg, level, index) {
    if (!level) level = 'debug';
    if (!index) index = 0;

    let caller = stackTrace.get()[index].getFileName();
    let callerMethod = stackTrace.get()[index].getMethodName();
    let callerLine = stackTrace.get()[index].getLineNumber();
    let filename = path.basename(caller);
    let dirname = path.dirname(caller).split(path.sep);

    let namespace = 'store-space:' + level;

    for(var i=dirname.indexOf('store-space')+1; i< dirname.length; i++){
      namespace += ':' + dirname[i];
    }

    namespace += ':' + filename;
    if (callerMethod) namespace += ':' + callerMethod;

    debug(namespace)(['[',callerLine,'] '].join(''), msg);
  },
  debug: function(msg) {
    this.log(msg, 'debug', 2);
  },
  error: function(msg) {
    this.log(msg, 'error', 2);
  },
  info: function(msg) {
    this.log(msg, 'info', 2);
  },
}

module.exports = (function(){
  console.logger = logger;
  return logger;
})();
