const User = require('../models/userModel');

const constants = require('../constants/constants');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const sendJWTCookie = require('../utils/sendJWTCookie');
const signJWT = require('../utils/signJWT');
const verifyJWT = require('../utils/verifyJWT');
const isAPIRequest = require('../utils/isAPIRequest');

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const isAPI = isAPIRequest(req);
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  newUser.password = undefined;

  const token = signJWT(newUser);
  sendJWTCookie(token, req, res);

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  if (isAPI) {
    return res.status(constants.HTTP_CREATED).json({
      status: constants.STATUS_SUCCESS,
      token,
      data: {
        user: newUser,
      },
    });
  }
  return res.redirect('/me');
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const isAPI = isAPIRequest(req);
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(
      new AppError(
        'Please provide email and password',
        constants.HTTP_BAD_REQUEST
      )
    );
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  const passwordIsCorrect =
    user && (await user.correctPassword(password, user.password));

  if (!user || !passwordIsCorrect) {
    if (isAPI) {
      return next(
        new AppError('Incorrect email or password', constants.HTTP_UNAUTHORIZED)
      );
    }
    return res.render('login', {
      title: 'Log into your account',
      alertMessage: 'Incorrect email or password',
    });
  }

  user.password = undefined;

  // 3) If everything is ok, send token to client
  const token = signJWT(user);
  sendJWTCookie(token, req, res);
  console.log(req.headers);
  if (isAPI) {
    return res.status(constants.HTTP_OK).json({
      status: constants.STATUS_SUCCESS,
      token,
      csrf: req.headers['csrf-token'],
      data: { user },
    });
  }

  return res.redirect('/');
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  const authorization =
    typeof req.headers.authorization === 'string'
      ? req.headers.authorization.trim()
      : '';
  const jwtCookie = req.cookies.jwt;

  if (
    authorization &&
    authorization.startsWith('Bearer') &&
    authorization.split(' ').length === 2
  ) {
    token = authorization.split(' ')[1];
  } else if (jwtCookie) {
    token = jwtCookie;
  }

  if (!token) {
    res.locals.authErrorMessage =
      'You are not authorized. Please log in to get access';
    return next();
  }
  // 2) Verify token signature

  const decoded = await verifyJWT(token);

  if (!decoded) {
    res.locals.authErrorMessage = 'Invalid token! Please log in to get access';
    return next();
  }

  // 3) Check if user still exists

  const userId = decoded.id;

  if (!userId) {
    res.locals.authErrorMessage = 'Invalid token! Please log in to get access';
    return next();
  }

  const currentUser = await User.findOne({ _id: userId });

  if (!currentUser) {
    res.locals.authErrorMessage =
      'The user belonging to this token no longer exists.';
    return next();
  }

  // 4) Check if user changed password after the JWT token was issued

  // console.log(currentUser.changedPasswordAfter);
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    res.locals.authErrorMessage =
      'User has recently changed their password, please log in again';
    return next();
  }

  res.locals.user = currentUser;
  req.user = currentUser;
  return next();
});

exports.logout = catchAsync(async (req, res, next) => {
  const isAPI = isAPIRequest(req);
  res.clearCookie('_csrf');
  res.clearCookie('jwt');
  if (isAPI) {
    return res
      .status(constants.HTTP_OK)
      .json({ status: constants.STATUS_SUCCESS });
  }

  return res.redirect('/');
});

exports.protect = catchAsync(async (req, res, next) => {
  const defaultAuthErrorMessage =
    'You are not authorized. Please log in to get access';

  const authErrorMessage =
    res.locals.authErrorMessage || defaultAuthErrorMessage;

  if (!req.user) {
    return next(new AppError(authErrorMessage, constants.HTTP_UNAUTHORIZED));
  }

  return next();
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the Users collection

  const user = await User.findById(req.user.id).select('+password');

  const { currentPassword, password, passwordConfirm } = req.body;

  // 2) Check if POSTed current password is correct

  if (
    !user ||
    !currentPassword ||
    !(await user.correctPassword(currentPassword, user.password))
  ) {
    return next(
      new AppError(
        'Incorrect password. Password change failed.',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  // 3) Update with new password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4) Log the user in, send JWT
  const token = signJWT(user);
  sendJWTCookie(token, req, res);

  return res.status(constants.HTTP_OK).json({
    status: constants.STATUS_SUCCESS,
    token,
  });
});
