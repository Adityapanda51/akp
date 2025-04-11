import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'order' | 'promotion' | 'info';
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Order Confirmed',
      message: 'Your order #ORD-2023-001 has been confirmed and is being processed.',
      time: '10 min ago',
      isRead: false,
      type: 'order',
    },
    {
      id: '2',
      title: 'Special Discount',
      message: 'Enjoy 20% off on all products this weekend. Use code WEEKEND20.',
      time: '2 hours ago',
      isRead: false,
      type: 'promotion',
    },
    {
      id: '3',
      title: 'Order Delivered',
      message: 'Your order #ORD-2023-002 has been delivered. Enjoy your purchase!',
      time: '1 day ago',
      isRead: true,
      type: 'order',
    },
    {
      id: '4',
      title: 'Account Update',
      message: 'Your account information has been successfully updated.',
      time: '3 days ago',
      isRead: true,
      type: 'info',
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const getIconForType = (type: 'order' | 'promotion' | 'info') => {
    switch (type) {
      case 'order':
        return 'shopping-bag';
      case 'promotion':
        return 'local-offer';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getIconColorForType = (type: 'order' | 'promotion' | 'info') => {
    switch (type) {
      case 'order':
        return COLORS.primary;
      case 'promotion':
        return COLORS.tertiary;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.gray;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        item.isRead ? styles.readNotification : styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: getIconColorForType(item.type) + '20' }
      ]}>
        <MaterialIcons 
          name={getIconForType(item.type)} 
          size={24} 
          color={getIconColorForType(item.type)} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.notificationsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-off" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  notificationsList: {
    padding: SIZES.padding,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  readNotification: {
    opacity: 0.8,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  notificationTitle: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  notificationTime: {
    ...FONTS.body5,
    color: COLORS.gray,
  },
  notificationMessage: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SIZES.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
});

export default NotificationsScreen; 