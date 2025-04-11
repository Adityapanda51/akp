import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import CustomImagePicker from '../components/ImagePicker';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  countInStock: number;
  image: string;
}

interface RouteParams {
  product: Product;
}

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = (route.params as RouteParams) || {};

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [countInStock, setCountInStock] = useState(product?.countInStock?.toString() || '');
  const [image, setImage] = useState(product?.image || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) {
      Alert.alert('Error', 'Product not found');
      navigation.goBack();
    }
  }, [product, navigation]);

  const handleUpdateProduct = async () => {
    if (!name || !description || !price || !category || !countInStock) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/vendors/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authorization header
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
          countInStock: parseInt(countInStock, 10),
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <CustomImagePicker
          image={image}
          onImageSelected={setImage}
          style={styles.imagePicker}
        />

        <Input
          label="Product Name"
          placeholder="Enter product name"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Description"
          placeholder="Enter product description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Input
          label="Price"
          placeholder="Enter price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Input
          label="Category"
          placeholder="Enter category"
          value={category}
          onChangeText={setCategory}
        />

        <Input
          label="Stock Count"
          placeholder="Enter available stock"
          value={countInStock}
          onChangeText={setCountInStock}
          keyboardType="number-pad"
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Update Product"
            onPress={handleUpdateProduct}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  imagePicker: {
    marginBottom: SIZES.padding,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginVertical: SIZES.padding,
  },
});

export default EditProductScreen; 