const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    type: String,
    required: [true, 'Please provide car brand'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Please provide car model'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Please provide car year'],
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  category: {
    type: String,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Sports', 'Electric'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  seats: {
    type: Number,
    required: true,
    min: 2,
    max: 8
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Please provide price per day'],
    min: 0
  },
  location: {
    city: {
      type: String,
      required: true
    },
    address: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  description: {
    type: String,
    maxlength: 1000
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  mileage: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search and filtering
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ category: 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ 'location.city': 1 });
carSchema.index({ isActive: 1 });
carSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Car', carSchema);
