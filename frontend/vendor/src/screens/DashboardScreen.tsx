import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { getDashboardStats, getVendorOrders } from '../services/api';
import { Order } from '../types';

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await getDashboardStats();
      console.log('Dashboard data received:', dashboardData);
      
      // Handle pendingOrders specifically
      const pendingOrdersCount = dashboardData.pendingOrders || 0;
      
      setStats({
        totalOrders: dashboardData.totalOrders || 0,
        pendingOrders: pendingOrdersCount,
        totalProducts: dashboardData.totalProducts || 0,
        totalRevenue: dashboardData.revenue || 0,
      });

      if (dashboardData.recentOrders) {
        setRecentOrders(dashboardData.recentOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const renderStatCard = (title: string, value: number | string, icon: string, onPress?: () => void) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.statValue}>
        {typeof value === 'number' && title === 'Total Revenue' ? `$${value.toFixed(2)}` : value}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderQuickAction = (title: string, icon: string, onPress: () => void) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <MaterialIcons name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'processing':
        return COLORS.info;
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <MaterialIcons name="notifications" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons name="notifications" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsContainer}>
            {renderStatCard('Total Orders', stats.totalOrders, 'shopping-cart', 
              () => navigation.navigate('Orders', { screen: 'OrdersList', params: { filter: 'all' } })
            )}
            {renderStatCard('Pending Orders', stats.pendingOrders, 'pending-actions', 
              () => navigation.navigate('Orders', { screen: 'OrdersList', params: { filter: 'pending' } })
            )}
            {renderStatCard('Total Products', stats.totalProducts, 'inventory',
              () => navigation.navigate('Products')
            )}
            {renderStatCard('Total Revenue', stats.totalRevenue, 'attach-money')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {renderQuickAction('Add Product', 'add-circle', () =>
                navigation.navigate('AddProduct')
              )}
              {renderQuickAction('View Orders', 'list-alt', () =>
                navigation.navigate('Orders')
              )}
              {renderQuickAction('Manage Products', 'inventory', () =>
                navigation.navigate('Products')
              )}
              {renderQuickAction('Store Settings', 'settings', () =>
                navigation.navigate('Settings')
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inbox" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>No recent orders</Text>
              </View>
            ) : (
              <View style={styles.ordersContainer}>
                {recentOrders.map((order, index) => (
                  <TouchableOpacity
                    key={order._id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Order #{order._id.substring(0, 8)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{order.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.orderInfo}>
                      <Text style={styles.customerName}>{order.user.name}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>${order.totalPrice.toFixed(2)}</Text>
                      <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === 'android' ? SIZES.padding * 2 : SIZES.padding,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '20',
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: SIZES.padding,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  statTitle: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  section: {
    marginBottom: SIZES.padding * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  seeAllText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
  },
  quickAction: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  quickActionText: {
    ...FONTS.body3,
    color: COLORS.black,
    flex: 1,
  },
  ordersContainer: {
    paddingHorizontal: SIZES.padding,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  orderId: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  statusText: {
    ...FONTS.body4,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: SIZES.base,
  },
  customerName: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  orderDate: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '30',
    paddingTop: SIZES.base,
  },
  orderTotal: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
  },
});

export default DashboardScreen; 