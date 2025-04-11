import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  description: string;
};

const ProductsScreen = ({ navigation }) => {
  // Dummy data for demonstration
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Product 1',
      price: 29.99,
      stock: 50,
      image: 'https://via.placeholder.com/150',
      category: 'Category 1',
      description: 'Description for product 1',
    },
    // Add more dummy products as needed
  ]);

  const [filterCategory, setFilterCategory] = useState('all');

  const handleDeleteProduct = (productId: string) => {
    // TODO: Implement delete product logic
    setProducts(products.filter(product => product.id !== productId));
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
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
          onPress={() => handleDeleteProduct(item.id)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
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
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterCategory === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterCategory('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterCategory === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {/* Add more category filter buttons as needed */}
          </ScrollView>
        </View>

        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
        />
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
});

export default ProductsScreen; 