import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNotifications, Notification } from '../context/NotificationContext';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'order' && notification.data) {
      navigation.navigate('OrderDetails', { orderId: notification.data._id });
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem, 
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={
            item.type === 'order' 
              ? 'shopping-cart' 
              : item.type === 'system' 
                ? 'info' 
                : 'notifications'
          }
          size={24}
          color={
            item.type === 'order' 
              ? COLORS.primary 
              : item.type === 'system' 
                ? COLORS.info 
                : COLORS.warning
          }
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.actionButtons}>
            {notifications.length > 0 && (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={markAllAsRead}
                >
                  <MaterialIcons name="done-all" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={clearAll}
                >
                  <MaterialIcons name="delete-sweep" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-off" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications for new orders and updates here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            contentContainerStyle={styles.notificationsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SIZES.base,
    marginLeft: SIZES.base,
  },
  notificationsList: {
    padding: SIZES.padding,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  unreadNotification: {
    backgroundColor: COLORS.lightGray + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: 4,
  },
  message: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 8,
  },
  time: {
    ...FONTS.body5,
    color: COLORS.lightGray,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  emptySubtext: {
    ...FONTS.body4,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SIZES.base,
  },
});

export default NotificationsScreen; 