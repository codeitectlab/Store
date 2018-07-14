const AWS = require('./base')();
const config = require('../../config/config');
let crypto = require('../../helpers/crypto');

var sesClient = new AWS.SES();

module.exports = sesClient;
