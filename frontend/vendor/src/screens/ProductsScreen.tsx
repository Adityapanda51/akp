import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { getVendorProducts, deleteProduct } from '../services/api';
import axios from 'axios';

// Base64 encoded small placeholder image
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEHUlEQVR4nO2dW4hNURjHf2PGbeQ6bhm3ktySSHkQeVBeUCiXF0QeeHB5MB4oRHlAEkkpIrm8UELkUiJRLC4zI5ccMwxm0pyZ//Gt2mp3OufsvfZae6/1/Orb55w9e6/1X9+5rG+tvQOGYRiGYRiGYRiGYaQPoBYYB8wCFgCLgKXAOGwUnBOAFmA/0AF8Bn71Ky+BY0At/ipTgL1AJ/CzhO9Ighw9F7gDjPAvTAPa+b8BpeQJsInckCEHUxzJKJQ7wHhyKmILMABkSsgD7QG5E3EI+JbhqB+JiM06UopYrRMUMksLa9+uLxBCnsT1xzEJvQFCdCIuFZDQFyDiFjDUlhBbgP6AENUDQJMNIbnrDXID+KwTWqIm5E1Ue4jnNvAhoIVshsLTGMdYVlbHm6wHmgq5DnQHtJAnwHTqmAm0VVBEe1RRY5pCfI6kjAVrDlU6ZKsIm2MoYiYnRNZ4yjXW5pgsrQP6bYpoTCGkMYZTrTORuN1IvcpoB14kKSRGV7cEeJ6gkAuoiLpSlRVKiHi1RykRMk6lGaPTijCETAeGqRxX3mUgYgkqoa4kw2l9FQ5O9yoSIoPJv2n4ZrMCLVEJkbI+ISGbFJCxLGEha9F8v1DY1QTDVC2qcCIFIbMdtpDjKQgRjqGK2pSEtKMKl1ISsjbm+SyxOJiikPloInMG/CZlIeu1EFKTspDbqMJDR0LEeJpCFqIK9x0JkckSbVyLo2NYh2osdihkLqrRmlDXl7RExmDLuBrQ/a1CVUa7EiJNVgOq0ghsLyND7OvYgKqsdSjkIapzG/jsWMi7JM7wcME4/pcrtjuW8lKLMayLFZDR7VBIJw7WMqzDZDo7yS5sV20KGImODLRj+Ov4IrAcDTnpWsRFPOC4QxEXSDkLggftjw5F7MUD5Pz0Lw5EXMUD5FTrdtJZjbAPDzhG6bnPw/CAenKl4yRqpgyqT8z3wBF84STwI6FWsgNPkJW+uyIeJnqSeFhDm2H0EcPbRO1X86TDvGRCSpAX1lSkQp86zHqgjxLQlSqWxmW+4yHXgRMoYLnQsaSQp45OiaiEGmBJhc1Wq8pThzuU/z1s8pPepOLV9RpDrZlNfCJkd3ICqmYu8RExjqPJrYpOmgvAFeLdaXEWD9dXLyLeMcTlhLvMJfNQYzzQRfQiXpDbHyiqAR4Rn4hOMngwLTETgEfEI+IVsAhDEPfDVQIi+oB9GMUoJQ+l5ggXGK4Z4vuN/LKxmgGu0f8IObZlDMAk0kHW2JCvZTkwWZ6bJzd/u8tDiuwJ5jmDTFbf9l2+J1Lk5tMu+SkR00WQ6kKMJBYA29S92H7SepA7NuQlhRa1R9apo/CKGc/YYRiGYRiGYRiGYRhG7vgDFQlTfNY0FSMAAAAASUVORK5CYII=';

// Function to create a placeholder image with text
const getImagePlaceholder = (productName: string): string => {
  // Return base64 image data
  return PLACEHOLDER_IMAGE;
};

// API URL for backend
const API_URL = Platform.select({
  android: 'http://192.168.101.5:5000', // Android Emulator
  ios: 'http://192.168.101.5:5000',     // iOS Simulator
  default: 'http://192.168.101.5:5000'  // Fallback
});

// Function to convert S3 URL to a proxied URL
const getProxiedImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return getImagePlaceholder('');
  
  try {
    // Check if it's an S3 URL (from your aws bucket)
    if (imageUrl.includes('amazonaws.com')) {
      // Extract the key from the URL (the last part after the last slash)
      const key = imageUrl.split('/').pop();
      if (!key) return getImagePlaceholder('');
      
      // Return the proxied URL
      return `${API_URL}/proxy-image/${key}`;
    }
    
    // For other cases, return the original URL
    return imageUrl;
  } catch (error) {
    console.error('Error converting to proxied URL:', error);
    return getImagePlaceholder('');
  }
};

// Updated categories as requested
const categories = [
  'All',
  'Bakery',
  'Biryani',
  'Fast Food',
];

interface Product {
  _id: string;
  name: string;
  price: number;
  countInStock: number;
  images: string[];
  category: string;
  description: string;
}

const ProductsScreen = ({ navigation }: { navigation: any }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProductsByCategory();
  }, [selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getVendorProducts();
      console.log('Products received:', response);
      if (response && Array.isArray(response) && response.length > 0) {
        // Log first product's image URLs
        console.log('First product:', response[0].name);
        console.log('First product image URLs:', response[0].images);
      }
      // Type cast response to Product[] to satisfy TypeScript
      setProducts(Array.isArray(response) ? response : []);
      setFilteredProducts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProductsByCategory = () => {
    if (selectedCategory === 'All' || !products.length) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(
      (product) => product.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async (productId: string) => {
    // Add confirmation dialog before deleting
    const confirmDelete = await new Promise((resolve) => {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this product? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      console.log(`Attempting to delete product with ID: ${productId}`);
      await deleteProduct(productId);
      
      console.log('Product deleted successfully, updating UI');
      // Update local state after successful deletion
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      Alert.alert('Success', 'Product deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      // Better error handling with specific messages for server errors
      let errorMessage = 'Failed to delete product. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message || '';
        
        console.error(`Server returned status ${status} with message: ${serverMessage}`);
        
        if (status === 500 && serverMessage.includes('remove is not a function')) {
          errorMessage = 'Server error: The product could not be deleted due to a server-side issue. Please contact support.';
        } else {
          errorMessage = `Server Error: ${status} - ${serverMessage || 'Unknown error'}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    // Get the first image URL or use placeholder
    const imageUrl = item.images && item.images.length > 0 
      ? getProxiedImageUrl(item.images[0])
      : getImagePlaceholder(item.name);
      
    return (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.productImage} 
        onError={(error) => {
          console.error('Image loading error for', item.name, ':', error.nativeEvent.error);
        }}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productNameText}>{item.name}</Text>
        <Text style={styles.productPriceText}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productStockText}>Stock: {item.countInStock}</Text>
        <Text style={styles.productCategoryText}>{item.category}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProduct', { product: item })}
        >
          <MaterialIcons name="edit" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item._id)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedCategory === item && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedCategory === item && styles.filterButtonTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitleText}>Products</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <MaterialIcons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Test image using proxy endpoint */}
        {/* <View style={{ padding: 10, alignItems: 'center' }}>
          <Text>Test Image Proxy:</Text>
          <Image 
            source={{ uri: `${API_URL}/test-s3-image` }}
            style={{ width: 80, height: 80, marginTop: 5, borderRadius: 10 }}
            onError={(error) => console.error('Test proxy image error:', error.nativeEvent.error)}
          />
        </View> */}

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategory === category && styles.filterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              Add your first product by tapping the + button
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProducts().finally(() => setRefreshing(false));
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === 'android' ? SIZES.padding * 2 : SIZES.padding,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '20',
  },
  headerTitleText: {
    fontSize: FONTS.h2.fontSize,
    lineHeight: FONTS.h2.lineHeight,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.base,
  },
  filterScroll: {
    paddingHorizontal: SIZES.padding,
  },
  filterButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray + '20',
    marginRight: SIZES.base,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  productList: {
    padding: SIZES.padding,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    overflow: 'hidden' as const,
  },
  productInfo: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  productNameText: {
    fontSize: FONTS.h3.fontSize,
    lineHeight: FONTS.h3.lineHeight,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
    fontWeight: '500',
  },
  productPriceText: {
    fontSize: FONTS.body2.fontSize,
    lineHeight: FONTS.body2.lineHeight,
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
    fontWeight: '400',
  },
  productStockText: {
    fontSize: FONTS.body3.fontSize,
    lineHeight: FONTS.body3.lineHeight,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
    fontWeight: '400',
  },
  productCategoryText: {
    fontSize: FONTS.body3.fontSize,
    lineHeight: FONTS.body3.lineHeight,
    color: COLORS.gray,
    fontWeight: '400',
  },
  productActions: {
    justifyContent: 'space-around',
    paddingLeft: SIZES.padding,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '15',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: FONTS.h3.fontSize,
    lineHeight: FONTS.h3.lineHeight,
    color: COLORS.gray,
    marginTop: SIZES.padding,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONTS.body4.fontSize,
    lineHeight: FONTS.body4.lineHeight,
    color: COLORS.gray,
    marginTop: SIZES.base,
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default ProductsScreen; 