import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Order } from '../types';
import { getOrderById } from '../services/api';

interface OrderConfirmationScreenProps {
  route?: {
    params?: {
      orderId?: string;
      totalAmount?: number;
    };
  };
}

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute();
  const params = route.params as { orderId?: string; totalAmount?: number } || {};
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!params.orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        const orderData = await getOrderById(params.orderId);
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Could not fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (params?.orderId) {
      fetchOrderDetails();
    }
  }, [params]);

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'Order information not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={handleContinueShopping}>
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orderId = order.orderNumber || order._id?.substring(0, 8) || 'Unknown';
  const totalAmount = order.totalPrice || params.totalAmount || 0;
  const isCashOnDelivery = order.paymentMethod === 'cod';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={100} color={COLORS.success} />
          </View>
          
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.message}>
            Your order has been placed successfully. We'll process it right away!
          </Text>
          
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Order ID</Text>
              <Text style={styles.orderInfoValue}>{orderId}</Text>
            </View>
            
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Amount {isCashOnDelivery ? 'Due' : 'Paid'}</Text>
              <Text style={styles.orderInfoValue}>${totalAmount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Payment Method</Text>
              <Text style={styles.orderInfoValue}>
                {isCashOnDelivery ? 'Cash on Delivery' : order.paymentMethod || 'Credit Card'}
              </Text>
            </View>

            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Order Status</Text>
              <Text style={[
                styles.orderInfoValue, 
                { color: isCashOnDelivery ? COLORS.warning : COLORS.success }
              ]}>
                {isCashOnDelivery ? 'Processing' : 'Paid'}
              </Text>
            </View>

            {/* Estimated delivery date */}
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Estimated Delivery</Text>
              <Text style={styles.orderInfoValue}>3-5 business days</Text>
            </View>
          </View>
          
          {/* Additional info for Cash on Delivery orders */}
          {isCashOnDelivery && (
            <View style={styles.codInfoCard}>
              <View style={styles.codInfoHeader}>
                <MaterialIcons name="info-outline" size={20} color={COLORS.white} />
                <Text style={styles.codInfoTitle}>Cash on Delivery Instructions</Text>
              </View>
              <Text style={styles.codInfoText}>
                • Please have the exact amount of ${totalAmount.toFixed(2)} ready.
              </Text>
              <Text style={styles.codInfoText}>
                • The delivery person will collect the payment upon delivery.
              </Text>
              <Text style={styles.codInfoText}>
                • You'll receive a payment receipt after successful payment.
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleContinueShopping}
          >
            <Text style={styles.primaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleViewOrders}
          >
            <Text style={styles.secondaryButtonText}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SIZES.padding * 2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.success,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  message: {
    ...FONTS.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  orderInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    width: '100%',
    marginBottom: SIZES.padding * 2,
    ...SHADOWS.medium,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  orderInfoLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  orderInfoValue: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  estimatedDelivery: {
    ...FONTS.body3,
    color: COLORS.success,
    marginBottom: SIZES.padding * 2,
  },
  button: {
    width: '100%',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  loadingText: {
    ...FONTS.body2,
    color: COLORS.primary,
    marginTop: SIZES.padding,
  },
  errorText: {
    ...FONTS.body2,
    color: COLORS.error,
    marginVertical: SIZES.padding,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  codInfoCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    width: '100%',
    marginBottom: SIZES.padding * 2,
    ...SHADOWS.medium,
  },
  codInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  codInfoTitle: {
    ...FONTS.h4,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
  codInfoText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginTop: SIZES.base,
  },
});

export default OrderConfirmationScreen; 