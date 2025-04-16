import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable or fallback to localhost for web
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

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
  token: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  storeName: string;
  user?: User;
}

interface ProfileResponse extends User {}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  function(config) {
    // Get token synchronously to avoid type issues
    AsyncStorage.getItem('token').then(token => {
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }).catch(error => {
      console.error('Error retrieving token:', error);
    });
    
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/vendors/login', { email, password });
    // Store the token
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  },

  register: async (data: {
    storeName: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/vendors/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      storeName: data.storeName,
      storeAddress: data.address,
      phone: data.phone
    });
    // Store the token
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/vendors/profile');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/vendors/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/vendors/reset-password', { token, password });
  },
};

export const productAPI = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/products', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await api.put(`/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};

export const orderAPI = {
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};

export default api; 