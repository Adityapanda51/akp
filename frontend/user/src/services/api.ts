import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Product, Order } from '../types';
import { Platform } from 'react-native';

// Base URL for API calls
// Use appropriate URL based on device type
const API_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:5000/api', // Android Emulator
  ios: process.env.EXPO_PUBLIC_API_URL_IOS || 'http://localhost:5000/api',     // iOS Simulator
  default: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'  // Fallback
});

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
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

export default api; 