module.exports = (token, req, res) => {
  const cookieOptions = {
    httpOnly: true,
    maxAge: +process.env.JWT_COOKIE_EXPIRES_IN,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };
  res.cookie('jwt', token, cookieOptions);
};
