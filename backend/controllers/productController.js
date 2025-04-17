const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });
  res.json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  const products = await Product.find({ category, isActive: true });
  res.json(products);
});

// @desc    Get nearby products
// @route   GET /api/products/nearby
// @access  Public
const getNearbyProducts = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, category } = req.query;
  
  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }
  
  // Convert radius from km to meters
  const radiusInMeters = parseInt(radius) * 1000;
  
  // Build the query
  let query = {
    isActive: true,
    'location.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radiusInMeters
      }
    }
  };
  
  // Add category filter if provided
  if (category) {
    query.category = category.toLowerCase();
  }
  
  try {
    const products = await Product.find(query).populate('vendor', 'name storeName storeLocation serviceRadius');
    res.json(products);
  } catch (error) {
    console.error('Error finding nearby products:', error);
    res.status(500);
    throw new Error('Error finding nearby products: ' + error.message);
  }
});

// @desc    Search products
// @route   GET /api/products/search/:keyword
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const keyword = req.params.keyword;
  const products = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ],
    isActive: true,
  });
  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  getNearbyProducts,
  searchProducts,
}; 