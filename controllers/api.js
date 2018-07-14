let http = require('http');
let https = require('https');
let config = require('../config/config');
let apiCache = require('./apiCache');

/*
var formToken = require('patron-form-token');
var zToken = formToken.createFormToken(API_KEY, CONTROLLER);
*/

let self = {
  get: (api, path, params, headers, cacheOverride, returnHeaders) => {
    return self.create('GET', api, path, params, headers, '', cacheOverride, returnHeaders);
  },
  post: (api, path, params, headers, cacheOverride, returnHeaders) => {
    return self.create('POST', api, path, '', headers, params, cacheOverride, returnHeaders);
  },
  create: (method, api, path, params = {}, headers = {}, body = '', cacheOverride = false, returnHeaders = false) => {
    return new Promise((resolve, reject) => {
      let controller = config[api];
      let endpoint = controller.endpoints ? controller.endpoints[path] || path : path;
      let contentType = controller.contentType || 'application/json';

      // add slash
      if (!endpoint.startsWith('/')) {
        endpoint = `/${endpoint}`;
      }
      
      // add necessary prefix
      if (controller.prefix && !endpoint.startsWith(controller.prefix)) {
        endpoint = controller.prefix + endpoint;
      }

      // merge params
      if (controller.params) {
        params = Object.assign({}, params, controller.params);
      }
      
      let queryString = method === 'GET' ? self.buildQueryString(params) : null;
      let requestPath = `${endpoint}${queryString ? '?' + queryString : ''}`;

      // get from cache. if not, get from endpoint
      if (method === 'GET' && config.apiCache.enabled && !cacheOverride) {
        let data = apiCache.get(requestPath)
        if (data) {
          return resolve(data);
        }
      }

      body = JSON.stringify(body);
      
      let options = {
        host: controller.host,
        port: controller.port,
        path: requestPath,
        method: method,
        headers: {
          'Content-Type': contentType,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      // merge headers
      if (Object.keys(headers).length) {
        options.headers = Object.assign({}, headers, options.headers);
      }

      let connection = controller.port === 443 ? https : http;
      let req = connection.request(options, (res) => {
        let body = '';

        res.setEncoding('utf8');
        let headers = res.headers;

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          let json = contentType === 'application/json' ? JSON.tryParse(body) : body;

          if(returnHeaders) json.headers = headers;

          // set in cache
          if (method === 'GET' && config.apiCache.enabled && !cacheOverride) {
            apiCache.put(options.path, json);
          }

          return resolve(json);
        });
      });

      req.on('error', (err) => {
        console.logger.error(err);
        return reject(err);
      });

      req.write(body);
      req.end();
    })
  },
  buildQueryString: (params) => {
    let queryString = [];

    for (var key in params) {
      let value = typeof params[key] === 'object' ? encodeURIComponent(JSON.stringify(params[key])) : params[key];
      queryString.push(`${key}=${value}`);
		}

		return queryString.join('&');
  },
  render: (req, res) => {
		let api = req.params.api;
    let path = req.path.replace(`/${api}/`, '');
    
    self.get(api, path, req.query, {}).then((json) => {
      res.type(typeof json === 'string' ? 'text/html' : 'application/json');
      res.send(json);
    });
  }
}

module.exports = self;