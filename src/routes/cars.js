const express = require('express');
const {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  getHostCars,
  toggleCarStatus,
  getHostStats
} = require('../controllers/carController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCars);
router.get('/:id', getCar);

// Protected routes - Any authenticated user can create, manage their own cars, and book others' cars
router.post('/', protect, createCar);

// User's own cars routes - any authenticated user can access
router.get('/host/my-cars', protect, getHostCars);
router.get('/host/stats', protect, getHostStats);

router.route('/:id')
  .put(protect, updateCar)
  .delete(protect, deleteCar);

router.patch('/:id/toggle-status', protect, toggleCarStatus);

module.exports = router;
