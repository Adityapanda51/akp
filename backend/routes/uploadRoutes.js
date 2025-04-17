const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultipleImages, deleteImage } = require('../controllers/uploadController');
const { upload } = require('../utils/imageUpload');
const { protect } = require('../middleware/authMiddleware');

// Single image upload route
router.post('/', protect, upload.single('image'), uploadImage);

// Multiple images upload route
router.post('/multiple', protect, upload.array('images', 5), uploadMultipleImages);

// Image deletion route
router.delete('/', protect, deleteImage);

module.exports = router; 