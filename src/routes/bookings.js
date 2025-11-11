const express = require('express');
const {
  createBooking,
  getMyBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  addReview,
  getBookingStats
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User booking routes
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/stats', protect, getBookingStats);

// Get bookings for cars owned by the user
router.get('/host/bookings', protect, getHostBookings);

// Booking operations
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/review', protect, addReview);

module.exports = router;
