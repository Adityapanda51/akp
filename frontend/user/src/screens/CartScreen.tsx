import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';

const CartScreen = ({ navigation }: any) => {
  const { cartItems, removeFromCart, updateCartItemQuantity, cartTotal } = useCart();

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={styles.itemPrice}>${item.product.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartItemQuantity(item.product._id, item.quantity - 1)}
        >
          <MaterialIcons name="remove" size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartItemQuantity(item.product._id, item.quantity + 1)}
        >
          <MaterialIcons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.product._id)}
      >
        <MaterialIcons name="delete" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
      </View>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Browse Products"
            onPress={() => navigation.navigate('Home')}
            containerStyle={styles.browseButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.product._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.cartList}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
            </View>
            
            <Button
              title="Proceed to Checkout"
              onPress={() => navigation.navigate('Checkout')}
              containerStyle={styles.checkoutButton}
            />
          </View>
        </>
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
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  cartList: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius / 2,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SIZES.padding / 2,
  },
  itemName: {
    ...FONTS.body3,
    color: COLORS.black,
    marginBottom: 4,
  },
  itemPrice: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  quantityButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius / 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    ...FONTS.h3,
    color: COLORS.black,
    marginHorizontal: SIZES.padding / 2,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: SIZES.base,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...SHADOWS.medium,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  totalLabel: {
    ...FONTS.h3,
    color: COLORS.gray,
  },
  totalAmount: {
    ...FONTS.h2,
    color: COLORS.primary,
  },
  checkoutButton: {
    height: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  browseButton: {
    width: '70%',
  },
});

export default CartScreen; 