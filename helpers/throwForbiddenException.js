module.exports = function throwForbiddenException(req, res) {
  res.statusCode = 403;
  res.statusMessage = 'Forbidden';
  return res.render('errors/403', {});
}