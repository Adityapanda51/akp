import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useNavigation, useRoute, RouteProp, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';

interface AddressData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

type DeliveryAddressScreenRouteProp = RouteProp<
  {
    params: {
      address?: AddressData;
      onAddressSave?: (address: AddressData) => void;
    };
  },
  'params'
>;

const DeliveryAddressScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute<DeliveryAddressScreenRouteProp>();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initialAddress = route.params?.address || {
    name: user?.name || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  };

  const [address, setAddress] = useState<AddressData>(initialAddress);
  const [errors, setErrors] = useState<Partial<AddressData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<AddressData> = {};
    let isValid = true;

    if (!address.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!address.street.trim()) {
      newErrors.street = 'Street address is required';
      isValid = false;
    }

    if (!address.city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    if (!address.state.trim()) {
      newErrors.state = 'State is required';
      isValid = false;
    }

    if (!address.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
      isValid = false;
    }

    if (!address.country.trim()) {
      newErrors.country = 'Country is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveAddress = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);

      // Save to user profile if logged in
      if (user) {
        const updatedUserData = {
          address: {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
          }
        };

        await updateUserProfile(updatedUserData);
        
        // Update local user context
        updateUser({
          ...user,
          address: updatedUserData.address
        });
      }

      // Call the callback function if provided through route params
      if (route.params?.onAddressSave) {
        route.params.onAddressSave(address);
      }

      Alert.alert(
        "Success", 
        "Delivery address saved successfully", 
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert(
        "Error",
        "Failed to save address. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={address.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              placeholder="Enter your street address"
              value={address.street}
              onChangeText={(value) => handleInputChange('street', value)}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: SIZES.padding / 2 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="City"
                value={address.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: SIZES.padding / 2 }]}>
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                placeholder="State"
                value={address.state}
                onChangeText={(value) => handleInputChange('state', value)}
              />
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: SIZES.padding / 2 }]}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={[styles.input, errors.zipCode && styles.inputError]}
                placeholder="ZIP Code"
                value={address.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                keyboardType="numeric"
              />
              {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: SIZES.padding / 2 }]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={[styles.input, errors.country && styles.inputError]}
                placeholder="Country"
                value={address.country}
                onChangeText={(value) => handleInputChange('country', value)}
              />
              {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Saving address...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAddress}
          >
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  backButton: {
    padding: SIZES.base,
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    ...SHADOWS.small,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  input: {
    backgroundColor: COLORS.lightGray + '30',
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 0.8,
    borderWidth: 1,
    borderColor: COLORS.lightGray + '50',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
    ...SHADOWS.medium,
  },
  saveButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
    padding: SIZES.padding,
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginTop: SIZES.base,
  },
});

export default DeliveryAddressScreen; 