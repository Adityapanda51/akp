import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('userToken');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting login process...');
      
      // Check if we can reach the API
      try {
        const userData = await api.login(email, password);
        console.log('Login successful, saving user data...');
        
        // Save user and token to storage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('userToken', userData.token || '');
        
        setUser(userData);
        console.log('Login process completed successfully');
      } catch (apiError: any) {
        console.error('API call error:', apiError);
        
        // Check if it's a network error
        if (apiError.message === 'Network Error') {
          setError('Cannot connect to the server. Please check your internet connection and try again.');
        } else {
          setError(apiError.response?.data?.message || 'Failed to login. Please check your credentials.');
        }
        throw apiError;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Error is already set above
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await api.register({
        name,
        email,
        password,
        phone,
        address,
      });
      
      // Save user and token to storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', userData.token || '');
      
      setUser(userData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to register');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Remove user and token from storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUserData = await api.updateUserProfile(userData);
      
      // Update user in storage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      
      setUser(updatedUserData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user');
      console.error('Update user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.resetPassword(email);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 