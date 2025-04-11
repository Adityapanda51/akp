import axios from 'axios';
import type { RawAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local IP address for Expo Go
const getLocalIpAddress = () => {
  return '192.168.98.174'; // Your local IP address
};

// Use environment variable or fallback to appropriate URL based on platform
const API_URL = Platform.select({
  android: `http://${getLocalIpAddress()}:5000/api`,
  ios: `http://${getLocalIpAddress()}:5000/api`,
  default: 'http://localhost:5000/api'
});

console.log('API URL being used:', API_URL);

interface User {
  _id: string;
  storeName: string;
  name: string;
  email: string;
  phone: string;
  storeAddress: string;
  role: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  storeName: string;
  token: string;
}

interface ProfileResponse extends User {}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('vendorToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('Response interceptor - Status:', response.status);
    console.log('Response interceptor - Data:', response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', {
        request: error.request,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        }
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
      console.error('Error config:', error.config);
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const registerVendor = async (vendorData: any) => {
  try {
    console.log('Registering vendor with data:', vendorData);
    console.log('Making request to:', `${API_URL}/vendors`);
    const response = await api.post('/vendors', vendorData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        data: error.config?.data
      }
    });
    throw error;
  }
};

export const loginVendor = async (credentials: { email: string; password: string }) => {
  try {
    console.log('Logging in vendor with email:', credentials.email);
    const response = await api.post('/vendors/login', credentials);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/vendors/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post('/vendors/reset-password', { token, password });
  return response.data;
};

// Profile APIs
export const getVendorProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateVendorProfile = async (profileData: any) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

export const updateVendorPassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
  const response = await api.put('/profile/password', passwordData);
  return response.data;
};

// Product APIs
export const getVendorProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const createProduct = async (productData: any) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (productId: string, productData: any) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId: string) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

export default api; 