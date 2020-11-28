const express = require('express');
const viewsController = require('../controllers/viewsController');
const authenticationController = require('../controllers/authenticationController');
const bookingController = require('../controllers/bookingController');
const addCsrfToken = require('../utils/addCsrfToken');

const router = express.Router();

const csrfProtection = require('../utils/csrfProtection');
const addCSRFToken = require('../utils/addCsrfToken');

router.use(viewsController.setAlert);

router.get('/', viewsController.handleGetOverview);

router.get('/tour/:tourSlug', viewsController.handleGetTour);

router.get('/login', csrfProtection, addCSRFToken, viewsController.handleLogin);
router.post('/login', authenticationController.login);
router.get(
  '/logout',
  csrfProtection,
  addCsrfToken,
  authenticationController.logout
);
router.get(
  '/signup',
  csrfProtection,
  addCsrfToken,
  viewsController.handleSignUp
);
router.get(
  '/me',
  csrfProtection,
  addCsrfToken,
  authenticationController.protect,
  viewsController.handleGetMyAccount
);
router.get(
  '/my-tours',
  csrfProtection,
  addCsrfToken,
  authenticationController.protect,
  viewsController.getMyTours
);

router.post(
  '/submit-user-data',
  csrfProtection,
  addCsrfToken,
  authenticationController.protect,
  viewsController.handleUpdateUserData
);

module.exports = router;
