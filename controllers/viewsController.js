const constants = require('../constants/constants');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');

const alerts = {
  bookingSuccess: {
    type: 'success',
    message:
      'Tour was booked successfully, and a confirmation email was sent. Thank you! If your booking does not show up here immediately, please check again later',
  },
};

exports.setAlert = (req, res, next) => {
  const { alert } = req.query;
  if (alert && alerts[alert]) {
    res.locals.alert = alerts[alert];
  }
  next();
};

exports.handleGetOverview = catchAsync(async (req, res, next) => {
  // Get tour data from collection
  const tours = await Tour.find();

  // Build template

  // Render that template using the tour data

  res
    .status(constants.HTTP_OK)
    .render('overview', { title: 'All Tours', tours });
});

exports.handleGetTour = catchAsync(async (req, res, next) => {
  const slug = req.params.tourSlug;

  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'user review rating',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  res.status(constants.HTTP_OK).render('tour', { title: tour.name, tour });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIds = bookings.map((booking) => booking.tour.id);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  return res.status(200).render('overview', { title: 'My Tours', tours });
});

exports.handleLogin = catchAsync(async (req, res, next) => {
  res
    .status(constants.HTTP_OK)
    .render('login', { title: 'Log into your account' });
});

exports.handleSignUp = catchAsync(async (req, res, next) => {
  return res.status(constants.HTTP_OK).render('signup', { title: 'Sign up' });
});

exports.handleGetMyAccount = catchAsync(async (req, res, next) => {
  // console.log('current user:', res.locals.user);
  res.status(constants.HTTP_OK).render('account', { title: 'Account Info' });
});

exports.handleUpdateUserData = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true }
  );

  return res
    .status(constants.HTTP_OK)
    .render('account', { title: 'Account Info', user: updatedUser });
});
