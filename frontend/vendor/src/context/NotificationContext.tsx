import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'order' | 'system' | 'info';
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  showOrderNotification: (orderData: any) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from storage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem('vendor_notifications');
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          setNotifications(parsed);
          
          // Count unread notifications
          const unread = parsed.filter((notification: Notification) => !notification.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Save notifications to storage whenever they change
  useEffect(() => {
    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem('vendor_notifications', JSON.stringify(notifications));
      } catch (error) {
        console.error('Error saving notifications:', error);
      }
    };

    if (notifications.length > 0) {
      saveNotifications();
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    AsyncStorage.removeItem('vendor_notifications');
  };

  // Show an order notification with Alert
  const showOrderNotification = (orderData: any) => {
    const { _id, totalPrice, customerName, items } = orderData;
    const orderTitle = `New Order #${_id.substring(0, 8)}`;
    const orderMessage = `${customerName} ordered ${items?.length || 'several'} items for $${totalPrice.toFixed(2)}`;
    
    // Add to notifications list
    addNotification({
      title: orderTitle,
      message: orderMessage,
      type: 'order',
      data: orderData
    });

    // Show alert
    Alert.alert(
      orderTitle,
      orderMessage,
      [
        { text: 'View Details', onPress: () => console.log('View order details:', _id) },
        { text: 'Later', style: 'cancel' }
      ]
    );
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showOrderNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 