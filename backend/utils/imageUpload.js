const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const s3Client = require('./s3Config');

// Configure Multer for memory storage (files will be in memory before upload to S3)
const storage = multer.memoryStorage();

// File filter function to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only JPEG, JPG, PNG, and WEBP are allowed.'), false);
  }
};

// Configure upload with limits
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter,
});

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} filename - The name of the file
 * @param {string} mimetype - The MIME type of the file
 * @returns {Promise<string>} - The URL of the uploaded file
 */
const uploadToS3 = async (fileBuffer, filename, mimetype) => {
  console.log('==== S3 UTILITY - UPLOAD TO S3 ====');
  
  // Generate a unique key for the file
  const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(filename)}`;

  // Set bucket name from env variable
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  
  console.log('S3 upload config:', { 
    key, 
    bucketName, 
    region, 
    contentType: mimetype,
    fileSize: fileBuffer.length
  });

  // Set upload parameters
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  try {
    console.log('Sending PutObjectCommand to S3...');
    // Upload file to S3
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('S3 PutObjectCommand response:', result);
    
    // Construct the URL of the uploaded file
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    console.log('Generated S3 URL:', fileUrl);
    console.log('==== END S3 UTILITY - UPLOAD TO S3 ====');
    
    // Return the URL of the uploaded file
    return fileUrl;
  } catch (error) {
    console.error('==== S3 UTILITY - UPLOAD ERROR ====');
    console.error('Error uploading to S3:', error);
    console.error('Upload parameters:', {
      Bucket: bucketName,
      Key: key,
      ContentType: mimetype,
      FileSize: fileBuffer.length
    });
    
    // Check S3 client configuration
    console.error('S3 client config:', {
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME
    });
    console.error('==== END S3 UTILITY - UPLOAD ERROR ====');
    
    throw new Error('Failed to upload file to S3: ' + error.message);
  }
};

/**
 * Generate a presigned URL for viewing an object
 * @param {string} key - The key of the object in S3
 * @returns {Promise<string>} - The presigned URL
 */
const getPresignedUrl = async (key) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    // Generate presigned URL that expires in 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

/**
 * Delete a file from S3
 * @param {string} url - The URL of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (url) => {
  try {
    // Extract the key from the URL
    const key = url.split('/').pop();
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Delete the object from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - The S3 URL
 * @returns {string} - The S3 key
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
};

module.exports = {
  upload,
  uploadToS3,
  getPresignedUrl,
  deleteFromS3,
  getKeyFromUrl,
}; 