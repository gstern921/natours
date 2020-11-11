const constants = require('../constants/constants');

class AppError extends Error {
  constructor(message = 'Error Message', statusCode = 500) {
    super(message);
    this.message = message;
    this.statusCode = Number.isNaN(+statusCode) ? 500 : +statusCode;
    this.status =
      this.statusCode >= 500 ? constants.STATUS_ERROR : constants.STATUS_FAIL;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
