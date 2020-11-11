const stripe = require('stripe')(process.env.STRIPE_TEST_SECRET_KEY);
const { HTTP_OK, STATUS_SUCCESS } = require('../constants/constants');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const notFoundByIdMessage = 'No tour found with that ID';
const docName = 'review';

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const { tourId } = req.params;
  const tour = await Tour.findById(tourId);
  // console.log(stripe.checkout);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  // 3) Create session as response
  return res.status(HTTP_OK).json({ status: STATUS_SUCCESS, session });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { user, tour, price } = req.query;
  if (!user || !tour || !price) {
    return next();
  }
  await Booking.create({ user, tour, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = handlerFactory.createOne(Booking, {
  docnName: 'booking',
});

exports.updateBooking = handlerFactory.handleUpdateOneById(Booking, {
  idParam: 'id',
  notFoundMessage: 'Unable to find booking with that ID',
  docName: 'booking',
});

exports.getBooking = handlerFactory.handleGetOneById(Booking, {
  idParam: 'id',
  docName: 'booking',
});

exports.getAllBookings = handlerFactory.handleGetAll(Booking, {
  filterableProps: ['price', 'createdAt', 'paid'],
  sortableProps: ['price', 'createdAt', 'paid'],
  docName: 'booking',
});

exports.deleteById = handlerFactory.handleDeleteOneById(Booking, {
  idParam: 'id',
  notFoundMessage: 'Unable to find booking with that ID',
});
