const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review requires a rating'],
    },
    createdAt: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    review: {
      type: String,
      required: [true, 'A review cannot be empty'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date(Date.now()).toJSON();
  }
  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats.length ? stats[0].nRating : 0,
    ratingsAverage: stats.length ? stats[0].avgRating : null,
  });
};

reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  console.log(this.r);
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
  // await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
