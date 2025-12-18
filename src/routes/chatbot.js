const express = require('express');
const { processMessage, getSuggestions } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public route - suggestions don't require auth
router.get('/suggestions', getSuggestions);

// Protected route - chat requires authentication
router.post('/message', protect, processMessage);

module.exports = router;
