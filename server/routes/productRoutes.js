const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:idOrSlug', productController.getProduct);

// Protected routes (Admin only)
router.post('/', protect, productController.createProduct);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
