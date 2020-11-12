module.exports = (token, req, res) => {
  const cookieOptions = {
    httpOnly: true,
    maxAge: +process.env.JWT_COOKIE_EXPIRES_IN,
    secure: true,
  };
  res.cookie('jwt', token, cookieOptions);
};
