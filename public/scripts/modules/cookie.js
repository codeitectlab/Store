module.exports = {
  get: function(name) {
    var pattern = new RegExp('(?:(?:^|.*;\\s*)' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$');
    return document.cookie.replace(pattern, '$1');
  },
  set: function(name, value, options) {
    var cookie = name + '=' + value;

    for (var o in options) {
      if (o === 'expires') {
        options[o].toUTCString();
      }

      cookie += '; ' + o + '=' + options[o];
    }

    document.cookie = cookie;
  },
  delete: function(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
  }
};