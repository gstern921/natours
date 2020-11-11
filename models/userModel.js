const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');

const constants = require('../constants/constants');
const hashPassword = require('../utils/hashPassword');
const comparePasswordToHash = require('../utils/comparePasswordToHash');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have an email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: {
      values: constants.ROLE_ALL,
      message: 'A user must have an appropriate role',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: [
      function (val) {
        return val === this.password;
      },
      'The confirmation password must match the password',
    ],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - constants.ONE_SECOND;
    }
    this.password = await hashPassword(this.password);
    this.passwordConfirm = undefined;
  }
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await comparePasswordToHash(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  return (
    this.passwordChangedAt &&
    parseInt(this.passwordChangedAt.getTime() / 1000, 10) >= JWTTimestamp
  );
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(
    Date.now() + 10 * constants.ONE_MINUTE
  ).toJSON();

  await this.save({ validateBeforeSave: false });

  return resetToken;
};

userSchema.methods.resetPassword = async function (newPassword) {
  if (this.passwordResetExpires) {
    const expires = this.passwordResetExpires.getTime();
    if (Date.now() <= expires) {
      this.password = newPassword;
      this.passwordConfirm = newPassword;
      await this.save();
    }
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
