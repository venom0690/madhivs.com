const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:idOrSlug', productController.getProduct);

// Protected routes (Admin only) with CSRF protection
router.post('/', protect, verifyCsrfToken, productController.createProduct);
router.put('/:id', protect, verifyCsrfToken, productController.updateProduct);
router.delete('/:id', protect, verifyCsrfToken, productController.deleteProduct);

module.exports = router;
