const express = require('express');
const router = express.Router();
const {
  registerDelivery,
  authDelivery,
  getDeliveryProfile,
  updateDeliveryProfile,
  getAvailableOrders,
  getAssignedOrders,
  acceptOrder,
  deliverOrder,
  getDeliveryStats,
  forgotPassword,
  resetPassword,
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/deliveryAuthMiddleware');

// Public routes
router.post('/', registerDelivery);
router.post('/login', authDelivery);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/profile', protect, getDeliveryProfile);
router.put('/profile', protect, updateDeliveryProfile);
router.get('/orders/available', protect, getAvailableOrders);
router.get('/orders', protect, getAssignedOrders);
router.put('/orders/:id/accept', protect, acceptOrder);
router.put('/orders/:id/deliver', protect, deliverOrder);
router.get('/statistics', protect, getDeliveryStats);

module.exports = router; 