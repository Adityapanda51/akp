const asyncHandler = require('express-async-handler');
const { uploadToS3, deleteFromS3 } = require('../utils/imageUpload');

/**
 * @desc    Upload a single image to S3
 * @route   POST /api/upload
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  console.log('==== S3 UPLOAD CONTROLLER - SINGLE IMAGE ====');
  console.log('Upload request received from user:', req.user?._id);
  
  if (!req.file) {
    console.log('No file found in the request');
    res.status(400);
    throw new Error('No file uploaded');
  }

  try {
    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Upload file to S3
    console.log('Attempting to upload to S3...');
    const fileUrl = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log('S3 upload successful. URL:', fileUrl);
    console.log('==== END S3 UPLOAD CONTROLLER - SINGLE IMAGE ====');
    
    res.status(201).json({
      success: true,
      imageUrl: fileUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('==== S3 UPLOAD ERROR - SINGLE IMAGE ====');
    console.error('Failed to upload image to S3:', error.message);
    console.error('Error details:', error);
    console.error('==== END S3 UPLOAD ERROR - SINGLE IMAGE ====');
    res.status(500);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
});

/**
 * @desc    Upload multiple images to S3
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  console.log('==== S3 UPLOAD CONTROLLER - MULTIPLE IMAGES ====');
  console.log('Upload request received from user:', req.user?._id);
  
  if (!req.files || req.files.length === 0) {
    console.log('No files found in the request');
    res.status(400);
    throw new Error('No files uploaded');
  }

  try {
    console.log('Files received:', req.files.length);
    req.files.forEach((file, index) => {
      console.log(`File ${index}:`, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
    });
    
    // Upload all files to S3
    console.log('Attempting to upload multiple files to S3...');
    const uploadPromises = req.files.map(file => 
      uploadToS3(file.buffer, file.originalname, file.mimetype)
    );

    const imageUrls = await Promise.all(uploadPromises);
    
    console.log('All files uploaded successfully to S3');
    console.log('Image URLs:', imageUrls);
    console.log('==== END S3 UPLOAD CONTROLLER - MULTIPLE IMAGES ====');

    res.status(201).json({
      success: true,
      imageUrls,
      message: 'Images uploaded successfully',
    });
  } catch (error) {
    console.error('==== S3 UPLOAD ERROR - MULTIPLE IMAGES ====');
    console.error('Failed to upload images to S3:', error.message);
    console.error('Error details:', error);
    console.error('==== END S3 UPLOAD ERROR - MULTIPLE IMAGES ====');
    res.status(500);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
});

/**
 * @desc    Delete an image from S3
 * @route   DELETE /api/upload
 * @access  Private
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400);
    throw new Error('Image URL is required');
  }

  try {
    await deleteFromS3(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
});

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
}; 