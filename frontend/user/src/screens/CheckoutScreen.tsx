import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SafeImage from '../components/SafeImage';

interface CheckoutScreenProps {
  route?: {
    params?: {
      totalAmount?: number;
    };
  };
}

interface AddressData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to cash on delivery
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData>({
    name: user?.name || 'Guest User',
    street: user?.address?.street || '123 Main St',
    city: user?.address?.city || 'New York',
    state: user?.address?.state || 'NY',
    zipCode: user?.address?.zipCode || '10001',
    country: user?.address?.country || 'USA',
  });

  // Update address if user changes
  useEffect(() => {
    if (user) {
      setDeliveryAddress({
        name: user.name || deliveryAddress.name,
        street: user.address?.street || deliveryAddress.street,
        city: user.address?.city || deliveryAddress.city,
        state: user.address?.state || deliveryAddress.state,
        zipCode: user.address?.zipCode || deliveryAddress.zipCode,
        country: user.address?.country || deliveryAddress.country,
      });
    }
  }, [user]);

  const handleChangeAddress = () => {
    navigation.navigate('DeliveryAddress', {
      address: deliveryAddress,
      onAddressSave: (newAddress: AddressData) => {
        setDeliveryAddress(newAddress);
      }
    });
  };

  const validateOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Please add items before placing an order.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Check if the address is complete
    const requiredFields = ['name', 'street', 'city', 'state', 'zipCode', 'country'];
    for (const field of requiredFields) {
      if (!deliveryAddress[field as keyof AddressData]?.trim()) {
        Alert.alert(
          'Missing Information',
          'Please provide a complete delivery address',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Address', onPress: handleChangeAddress }
          ]
        );
        return false;
      }
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;

    try {
      setIsLoading(true);
      
      // Create order payload
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item.product._id,
          name: item.product.name,
          qty: item.quantity,
          price: item.product.price,
          image: item.product.images[0],
          vendor: item.product.vendor // Ensure vendor is included for each item
        })),
        shippingAddress: {
          name: deliveryAddress.name,
          address: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          postalCode: deliveryAddress.zipCode,
          country: deliveryAddress.country,
        },
        paymentMethod: paymentMethod,
        isPaid: paymentMethod !== 'cod', // Only mark as paid for non-COD payments
        paidAt: paymentMethod !== 'cod' ? new Date().toISOString() : undefined, // Convert Date to ISO string
        isDelivered: false,
        totalPrice: cartTotal + 10, // Adding shipping fee
        shippingPrice: 10,
        itemsPrice: cartTotal,
        taxPrice: 0,
        status: paymentMethod === 'cod' ? 'processing' : 'pending'
      };
      
      console.log('Creating order with data:', JSON.stringify(orderData));
      
      // Call API to create order
      const response = await createOrder(orderData);
      
      // Clear cart after successful order
      clearCart();
      
      // Navigate to confirmation screen
      navigation.navigate('OrderConfirmation', {
        orderId: response._id || response.id || `ORD-${Date.now()}`,
        totalAmount: orderData.totalPrice,
      });
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        'There was an error placing your order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
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
        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <Text style={styles.itemCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
          </View>
          
          <View style={styles.orderItemsContainer}>
            {cartItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <SafeImage 
                  uri={item.product.images[0]} 
                  placeholderContent={item.product.name}
                  style={styles.itemImage} 
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.itemPrice}>${item.product.price.toFixed(2)} × {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={handleChangeAddress}>
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

          {/* Additional info if COD is selected */}
          {paymentMethod === 'cod' && (
            <View style={styles.codInfoContainer}>
              <MaterialIcons name="info-outline" size={18} color={COLORS.info} />
              <Text style={styles.codInfoText}>
                Pay with cash upon delivery. Please have the exact amount ready.
              </Text>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Fee</Text>
              <Text style={styles.summaryValue}>$10.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${(cartTotal + 10).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Place Order Button */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing your order...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={cartItems.length === 0}
          >
            <Text style={styles.placeOrderText}>
              {paymentMethod === 'cod' ? 'Place Order - Pay on Delivery' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  backButton: {
    padding: SIZES.base,
  },
  scrollContainer: {
    paddingBottom: SIZES.padding * 3,
  },
  section: {
    marginTop: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  changeText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  itemCount: {
    ...FONTS.body3,
    color: COLORS.gray,
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
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginBottom: SIZES.base / 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding / 2,
    ...SHADOWS.small,
  },
  selectedPayment: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  paymentText: {
    ...FONTS.body2,
    color: COLORS.black,
    marginLeft: SIZES.padding,
    flex: 1,
  },
  selectedPaymentText: {
    color: COLORS.primary,
    ...FONTS.h4,
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
    ...FONTS.h2,
    color: COLORS.primary,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding,
    marginHorizontal: SIZES.padding,
  },
  placeOrderText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding,
    padding: SIZES.padding,
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginTop: SIZES.base,
  },
  orderItemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: SIZES.radius / 2,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SIZES.padding / 2,
  },
  itemName: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  itemPrice: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  itemTotal: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  codInfoContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '20',
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    marginTop: SIZES.base,
    marginBottom: SIZES.padding / 2,
    alignItems: 'center',
  },
  codInfoText: {
    ...FONTS.body4,
    color: COLORS.info,
    marginLeft: SIZES.base,
    flex: 1,
  },
});

export default CheckoutScreen; 