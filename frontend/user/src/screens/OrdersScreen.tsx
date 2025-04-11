import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: number;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2023-001',
    date: '2023-10-15',
    status: 'Delivered',
    total: 125.50,
    items: 3,
  },
  {
    id: '2',
    orderNumber: 'ORD-2023-002',
    date: '2023-10-10',
    status: 'Processing',
    total: 78.99,
    items: 2,
  },
  {
    id: '3',
    orderNumber: 'ORD-2023-003',
    date: '2023-09-28',
    status: 'Cancelled',
    total: 45.00,
    items: 1,
  },
];

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Delivered':
        return COLORS.success;
      case 'Processing':
        return COLORS.info;
      case 'Cancelled':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        // Navigate to order details screen when implemented
        console.log(`Viewing order ${item.orderNumber}`);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>Ordered on {item.date}</Text>
        <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderItems}>{item.items} {item.items > 1 ? 'items' : 'item'}</Text>
        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {mockOrders.length > 0 ? (
        <FlatList
          data={mockOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-bag" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No orders found</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => {
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    textAlign: 'center',
  },
  ordersList: {
    padding: SIZES.padding,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  orderNumber: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  statusText: {
    ...FONTS.body5,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  orderDate: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  orderTotal: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  orderItems: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  shopButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default OrdersScreen; 