var Helper = require('./helper');

var Modal = (function() {
  var instance;

  function init() {
    var container;
    var content;
    var close;
    var animationType;

    return {
      self: this,
      exists: function() {
        return container && content;
      },
      create: function(modalContent) {
        //check for existing modal
        if (this.exists()) {
          this.empty();
        }

        container = document.createElement('div');
        container.id = 'modal';

        close = document.createElement('a');
        close.id = 'modal-close';
        close.innerHTML = 'Close';

        if (typeof modalContent === 'string') {
          container.innerHTML = modalContent;
          modalContent = container.firstChild;
        } else {
          container.appendChild(modalContent);
        }

        modalContent.appendChild(close);

        document.body.appendChild(container);

        //remove and then add noscroll class
        document.body.classList.add('noscroll');

        content = modalContent;

        //add handlers to close modal
        container.addEventListener('click', this.destroy);
        document.addEventListener('keyup', this.destroy);
      },
      createIframe: function(url) {
        var container = document.createElement('div');
        var iframe = document.createElement('iframe');
        iframe.src = url;
        container.className = 'iframe-container';
        container.appendChild(iframe);
        this.create(container);
      },
      activate: function(e) {
        e.preventDefault();
        this.createIframe(e.currentTarget.href);
      },
      destroy: function(e) {
        if (arguments.length === 0 || e.target === e.currentTarget || e.target.id === 'modal-close' || e.keyCode === 27) {
          if (!Modal.getInstance().exists()) {
            return;
          }

          //get transition type
          animationType = Helper.getAnimationType(container);

          if (animationType) {
            Modal.getInstance().empty();
            //container.addEventListener(animationType, Modal.getInstance().empty);
            //container.classList.add('inactive');
          } else {
            Modal.getInstance().empty();
          }
        }
      },
      empty: function(e) {
        container.removeEventListener('click', this.destroy);
        document.removeEventListener('keyup', this.destroy);

        container.removeChild(content);
        document.body.removeChild(container);

        // remove noscroll class
        document.body.classList.remove('noscroll');

        content = null;

        if (animationType) {
          container.removeEventListener(animationType, Modal.getInstance().empty);
          animationType = null;
        }
      }
    }
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = init();
      }

      return instance;
    }
  }
})();

module.exports = Modal.getInstance();