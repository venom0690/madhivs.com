const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');

// Homepage Settings
router.get('/homepage', contentController.getHomepageParams);
router.post('/homepage', protect, verifyCsrfToken, contentController.updateHomepageParams);
router.put('/homepage', protect, verifyCsrfToken, contentController.updateHomepageParams); // Alias

// Search Keywords
router.get('/keywords', contentController.getKeywords);
router.post('/keywords', protect, verifyCsrfToken, contentController.createKeyword);
router.put('/keywords/:id', protect, verifyCsrfToken, contentController.updateKeyword);
router.delete('/keywords/:id', protect, verifyCsrfToken, contentController.deleteKeyword);

module.exports = router;
