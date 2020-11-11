const express = require('express');

const { ROLE_USER, ROLE_ADMIN } = require('../constants/constants');

const reviewController = require('../controllers/reviewController');
const authenticationController = require('../controllers/authenticationController');
const authorizationController = require('../controllers/authorizationController');

const router = express.Router({ mergeParams: true });

router.use(authenticationController.protect);

router
  .route('/')
  .get(reviewController.filterByTourId, reviewController.handleGetAllReviews)
  .post(
    authorizationController.restrictTo(ROLE_USER),
    reviewController.setUserId,
    reviewController.handleCreateReview
  );

router
  .route('/:id')
  .get(reviewController.handleGetReviewById)
  .patch(
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_USER),
    reviewController.handleUpdateReviewById
  )
  .delete(
    authenticationController.protect,
    authorizationController.restrictTo(ROLE_ADMIN, ROLE_USER),
    reviewController.handleDeleteReviewById
  );

module.exports = router;
