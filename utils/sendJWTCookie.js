module.exports = (token, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: +process.env.JWT_COOKIE_EXPIRES_IN,
  };
  if (process.env.NODE_ENV === 'development') {
    cookieOptions.secure = false;
  }
  res.cookie('jwt', token, cookieOptions);
};
