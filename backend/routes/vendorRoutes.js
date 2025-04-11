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
  forgotPassword,
  resetPassword,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/vendorAuthMiddleware');

// Public routes
router.post('/register', registerVendor);
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

module.exports = router; 