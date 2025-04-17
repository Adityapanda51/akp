import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import Button from '../components/Button';
import { createProduct } from '../services/api';
import axios from 'axios';

// Updated categories as requested
const categories = [
  'All',
  'Bakery',
  'Biryani',
  'Fast Food',
];

interface NavigationProps {
  goBack: () => void;
  navigate: (screen: string, params?: any) => void;
}

const AddProductScreen = ({ navigation }: { navigation: NavigationProps }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    brand: '',
    images: [] as string[],
  });

  const [errors, setErrors] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    brand: '',
    images: '',
  });

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      price: '',
      stock: '',
      category: '',
      description: '',
      brand: '',
      images: '',
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

    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
      isValid = false;
    } else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Please enter a valid stock quantity';
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

    // Brand is optional, so no validation needed
    
    // Images are optional, so no validation needed
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Format the product data for API
        const productData = {
          name: formData.name,
          price: Number(formData.price),
          countInStock: Number(formData.stock),
          category: formData.category.toLowerCase(),
          description: formData.description,
          // Only include brand if it has value
          ...(formData.brand.trim() !== '' && { brand: formData.brand.trim() }),
          // Use a default image if none provided
          images: formData.images.length > 0 ? formData.images : ['https://via.placeholder.com/400x400?text=No+Image']
        };
        
        console.log('Sending product data:', JSON.stringify(productData));
        
        // Call the API to create the product
        const response = await createProduct(productData);
        console.log('Product created successfully:', response);
        alert('Product created successfully!');
        navigation.goBack();
      } catch (error: any) {
        console.error('Error creating product:', error);
        
        // Simpler error handling approach
        let errorMessage = 'Failed to create product. Please try again.';
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

  const selectCategory = (category: string) => {
    setFormData({ ...formData, category });
    setCategoryModalVisible(false);
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => selectCategory(item)}
    >
      <Text style={styles.categoryText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
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
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                />
                {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={[
                  styles.categorySelectorText,
                  !formData.category && styles.categorySelectorPlaceholder
                ]}>
                  {formData.category || "Select category"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.gray} />
              </TouchableOpacity>
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Images <Text style={styles.optionalText}>(Optional)</Text></Text>
              <View style={styles.imageContainer}>
                {formData.images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image 
                      source={{ uri }} 
                      style={{ width: '100%', height: '100%', borderRadius: SIZES.radius }} 
                    />
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialIcons name="close" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addImage} onPress={handleImagePick}>
                  <MaterialIcons name="add-photo-alternate" size={24} color={COLORS.primary} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Add Product"
              onPress={handleSubmit}
              containerStyle={styles.submitButton}
              loading={loading}
            />
          </View>
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={categories.filter(cat => cat !== 'All')}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.categoryList}
              />
            </View>
          </TouchableOpacity>
        </Modal>
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
  form: {
    padding: SIZES.padding,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  addImage: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginTop: SIZES.base / 2,
  },
  errorText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
  },
  submitButton: {
    marginTop: SIZES.padding,
  },
  categorySelector: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySelectorText: {
    ...FONTS.body2,
    color: COLORS.black,
  },
  categorySelectorPlaceholder: {
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  modalTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    fontWeight: '700',
  },
  categoryList: {
    paddingBottom: SIZES.padding,
  },
  categoryItem: {
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  categoryText: {
    ...FONTS.body2,
    color: COLORS.black,
  }
});

export default AddProductScreen; 