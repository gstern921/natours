const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const constants = require('../constants/constants');

module.exports = async (token) => {
  return await promisify(jwt.verify)(token, constants.JWT_SECRET);
};
