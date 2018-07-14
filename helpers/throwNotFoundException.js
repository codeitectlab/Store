module.exports = function throwNotFoundException(req, res, customMessage) {
  res.statusCode = 404;
  res.statusMessage = customMessage || 'Not found';

  if (req.xhr) {
    return res.status(404).send({ statusCode: 404, error: res.statusMessage });
  } else {
    return res.render('errors/404', { message: res.statusMessage });
  }
}
