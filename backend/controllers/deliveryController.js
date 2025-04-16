const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new delivery partner
// @route   POST /api/delivery
// @access  Public
const registerDelivery = asyncHandler(async (req, res) => {
  console.log('Delivery partner registration attempt:', req.body);
  const { name, email, password, phone, vehicleType, vehicleNumber } = req.body;

  console.log('Checking if user already exists with email:', email);
  const userExists = await User.findOne({ email });

  if (userExists) {
    console.log('Registration failed: User already exists');
    res.status(400);
    throw new Error('User already exists');
  }

  console.log('Creating new delivery partner user');
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'delivery',
    vehicleType,
    vehicleNumber,
  });

  if (user) {
    console.log('Delivery partner registration successful:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      vehicleType: user.vehicleType,
      vehicleNumber: user.vehicleNumber,
      token: generateToken(user._id),
    });
  } else {
    console.log('Registration failed: Invalid user data');
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth delivery partner & get token
// @route   POST /api/delivery/login
// @access  Public
const authDelivery = asyncHandler(async (req, res) => {
  console.log('Delivery partner login attempt:', req.body);
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
    
    if (isPasswordMatch && user.role === 'delivery') {
      console.log('Login successful, generating token');
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
        token: generateToken(user._id),
      });
    } else {
      console.log('Login failed: Invalid credentials or not a delivery partner');
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } else {
    console.log('Login failed: User not found');
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get delivery partner profile
// @route   GET /api/delivery/profile
// @access  Private
const getDeliveryProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      vehicleType: user.vehicleType,
      vehicleNumber: user.vehicleNumber,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update delivery partner profile
// @route   PUT /api/delivery/profile
// @access  Private
const updateDeliveryProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.vehicleType = req.body.vehicleType || user.vehicleType;
    user.vehicleNumber = req.body.vehicleNumber || user.vehicleNumber;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      vehicleType: updatedUser.vehicleType,
      vehicleNumber: updatedUser.vehicleNumber,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get available orders for delivery
// @route   GET /api/delivery/orders/available
// @access  Private
const getAvailableOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 
    status: 'processing',
    deliveryPartner: null
  })
  .populate('user', 'name email')
  .populate('orderItems.product', 'name price');
  
  res.json(orders);
});

// @desc    Get orders assigned to delivery partner
// @route   GET /api/delivery/orders
// @access  Private
const getAssignedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 
    deliveryPartner: req.user._id
  })
  .populate('user', 'name email')
  .populate('orderItems.product', 'name price');
  
  res.json(orders);
});

// @desc    Accept an order for delivery
// @route   PUT /api/delivery/orders/:id/accept
// @access  Private
const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status !== 'processing') {
    res.status(400);
    throw new Error('Order cannot be accepted at this time');
  }

  if (order.deliveryPartner) {
    res.status(400);
    throw new Error('Order already has a delivery partner assigned');
  }

  order.deliveryPartner = req.user._id;
  order.status = 'out_for_delivery';
  order.deliveryStartedAt = Date.now();

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Mark order as delivered
// @route   PUT /api/delivery/orders/:id/deliver
// @access  Private
const deliverOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.deliveryPartner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this order');
  }

  if (order.status !== 'out_for_delivery') {
    res.status(400);
    throw new Error('Order cannot be marked as delivered');
  }

  order.status = 'delivered';
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Get delivery statistics
// @route   GET /api/delivery/statistics
// @access  Private
const getDeliveryStats = asyncHandler(async (req, res) => {
  // Total deliveries count
  const totalDeliveries = await Order.countDocuments({
    deliveryPartner: req.user._id,
    status: { $in: ['out_for_delivery', 'delivered'] }
  });

  // Completed deliveries count
  const completedDeliveries = await Order.countDocuments({
    deliveryPartner: req.user._id,
    status: 'delivered'
  });

  // Pending deliveries count
  const pendingDeliveries = await Order.countDocuments({
    deliveryPartner: req.user._id,
    status: 'out_for_delivery'
  });

  // Recent deliveries
  const recentDeliveries = await Order.find({
    deliveryPartner: req.user._id
  })
  .sort({ updatedAt: -1 })
  .limit(5)
  .populate('user', 'name')
  .populate('orderItems.product', 'name price');

  // Calculate average delivery time (in minutes)
  const completedOrders = await Order.find({
    deliveryPartner: req.user._id,
    status: 'delivered',
    deliveryStartedAt: { $exists: true },
    deliveredAt: { $exists: true }
  });

  let avgDeliveryTime = 0;
  if (completedOrders.length > 0) {
    const totalTime = completedOrders.reduce((acc, order) => {
      const deliveryTime = new Date(order.deliveredAt) - new Date(order.deliveryStartedAt);
      return acc + (deliveryTime / (1000 * 60)); // Convert to minutes
    }, 0);
    avgDeliveryTime = Math.round(totalTime / completedOrders.length);
  }

  res.json({
    totalDeliveries,
    completedDeliveries,
    pendingDeliveries,
    avgDeliveryTime,
    recentDeliveries
  });
});

// @desc    Forgot password
// @route   POST /api/delivery/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, role: 'delivery' });

  if (!user) {
    res.status(404);
    throw new Error('No delivery partner account found with this email');
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
// @route   PUT /api/delivery/reset-password/:resetToken
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
    role: 'delivery',
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
}; 