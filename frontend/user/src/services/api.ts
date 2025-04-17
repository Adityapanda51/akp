import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Product, Order, GeocodeResult } from '../types';
import { Platform } from 'react-native';

// Base URL for API calls
// Use appropriate URL based on device type
const API_URL = Platform.select({
  android: 'http://192.168.101.5:5000/api', // Android Emulator
  ios: 'http://192.168.101.5:5000/api',     // iOS Simulator
  default: 'http://192.168.101.5:5000/api'  // Fallback
});

console.log('Using API URL:', API_URL);

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    console.log('Making request to:', config.url);
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

// Auth Services
export const login = async (email: string, password: string): Promise<User> => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string };
}): Promise<User> => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

// Location Services
export const updateUserLocation = async (locationData: {
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
}): Promise<User> => {
  const response = await api.put('/users/location', { currentLocation: locationData });
  return response.data;
};

export const saveUserLocation = async (locationData: {
  name: string;
  type: 'home' | 'work' | 'other';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
}): Promise<User> => {
  const response = await api.post('/users/saved-locations', locationData);
  return response.data;
};

export const deleteSavedLocation = async (locationId: string): Promise<User> => {
  const response = await api.delete(`/users/saved-locations/${locationId}`);
  return response.data;
};

// Enhanced geocodeAddress to handle errors better and return multiple results
export const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
  try {
    const response = await api.get(`/geocode?address=${encodeURIComponent(address)}`);
    return response.data;
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    console.error('Details:', error.response?.data || 'No response data');
    return [];
  }
};

// Enhanced reverseGeocode to handle errors better
export const reverseGeocode = async (latitude: number, longitude: number): Promise<{
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
} | null> => {
  try {
    const response = await api.get(`/geocode/reverse?lat=${latitude}&lng=${longitude}`);
    return response.data;
  } catch (error: any) {
    console.error('Reverse geocoding error:', error.message);
    console.error('Details:', error.response?.data || 'No response data');
    // Return a default value instead of failing
    return {
      formattedAddress: "Location unknown",
      city: "",
      state: "",
      country: ""
    };
  }
};

// Product Services
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const response = await api.get(`/products/category/${category}`);
  return response.data;
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const response = await api.get(`/products/search/${keyword}`);
  return response.data;
};

// Location-based product search
export const getNearbyProducts = async (
  latitude: number,
  longitude: number,
  radius: number = 10, // Default radius in kilometers
  category?: string
): Promise<Product[]> => {
  let url = `/products/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`;
  if (category) {
    url += `&category=${category}`;
  }
  const response = await api.get(url);
  return response.data;
};

// Order Services
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders/myorders');
  return response.data;
};

export const updateOrderToPaid = async (id: string, paymentResult: any): Promise<Order> => {
  const response = await api.put(`/orders/${id}/pay`, paymentResult);
  return response.data;
};

export const resetPassword = async (email: string): Promise<void> => {
  const response = await api.post('/users/reset-password', { email });
  return response.data;
};

// Image Upload Services
export const uploadSingleImage = async (imageUri: string): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Get file name and type from URI
    const fileNameMatch = imageUri.match(/[^/]+$/);
    const fileName = fileNameMatch ? fileNameMatch[0] : 'image.jpg';
    
    // Determine file type
    const fileType = fileName.endsWith('.png') 
      ? 'image/png' 
      : fileName.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
    
    // Append image to form data
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as any);
    
    // Create custom config for form data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
      },
    };
    
    // Make API request
    const response = await axios.post(`${API_URL}/upload`, formData, config);
    
    // Return image URL
    return response.data.imageUrl;
  } catch (error: any) {
    console.error('Image upload error:', error.message);
    console.error('Response data:', error.response?.data);
    throw new Error('Failed to upload image');
  }
};

export const uploadMultipleImages = async (imageUris: string[]): Promise<string[]> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add all images to form data
    imageUris.forEach((uri, index) => {
      const fileNameMatch = uri.match(/[^/]+$/);
      const fileName = fileNameMatch ? fileNameMatch[0] : `image${index}.jpg`;
      
      const fileType = fileName.endsWith('.png') 
        ? 'image/png' 
        : fileName.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
      
      formData.append('images', {
        uri: uri,
        name: fileName,
        type: fileType,
      } as any);
    });
    
    // Create custom config for form data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
      },
    };
    
    // Make API request
    const response = await axios.post(`${API_URL}/upload/multiple`, formData, config);
    
    // Return array of image URLs
    return response.data.imageUrls;
  } catch (error: any) {
    console.error('Multiple image upload error:', error.message);
    console.error('Response data:', error.response?.data);
    throw new Error('Failed to upload images');
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    await api.delete('/upload', { data: { imageUrl } });
  } catch (error: any) {
    console.error('Image deletion error:', error.message);
    console.error('Response data:', error.response?.data);
    throw new Error('Failed to delete image');
  }
};

/**
 * Get a pre-signed URL for an S3 image
 * @param {string} imageUrl - The original S3 image URL
 * @returns {Promise<string>} - The pre-signed URL
 */
export const getPresignedImageUrl = async (imageUrl: string): Promise<string> => {
  try {
    // If it's not an S3 URL, return as is
    if (!imageUrl || !imageUrl.includes('amazonaws.com')) {
      return imageUrl;
    }
    
    // Extract the key from the URL (the filename after the last slash)
    const key = imageUrl.split('/').pop();
    if (!key) return imageUrl;
    
    console.log('Getting presigned URL for:', key);
    
    // Call the API to get a pre-signed URL
    const response = await api.get(`/presigned-url/${key}`);
    
    // Return the pre-signed URL
    return response.data.url;
  } catch (error: any) {
    console.error('Error getting presigned URL:', error.message);
    // Return the original URL as fallback
    return imageUrl;
  }
};

export default api; 