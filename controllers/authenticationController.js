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
  const { name, email, password, passwordConfirm, role } = req.body;
  const isAPI = isAPIRequest(req);
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
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

  if (isAPI) {
    return res.status(constants.HTTP_OK).json({
      status: constants.STATUS_SUCCESS,
      token,
      data: { user },
    });
  }

  return res.redirect('/');
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return next();
    }
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return next();
    }
    // 3) Check if user still exists

    const userId = decoded.id;

    if (!userId) {
      return next();
    }

    const currentUser = await User.findOne({ _id: userId });

    if (!currentUser) {
      return next();
    }

    // 4) Check if user changed password after the JWT token was issued

    // console.log(currentUser.changedPasswordAfter);
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    res.locals.user = currentUser;
    return next();
  } catch (err) {
    return next();
  }
});

exports.logout = catchAsync(async (req, res, next) => {
  sendJWTCookie('', req, res);
  const isAPI = isAPIRequest(req);
  if (isAPI) {
    return res
      .status(constants.HTTP_OK)
      .json({ status: constants.STATUS_SUCCESS });
  }

  return res.redirect('/');
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (res.locals.user) {
    req.user = res.locals.user;
    return next();
  }
  if (req.user) {
    return next();
  }

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') &&
    req.headers.authorization.split(' ').length === 2
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError(
        'You are not authorized. Please log in to get access',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }
  // 2) Verify token signature

  const decoded = await verifyJWT(token);

  if (!decoded) {
    return next(
      new AppError(
        'Invalid token! Please log in to get access',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  // 3) Check if user still exists

  const userId = decoded.id;

  if (!userId) {
    return next(
      new AppError(
        'Invalid token! Please log in to get access',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  const currentUser = await User.findOne({ _id: userId });

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token no longer exists.',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  // 4) Check if user changed password after the JWT token was issued

  // console.log(currentUser.changedPasswordAfter);
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User has recently changed their password, please log in again',
        constants.HTTP_UNAUTHORIZED
      )
    );
  }

  req.user = currentUser;

  next();
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the Users collection

  const user = await User.findById(req.user._id).select('+password');

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
