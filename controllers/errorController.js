const constants = require('../constants/constants');
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, constants.HTTP_BAD_REQUEST);

const handleDuplicateFieldsDB = (err) => {
  const messages = Object.entries(err.keyValue)
    .map(
      ([key, val]) =>
        `Duplicate field value ${key} (${val}), please use another value`
    )
    .join('. ');
  return new AppError(messages, constants.HTTP_BAD_REQUEST);
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join('. ');
  return new AppError(
    `Invalid input data. ${messages}`,
    constants.HTTP_BAD_REQUEST
  );
};

const handleJWTError = () =>
  new AppError(
    `Invalid token. Please log in again.`,
    constants.HTTP_UNAUTHORIZED
  );

const handleJWTExpiredError = () =>
  new AppError(
    'Your token has expired. Please log in again',
    constants.HTTP_UNAUTHORIZED
  );

const handleBadCSRFTokenError = () =>
  new AppError('Invalid CSRF Token', constants.HTTP_FORBIDDEN);

const sendAPIErrorDev = (err, req, res) => {
  const { status, message, stack } = err;
  console.error('💥  ERROR 💥', err);
  return res.status(err.statusCode).json({
    status,
    err,
    message,
    stack,
  });
};
const sendRenderedErrorDev = (err, req, res) => {
  return res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong!', msg: err.message });
};

const sendAPIErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error('💥  ERROR 💥', err);
  return res.status(constants.HTTP_SERVER_ERROR).json({
    status: constants.STATUS_ERROR,
    message: 'Something went very wrong!',
  });
};

const sendRenderedErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', msg: err.message });
  }

  console.error('💥  ERROR 💥', err);
  return res.status(constants.HTTP_SERVER_ERROR).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = +err.statusCode || constants.HTTP_NOT_FOUND;
  err.status = err.status || constants.STATUS_FAIL;
  console.log(err);

  let returnedError = err;
  if (err.name === 'CastError') {
    returnedError = handleCastErrorDB(err);
  } else if (err.name === 'ValidationError') {
    returnedError = handleValidationErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    returnedError = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    returnedError = handleJWTExpiredError();
  } else if (err.code === 11000) {
    returnedError = handleDuplicateFieldsDB(err);
  } else if (err.code === 'EBADCSRFTOKEN') {
    returnedError = handleBadCSRFTokenError();
  }

  const isAPIError = req.originalUrl.startsWith('/api');

  if (process.env.NODE_ENV === 'development') {
    if (isAPIError) {
      return sendAPIErrorDev(returnedError, req, res);
    }
    return sendRenderedErrorDev(returnedError, req, res);
  }

  if (isAPIError) {
    return sendAPIErrorProd(returnedError, req, res);
  }
  return sendRenderedErrorProd(returnedError, req, res);
};
