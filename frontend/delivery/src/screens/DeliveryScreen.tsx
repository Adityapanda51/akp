import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../services/api';

type RouteParams = {
  params: {
    orderId: string;
  };
};

type Props = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<Record<string, RouteParams>, string>;
};

interface OrderDetails {
  _id: string;
  user: {
    _id: string;
    name: string;
    phone?: string;
    email: string;
  };
  orderItems: Array<{
    _id: string;
    name: string;
    qty: number;
    price: number;
    product: {
      _id: string;
      name: string;
    };
  }>;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
  deliveryStartedAt?: string;
}

const DeliveryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await orderAPI.getOrderDetails(orderId);
      setOrder(orderData);

      // If shipping address has coordinates, update map region
      if (
        orderData.shippingAddress &&
        orderData.shippingAddress.latitude &&
        orderData.shippingAddress.longitude
      ) {
        setMapRegion({
          latitude: orderData.shippingAddress.latitude,
          longitude: orderData.shippingAddress.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      Alert.alert(
        'Confirm Delivery',
        'Are you sure this order has been delivered?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes, Delivered',
            onPress: async () => {
              setLoading(true);
              await orderAPI.deliverOrder(orderId);
              Alert.alert('Success', 'Order marked as delivered');
              navigation.navigate('Orders');
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update order';
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (order?.user?.phone) {
      const phoneNumber = Platform.OS === 'android' ? `tel:${order.user.phone}` : `telprompt:${order.user.phone}`;
      Linking.openURL(phoneNumber);
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  const handleNavigate = () => {
    const { latitude, longitude } = mapRegion;
    const url = Platform.select({
      ios: `maps:0,0?q=${order?.shippingAddress.address}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${order?.shippingAddress.address})`,
    });

    if (url) {
      Linking.openURL(url).catch((err) =>
        Alert.alert('Error', 'Cannot open maps application')
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
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
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map} 
          region={mapRegion}
          provider="google"
        >
          <Marker
            coordinate={{
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude,
            }}
            title="Delivery Location"
            description={order.shippingAddress.address}
          />
        </MapView>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
        >
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.orderInfoSection}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order._id.substring(0, 8)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {order.status === 'out_for_delivery' ? 'Out for Delivery' : order.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>Ordered on: {formatDate(order.createdAt)}</Text>
        {order.deliveryStartedAt && (
          <Text style={styles.orderDate}>Delivery started: {formatDate(order.deliveryStartedAt)}</Text>
        )}
      </View>

      <View style={styles.customerSection}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Text style={styles.customerName}>{order.user.name}</Text>
        <Text style={styles.customerDetail}>{order.user.email}</Text>
        {order.user.phone && (
          <Text style={styles.customerDetail}>{order.user.phone}</Text>
        )}
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallCustomer}
          disabled={!order.user.phone}
        >
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.callButtonText}>Call Customer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
        <Text style={styles.addressText}>
          {order.shippingAddress.city}, {order.shippingAddress.postalCode}
        </Text>
        <Text style={styles.addressText}>{order.shippingAddress.country}</Text>
      </View>

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.orderItems.map((item) => (
          <View key={item._id} style={styles.orderItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQty}>Qty: {item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {order.status === 'out_for_delivery' && (
        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={handleMarkAsDelivered}
        >
          <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
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
    padding: 20,
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
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066CC',
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 200,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navigateButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  navigateButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  orderInfoSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  customerSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  customerDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  addressSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  itemsSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  deliveredButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 15,
    marginBottom: 30,
  },
  deliveredButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeliveryScreen; 