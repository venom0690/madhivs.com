const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All upload routes require admin authentication
router.use(protect);

// Single image upload
router.post('/', uploadController.uploadSingle, uploadController.uploadSingleImage);

// Multiple images upload
router.post('/multiple', uploadController.uploadMultiple, uploadController.uploadMultipleImages);

// Delete image
router.delete('/:filename', uploadController.deleteImage);

module.exports = router;
