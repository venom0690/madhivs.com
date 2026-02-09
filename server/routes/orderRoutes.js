const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Public route - Create order (checkout)
router.post('/', orderController.createOrder);

// Protected routes (Admin only)
router.get('/', protect, orderController.getAllOrders);
router.get('/:id', protect, orderController.getOrder);
router.patch('/:id', protect, orderController.updateOrderStatus);

module.exports = router;
