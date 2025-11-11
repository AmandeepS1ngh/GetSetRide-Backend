const Booking = require('../models/Booking');
const Car = require('../models/Car');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { carId, startDate, endDate, pickupTime, dropoffTime } = req.body;

    // Validate required fields
    if (!carId || !startDate || !endDate || !pickupTime || !dropoffTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check if car is available
    if (!car.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Car is not available for booking'
      });
    }

    // User cannot book their own car
    if (car.host.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own car'
      });
    }

    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Car is already booked for selected dates'
      });
    }

    // Calculate total days and amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (totalDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Booking must be at least 1 day'
      });
    }

    const totalAmount = totalDays * car.pricePerDay;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      car: carId,
      host: car.host,
      startDate,
      endDate,
      pickupTime,
      dropoffTime,
      totalDays,
      pricePerDay: car.pricePerDay,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid' // For now, assume payment is done
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('car')
      .populate('host', 'fullName email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'car',
        select: 'brand model year images category pricePerDay location'
      })
      .populate('host', 'fullName phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get host bookings
// @route   GET /api/bookings/host/bookings
// @access  Private/Host
exports.getHostBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { host: req.user.id };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'car',
        select: 'brand model year images category pricePerDay location'
      })
      .populate('user', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('host', 'fullName email phone')
      .populate('user', 'fullName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id && 
        booking.host.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id && 
        booking.host.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id && 
        booking.host.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Cannot cancel completed bookings
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Cannot cancel already cancelled bookings
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = booking.user.toString() === req.user.id ? 'user' : 'host';
    booking.cancelledAt = Date.now();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to booking
// @route   POST /api/bookings/:id/review
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating between 1 and 5'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only user can review
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking user can add a review'
      });
    }

    // Can only review completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if already reviewed
    if (booking.review && booking.review.rating) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    booking.review = {
      rating,
      comment,
      createdAt: Date.now()
    };

    await booking.save();

    // Update car rating
    const car = await Car.findById(booking.car);
    const totalRating = car.rating.average * car.rating.count + rating;
    car.rating.count += 1;
    car.rating.average = totalRating / car.rating.count;
    await car.save();

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking stats for user
// @route   GET /api/bookings/stats
// @access  Private
exports.getBookingStats = async (req, res, next) => {
  try {
    const now = new Date();

    const upcomingCount = await Booking.countDocuments({
      user: req.user.id,
      status: { $in: ['confirmed', 'active'] },
      startDate: { $gte: now }
    });

    const completedCount = await Booking.countDocuments({
      user: req.user.id,
      status: 'completed'
    });

    const totalSpentResult = await Booking.aggregate([
      {
        $match: {
          user: req.user.id,
          status: { $in: ['completed', 'active', 'confirmed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].totalSpent : 0;

    res.status(200).json({
      success: true,
      stats: {
        upcomingTrips: upcomingCount,
        completedTrips: completedCount,
        totalSpent
      }
    });
  } catch (error) {
    next(error);
  }
};
