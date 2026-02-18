const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);

// Protected routes (Admin only) with CSRF protection
router.post('/', protect, verifyCsrfToken, categoryController.createCategory);
router.put('/:id', protect, verifyCsrfToken, categoryController.updateCategory);
router.delete('/:id', protect, verifyCsrfToken, categoryController.deleteCategory);

module.exports = router;
