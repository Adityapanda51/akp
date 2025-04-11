const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new vendor
// @route   POST /api/vendors
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  console.log('Vendor registration attempt:', req.body);
  const { name, email, password, storeName } = req.body;

  console.log('Checking if user already exists with email:', email);
  const userExists = await User.findOne({ email });

  if (userExists) {
    console.log('Registration failed: User already exists');
    res.status(400);
    throw new Error('User already exists');
  }

  console.log('Creating new vendor user');
  const user = await User.create({
    name,
    email,
    password,
    role: 'vendor',
    storeName,
  });

  if (user) {
    console.log('Vendor registration successful:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeName: user.storeName
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeName: user.storeName,
      token: generateToken(user._id),
    });
  } else {
    console.log('Registration failed: Invalid user data');
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth vendor & get token
// @route   POST /api/vendors/login
// @access  Public
const authVendor = asyncHandler(async (req, res) => {
  console.log('Vendor login attempt:', req.body);
  const { email, password } = req.body;

  console.log('Looking for user with email:', email);
  const user = await User.findOne({ email });
  
  if (user) {
    console.log('User found:', { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      name: user.name
    });
    
    const isPasswordMatch = await user.matchPassword(password);
    console.log('Password match:', isPasswordMatch);
    
    if (isPasswordMatch && user.role === 'vendor') {
      console.log('Login successful, generating token');
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        token: generateToken(user._id),
      });
    } else {
      console.log('Login failed: Invalid credentials or not a vendor');
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } else {
    console.log('Login failed: User not found');
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private
const getVendorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeName: user.storeName,
      storeAddress: user.storeAddress,
      phone: user.phone,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private
const updateVendorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.storeName = req.body.storeName || user.storeName;
    user.storeAddress = req.body.storeAddress || user.storeAddress;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      storeName: updatedUser.storeName,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get vendor products
// @route   GET /api/vendors/products
// @access  Private
const getVendorProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id });
  res.json(products);
});

// @desc    Add a product
// @route   POST /api/vendors/products
// @access  Private
const addProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    countInStock,
    image
  } = req.body;

  const product = new Product({
    name,
    description,
    price,
    category,
    countInStock,
    image,
    vendor: req.user._id,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/vendors/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    countInStock,
    image
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product && product.vendor.toString() === req.user._id.toString()) {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;
    product.image = image || product.image;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found or not authorized');
  }
});

// @desc    Delete a product
// @route   DELETE /api/vendors/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product && product.vendor.toString() === req.user._id.toString()) {
    await product.remove();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found or not authorized');
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/vendors/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({ vendor: req.user._id });
  const totalOrders = await Order.countDocuments({ 
    'orderItems.vendor': req.user._id,
    status: { $in: ['pending', 'processing', 'completed'] }
  });
  
  const recentOrders = await Order.find({ 
    'orderItems.vendor': req.user._id 
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  const revenue = await Order.aggregate([
    {
      $match: {
        'orderItems.vendor': req.user._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalPrice' }
      }
    }
  ]);

  res.json({
    totalProducts,
    totalOrders,
    revenue: revenue.length > 0 ? revenue[0].total : 0,
    recentOrders
  });
});

// @desc    Forgot password
// @route   POST /api/vendors/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, role: 'vendor' });

  if (!user) {
    res.status(404);
    throw new Error('No vendor account found with this email');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  await user.save();

  // Create reset url based on platform
  const platform = req.headers['user-agent']?.toLowerCase() || '';
  let baseUrl = process.env.FRONTEND_URL_WEB; // default to web

  if (platform.includes('android')) {
    baseUrl = process.env.FRONTEND_URL_ANDROID;
  } else if (platform.includes('ios')) {
    baseUrl = process.env.FRONTEND_URL_IOS;
  }

  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You are receiving this email because you requested to reset your password. Please click the following link to reset your password: ${resetUrl}`,
      resetUrl,
      userName: user.name
    });

    res.json({ 
      message: 'Password reset email sent',
      success: true
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Reset password
// @route   PUT /api/vendors/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
    role: 'vendor',
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    message: 'Password reset successful',
  });
});

module.exports = {
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
}; 