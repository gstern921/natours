module.exports = (...names) => (req, res, next) => {
  names.forEach((name) => {
    res.cookie(name, '', { maxAge: 0 });
  });
  return next();
};
