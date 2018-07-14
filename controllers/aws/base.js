const AWS = require('aws-sdk');
const config = require('../../config/config');
let crypto = require('../../helpers/crypto');

module.exports = function () {
 if (config.isProd) {
 // if (config.isLocal) {
    AWS.config.update({
      accessKeyId: crypto.decrypt(config.aws.access, config.aws.cryptoKey),
      secretAccessKey: crypto.decrypt(config.aws.secret, config.aws.cryptoKey)
    });
  }

  AWS.config.update({
    region: config.aws.region
  });

  return AWS;
}
