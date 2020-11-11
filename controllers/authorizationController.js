const crypto = require('crypto');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const constants = require('../constants/constants');
const User = require('../models/userModel');
const Email = require('../utils/email');
const sendJWTCookie = require('../utils/sendJWTCookie');
const signJWT = require('../utils/signJWT');

exports.restrictTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          constants.HTTP_FORBIDDEN
        )
      );
    }
    next();
  });

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        'Unable to find user with that email address',
        constants.HTTP_NOT_FOUND
      )
    );
  }
  const resetToken = await user.createPasswordResetToken();

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `There was an error sending the password reset token to email address ${user.email}`,
        constants.HTTP_SERVER_ERROR
      )
    );
  }

  return res
    .status(constants.HTTP_OK)
    .json({ status: constants.STATUS_SUCCESS, message: 'Token sent to email' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Find user based on the reset token

  const resetTokenHash = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
  });

  if (!user) {
    return next(new AppError('Token is invalid', constants.HTTP_BAD_REQUEST));
  }

  // 2) If the reset token is not expired, and there is a user, set the new password

  const now = Date.now();
  if (!user.passwordResetExpires || user.passwordResetExpires.getTime() < now) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'Token to reset password has expired. Please request a new one',
        constants.HTTP_NOT_MODIFIED
      )
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = now;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  // 3) Update the changedPasswordAt property for the user

  // 4) Log the user in, send the JWT
  const token = signJWT(user);
  sendJWTCookie(token, res);

  return res
    .status(constants.HTTP_OK)
    .json({ status: constants.STATUS_SUCCESS, token });
});
