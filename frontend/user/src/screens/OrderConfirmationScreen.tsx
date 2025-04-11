import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface OrderConfirmationScreenProps {
  route?: {
    params?: {
      orderId?: string;
      totalAmount?: number;
    };
  };
}

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const orderId = route?.params?.orderId || 'ORD-123456';
  const totalAmount = route?.params?.totalAmount || 150.99;

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.orderInfoLabel}>Amount Paid</Text>
            <Text style={styles.orderInfoValue}>${totalAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Payment Method</Text>
            <Text style={styles.orderInfoValue}>Credit Card</Text>
          </View>
        </View>
        
        <Text style={styles.estimatedDelivery}>
          Estimated Delivery: 3-5 business days
        </Text>
        
        <View style={styles.buttonsContainer}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconContainer: {
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  message: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  orderInfoCard: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  orderInfoLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  orderInfoValue: {
    ...FONTS.body4,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  estimatedDelivery: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginBottom: SIZES.padding * 2,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen; 