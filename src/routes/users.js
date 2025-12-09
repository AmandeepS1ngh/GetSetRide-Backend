const express = require('express');
const { protect } = require('../middleware/auth');
const { getMe } = require('../controllers/authController');
const User = require('../models/User');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, getMe);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
