import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  containerStyle?: ViewStyle;
}

const ProductCard = ({ product, onPress, containerStyle }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: product.images[0] }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color={COLORS.tertiary} />
          <Text style={styles.rating}>
            {product.rating.toFixed(1)} ({product.numReviews})
          </Text>
        </View>
        
        <View style={styles.priceAddContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
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
    width: SIZES.width / 2 - SIZES.padding * 1.5,
    marginBottom: SIZES.padding,
    ...SHADOWS.medium,
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
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