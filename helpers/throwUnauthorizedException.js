module.exports = function throwUnauthorizedException(req, res) {
  res.statusCode = 401;
  res.statusMessage = 'Unauthorized';
  return res.render('errors/401', {});
}