import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const [imageError, setImageError] = useState(false);

  // Function to generate a placeholder image URL with product name
  const getPlaceholderImageUrl = (productName: string) => {
    // Encode the product name to be URL-safe
    const encodedName = encodeURIComponent(productName);
    // Create a placeholder image with the product name
    return `https://via.placeholder.com/150/CCCCCC/333333?text=${encodedName}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ 
          uri: imageError ? 
            getPlaceholderImageUrl(product.name.substring(0, 10)) : 
            product.images && product.images.length > 0 ? 
              product.images[0] : 
              getPlaceholderImageUrl('No Image')
        }}
        style={styles.image}
        onError={() => setImageError(true)}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <View style={styles.stockRow}>
          <Text style={styles.stock}>
            {product.countInStock > 0 ? `In Stock: ${product.countInStock}` : 'Out of Stock'}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: SIZES.padding,
  },
  name: {
    ...FONTS.h3,
    marginBottom: 5,
  },
  price: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 5,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stock: {
    ...FONTS.body4,
    color: COLORS.gray,
  }
});

export default ProductCard; 