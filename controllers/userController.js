const multer = require('multer');
const sharp = require('sharp');

const constants = require('../constants/constants');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { resetPassword } = require('./authorizationController');
const handlerFactory = require('./handlerFactory');

const notFoundByIdMessage = 'No user found with that ID';
const myDataNotFoundMessage = 'Cannot get your user data. Please log in.';

const docName = 'user';

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  const objFields = Object.keys(obj);
  allowedFields
    .filter((field) => objFields.includes(field))
    .forEach((field) => {
      filteredObj[field] = obj[field];
    });
  return filteredObj;
};

const sortableProps = ['name', 'email', 'passwordChangedAt', 'role'];
const filterableProps = ['name', 'role', 'email'];

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     if (!req.user || !req.user.id) {
//       return cb(
//         new AppError(
//           'Cannot upload photo without being logged in',
//           constants.HTTP_UNAUTHORIZED
//         )
//       );
//     }
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  if (!req.file) {
    return next();
  }

  if (!req.user || !req.user.id) {
    return next(
      new AppError(
        'Cannot process photo without being logged in',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.handleGetAllUsers = handlerFactory.handleGetAll(User, {
  filterableProps,
  sortableProps,
  docName: 'users',
});

exports.handleGetUserById = handlerFactory.handleGetOneById(User, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
  docName,
  removeFields: ['password', 'passwordConfirm'],
});

exports.handleCreateUser = handlerFactory.createOne(User, {
  docName: 'user',
});

// DO NOT USE TO UPDATE PASSWORD
exports.handleUpdateUserById = handlerFactory.handleUpdateOneById(User, {
  docName,
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
});

exports.handleDeleteUserById = handlerFactory.handleDeleteOneById(User, {
  idParam: 'id',
  notFoundMessage: notFoundByIdMessage,
});

exports.setCurrentUserId = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError(myDataNotFoundMessage, constants.HTTP_UNAUTHORIZED)
    );
  }
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating passwords. Please use /update-my-password',
        constants.HTTP_BAD_REQUEST
      )
    );
  }

  // Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file && req.file.filename) {
    filteredBody.photo = req.file.filename;
  }
  // console.log(filteredBody);

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  updatedUser.password = undefined;

  return res
    .status(constants.HTTP_OK)
    .json({ status: constants.STATUS_SUCCESS, data: { user: updatedUser } });
});

exports.handleDeactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { active: false },
    { new: true, runValidators: true }
  );

  return res
    .status(constants.HTTP_NO_CONTENT)
    .json({ status: constants.STATUS_SUCCESS, data: null });
});
