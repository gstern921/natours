const multer = require('multer');
const sharp = require('sharp');
const constants = require('../constants/constants');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const filterableProps = [
  'name',
  'duration',
  'maxGroupSize',
  'price',
  'priceDiscount',
  'ratingsQuantity',
  'ratingsAverage',
  'difficulty',
  'startDates',
];

const sortableProps = [
  'name',
  'duration',
  'maxGroupSize',
  'price',
  'priceDiscount',
  'ratingsQuantity',
  'ratingsAverage',
  'difficulty',
  'startDates',
];

const notFoundByIdMessage = 'No tour found with that ID';
const docName = 'tour';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  const mimeType = file.mimetype;
  if (mimeType.startsWith('image')) {
    return cb(null, true);
  }
  return cb(
    new AppError(
      'Invalid file upload type! Please upload only images',
      constants.HTTP_BAD_REQUEST
    ),
    false
  );
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files || !req.files.imageCover || !req.files.images) {
    return next();
  }

  // Cover image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  // Tour images
  await Promise.all(
    req.files.images.map(async (image, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
});

exports.handleGetAllTours = handlerFactory.handleGetAll(Tour, {
  filterableProps,
  sortableProps,
  docName: 'tours',
});

exports.handleGetTourById = handlerFactory.handleGetOneById(Tour, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
  docName,
  populateOptions: {
    path: 'reviews',
    select: 'user review rating',
  },
});

exports.setTourId = catchAsync(async (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  next();
});

exports.handleCreateTour = handlerFactory.createOne(Tour, {
  docName: 'tour',
  notFoundMessage: notFoundByIdMessage,
});

exports.handleUpdateTourById = handlerFactory.handleUpdateOneById(Tour, {
  idParam: 'id',
  docName: 'tour',
  notFoundMessage: notFoundByIdMessage,
});

exports.handleDeleteTourById = handlerFactory.handleDeleteOneById(Tour, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
});

exports.aliasTopTours = catchAsync((req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
});

exports.handleGetTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  return res
    .status(constants.HTTP_OK)
    .json({ status: constants.STATUS_SUCCESS, data: { stats } });
});

exports.handleGetMonthlyPlan = catchAsync(async (req, res, next) => {
  const currentYear = new Date(Date.now()).getFullYear();

  let year = req.params.year === undefined ? currentYear : +req.params.year;
  if (Number.isNaN(year)) {
    year = currentYear;
  }

  const stats = await Tour.aggregate([
    {
      $addFields: {
        startDates: {
          $filter: {
            input: '$startDates',
            as: 'd',
            cond: { $eq: [{ $year: '$$d' }, year] },
          },
        },
      },
    },
    {
      $unwind: '$startDates',
    },
    {
      $addFields: {
        startDateMonths: {
          $month: '$startDates',
        },
      },
    },
    {
      $group: {
        _id: '$startDateMonths',
        numTourStarts: { $sum: 1 },
        tours: {
          $push: {
            name: '$name',
            price: '$price',
            startDate: '$startDates',
          },
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  return res.status(constants.HTTP_OK).json({
    status: constants.STATUS_SUCCESS,
    results: stats.length,
    data: { stats },
  });
});

const getRadiansFromDistance = (distance, distanceUnit = 'mi') => {
  const distancePerRadian = { km: 6371, mi: 3958.8 };
  const defaultUnit = 'mi';

  let unit =
    typeof distanceUnit === 'string' ? distanceUnit.toLowerCase() : defaultUnit;

  if (!Object.keys(distancePerRadian).includes(unit)) {
    unit = defaultUnit;
  }

  return distance / distancePerRadian[unit];
};

const getLatitudeAndLongitude = (latLng) => {
  let latitudeLongitude = latLng;
  if (!latitudeLongitude || typeof latitudeLongitude !== 'string') {
    throw new AppError(
      'Please provide latitude and longitude as numerical values in the format lat,lng',
      constants.HTTP_BAD_REQUEST
    );
  }

  latitudeLongitude = latitudeLongitude.trim().split(/\s*,\s*/);

  if (latitudeLongitude.length !== 2) {
    throw new AppError(
      'Please provide latitude and longitude as numerical values in the format lat,lng',
      constants.HTTP_BAD_REQUEST
    );
  }

  const latitude = latitudeLongitude[0].length ? +latitudeLongitude[0] : NaN;
  const longitude = latitudeLongitude[1].length ? +latitudeLongitude[1] : NaN;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new AppError(
      'Please provide latitude and longitude as numerical values in the format lat,lng',
      constants.HTTP_BAD_REQUEST
    );
  }

  return [latitude, longitude];
};

const getUnit = (u) => {
  let unit = u;
  if (typeof unit !== 'string') {
    unit = 'mi';
  } else {
    unit = unit.toLowerCase() === 'km' ? 'km' : 'mi';
  }
  return unit;
};

exports.handleGetToursWithin = catchAsync(async (req, res, next) => {
  let { unit } = req.params;
  let { distance } = req.params;

  if (typeof unit !== 'string') {
    unit = 'mi';
  } else {
    unit = unit.toLowerCase() === 'km' ? 'km' : 'mi';
  }

  let latitudeLongitude = req.params.latlng;
  if (!latitudeLongitude || typeof latitudeLongitude !== 'string') {
    return next(
      new AppError(
        'Please provide latitude and longitude as numerical values in the format lat,lng',
        constants.HTTP_BAD_REQUEST
      )
    );
  }

  latitudeLongitude = latitudeLongitude.split(/\s*,\s*/);

  if (latitudeLongitude.length !== 2) {
    return next(
      new AppError(
        'Please provide latitude and longitude as numerical values in the format lat,lng',
        constants.HTTP_BAD_REQUEST
      )
    );
  }

  const latitude = +latitudeLongitude[0];
  const longitude = +latitudeLongitude[1];

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return next(
      new AppError(
        'Please provide latitude and longitude as numerical values in the format lat,lng',
        constants.HTTP_BAD_REQUEST
      )
    );
  }

  distance = +distance;
  if (Number.isNaN(distance)) {
    return next(
      new AppError('Invalid distance provided', constants.HTTP_BAD_REQUEST)
    );
  }

  const radians = getRadiansFromDistance(distance, unit);

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radians] },
    },
  });

  return res.status(constants.HTTP_OK).json({
    status: constants.STATUS_SUCCESS,
    results: tours.length,
    data: { tours },
  });
});

exports.handleGetDistances = catchAsync(async (req, res, next) => {
  try {
    const [latitude, longitude] = getLatitudeAndLongitude(req.params.latlng);
    const unit = getUnit(req.params.unit);
    const multiplier = unit === 'mi' ? 0.0006213711922373339 : 0.001;
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          name: 1,
          ratingsAverage: 1,
          ratingsQuantity: 1,
          distance: 1,
        },
      },
    ]);
    return res.status(constants.HTTP_OK).json({
      status: constants.STATUS_SUCCESS,
      data: { distances },
    });
  } catch (err) {
    if (err.isOperational) {
      return next(err);
    }
    throw err;
  }
});
