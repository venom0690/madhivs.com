const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');

// All upload routes require admin authentication
router.use(protect);

// Single image upload with CSRF protection
router.post('/', verifyCsrfToken, uploadController.uploadSingle, uploadController.uploadSingleImage);

// Multiple images upload with CSRF protection
router.post('/multiple', verifyCsrfToken, uploadController.uploadMultiple, uploadController.uploadMultipleImages);

// Delete image with CSRF protection
router.delete('/:filename', verifyCsrfToken, uploadController.deleteImage);

module.exports = router;
