const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

exports.protect = async (req, res, next) => {
  try {
    let token;

    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Authorization header:', req.headers.authorization);

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? 'Present (' + token.substring(0, 20) + '...)' : 'Missing');
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('✅ Token decoded successfully:', { id: decoded.id, iat: decoded.iat });

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role);
      next();
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
