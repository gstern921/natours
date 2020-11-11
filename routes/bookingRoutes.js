const express = require('express');

const {
  ROLE_USER,
  ROLE_ADMIN,
  ROLE_LEAD_GUIDE,
} = require('../constants/constants');

const bookingController = require('../controllers/bookingController');
const authenticationController = require('../controllers/authenticationController');
const authorizationController = require('../controllers/authorizationController');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authenticationController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authorizationController.restrictTo(ROLE_LEAD_GUIDE, ROLE_ADMIN));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking)
  .patch(bookingController.updateBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .delete(bookingController.deleteById);

module.exports = router;
