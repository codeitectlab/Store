module.exports = (function() {
    window.XMLHttpRequest.prototype.vanillaSend = window.XMLHttpRequest.prototype.send;

    var newSend = function(body) {
        this.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        this.vanillaSend.apply(this, arguments);
    }

    window.XMLHttpRequest.prototype.send = newSend;
  })();