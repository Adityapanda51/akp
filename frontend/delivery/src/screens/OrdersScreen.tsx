import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  _id: string;
  user: {
    name: string;
  };
  shippingAddress: {
    address: string;
    city: string;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

type Props = {
  navigation: StackNavigationProp<any>;
};

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadAssignedOrders();

    // Refresh orders when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadAssignedOrders();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAssignedOrders = async () => {
    try {
      setLoading(true);
      const assignedOrders = await orderAPI.getAssignedOrders();
      setOrders(assignedOrders);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      Alert.alert('Error', 'Failed to load your orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssignedOrders();
  };

  const handleDeliverOrder = async (orderId: string) => {
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
              loadAssignedOrders();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    let backgroundColor = '#0066CC';
    let textColor = 'white';

    if (status === 'out_for_delivery') {
      backgroundColor = '#FFA500';
    } else if (status === 'delivered') {
      backgroundColor = '#28a745';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {status === 'out_for_delivery' ? 'Out for Delivery' : 'Delivered'}
        </Text>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item._id.substring(0, 8)}</Text>
        {getStatusBadge(item.status)}
      </View>
      <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>Customer: {item.user.name}</Text>
        <Text style={styles.address}>
          Delivery Address: {item.shippingAddress.address}, {item.shippingAddress.city}
        </Text>
        <Text style={styles.price}>Amount: ${item.totalPrice.toFixed(2)}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('DeliveryScreen', { orderId: item._id })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'out_for_delivery' && (
          <TouchableOpacity
            style={styles.deliverButton}
            onPress={() => handleDeliverOrder(item._id)}
          >
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>My Deliveries</Text>
        <Text style={styles.subtitle}>Orders assigned to you</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No orders assigned yet</Text>
          <Text style={styles.emptySubtext}>
            Go to Available Orders to accept new delivery tasks
          </Text>
          <TouchableOpacity
            style={styles.availableOrdersButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.availableOrdersButtonText}>See Available Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0066CC']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
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
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  address: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0066CC',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#0066CC',
    fontSize: 14,
  },
  deliverButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    flex: 1,
    alignItems: 'center',
  },
  deliverButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  availableOrdersButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066CC',
    borderRadius: 5,
  },
  availableOrdersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrdersScreen; 