var algorithm = 'aes-256-cbc';
var crypto = require("crypto");

var zCrypto = {
	decrypt : function(text, password) {
	  var decipher = crypto.createDecipher(algorithm, password)
	  var decrypted = decipher.update(text,'hex','utf8')
	  decrypted += decipher.final('utf8');
	  return decrypted;
	},
	encrypt : function(text, password) {
	  var cipher = crypto.createCipher(algorithm, password)
	  var crypted = cipher.update(text,'utf8','hex')
	  crypted += cipher.final('hex');
	  return crypted;
	}
}
module.exports = zCrypto;