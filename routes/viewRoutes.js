const express = require('express');
const viewsController = require('../controllers/viewsController');
const authenticationController = require('../controllers/authenticationController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authenticationController.isLoggedIn);

router.get(
  '/',
  authenticationController.isLoggedIn,
  viewsController.handleGetOverview
);

router.get('/tour/:tourSlug', viewsController.handleGetTour);

router.get('/login', viewsController.handleLogin);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.get(
  '/me',
  authenticationController.protect,
  viewsController.handleGetMyAccount
);
router.get(
  '/my-tours',
  authenticationController.protect,
  viewsController.getMyTours
);

router.post(
  '/submit-user-data',
  authenticationController.protect,
  viewsController.handleUpdateUserData
);

module.exports = router;
