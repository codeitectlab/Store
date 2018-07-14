module.exports = {
  isGlobal: true,
  handler: (req, res, next) => {
    console.logger.info(req.method + ' ' + req.url);
    console.logger.info(req.session);
    if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
      return next();
    }

    return res.redirect(req.app.locals.getHttpsUrl(req));
  }
}
