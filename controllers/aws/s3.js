const AWS = require('./base')();
const config = require('../../config/config');
let crypto = require('../../helpers/crypto');

AWS.config.update(
    {
        accessKeyId: crypto.decrypt(config.aws.access, config.aws.cryptoKey),
        secretAccessKey: crypto.decrypt(config.aws.secret, config.aws.cryptoKey),
        region: config.aws.region
    }
);

var s3Client = new AWS.S3();

module.exports = s3Client;