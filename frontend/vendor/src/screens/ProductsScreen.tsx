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
      setProducts(response);
      setFilteredProducts(response);
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

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productStock}>Stock: {item.countInStock}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
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
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <MaterialIcons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

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
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
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
  },
  productInfo: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  productName: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  productPrice: {
    ...FONTS.body2,
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
  },
  productStock: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  productCategory: {
    ...FONTS.body3,
    color: COLORS.gray,
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
    ...FONTS.h3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
    textAlign: 'center',
  },
  emptySubtext: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
});

export default ProductsScreen; 