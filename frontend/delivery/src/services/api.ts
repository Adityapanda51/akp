import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define API URLs array outside the function for reuse
const API_URLS = [
  // 1. Network IP approach - your current configuration
  'http://192.168.101.5:5000/api',
  
  // 2. Android emulator special IP
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : undefined,
  
  // 3. iOS simulator localhost
  Platform.OS === 'ios' ? 'http://localhost:5000/api' : undefined,
  
  // 4. Alternative Android approach for some emulators
  Platform.OS === 'android' ? 'http://10.0.0.2:5000/api' : undefined,
  
  // 5. Try direct localhost (works on some setups)
  'http://localhost:5000/api',
  
  // 6. Try loopback IP explicitly
  'http://127.0.0.1:5000/api',
  
  // 7. Expo Go's special IP for web (for browser testing)
  'http://localhost:5000/api',
].filter((url): url is string => url !== undefined); // Filter out undefined values with type assertion

// Global variable to track which API URL index is currently being used
let currentApiUrlIndex = 0;

// Use environment variable or fallback to appropriate localhost URL based on platform
const getApiUrl = (): string => {
  // Use environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('Using environment API URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  console.log('Available API URLs to try:', API_URLS);
  
  // For now, return the first one
  // Our connection test function will attempt others if this fails
  return API_URLS[0];
};

const API_URL = getApiUrl();
console.log('Selected API URL:', API_URL);

// Type definitions
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  role: string;
  deliveryStatus?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  token: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  user?: User;
}

interface ProfileResponse extends User {}

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
  };
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalPrice: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
}

interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  avgDeliveryTime: number;
  recentDeliveries: Order[];
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor without async/await
api.interceptors.request.use(
  function (config) {
    // We'll manually set the auth token for each request
    return config;
  },
  function (error) {
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

// Helper function to get auth header
const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth API methods
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/delivery/login', { email, password });
    // Store the token
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/delivery', data);
    // Store the token
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const headers = await getAuthHeader();
    const response = await api.get<ProfileResponse>('/delivery/profile', { headers });
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ProfileResponse> => {
    const headers = await getAuthHeader();
    const response = await api.put<ProfileResponse>('/delivery/profile', data, { headers });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/delivery/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`/delivery/reset-password/${token}`, { password });
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
};

// Order API methods
export const orderAPI = {
  getAvailableOrders: async (): Promise<Order[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<Order[]>('/delivery/orders/available', { headers });
    return response.data;
  },

  getAssignedOrders: async (): Promise<Order[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<Order[]>('/delivery/orders', { headers });
    return response.data;
  },

  acceptOrder: async (orderId: string): Promise<Order> => {
    const headers = await getAuthHeader();
    const response = await api.put<Order>(`/delivery/orders/${orderId}/accept`, {}, { headers });
    return response.data;
  },

  deliverOrder: async (orderId: string): Promise<Order> => {
    const headers = await getAuthHeader();
    const response = await api.put<Order>(`/delivery/orders/${orderId}/deliver`, {}, { headers });
    return response.data;
  },

  getOrderDetails: async (orderId: string): Promise<Order> => {
    const headers = await getAuthHeader();
    const response = await api.get<Order>(`/delivery/orders/${orderId}`, { headers });
    return response.data;
  },

  getDeliveryStats: async (): Promise<DeliveryStats> => {
    const headers = await getAuthHeader();
    const response = await api.get<DeliveryStats>('/delivery/statistics', { headers });
    return response.data;
  },
};

// Utility function to test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  let apiUrlsToTry = [...API_URLS]; // Create a copy of the API URLs to try
  
  for (let i = 0; i < apiUrlsToTry.length; i++) {
    const url = apiUrlsToTry[i];
    console.log(`Trying API connection ${i+1}/${apiUrlsToTry.length}: ${url}`);
    
    try {
      // Try a simple GET request to the health endpoint first
      try {
        const healthResponse = await axios.get(url.replace('/api', '/health'), { 
          timeout: 5000 
        });
        console.log(`API health check successful for ${url}:`, healthResponse.status);
        
        // If successful, update the current API URL index
        if (url !== API_URL) {
          console.log(`Switching to working API URL: ${url}`);
          currentApiUrlIndex = i;
          // We can't update API_URL as it's a const, but we can update the api baseURL
          api.defaults.baseURL = url;
        }
        return true;
      } catch (healthError) {
        // If health endpoint fails, try the base API endpoint
        console.log(`Health endpoint not available for ${url}, trying base API endpoint`);
        const apiResponse = await axios.get(url, { 
          timeout: 5000 
        });
        console.log(`Base API connection successful for ${url}:`, apiResponse.status);
        
        // If successful, update the current API URL index
        if (url !== API_URL) {
          console.log(`Switching to working API URL: ${url}`);
          currentApiUrlIndex = i;
          // We can't update API_URL as it's a const, but we can update the api baseURL
          api.defaults.baseURL = url;
        }
        return true;
      }
    } catch (error: any) {
      console.error(`API connection failed for ${url}:`, error.message);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.log('Server responded with status:', error.response.status);
        // Even a 404 means the server is reachable, so we count this as success
        if (url !== API_URL) {
          console.log(`Switching to working API URL: ${url}`);
          currentApiUrlIndex = i;
          api.defaults.baseURL = url;
        }
        return true; 
      } 
      
      // If we reach the last URL and none worked, continue to the next URL
      if (i === apiUrlsToTry.length - 1) {
        console.error('All API URLs failed to connect');
        return false;
      }
      
      // Otherwise continue to the next URL
      console.log(`Trying next API URL...`);
    }
  }
  
  return false; // All URLs failed
};

export default api; 