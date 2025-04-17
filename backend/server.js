const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS Configuration - Allow all origins in development
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Image proxy endpoint for S3 images
// This helps mobile apps access S3 images that might be restricted
app.get('/proxy-image/:key', async (req, res) => {
  try {
    const key = req.params.key;
    if (!key) {
      console.log('Missing image key in request');
      return res.status(400).send('Missing image key');
    }
    
    console.log('Proxying image with key:', key);
    
    // Import the necessary modules for generating presigned URLs
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const s3Client = require('./utils/s3Config');
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    
    if (!bucketName || !region) {
      console.error('Missing S3 configuration:', { bucketName, region });
      return res.status(500).send('Server configuration error');
    }
    
    // Create a GetObjectCommand
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Generate presigned URL
    console.log('Generating presigned URL for S3 object');
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL:', presignedUrl);
    
    // Fetch the image using the presigned URL
    console.log('Fetching image using presigned URL...');
    const response = await axios({
      method: 'get',
      url: presignedUrl,
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });
    
    console.log('S3 response received, status:', response.status);
    
    // Set appropriate headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the image data
    console.log('Sending image data, length:', response.data.length);
    return res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error.message);
    if (error.response) {
      console.error('S3 response status:', error.response.status);
      console.error('S3 response headers:', error.response.headers);
    }
    if (error.request) {
      console.error('No response received from S3');
    }
    return res.status(404).send('Image not found or access denied');
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// Test route for images - serves a simple test image
app.get('/test-image', (req, res) => {
  console.log('Test image endpoint called');
  // Base64 encoded small test image (1x1 pixel)
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const img = Buffer.from(base64Image, 'base64');
  
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.set('Access-Control-Allow-Origin', '*'); // Allow CORS for this endpoint
  res.send(img);
});

// Debug endpoint to check S3 configuration
app.get('/debug/s3-config', (req, res) => {
  const s3Config = {
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
  };
  
  res.json({
    success: true,
    config: s3Config,
    message: 'S3 configuration loaded successfully'
  });
});

// Test endpoint to display a specific image from S3
app.get('/test-s3-image', async (req, res) => {
  console.log('Test S3 image endpoint called');
  
  try {
    const key = req.query.key || '1744903183384-ab566f6fe50a0e9f.jpeg'; // Default to one of your known images
    console.log('Fetching S3 image with key:', key);
    
    // Import the necessary modules for generating presigned URLs
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const s3Client = require('./utils/s3Config');
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    
    if (!bucketName || !region) {
      console.error('Missing S3 configuration:', { bucketName, region });
      return res.status(500).send('Server configuration error');
    }
    
    // Create a GetObjectCommand
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Generate presigned URL
    console.log('Generating presigned URL for S3 object');
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL:', presignedUrl);
    
    // Fetch the image using the presigned URL
    console.log('Fetching image using presigned URL...');
    const response = await axios({
      method: 'get',
      url: presignedUrl,
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });
    
    console.log('S3 response received, status:', response.status);
    
    // Set appropriate headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.set('Access-Control-Allow-Origin', '*'); // Allow CORS for this endpoint
    
    // Send the image data
    console.log('Sending image data, length:', response.data.length);
    return res.send(response.data);
  } catch (error) {
    console.error('Error fetching test S3 image:', error.message);
    if (error.response) {
      console.error('S3 response status:', error.response.status);
      console.error('S3 response headers:', error.response.headers);
    }
    return res.status(500).send('Error fetching image: ' + error.message);
  }
});

// Get presigned URL for S3 image
app.get('/api/presigned-url/:key', async (req, res) => {
  console.log('Presigned URL endpoint called');
  
  try {
    const key = req.params.key;
    if (!key) {
      console.log('Missing image key in request');
      return res.status(400).json({ success: false, message: 'Missing image key' });
    }
    
    console.log('Generating presigned URL for key:', key);
    
    // Import the necessary modules for generating presigned URLs
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const s3Client = require('./utils/s3Config');
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    
    if (!bucketName) {
      console.error('Missing S3 bucket configuration');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    
    // Create a GetObjectCommand
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Generate presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL successfully');
    
    return res.json({
      success: true,
      url: presignedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URL',
      error: error.message,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Use port 5000 as originally configured
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('CORS enabled for all origins in development mode');
}); 