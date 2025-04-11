import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  storeName: string;
  storeAddress?: string;
  phone?: string;
  role?: string;
  profilePicture?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    storeName: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    storeAddress: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (userData && token) {
        const user = JSON.parse(userData);
        setUser({ ...user, token });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login process');
      setLoading(true);
      console.log('AuthContext: Calling authAPI.login');
      
      const response = await authAPI.login(email, password);
      console.log('AuthContext: Login API call successful');
      console.log('AuthContext: Login response:', response);
      
      // Save token and user data
      console.log('AuthContext: Saving token to AsyncStorage');
      await AsyncStorage.setItem('token', response.token);
      
      const userInfo = {
        _id: response._id,
        name: response.name,
        email: response.email,
        storeName: response.storeName,
        role: response.role,
        token: response.token
      };
      
      console.log('AuthContext: Saving user data to AsyncStorage');
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      console.log('AuthContext: Setting user state');
      setUser(userInfo);
      console.log('AuthContext: Login process completed successfully');
    } catch (error: any) {
      console.error('AuthContext: Error during login:', error);
      console.error('AuthContext: Error details:', {
        message: error?.message || 'Unknown error',
        response: error?.response?.data,
        status: error?.response?.status
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    storeName: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    storeAddress: string;
  }) => {
    try {
      console.log('Starting registration process...');
      console.log('Registration data:', { ...userData, password: '[REDACTED]' });
      
      const response = await authAPI.register(userData);
      console.log('Registration API response:', response);
      
      console.log('Registration successful, saving token and user data...');
      const userInfo = {
        _id: response._id,
        name: response.name,
        email: response.email,
        storeName: response.storeName,
        role: response.role,
        token: response.token
      };
      
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      console.log('Registration process completed successfully');
    } catch (error: any) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      // Get the updated profile from the API
      const response = await authAPI.getProfile();
      
      // Update stored user data
      const updatedUser = { 
        _id: response._id,
        name: response.name,
        email: response.email,
        storeName: response.storeName,
        storeAddress: response.storeAddress,
        phone: response.phone,
        role: response.role,
        token: user?.token
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 