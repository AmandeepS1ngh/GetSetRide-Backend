const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  dropoffTime: {
    type: String,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet']
  },
  transactionId: String,
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['user', 'host', 'admin']
  },
  cancelledAt: Date,
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ car: 1, status: 1 });
bookingSchema.index({ host: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Middleware to update car stats after booking
bookingSchema.post('save', async function() {
  if (this.status === 'completed') {
    const Car = mongoose.model('Car');
    await Car.findByIdAndUpdate(this.car, {
      $inc: { totalBookings: 1, totalEarnings: this.totalAmount }
    });
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
