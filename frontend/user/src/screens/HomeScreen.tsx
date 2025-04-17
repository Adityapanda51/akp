import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { getProducts, getProductsByCategory } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const categories = [
  'All',
  'Bakery',
  'Biryani',
  'Fast Food',
];

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Fetch all products or by category
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedCategory === 'All') {
        response = await getProducts();
      } else {
        response = await getProductsByCategory(selectedCategory.toLowerCase());
      }
      
      if (Array.isArray(response)) {
        console.log(`Fetched ${response.length} products`);
        setProducts(response);
        setFilteredProducts(response);
      } else {
        console.error('Invalid response format:', response);
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons name="notifications" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cartIcon}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialIcons name="shopping-cart" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          renderItem={renderCategoryItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { product: item })}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding / 2,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.black,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIcon: {
    marginLeft: SIZES.padding,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.padding / 1.5,
    paddingHorizontal: SIZES.padding / 2,
    ...FONTS.body3,
    color: COLORS.black,
  },
  categoriesContainer: {
    marginBottom: SIZES.padding,
  },
  categoriesList: {
    paddingHorizontal: SIZES.padding / 2,
  },
  categoryItem: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.base / 2,
    ...SHADOWS.small,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  productsGrid: {
    paddingHorizontal: SIZES.padding / 2,
    paddingBottom: SIZES.padding * 2,
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
    paddingTop: SIZES.padding * 5,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
});

export default HomeScreen; 





