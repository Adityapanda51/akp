const express = require('express');
const router = express.Router();
const {
  registerVendor,
  authVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
  getVendorOrders,
  getVendorOrderById,
  updateOrderStatus,
  getPendingOrdersCount,
  forgotPassword,
  resetPassword,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/vendorAuthMiddleware');

// Public routes
router.post('/', registerVendor);
router.post('/login', authVendor);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/profile', protect, getVendorProfile);
router.put('/profile', protect, updateVendorProfile);
router.get('/products', protect, getVendorProducts);
router.post('/products', protect, addProduct);
router.put('/products/:id', protect, updateProduct);
router.delete('/products/:id', protect, deleteProduct);
router.get('/dashboard', protect, getDashboardStats);

// Order routes
router.get('/orders', protect, getVendorOrders);
router.get('/orders/pending/count', protect, getPendingOrdersCount);
router.get('/orders/:id', protect, getVendorOrderById);
router.put('/orders/:id/status', protect, updateOrderStatus);

module.exports = router; 