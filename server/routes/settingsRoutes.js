const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// Public route to get settings (e.g. shipping cost for cart)
router.get('/', settingsController.getSettings);

// Protected route to update settings
router.put('/', protect, settingsController.updateSettings);

module.exports = router;
