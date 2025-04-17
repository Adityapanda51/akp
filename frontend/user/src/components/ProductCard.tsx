import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
  GestureResponderEvent,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import SafeImage from './SafeImage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - SIZES.padding * 1.5;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  containerStyle?: ViewStyle;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, containerStyle }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: GestureResponderEvent) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();
    
    // Add product to cart
    addToCart(product, 1);
    
    // Show feedback to user
    Alert.alert(
      "Added to Cart",
      `${product.name} has been added to your cart.`,
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <SafeImage
          uri={product.images && product.images.length > 0 ? product.images[0] : ''}
          placeholderContent={product.name}
          style={styles.image}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color={COLORS.tertiary} />
          <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.priceAddContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddToCart}
          >
            <MaterialIcons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    width: CARD_WIDTH,
    marginBottom: SIZES.padding,
    marginHorizontal: SIZES.padding / 2,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: SIZES.padding / 2,
  },
  name: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    ...FONTS.body5,
    color: COLORS.gray,
    marginLeft: 4,
  },
  priceAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard; 