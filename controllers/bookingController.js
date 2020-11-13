const stripe = require('stripe')(process.env.STRIPE_TEST_SECRET_KEY);
const {
  HTTP_OK,
  STATUS_SUCCESS,
  HTTP_BAD_REQUEST,
} = require('../constants/constants');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
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
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { user, tour, price } = req.query;
//   if (!user || !tour || !price) {
//     return next();
//   }
//   await Booking.create({ user, tour, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }, { id: 1 });
  const price = session.line_items[0].amount / 100;
  const booking = await Booking.create({ tour, user, price });
  return booking;
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const { STRIPE_WEBHOOK_SECRET } = process.env;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(HTTP_BAD_REQUEST).send(`Webhook error: ${err}`);
  }

  const eventType = event ? event.type : undefined;

  if (!eventType || eventType !== 'checkout.session.async_payment_succeeded') {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(
        `Expected type checkout.session.async_payment_succeeded, but got ${eventType}`
      );
  }
  const booking = createBookingCheckout(event.data.object);
  if (booking) {
    return res.status(HTTP_OK).json({ received: true });
  }
  return res
    .status(HTTP_BAD_REQUEST)
    .send(`Unable to create booking from data received`);
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
