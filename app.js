const path = require('path');

const express = require('express');

const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const globalErrorController = require('./controllers/errorController');
const AppError = require('./utils/appError');
const constants = require('./constants/constants');

// Start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE

// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet());

// Log data about each request (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Requests From Same IP
const limiter = rateLimit({
  max: 300,
  windowMs: constants.ONE_HOUR,
  message: 'Too many requests from this IP address, please try again later',
});

app.use('/api', limiter);

// Body Parser (Turns request body into JSON)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization Against NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization Against XSS Attacks
app.use(xss());

// Prevent http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test Middleware (Adds the current timestamp to the request)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.body);
  // console.log(req.cookies);
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Content-Security-Policy', '');
  }
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

app.use(globalErrorController);
app.all('*', (req, res, next) => {
  // return res.status(constants.HTTP_NOT_FOUND).json({
  //   status: constants.STATUS_FAIL,
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

module.exports = app;
