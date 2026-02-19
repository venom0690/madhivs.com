const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');
const { orderLimiter } = require('../middleware/rateLimiter');

// Public route - Create order (checkout) with rate limiting
router.post('/', orderLimiter, orderController.createOrder);

// Protected routes (Admin only) with CSRF protection on state-changing routes
router.get('/', protect, orderController.getAllOrders);
router.get('/:id', protect, orderController.getOrder);
router.patch('/:id', protect, verifyCsrfToken, orderController.updateOrderStatus);

module.exports = router;
