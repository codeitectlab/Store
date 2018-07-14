module.exports = (function() {
  if (!JSON.tryParse) {
    JSON.tryParse = function(value, type) {
      var json;

      try {
        json = JSON.parse(value);
      } catch (ex) {
        json = type || {};
      }

      return json;
    }
  }
})();