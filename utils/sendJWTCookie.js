module.exports = (token, req, res) => {
  const maxAge = !token ? 0 : +process.env.JWT_COOKIE_EXPIRES_IN;
  const secure = !!res.locals.isSecureRequest;
  const cookieOptions = {
    httpOnly: true,
    maxAge,
    secure,
    sameSite: 'lax',
  };
  res.cookie('jwt', token, cookieOptions);
};
