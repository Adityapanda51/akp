# AWS S3 Setup for Image Storage

## Overview
This document provides instructions for setting up AWS S3 for image storage in the AKP Hyperlocal Shopping App. The app uses S3 buckets to store user profile images, vendor profile images, product images, and delivery proof images.

## Prerequisites
- AWS account
- Access to AWS Management Console
- Basic understanding of AWS IAM and S3 services

## Step 1: Create an S3 Bucket

1. Log in to the AWS Management Console
2. Navigate to S3 from the Services menu
3. Click "Create bucket"
4. Name your bucket (e.g., "akp-app-images") - note that bucket names must be globally unique
5. Select your preferred AWS Region
6. Configure bucket settings:
   - For development: You can leave Block Public Access settings at default
   - For production: Enable appropriate privacy settings based on your requirements
7. Enable versioning if needed
8. Click "Create bucket"

## Step 2: Configure CORS for the Bucket

1. Select your newly created bucket
2. Go to the "Permissions" tab
3. Scroll down to the CORS section and click "Edit"
4. Add the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

For production, replace `"AllowedOrigins": ["*"]` with your specific domains.

## Step 3: Create IAM User for API Access

1. Navigate to IAM from the Services menu
2. Go to "Users" and click "Add users"
3. Enter a user name (e.g., "akp-app-s3-user")
4. Select "Access key - Programmatic access" as the access type
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Create a new policy:
   - Click "Create policy"
   - Go to the JSON tab
   - Add the following policy (replace `your-bucket-name` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

8. Name the policy (e.g., "AKP-S3-Access") and create it
9. Return to the user creation process and refresh the policy list
10. Find and select your newly created policy
11. Click "Next: Tags" (add optional tags if needed)
12. Click "Next: Review" and then "Create user"
13. **IMPORTANT**: Download or copy the Access Key ID and Secret Access Key - you will not be able to view the Secret Access Key again

## Step 4: Update Backend Environment Variables

Update your backend `.env` file with the following values:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_selected_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

## Step 5: Install Dependencies and Restart Server

1. Navigate to the backend directory
2. Install the required packages:

```bash
npm install
```

3. Restart your server:

```bash
npm run dev
```

## Testing S3 Integration

After completing the setup, test the S3 integration using the API endpoints:

- POST `/api/upload` - Upload a single image
- POST `/api/upload/multiple` - Upload multiple images
- DELETE `/api/upload` - Delete an image

## Security Best Practices

For production environments:

1. Use IAM roles instead of access keys when possible
2. Implement strict CORS policies to only allow your domain(s)
3. Set up bucket policies to restrict access
4. Enable encryption for data at rest
5. Consider implementing presigned URLs for direct uploads from clients
6. Regularly rotate access keys
7. Enable bucket logging to monitor access
8. Set up lifecycle policies to manage storage costs 