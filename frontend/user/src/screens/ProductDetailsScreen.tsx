import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';

interface ProductDetailsScreenProps {
  route: {
    params: {
      product: Product;
    };
  };
  navigation: any;
}

const ProductDetailsScreen = ({ route, navigation }: ProductDetailsScreenProps) => {
  const { product } = route.params;
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={20} color={COLORS.tertiary} />
            <Text style={styles.rating}>
              {product.rating.toFixed(1)} ({product.numReviews} reviews)
            </Text>
          </View>
          
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.actionContainer}>
            <Button
              title="Add to Cart"
              onPress={handleAddToCart}
              containerStyle={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: SIZES.padding * 2,
    left: SIZES.padding,
    zIndex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    ...SHADOWS.small,
  },
  imageContainer: {
    height: SIZES.height * 0.45,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding * 3,
    marginTop: -30,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  rating: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginLeft: 5,
  },
  price: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginVertical: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: SIZES.padding * 2,
  },
  button: {
    height: 60,
  },
});

export default ProductDetailsScreen; 