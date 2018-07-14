const AWS = require('./base')();
const config = require('../../config/config');
const cache = require('./awsCache');

var dynamoClient = new AWS.DynamoDB.DocumentClient();

var opsCache = {
  query: false,
  scan: false,
  get: false,
  put: false
};

Object.keys(opsCache).forEach((key) => {
  let vanillaKey = 'vanilla' + key;
  dynamoClient[vanillaKey] = dynamoClient[key];

  var newFn = null;

  if(opsCache[key]){
    newFn = function(params, cb) {
      let cachedData = cache.get(JSON.stringify(params));
      if(cachedData) {
        console.logger.debug('Cache hit');
        return cb(null, cachedData);
      }

      console.logger.debug('Cache miss');
      this[vanillaKey](params, (err, data) => {
        if (!err && config.aws.cache.enabled) {
          console.logger.debug('Inserting into cache');
          cache.put(JSON.stringify(params), data);
        }

        cb(err, data);
      });
    }
  } else {
    newFn = function(params, cb) {
      this[vanillaKey](params, (err, data) => {
        cb(err, data);
      });
    }
  }
  dynamoClient[key] = newFn;
});

module.exports = dynamoClient;
