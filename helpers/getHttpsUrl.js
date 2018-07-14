module.exports = function getHttpsUrl(req) {
  if (req.app.get('https_port')) {
    return `https://${req.hostname}:${req.app.get('https_port')}${req.url}`;
  } else {
    return `https://${req.hostname}${req.url}`;
  }
}