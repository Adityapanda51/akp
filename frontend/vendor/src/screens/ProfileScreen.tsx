import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ImageStyle,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Input from '../components/Input';
import api, { uploadSingleImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { debounce } from 'lodash';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  serviceRadius: number;
  storeLocation?: {
    coordinates: [number, number];
    address: string;
    city?: string;
    state?: string;
    country?: string;
    formattedAddress?: string;
  };
}

interface ApiResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
}

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.storeAddress || '',
    description: user?.description || '',
    serviceRadius: user?.serviceRadius || 10,
    storeLocation: user?.storeLocation || undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mapVisible, setMapVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: formData.storeLocation?.coordinates?.[1] || 37.78825,
    longitude: formData.storeLocation?.coordinates?.[0] || -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  // Add address search functionality
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);

  const [imageLoading, setImageLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.storeLocation) newErrors.storeLocation = 'Store location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageLoading(true);
        try {
          // Use the S3 upload function instead of direct API call
          const imageUrl = await uploadSingleImage(result.assets[0].uri);
          
          // Update profile with the new image URL
          updateProfile({ ...user, profilePicture: imageUrl });
          Alert.alert('Success', 'Profile image updated successfully');
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need location permission to set your store location. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get address for this location
      try {
        const geocodeResponse = await api.get(`/geocode/reverse?lat=${latitude}&lng=${longitude}`);
        
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });
        
        setFormData({
          ...formData,
          storeLocation: {
            coordinates: [longitude, latitude],
            address: geocodeResponse.data.formattedAddress,
            city: geocodeResponse.data.city,
            state: geocodeResponse.data.state,
            country: geocodeResponse.data.country,
            formattedAddress: geocodeResponse.data.formattedAddress,
          }
        });
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        setFormData({
          ...formData,
          storeLocation: {
            coordinates: [longitude, latitude],
            address: formData.address,
          }
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again or set it manually.');
    } finally {
      setLocationLoading(false);
    }
  };
  
  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    
    setRegion({
      ...region,
      latitude,
      longitude,
    });
    
    // Get address for this location
    api.get(`/geocode/reverse?lat=${latitude}&lng=${longitude}`)
      .then(response => {
        setFormData({
          ...formData,
          storeLocation: {
            coordinates: [longitude, latitude],
            address: response.data.formattedAddress,
            city: response.data.city,
            state: response.data.state,
            country: response.data.country,
            formattedAddress: response.data.formattedAddress,
          }
        });
      })
      .catch(error => {
        console.error('Error reverse geocoding:', error);
        setFormData({
          ...formData,
          storeLocation: {
            coordinates: [longitude, latitude],
            address: formData.address,
          }
        });
      });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Include storeLocation and serviceRadius in the profile update
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        storeAddress: formData.address,
        description: formData.description,
        storeLocation: formData.storeLocation,
        serviceRadius: formData.serviceRadius,
      };
      
      const response = await api.put<ApiResponse>('/vendor/profile', profileData);
      
      if (response.data.success) {
        updateProfile({ 
          ...user, 
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          storeAddress: formData.address,
          description: formData.description,
          storeLocation: formData.storeLocation,
          serviceRadius: formData.serviceRadius,
        });
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth state change in App.tsx
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const searchAddressDebounced = useRef(
    debounce(async (text: string) => {
      if (text.length < 3) {
        setAddressSearchResults([]);
        return;
      }
      
      setAddressSearchLoading(true);
      try {
        console.log(`Vendor searching for address: "${text}"`);
        const response = await api.get(`/geocode?address=${encodeURIComponent(text)}`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Found ${response.data.length} addresses for vendor`);
          setAddressSearchResults(response.data);
        } else {
          console.log('No address found for vendor search');
          setAddressSearchResults([]);
        }
      } catch (error) {
        console.error('Vendor address search error:', error);
        setAddressSearchResults([]);
      } finally {
        setAddressSearchLoading(false);
      }
    }, 500)
  ).current;

  const handleAddressSearch = (text: string) => {
    setAddressSearch(text);
    searchAddressDebounced(text);
  };

  const selectAddress = (item: any) => {
    setRegion({
      latitude: item.coordinates[1],
      longitude: item.coordinates[0],
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    });
    
    setFormData({
      ...formData,
      storeLocation: {
        coordinates: item.coordinates,
        address: item.formattedAddress,
        city: item.city,
        state: item.state,
        country: item.country,
        formattedAddress: item.formattedAddress,
      }
    });
    
    setAddressSearch('');
    Keyboard.dismiss();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.imageContainer}>
        <View style={styles.profileImageContainer}>
          {imageLoading ? (
            <View style={styles.profileImage}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          ) : user?.profilePicture ? (
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.profileImage as ImageStyle} 
            />
          ) : (
            <View style={[styles.profileImage, styles.noProfileImage]}>
              <MaterialIcons name="store" size={50} color={COLORS.white} />
            </View>
          )}
          <TouchableOpacity 
            style={styles.imageEditButton}
            onPress={handleImagePick}
            disabled={imageLoading}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.storeName}>{user?.storeName || 'Your Store Name'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Name"
          value={formData.name}
          onChangeText={(text: string) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />

        <Input
          label="Email"
          value={formData.email}
          onChangeText={(text: string) => setFormData({ ...formData, email: text })}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Phone"
          value={formData.phone}
          onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
          error={errors.phone}
          keyboardType="phone-pad"
        />

        <Input
          label="Address"
          value={formData.address}
          onChangeText={(text: string) => setFormData({ ...formData, address: text })}
          error={errors.address}
          multiline
          numberOfLines={3}
        />

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text: string) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
        />
        
        {/* Location Selection Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Store Location</Text>
          <Text style={styles.sectionSubtitle}>
            Set your store's exact location on the map to help customers find you
          </Text>
          
          {formData.storeLocation ? (
            <View style={styles.locationInfo}>
              <MaterialIcons name="place" size={24} color={COLORS.primary} />
              <Text style={styles.locationText}>{formData.storeLocation.formattedAddress || formData.storeLocation.address}</Text>
            </View>
          ) : (
            <View style={styles.locationInfo}>
              <MaterialIcons name="place" size={24} color={COLORS.gray} />
              <Text style={styles.noLocationText}>No location set</Text>
            </View>
          )}
          
          {errors.storeLocation && (
            <Text style={styles.errorText}>{errors.storeLocation}</Text>
          )}
          
          <View style={styles.locationButtons}>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              <MaterialIcons name="my-location" size={20} color={COLORS.white} />
              <Text style={styles.buttonText}>
                {locationLoading ? 'Getting Location...' : 'Use Current Location'}
              </Text>
              {locationLoading && (
                <ActivityIndicator size="small" color={COLORS.white} style={{ marginLeft: 5 }} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => setMapVisible(true)}
            >
              <MaterialIcons name="map" size={20} color={COLORS.white} />
              <Text style={styles.buttonText}>Set on Map</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusLabel}>Delivery Radius: {formData.serviceRadius} km</Text>
            <View style={styles.radiusButtons}>
              <TouchableOpacity 
                style={styles.radiusButton}
                onPress={() => formData.serviceRadius > 1 && setFormData({
                  ...formData,
                  serviceRadius: formData.serviceRadius - 1
                })}
              >
                <MaterialIcons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.radiusValue}>{formData.serviceRadius} km</Text>
              <TouchableOpacity 
                style={styles.radiusButton}
                onPress={() => formData.serviceRadius < 50 && setFormData({
                  ...formData,
                  serviceRadius: formData.serviceRadius + 1
                })}
              >
                <MaterialIcons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Set Store Location</Text>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <MaterialIcons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
          
          {/* Address Search Input */}
          <View style={styles.addressSearchContainer}>
            <View style={styles.addressInputContainer}>
              <MaterialIcons name="search" size={24} color={COLORS.gray} />
              <TextInput
                style={styles.addressSearchInput}
                placeholder="Search for your store location..."
                value={addressSearch}
                onChangeText={handleAddressSearch}
                autoCapitalize="none"
              />
              {addressSearchLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
              {addressSearch.length > 0 && !addressSearchLoading && (
                <TouchableOpacity onPress={() => setAddressSearch('')}>
                  <MaterialIcons name="clear" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Address Search Results */}
            {addressSearchResults.length > 0 && (
              <View style={styles.addressResultsList}>
                {addressSearchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.addressResultItem}
                    onPress={() => selectAddress(item)}
                  >
                    <MaterialIcons name="place" size={24} color={COLORS.primary} />
                    <View style={styles.addressResultTextContainer}>
                      <Text style={styles.addressResultText}>
                        {item.name || item.formattedAddress}
                      </Text>
                      <Text style={styles.addressSubText}>
                        {item.description || 
                          `${item.city}${item.state ? `, ${item.state}` : ''}${item.country ? `, ${item.country}` : ''}`
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <Text style={styles.mapInstructions}>
            Tap on the map to select your store's exact location or search for an address above
          </Text>
          
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {formData.storeLocation && (
              <>
                <Marker
                  coordinate={{
                    latitude: formData.storeLocation.coordinates[1],
                    longitude: formData.storeLocation.coordinates[0],
                  }}
                  title="Store Location"
                />
                <Circle
                  center={{
                    latitude: formData.storeLocation.coordinates[1],
                    longitude: formData.storeLocation.coordinates[0],
                  }}
                  radius={formData.serviceRadius * 1000} // Convert km to meters
                  strokeWidth={1}
                  strokeColor="rgba(0, 128, 255, 0.5)"
                  fillColor="rgba(0, 128, 255, 0.1)"
                />
              </>
            )}
          </MapView>
          
          <TouchableOpacity
            style={styles.currentLocationMapBtn}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.confirmLocationButton}
            onPress={() => setMapVisible(false)}
          >
            <Text style={styles.confirmLocationText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  noProfileImage: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEditButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: '35%',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: COLORS.gray,
  },
  form: {
    padding: SIZES.padding,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logoutButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: COLORS.gray,
    marginBottom: 15,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
  },
  noLocationText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 10,
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 0.48,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  radiusContainer: {
    marginBottom: 15,
  },
  radiusLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  radiusButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  radiusValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapInstructions: {
    padding: SIZES.padding,
    fontStyle: 'italic',
    color: COLORS.gray,
  },
  map: {
    flex: 1,
    height: Dimensions.get('window').height * 0.7,
  },
  currentLocationMapBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
    position: 'absolute',
    right: 15,
    bottom: 80,
  },
  confirmLocationButton: {
    backgroundColor: COLORS.primary,
    margin: SIZES.padding,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmLocationText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressSearchContainer: {
    margin: SIZES.padding,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
  },
  addressSearchInput: {
    flex: 1,
    marginLeft: SIZES.padding / 2,
    ...FONTS.body3,
    color: COLORS.black,
  },
  addressResultsList: {
    marginTop: SIZES.base,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    maxHeight: 200,
    zIndex: 10,
  },
  addressResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  addressResultTextContainer: {
    flex: 1,
    marginLeft: SIZES.padding / 2,
  },
  addressResultText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  addressSubText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: 2,
  },
});

export default ProfileScreen; 