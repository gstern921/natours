const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking requires a tour ID'],
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A booking requires a user ID'],
  },
  price: {
    type: Number,
    required: [true, 'A booking requires a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'tour', select: 'name' });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
