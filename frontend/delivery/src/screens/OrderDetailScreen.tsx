import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../services/api';

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
  };
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalPrice: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
}

type RootStackParamList = {
  Home: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  DeliveryScreen: { orderId: string };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OrderDetail'>;
  route: RouteProp<RootStackParamList, 'OrderDetail'>;
};

const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await orderAPI.getOrderDetails(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    try {
      setLoading(true);
      await orderAPI.acceptOrder(orderId);
      Alert.alert('Success', 'Order accepted successfully');
      navigation.navigate('Orders');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to accept order';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    if (!order) return;
    
    const address = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`;
    const encodedAddress = encodeURIComponent(address);
    
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}?address=${encodedAddress}`,
      android: `${scheme}${encodedAddress}`,
    });

    if (url) {
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Could not open maps application');
        console.error('Error opening maps:', err);
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'out_for_delivery':
        return 'Out For Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    let backgroundColor = '#0066CC';
    let textColor = 'white';

    switch (status) {
      case 'pending':
        backgroundColor = '#FFC107';
        break;
      case 'processing':
        backgroundColor = '#0066CC';
        break;
      case 'out_for_delivery':
        backgroundColor = '#FF9800';
        break;
      case 'delivered':
        backgroundColor = '#28a745';
        break;
      default:
        backgroundColor = '#6c757d';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {getStatusText(status)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#d9534f" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order._id.substring(0, 8)}</Text>
        {getStatusBadge(order.status)}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={20} color="#0066CC" />
          <Text style={styles.cardTitle}>Order Timeline</Text>
        </View>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Order Placed:</Text>
          <Text style={styles.timelineValue}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Last Updated:</Text>
          <Text style={styles.timelineValue}>{formatDate(order.updatedAt)}</Text>
        </View>
        {order.deliveryStartedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Delivery Started:</Text>
            <Text style={styles.timelineValue}>{formatDate(order.deliveryStartedAt)}</Text>
          </View>
        )}
        {order.deliveredAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Delivered:</Text>
            <Text style={styles.timelineValue}>{formatDate(order.deliveredAt)}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={20} color="#0066CC" />
          <Text style={styles.cardTitle}>Customer Information</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{order.user.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{order.user.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color="#0066CC" />
          <Text style={styles.cardTitle}>Delivery Address</Text>
        </View>
        <Text style={styles.address}>
          {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
        </Text>
        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Ionicons name="map-outline" size={16} color="#fff" />
          <Text style={styles.mapButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cart-outline" size={20} color="#0066CC" />
          <Text style={styles.cardTitle}>Order Items</Text>
        </View>
        {order.orderItems.map((item) => (
          <View key={item._id} style={styles.orderItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>${item.product.price.toFixed(2)} x {item.qty}</Text>
            </View>
            <Text style={styles.itemTotal}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.orderTotal}>
          <Text style={styles.orderTotalLabel}>Total:</Text>
          <Text style={styles.orderTotalValue}>${order.totalPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
          <Text style={styles.paymentMethodValue}>{order.paymentMethod}</Text>
        </View>
      </View>

      {order.status === 'processing' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAcceptOrder}
        >
          <Text style={styles.acceptButtonText}>Accept Delivery</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#d9534f',
    marginVertical: 15,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666',
  },
  timelineValue: {
    fontSize: 14,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  mapButton: {
    backgroundColor: '#0066CC',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  paymentMethod: {
    flexDirection: 'row',
    marginTop: 5,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  paymentMethodValue: {
    fontSize: 14,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    marginHorizontal: 10,
    marginBottom: 30,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen; 