module.exports = (req, res, next) => {
  res.locals.isSecureRequest =
    !!req.secure || req.headers['x-forwarded-proto'] === 'https';
  return next();
};
