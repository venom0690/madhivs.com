const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Login route (FIX #6: rate limited — 5 attempts per 15 min)
router.post('/login', loginLimiter, authController.login);

// Get current admin info
router.get('/me', protect, authController.getMe);

module.exports = router;
