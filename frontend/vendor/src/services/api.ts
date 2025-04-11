import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable or fallback to appropriate URL based on platform
// For mobile devices, we need to use the IP address instead of localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.98.174:5000/api';

// Override any localhost URLs for mobile devices
const finalApiUrl = API_URL.includes('localhost') ? 'http://192.168.98.174:5000/api' : API_URL;

console.log('API URL from environment:', process.env.EXPO_PUBLIC_API_URL);
console.log('Final API URL being used:', finalApiUrl);

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

const api = axios.create({
  baseURL: finalApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  function(config) {
    console.log('Request interceptor - URL:', config.url);
    console.log('Request interceptor - Method:', config.method);
    console.log('Request interceptor - Headers:', config.headers);
    console.log('Request interceptor - Data:', config.data);
    
    // Get token synchronously to avoid type issues
    AsyncStorage.getItem('token').then(token => {
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request:', token.substring(0, 10) + '...');
      } else {
        console.log('No token available for request');
      }
    }).catch(error => {
      console.error('Error retrieving token:', error);
    });
    
    return config;
  },
  function(error) {
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

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Login attempt for email:', email);
      const response = await api.post<AuthResponse>('/vendors/login', { email, password });
      console.log('Login successful:', response.data);
      // Store the token
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    storeName: string;
    storeAddress: string;
  }): Promise<AuthResponse> => {
    console.log('Registering with data:', {
      ...data,
      password: '********'
    });
    console.log('API URL for registration:', API_URL);
    const response = await api.post<AuthResponse>('/vendors/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      storeName: data.storeName,
      storeAddress: data.storeAddress
    });
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    try {
      console.log('Fetching profile');
      const response = await api.get<ProfileResponse>('/vendors/profile');
      console.log('Profile fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      console.log('Sending forgot password request for:', email);
      await api.post('/vendors/forgot-password', { email });
      console.log('Forgot password request sent successfully');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      console.log('Resetting password with token');
      await api.post(`/vendors/reset-password/${token}`, { password });
      console.log('Password reset successful');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};

export const productAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Get all products error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get product by ID error:', error);
      throw error;
    }
  },

  create: async (data: FormData) => {
    try {
      const response = await api.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  update: async (id: string, data: FormData) => {
    try {
      const response = await api.put(`/products/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  },
};

export const orderAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Get all orders error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get order by ID error:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },
};

export default api; 