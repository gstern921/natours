const express = require('express');

const tourController = require('../controllers/tourController');
const authenticationController = require('../controllers/authenticationController');
const authorizationController = require('../controllers/authorizationController');
const reviewRouter = require('./reviewRoutes');

const { ROLE_ADMIN, ROLE_LEAD_GUIDE } = require('../constants/constants');

const router = express.Router();

router.use('/:tourId/reviews', tourController.setTourId, reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.handleGetAllTours);

router.route('/tour-stats').get(tourController.handleGetTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authenticationController.protect,
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_LEAD_GUIDE, ROLE_ADMIN),
    tourController.handleGetMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.handleGetToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.handleGetDistances);
router
  .route('/')
  .get(tourController.handleGetAllTours)
  .post(
    authenticationController.protect,
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_LEAD_GUIDE),
    tourController.handleCreateTour
  );

router
  .route('/:id')
  .get(tourController.handleGetTourById)
  .patch(
    authenticationController.protect,
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_LEAD_GUIDE),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.handleUpdateTourById
  )
  .delete(
    authenticationController.protect,
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_LEAD_GUIDE),
    tourController.handleDeleteTourById
  );

module.exports = router;
