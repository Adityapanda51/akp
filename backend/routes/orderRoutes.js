const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/orders - Create new order
router.route('/').post(protect, createOrder);

// GET /api/orders/myorders - Get logged in user's orders
router.route('/myorders').get(protect, getMyOrders);

// GET /api/orders/:id - Get order by ID
router.route('/:id').get(protect, getOrderById);

// PUT /api/orders/:id/pay - Update order to paid
router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router; 