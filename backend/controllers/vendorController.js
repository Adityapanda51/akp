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
  const { name, email, password, storeName, phone } = req.body;

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
    phone,
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
    user.description = req.body.description || user.description;
    
    // Update store location if provided
    if (req.body.storeLocation && req.body.storeLocation.coordinates) {
      user.storeLocation = {
        type: 'Point',
        coordinates: req.body.storeLocation.coordinates,
        address: req.body.storeLocation.address,
        city: req.body.storeLocation.city,
        state: req.body.storeLocation.state,
        country: req.body.storeLocation.country,
        formattedAddress: req.body.storeLocation.formattedAddress
      };
    }
    
    // Update service radius if provided
    if (req.body.serviceRadius) {
      user.serviceRadius = req.body.serviceRadius;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Also update the location of all vendor's products
    if (req.body.storeLocation && req.body.storeLocation.coordinates) {
      await Product.updateMany(
        { vendor: user._id },
        { 
          location: user.storeLocation,
          deliveryRadius: user.serviceRadius
        }
      );
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      storeName: updatedUser.storeName,
      storeAddress: updatedUser.storeAddress,
      phone: updatedUser.phone,
      description: updatedUser.description,
      storeLocation: updatedUser.storeLocation,
      serviceRadius: updatedUser.serviceRadius,
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
  console.log('Add product request received:', req.body);
  
  const {
    name,
    description,
    price,
    category,
    countInStock,
    images,
    brand
  } = req.body;

  console.log('Images received from client:', JSON.stringify(images));
  
  // Ensure images is always an array
  let productImages = [];
  if (images) {
    if (Array.isArray(images)) {
      productImages = images;
    } else if (typeof images === 'string') {
      productImages = [images];
    }
  }
  
  // Make sure we have at least one placeholder image if no images are provided
  if (productImages.length === 0) {
    productImages = ['https://via.placeholder.com/400x400?text=No+Image'];
  }
  
  console.log('Processed images array:', JSON.stringify(productImages));

  // Get the vendor's location information
  const vendor = await User.findById(req.user._id);
  const vendorLocation = vendor.storeLocation || { type: 'Point' };
  const deliveryRadius = vendor.serviceRadius || 10; // Default 10km

  const product = new Product({
    name,
    description,
    price,
    category,
    countInStock,
    images: productImages, // Use the processed images array
    brand: brand || 'Default Brand',
    vendor: req.user._id,
    location: vendorLocation,
    deliveryRadius,
    isActive: true
  });

  console.log('Creating product with images:', JSON.stringify(productImages));
  
  try {
    const createdProduct = await product.save();
    console.log('Product created successfully:', createdProduct);
    
    // Double-check the saved product has images
    const savedProduct = await Product.findById(createdProduct._id);
    console.log('Saved product images:', savedProduct.images);
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/vendors/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  console.log('Update product request received for product ID:', req.params.id);
  console.log('Update data:', req.body);
  
  const {
    name,
    description,
    price,
    category,
    countInStock,
    images,
    brand,
    isActive
  } = req.body;

  console.log('Images received for update:', JSON.stringify(images));

  const product = await Product.findById(req.params.id);

  if (product && product.vendor.toString() === req.user._id.toString()) {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.brand = brand || product.brand;
    
    // Process images array properly
    if (images) {
      let productImages = [];
      if (Array.isArray(images)) {
        productImages = images;
      } else if (typeof images === 'string') {
        productImages = [images];
      }
      
      // Make sure we have at least one placeholder image if no images are provided
      if (productImages.length === 0) {
        productImages = ['https://via.placeholder.com/400x400?text=No+Image'];
      }
      
      console.log('Processed update images array:', JSON.stringify(productImages));
      product.images = productImages;
    } else if (!product.images || product.images.length === 0) {
      // Ensure there's at least a placeholder if no images exist and none were provided
      product.images = ['https://via.placeholder.com/400x400?text=No+Image'];
    }
    
    // Update active status if provided
    if (isActive !== undefined) {
      product.isActive = isActive;
    }

    try {
      const updatedProduct = await product.save();
      console.log('Product updated successfully:', updatedProduct);
      
      // Double-check the saved product has images
      const savedProduct = await Product.findById(updatedProduct._id);
      console.log('Updated product images:', savedProduct.images);
      
      res.json(savedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
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
    await Product.findByIdAndDelete(req.params.id);
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

// @desc    Get orders for the vendor
// @route   GET /api/vendors/orders
// @access  Private
const getVendorOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    'orderItems.vendor': req.user._id
  })
  .populate('user', 'name email')
  .populate('orderItems.product', 'name images price')
  .sort({ createdAt: -1 });
  
  res.json(orders);
});

// @desc    Get order details
// @route   GET /api/vendors/orders/:id
// @access  Private
const getVendorOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name images price');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if order contains items from this vendor
  const vendorItems = order.orderItems.filter(
    item => item.vendor && item.vendor.toString() === req.user._id.toString()
  );

  if (vendorItems.length === 0) {
    res.status(401);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

// @desc    Update order status
// @route   PUT /api/vendors/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Check if order contains items from this vendor
  const vendorItems = order.orderItems.filter(
    item => item.vendor && item.vendor.toString() === req.user._id.toString()
  );

  if (vendorItems.length === 0) {
    res.status(401);
    throw new Error('Not authorized to update this order');
  }
  
  // Update status
  order.status = status;
  
  // If status is completed, mark as delivered
  if (status === 'completed') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Get pending orders count
// @route   GET /api/vendors/orders/pending/count
// @access  Private
const getPendingOrdersCount = asyncHandler(async (req, res) => {
  const pendingOrders = await Order.countDocuments({
    'orderItems.vendor': req.user._id,
    status: 'pending'
  });
  
  res.json({ count: pendingOrders });
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
  getVendorOrders,
  getVendorOrderById,
  updateOrderStatus,
  getPendingOrdersCount,
  forgotPassword,
  resetPassword,
}; 