var Helper = {
    getCookieAsJson: function(container, name) {
        var cookie = this.getCookie(container, name);
        return cookie ? JSON.parse(cookie) : {};
    },
    getCookie: function(container, name) {
        var pattern = new RegExp('(?:(?:^|.*;\\s*)' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$');
        return container.cookie ? container.cookie.replace(pattern, '$1') : '';
    },
    setCookie: function(name, value, expiration) {
        document.cookie = name + '=' + value + '; expires=' + expiration;
    },
    deleteCookie: function(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    },
    Base64: {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = this._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
            }
            return output;
        },
        decode: function(input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = this._utf8_decode(output);
            return output;
        },
        _utf8_encode: function(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        },
        _utf8_decode: function(utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    },
    emptyElement: function(node) {
        if (!node) {
            return;
        }

        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }
    },
    deleteWhitespace: function(node, isRecursive) {
        if (!node) {
            return;
        }

        for (var i = node.childNodes.length - 1; i >= 0; i--) {
            var child = node.childNodes[i];

            if (child.nodeType === 8 || (child.nodeType === 3 && !/\S/.test(child.nodeValue))) {
                node.removeChild(child);
            } else if (child.nodeType === 1 && isRecursive) {
                this.deleteWhitespace(child);
            }
        }
    },
    throttle: function(fn, threshhold, scope) {
       threshhold || (threshhold = 250);
       var last, deferTimer;

       return function() {
           var context = scope || this;

           var now = Date.now();
           var args = arguments;
           if (last && now < last + threshhold) {
               //hold on to it
               clearTimeout(deferTimer);
               deferTimer = setTimeout(function() {
                   last = now;
                   fn.apply(context, args);
               }, threshhold);
           } else {
               last = now;
               fn.apply(context, args);
           }
       };
   },
    debounce: function(func, wait, immediate) {
        var timeout;

        return function() {
            var context = this;
            var args = arguments;

            var later = function() {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };

            var callNow = immediate && !timeout;

            clearTimeout(timeout);

            timeout = setTimeout(later, wait);

            if (callNow) {
                func.apply(context, args);
            }
        };
    },
    camelToDash: function(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },
    getData: function(element, attr) {
        if (!element) {
            return;
        }

        if (element.dataset) {
            return element.dataset[attr];
        } else {
            return element.getAttribute('data-' + this.camelToDash(attr));
        }
    },
    setData: function(element, attr, value) {
        if (!element) {
            return;
        }

        if (element.dataset) {
            element.dataset[attr] = value;
        } else {
            element.setAttribute(this.camelToDash(attr), value);
        }
    },
    removeData: function(element, attr) {
        if (!element) {
            return;
        }

        if (element.dataset) {
            delete element.dataset[attr];
        } else {
            element.removeAttribute(this.camelToDash(attr));
        }
    },
    getAnimationType: function(element) {
        var a;
        var value;
        var animations = {
            'animationName': 'animationend',
            'OAnimationName': 'oAnimationEnd',
            'MozAnimationName': 'animationend',
            'WebkitAnimationName': 'webkitAnimationEnd',
            'transitionDuration': 'transitionend',
            'OTransitionDuration': 'oTransitionEnd',
            'MozTransitionDuration': 'transitionend',
            'WebkitTransitionDuration': 'webkitTransitionEnd'
        }

        for (a in animations) {
            value = window.getComputedStyle(element)[a];
            if (element.style[a] !== undefined && value !== '' && value !== 'none' && value != '0s') {
                return animations[a];
            }
        }

        return;
    },
    createHashtag: function(input) {
        return input.replace(/\W/g, '');
    }
};

module.exports = Helper;