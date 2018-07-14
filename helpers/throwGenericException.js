module.exports = function throwGenericException(err, req, res, next) {
  let model = {};

  if (req.app.get('config').env !== 'prod') {
    model = {message: err.message, stack: err.stack};
  }

  console.logger.debug(model.stack);

//  res.statusCode(500);

  if (req.xhr) {
    return res.send({ statusCode: 500, error: 'Houston, we have a problem!' });
  } else {
    return res.render('errors/index', model);
  }
};
