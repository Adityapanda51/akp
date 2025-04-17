import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { updateProduct } from '../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  countInStock: number;
  brand?: string;
  images: string[];
}

interface RouteParams {
  product: Product;
}

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = (route.params as RouteParams) || {};

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    category: product?.category || '',
    countInStock: product?.countInStock?.toString() || '',
    brand: product?.brand || '',
  });

  const [errors, setErrors] = useState({
    name: '',
    price: '',
    countInStock: '',
    category: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) {
      Alert.alert('Error', 'Product not found');
      navigation.goBack();
    }
  }, [product, navigation]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      price: '',
      countInStock: '',
      category: '',
      description: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
      isValid = false;
    }

    if (!formData.countInStock.trim()) {
      newErrors.countInStock = 'Stock quantity is required';
      isValid = false;
    } else if (isNaN(Number(formData.countInStock)) || Number(formData.countInStock) < 0) {
      newErrors.countInStock = 'Please enter a valid stock quantity';
      isValid = false;
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateProduct = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Format the product data for API
        const productData = {
          name: formData.name,
          price: Number(formData.price),
          countInStock: Number(formData.countInStock),
          category: formData.category.toLowerCase(),
          description: formData.description,
          // Only include brand if it has value
          ...(formData.brand.trim() !== '' && { brand: formData.brand.trim() }),
          // Keep existing images
          images: product.images
        };
        
        console.log('Updating product data:', JSON.stringify(productData));
        
        // Call the API to update the product
        const response = await updateProduct(product._id, productData);
        console.log('Product updated successfully:', response);
        alert('Product updated successfully!');
        navigation.goBack();
      } catch (error: any) {
        console.error('Error updating product:', error);
        
        // Error handling approach
        let errorMessage = 'Failed to update product. Please try again.';
        if (error.response) {
          errorMessage = `Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Product</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Brand <Text style={styles.optionalText}>(Optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter brand name (or leave empty)"
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: SIZES.base }]}>
                <Text style={styles.label}>Price <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                />
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Stock <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={formData.countInStock}
                  onChangeText={(text) => setFormData({ ...formData, countInStock: text })}
                />
                {errors.countInStock ? <Text style={styles.errorText}>{errors.countInStock}</Text> : null}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter category"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />
              {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
              {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateProduct}
              disabled={loading}
            >
              <Text style={styles.updateButtonText}>
                {loading ? 'Updating...' : 'Update Product'}
              </Text>
              {loading && <MaterialIcons name="sync" size={20} color={COLORS.white} style={{ marginLeft: 8, transform: [{ rotate: '45deg' }] }} />}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    fontWeight: '700',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  requiredAsterisk: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  optionalText: {
    ...FONTS.body3,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...FONTS.body2,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding,
    flexDirection: 'row',
  },
  updateButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default EditProductScreen; 