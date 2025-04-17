import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { getPresignedImageUrl } from '../services/api';
import { COLORS } from '../utils/theme';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholderContent?: string;
}

/**
 * SafeImage component that handles:
 * 1. Fetching pre-signed URLs for S3 images
 * 2. Showing loading state
 * 3. Handling image load errors with placeholders
 * 4. Maintaining image aspect ratio
 */
const SafeImage: React.FC<SafeImageProps> = ({ 
  uri, 
  placeholderContent, 
  style, 
  ...props 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Function to generate a placeholder image URL with text content
  const getPlaceholderImageUrl = (content: string = 'Image') => {
    // Encode the content to be URL-safe
    const encodedContent = encodeURIComponent(content.substring(0, 20));
    // Create a placeholder image with the content
    return `https://via.placeholder.com/400/CCCCCC/333333?text=${encodedContent}`;
  };

  useEffect(() => {
    const fetchImageUrl = async () => {
      setLoading(true);
      setError(false);
      
      try {
        // Only process S3 URLs for presigned access
        if (uri && uri.includes('amazonaws.com')) {
          console.log('Fetching presigned URL for:', uri);
          const presignedUrl = await getPresignedImageUrl(uri);
          setImageUrl(presignedUrl);
        } else {
          // For non-S3 images, use the URI directly
          setImageUrl(uri);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
        // Use placeholder in case of error
        setImageUrl(getPlaceholderImageUrl(placeholderContent));
      } finally {
        setLoading(false);
      }
    };

    if (uri) {
      fetchImageUrl();
    } else {
      setError(true);
      setLoading(false);
      setImageUrl(getPlaceholderImageUrl(placeholderContent));
    }
  }, [uri, placeholderContent]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ 
        uri: error || !imageUrl
          ? getPlaceholderImageUrl(placeholderContent)
          : imageUrl
      }}
      style={style}
      onError={() => {
        console.log('Image load error for URL:', imageUrl);
        setError(true);
        setImageUrl(getPlaceholderImageUrl(placeholderContent));
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SafeImage; 