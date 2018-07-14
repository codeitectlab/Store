var isArray = function(obj) {
  return obj && typeof obj != "undefined" && (obj instanceof Array || Array.isArray(obj));
}

module.exports = isArray;


