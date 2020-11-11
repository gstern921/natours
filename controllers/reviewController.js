const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const notFoundByIdMessage = 'No review found with that ID';
const docName = 'review';

// exports.handleGetAllReviews = catchAsync(async (req, res, next) => {
//   const filter = {};

//   const tourId = req.body.tour;

//   if (tourId) {
//     filter.tour = tourId;
//   }

//   const reviews = await Review.find(filter);

//   return res.status(constants.HTTP_OK).json({
//     status: constants.STATUS_SUCCESS,
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

const sortableProps = ['rating', 'createdAt', 'tour'];

const filterableProps = ['rating', 'createdAt', 'tour'];

exports.handleGetAllReviews = handlerFactory.handleGetAll(Review, {
  sortableProps,
  filterableProps,
  notFoundMessage: notFoundByIdMessage,
  docName: 'reviews',
});

exports.handleGetReviewById = handlerFactory.handleGetOneById(Review, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
  docName: 'review',
});

exports.filterByTourId = catchAsync(async (req, res, next) => {
  if (req.body.tour) {
    req.query.tour = req.body.tour;
  }
  next();
});

exports.setUserId = catchAsync(async (req, res, next) => {
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
});

// exports.handleCreateReview = catchAsync(async (req, res, next) => {
//   req.body.user = req.body.user || req.user.id;
//   req.body.tour = req.body.tour || req.params.tourId;
//   const userId = req.body.user
//   const tourId = req.body.tour
//   const { review } = req.body;
//   const rating = +req.body.rating;

//   const existingReview = await Review.find({ user: userId, tour: tourId });

//   if (existingReview.length) {
//     return next(
//       new AppError('Review for this tour already exists for this user.'),
//       constants.HTTP_BAD_REQUEST
//     );
//   }

//   const newReview = await Review.create({
//     tour: tourId,
//     user: userId,
//     rating,
//     review,
//   });

//   return res.status(constants.HTTP_OK).json({
//     status: constants.STATUS_SUCCESS,
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.handleCreateReview = handlerFactory.createOne(Review, {
  docName,
  notFoundMessage: notFoundByIdMessage,
});

exports.handleUpdateReviewById = handlerFactory.handleUpdateOneById(Review, {
  docName,
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
});

exports.handleDeleteReviewById = handlerFactory.handleDeleteOneById(Review, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
});
