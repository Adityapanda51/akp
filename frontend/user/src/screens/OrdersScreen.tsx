import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getMyOrders } from '../services/api';
import { Order } from '../types';

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return COLORS.success;
      case 'processing':
      case 'pending':
        return COLORS.info;
      case 'shipped':
      case 'out_for_delivery':
        return COLORS.warning;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        navigation.navigate('OrderDetails', { orderId: item._id });
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber || item._id.substring(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>Ordered on {formatDate(item.createdAt)}</Text>
        <Text style={styles.orderTotal}>${item.totalPrice.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderItems}>
          {item.orderItems.length} {item.orderItems.length > 1 ? 'items' : 'item'}
        </Text>
        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-bag" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No orders found</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => {
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    textAlign: 'center',
  },
  ordersList: {
    padding: SIZES.padding,
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
  orderNumber: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  statusText: {
    ...FONTS.body5,
    color: COLORS.white,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  orderDate: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  orderTotal: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  orderItems: {
    ...FONTS.body4,
    color: COLORS.gray,
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
    marginBottom: SIZES.padding * 2,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  shopButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginTop: SIZES.padding,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding,
  },
  retryButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
});

export default OrdersScreen; 