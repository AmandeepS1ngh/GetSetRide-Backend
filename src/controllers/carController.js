const Car = require('../models/Car');
const Booking = require('../models/Booking');

// @desc    Get all cars with filters
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res, next) => {
  try {
    const { 
      category, 
      transmission, 
      minPrice, 
      maxPrice, 
      city, 
      seats,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (transmission) filter.transmission = transmission;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (seats) filter.seats = { $gte: parseInt(seats) };
    
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = parseInt(maxPrice);
    }

    if (search) {
      filter.$or = [
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const cars = await Car.find(filter)
      .populate('host', 'fullName profileImage')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Car.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: cars.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      cars
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('host', 'fullName email phone profileImage joinDate');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Get bookings for this car to show availability
    const bookings = await Booking.find({
      car: req.params.id,
      status: { $in: ['confirmed', 'active'] }
    }).select('startDate endDate');

    res.status(200).json({
      success: true,
      car,
      bookedDates: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new car listing
// @route   POST /api/cars
// @access  Private (Any authenticated user)
exports.createCar = async (req, res, next) => {
  try {
    console.log('=== CREATE CAR REQUEST ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    // Add host (owner) from logged in user
    req.body.host = req.user.id;

    console.log('Creating car with data:', req.body);

    const car = await Car.create(req.body);

    console.log('Car created successfully:', car._id);

    res.status(201).json({
      success: true,
      message: 'Car listed successfully',
      car
    });
  } catch (error) {
    console.error('=== ERROR CREATING CAR ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A car with this license plate already exists'
      });
    }
    next(error);
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Host
exports.updateCar = async (req, res, next) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Make sure user is car owner
    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this car'
      });
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Host
exports.deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Make sure user is car owner
    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this car'
      });
    }

    // Check if car has active bookings
    const activeBookings = await Booking.countDocuments({
      car: req.params.id,
      status: { $in: ['confirmed', 'active'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete car with active bookings'
      });
    }

    await car.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's cars
// @route   GET /api/cars/host/my-cars
// @access  Private (Any authenticated user)
exports.getHostCars = async (req, res, next) => {
  try {
    const cars = await Car.find({ host: req.user.id })
      .sort({ createdAt: -1 });

    // Get stats for each car
    const carsWithStats = await Promise.all(cars.map(async (car) => {
      const bookingCount = await Booking.countDocuments({ 
        car: car._id,
        status: { $in: ['confirmed', 'active', 'completed'] }
      });

      return {
        ...car.toObject(),
        bookingCount
      };
    }));

    res.status(200).json({
      success: true,
      count: carsWithStats.length,
      cars: carsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle car active status
// @route   PATCH /api/cars/:id/toggle-status
// @access  Private (Car owner only)
exports.toggleCarStatus = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Make sure user is car owner
    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this car'
      });
    }

    car.isActive = !car.isActive;
    await car.save();

    res.status(200).json({
      success: true,
      message: `Car ${car.isActive ? 'activated' : 'deactivated'} successfully`,
      car
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's car dashboard stats
// @route   GET /api/cars/host/stats
// @access  Private (Any authenticated user)
exports.getHostStats = async (req, res, next) => {
  try {
    const totalCars = await Car.countDocuments({ host: req.user.id });
    const activeCars = await Car.countDocuments({ host: req.user.id, isActive: true });
    
    const totalBookings = await Booking.countDocuments({ 
      host: req.user.id,
      status: { $in: ['confirmed', 'active', 'completed'] }
    });

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          host: req.user.id,
          status: 'completed',
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Calculate average rating
    const cars = await Car.find({ host: req.user.id });
    let totalRating = 0;
    let ratedCars = 0;

    cars.forEach(car => {
      if (car.rating.count > 0) {
        totalRating += car.rating.average;
        ratedCars++;
      }
    });

    const avgRating = ratedCars > 0 ? (totalRating / ratedCars).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalCars,
        activeCars,
        totalBookings,
        totalRevenue,
        avgRating: parseFloat(avgRating)
      }
    });
  } catch (error) {
    next(error);
  }
};
