import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface CheckoutScreenProps {
  route?: {
    params?: {
      totalAmount?: number;
    };
  };
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const totalAmount = route?.params?.totalAmount || 150.99;

  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: 'John Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  });

  const handlePlaceOrder = () => {
    // Here you would process the order
    // Then navigate to order confirmation
    navigation.navigate('OrderConfirmation', {
      orderId: 'ORD-' + Date.now(),
      totalAmount,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{deliveryAddress.name}</Text>
            <Text style={styles.addressText}>{deliveryAddress.street}</Text>
            <Text style={styles.addressText}>
              {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
            </Text>
            <Text style={styles.addressText}>{deliveryAddress.country}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'creditCard' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('creditCard')}
          >
            <MaterialIcons 
              name="credit-card" 
              size={24} 
              color={paymentMethod === 'creditCard' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'creditCard' && styles.selectedPaymentText
            ]}>Credit/Debit Card</Text>
            {paymentMethod === 'creditCard' && (
              <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'paypal' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <MaterialIcons 
              name="account-balance-wallet" 
              size={24} 
              color={paymentMethod === 'paypal' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'paypal' && styles.selectedPaymentText
            ]}>PayPal</Text>
            {paymentMethod === 'paypal' && (
              <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <MaterialIcons 
              name="local-shipping" 
              size={24} 
              color={paymentMethod === 'cod' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'cod' && styles.selectedPaymentText
            ]}>Cash on Delivery</Text>
            {paymentMethod === 'cod' && (
              <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${(totalAmount - 10).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Fee</Text>
              <Text style={styles.summaryValue}>$10.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity 
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  section: {
    marginBottom: SIZES.padding * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  changeText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  addressName: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  addressText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    ...SHADOWS.small,
  },
  selectedPayment: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  paymentText: {
    ...FONTS.body3,
    color: COLORS.black,
    flex: 1,
    marginLeft: SIZES.padding,
  },
  selectedPaymentText: {
    color: COLORS.primary,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  summaryLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  summaryValue: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SIZES.base,
  },
  totalLabel: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  totalValue: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  placeOrderText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});

export default CheckoutScreen; 