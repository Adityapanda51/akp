import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { getOrderById } from '../services/api';
import { Order } from '../types';
import { getPresignedImageUrl } from '../services/api';

interface RouteParams {
  orderId: string;
}

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as RouteParams;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Could not load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.card}>
            <Text style={styles.orderNumber}>
              Order #{order.orderNumber || order._id.substring(0, 8)}
            </Text>
            <Text style={styles.date}>
              {formatDate(order.createdAt)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.card}>
            <Text style={styles.value}>{order.shippingAddress?.address}</Text>
            <Text style={styles.value}>
              {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
            </Text>
            <Text style={styles.value}>{order.shippingAddress?.country}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.card}>
            <View style={styles.paymentMethod}>
              <MaterialIcons
                name={
                  order.paymentMethod?.toLowerCase().includes('credit') ||
                  order.paymentMethod?.toLowerCase().includes('card')
                    ? 'credit-card'
                    : order.paymentMethod?.toLowerCase().includes('paypal')
                    ? 'account-balance-wallet'
                    : 'payments'
                }
                size={24}
                color={COLORS.primary}
                style={styles.paymentIcon}
              />
              <Text style={styles.value}>{order.paymentMethod}</Text>
            </View>
            <View style={styles.paymentStatus}>
              {order.isPaid ? (
                <>
                  <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.paymentStatusText, { color: COLORS.success }]}>
                    Paid on {formatDate(order.paidAt || '')}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="schedule" size={20} color={COLORS.warning} />
                  <Text style={[styles.paymentStatusText, { color: COLORS.warning }]}>
                    Payment Pending
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.orderItems?.map((item) => (
            <View key={item._id} style={styles.itemCard}>
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  defaultSource={require('../assets/placeholder.png')}
                />
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                </View>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.price * item.qty).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Items Total:</Text>
              <Text style={styles.totalValue}>${order.itemsPrice?.toFixed(2) || "0.00"}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping:</Text>
              <Text style={styles.totalValue}>${order.shippingPrice?.toFixed(2) || "0.00"}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>${order.taxPrice?.toFixed(2) || "0.00"}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>${order.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.card}>
            <View style={styles.deliveryStatus}>
              {order.isDelivered ? (
                <>
                  <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.deliveryStatusText, { color: COLORS.success }]}>
                    Delivered on {formatDate(order.deliveredAt || '')}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="local-shipping" size={20} color={COLORS.info} />
                  <Text style={[styles.deliveryStatusText, { color: COLORS.info }]}>
                    {order.status === 'cancelled'
                      ? 'Order cancelled'
                      : order.status === 'processing'
                      ? 'Processing'
                      : order.status === 'shipped'
                      ? 'Shipped'
                      : order.status === 'out_for_delivery'
                      ? 'Out for delivery'
                      : 'Preparing for shipping'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
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
  content: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
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
    marginBottom: 4,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  paymentIcon: {
    marginRight: SIZES.base,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    ...FONTS.body4,
    marginLeft: SIZES.base / 2,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryStatusText: {
    ...FONTS.body4,
    marginLeft: SIZES.base / 2,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.padding / 2,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    ...FONTS.body3,
    color: COLORS.black,
    marginBottom: 4,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  itemQty: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginLeft: SIZES.base,
  },
  itemTotal: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  totalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  totalLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  totalValue: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  grandTotal: {
    marginTop: SIZES.base,
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '40',
  },
  grandTotalLabel: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  grandTotalValue: {
    ...FONTS.h2,
    color: COLORS.primary,
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

export default OrderDetailsScreen; 