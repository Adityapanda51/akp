import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import Button from '../components/Button';
import { getOrderById, updateOrderStatus } from '../services/api';

interface OrderItem {
  _id: string;
  name: string;
  qty: number;
  price: number;
  image: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleUpdateOrderStatus = async (newStatus: Order['status']) => {
    try {
      setUpdating(true);
      await updateOrderStatus(orderId, newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.card}>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <Text style={styles.date}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: COLORS[order.status] + '20' }]}>
            <Text style={[styles.statusText, { color: COLORS[order.status] }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name: <Text style={styles.value}>{order.user.name}</Text></Text>
          <Text style={styles.label}>Email: <Text style={styles.value}>{order.user.email}</Text></Text>
          <Text style={styles.label}>Phone: <Text style={styles.value}>{order.user.phone}</Text></Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.card}>
          <Text style={styles.value}>{order.shippingAddress.address}</Text>
          <Text style={styles.value}>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</Text>
          <Text style={styles.value}>{order.shippingAddress.country}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.orderItems.map((item) => (
          <View key={item._id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQty}>{item.qty}x</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {order.status === 'pending' && (
          <Button
            title="Accept Order"
            onPress={() => handleUpdateOrderStatus('processing')}
            loading={updating}
            style={styles.actionButton}
          />
        )}
        {order.status === 'processing' && (
          <Button
            title="Mark as Completed"
            onPress={() => handleUpdateOrderStatus('completed')}
            loading={updating}
            style={styles.actionButton}
          />
        )}
        {(order.status === 'pending' || order.status === 'processing') && (
          <Button
            title="Cancel Order"
            onPress={() => handleUpdateOrderStatus('cancelled')}
            variant="outlined"
            loading={updating}
            style={styles.actionButton}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SIZES.padding,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  message: {
    ...FONTS.h3,
    color: COLORS.gray,
  },
  section: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
  },
  orderNumber: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  date: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  statusText: {
    ...FONTS.body4,
    fontWeight: '500',
  },
  label: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 4,
  },
  value: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
  },
  itemName: {
    ...FONTS.body3,
    color: COLORS.black,
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginRight: SIZES.base,
  },
  itemPrice: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderColor: COLORS.lightGray + '40',
  },
  totalLabel: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  totalAmount: {
    ...FONTS.h2,
    color: COLORS.primary,
  },
  actions: {
    marginTop: SIZES.padding,
  },
  actionButton: {
    marginBottom: SIZES.base,
  },
});

export default OrderDetailsScreen; 