const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  getNearbyProducts,
  searchProducts,
} = require('../controllers/productController');

// GET routes
router.route('/').get(getProducts);
router.route('/nearby').get(getNearbyProducts);
router.route('/category/:category').get(getProductsByCategory);
router.route('/search/:keyword').get(searchProducts);
router.route('/:id').get(getProductById);

module.exports = router; 