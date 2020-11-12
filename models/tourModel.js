const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must not be longer than 40 characters'],
      minlength: [10, 'A tour name must be at least 10 characters long'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      lowercase: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must be either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: null,
      min: [0, 'Ratings average must be at least 0'],
      max: [5, 'Ratings average must be no higher than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Ratings quantity must be no less than 0'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current document on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be lower than regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        maxlength: 2,
        minlength: 2,
      },
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
          maxlength: 2,
          minlength: 2,
        },
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return Math.ceil(this.duration / 7);
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  // this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

tourSchema.pre('validate', function (next) {
  // if (typeof this.difficulty === 'string') {
  //   this.difficulty = this.difficulty.toLowerCase();
  // }
  next();
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.pre('save', function (next) {
  next();
});
tourSchema.post('save', function (doc, next) {
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
