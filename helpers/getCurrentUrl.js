let url = require('url');

module.exports = function getCurrentUrl(req) {
  console.logger.debug(req.originalUrl);
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}
