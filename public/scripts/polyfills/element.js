module.exports = (function() {
  if (!Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.matchesSelector || 
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector || 
      Element.prototype.oMatchesSelector || 
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {

        }

        return i > -1;            
      };
  }

  if (typeof Element.prototype.closest !== 'function') {
    Element.prototype.closest = function closest(selector) {
      var element = this;

      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element;
        }

        element = element.parentNode;
      }

      return null;
    };
  }

  if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }

  if (!('removeChildren' in Element.prototype)) {
    Element.prototype.removeChildren = function() {
      while (this.lastChild) {
        this.removeChild(this.lastChild);
      }
    };
  }

  if (!('removeWhitespace' in Element.prototype)) {
    Element.prototype.removeWhitespace = function(isRecursive) {
      for (var i = this.childNodes.length - 1; i >= 0; i--) {
        var child = this.childNodes[i];

        if (child.nodeType === 8 || (child.nodeType === 3 && !/\S/.test(child.nodeValue))) {
          this.removeChild(child);
        } else if (child.nodeType === 1 && isRecursive) {
          child.removeWhitespace(isRecursive);
        }
      }
    }
  }
})();