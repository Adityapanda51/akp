import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
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
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      const userInfo = {
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        phone: response.phone,
        vehicleType: response.vehicleType,
        vehicleNumber: response.vehicleNumber,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    } catch (error: any) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
  }) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      const userInfo = {
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        phone: response.phone,
        vehicleType: response.vehicleType,
        vehicleNumber: response.vehicleNumber,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    } catch (error: any) {
      console.error('Error during registration:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
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
      const updatedUser = await authAPI.updateProfile(userData);
      
      if (user) {
        const userInfo = {
          ...user,
          ...updatedUser
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
      }
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