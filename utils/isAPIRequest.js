module.exports = (req) => {
  if (!req || !req.originalUrl) {
    throw new Error('Called isAPIRequest with invalid request object: ', req);
  }
  return req.originalUrl.startsWith('/api');
};
