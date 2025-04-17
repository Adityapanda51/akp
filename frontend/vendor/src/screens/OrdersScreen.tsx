import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { getVendorOrders } from '../services/api';
import { Order } from '../types';
import { useRoute } from '@react-navigation/native';

const OrdersScreen = ({ navigation }) => {
  const route = useRoute();
  const initialFilter = route.params?.filter || 'all';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>(
    initialFilter as 'all' | 'pending' | 'processing' | 'completed' | 'cancelled'
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getVendorOrders();
      // The API directly returns the array of orders, not wrapped in a data property
      setOrders(response || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update filter when route params change
  useEffect(() => {
    if (route.params?.filter) {
      setFilter(route.params.filter as 'all' | 'pending' | 'processing' | 'completed' | 'cancelled');
    }
  }, [route.params]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item._id.substring(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.customerName}>{item.user.name}</Text>
        <Text style={styles.orderDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>${item.totalPrice.toFixed(2)}</Text>
        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value }: { title: string; value: typeof filter }) => {
    // Get a color for the status indicator dot
    const getStatusIndicatorColor = () => {
      if (value === 'all') return COLORS.primary;
      if (value === 'pending') return COLORS.warning;
      if (value === 'processing') return COLORS.info;
      if (value === 'completed') return COLORS.success;
      if (value === 'cancelled') return COLORS.error;
      return COLORS.gray;
    };

    // Count orders for each filter
    const getCount = () => {
      if (value === 'all') return orders.length;
      return orders.filter(order => order.status === value).length;
    };

    const count = getCount();

    return (
      <TouchableOpacity
        style={[styles.filterButton, filter === value && styles.filterButtonActive]}
        onPress={() => setFilter(value)}
      >
        {value !== 'all' && (
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusIndicatorColor() }
            ]} 
          />
        )}
        <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
          {title}
        </Text>
        
        {count > 0 && (
          <View style={[
            styles.countBadge, 
            filter === value && styles.activeBadge
          ]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.filterArea}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
          bounces={true}
        >
          <FilterButton title="All" value="all" />
          <FilterButton title="Pending" value="pending" />
          <FilterButton title="Processing" value="processing" />
          <FilterButton title="Completed" value="completed" />
          <FilterButton title="Cancelled" value="cancelled" />
          <View style={{ width: 5 }} />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="list-alt" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  filterArea: {
    backgroundColor: COLORS.white,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  filterScrollContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    paddingRight: SIZES.padding * 2,
  },
  filterButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: SIZES.padding,
    backgroundColor: COLORS.lightGray + '20',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.02 }],
  },
  filterText: {
    ...FONTS.body4,
    color: COLORS.gray,
    fontWeight: '500' as '500',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600' as '600',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  orderItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  orderId: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
  },
  statusText: {
    ...FONTS.body4,
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  orderDetails: {
    marginBottom: SIZES.base,
  },
  customerName: {
    ...FONTS.body3,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  orderDate: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
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
  countBadge: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: COLORS.white,
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold' as 'bold',
    color: COLORS.primary,
  },
});

export default OrdersScreen; 