import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { getProducts, getProductsByCategory, getNearbyProducts, reverseGeocode, geocodeAddress } from '../services/api';
import { Product, SavedLocation, GeocodeResult } from '../types';
import ProductCard from '../components/ProductCard';
import * as Location from 'expo-location';
import { debounce } from 'lodash';

const categories = [
  'All',
  'Groceries',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Bakery',
  'Meat',
  'Electronics',
  'Fashion',
];

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Address search states
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<GeocodeResult[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);

  useEffect(() => {
    if (user?.currentLocation?.coordinates) {
      // Get location from user profile if available
      setCurrentLocation({
        longitude: user.currentLocation.coordinates[0],
        latitude: user.currentLocation.coordinates[1],
        address: user.currentLocation.formattedAddress || 'Current Location',
      });
      
      if (user.savedLocations) {
        setSavedLocations(user.savedLocations);
      }
    } else {
      // Otherwise request device location
      requestLocationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyProducts();
    } else {
      fetchProducts();
    }
  }, [currentLocation, selectedCategory]);

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need location permission to show nearby stores. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      try {
        const geocodeResult = await reverseGeocode(latitude, longitude);
        setCurrentLocation({
          latitude,
          longitude,
          address: geocodeResult.formattedAddress || 'Current Location',
        });
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        setCurrentLocation({
          latitude,
          longitude,
          address: 'Current Location',
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response);
      setFilteredProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyProducts = async () => {
    if (!currentLocation) return;
    
    try {
      setLoading(true);
      const category = selectedCategory !== 'All' ? selectedCategory.toLowerCase() : undefined;
      const response = await getNearbyProducts(
        currentLocation.latitude,
        currentLocation.longitude,
        10, // 10km radius
        category
      );
      setProducts(response);
      setFilteredProducts(response);
    } catch (error) {
      console.error('Error fetching nearby products:', error);
      // Fallback to regular products if location-based search fails
      fetchProducts();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentLocation) {
      await fetchNearbyProducts();
    } else {
      await fetchProducts();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    
    // Filter by search query
    const result = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredProducts(result);
  };

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

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
      containerStyle={styles.productCard}
    />
  );
  
  const renderSavedLocationItem = ({ item }: { item: SavedLocation }) => (
    <TouchableOpacity
      style={styles.savedLocationItem}
      onPress={() => {
        if (item.coordinates) {
          setCurrentLocation({
            longitude: item.coordinates[0],
            latitude: item.coordinates[1],
            address: item.formattedAddress || item.name,
          });
          setLocationModalVisible(false);
        }
      }}
    >
      <View style={styles.locationIconContainer}>
        <MaterialIcons 
          name={item.type === 'home' ? 'home' : item.type === 'work' ? 'work' : 'place'} 
          size={24} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.locationTextContainer}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress} numberOfLines={1}>
          {item.formattedAddress || item.address || `${item.city}, ${item.state}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const searchAddressDebounced = useRef(
    debounce(async (text: string) => {
      if (text.length < 3) {
        setAddressSearchResults([]);
        return;
      }
      
      setAddressSearchLoading(true);
      try {
        const result = await geocodeAddress(text);
        setAddressSearchResults([result]);
      } catch (error) {
        console.error('Error searching address:', error);
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

  const selectAddress = (item: GeocodeResult) => {
    setCurrentLocation({
      longitude: item.coordinates[0],
      latitude: item.coordinates[1],
      address: item.formattedAddress,
    });
    setLocationModalVisible(false);
    
    // Fetch products for the new location
    fetchNearbyProducts();
  };

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
      
      {/* Location Selector */}
      <TouchableOpacity 
        style={styles.locationSelector}
        onPress={() => setLocationModalVisible(true)}
      >
        <MaterialIcons name="place" size={22} color={COLORS.primary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationLoading 
            ? 'Detecting location...' 
            : (currentLocation?.address || 'Select location')}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={22} color={COLORS.primary} />
      </TouchableOpacity>

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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No products found</Text>
          {currentLocation && (
            <Text style={styles.emptySubtext}>
              Try changing your location or search criteria
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            {/* Current Location Button */}
            <TouchableOpacity 
              style={styles.currentLocationBtn}
              onPress={requestLocationPermission}
            >
              <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
              <Text style={styles.currentLocationText}>
                {locationLoading ? 'Detecting location...' : 'Use current location'}
              </Text>
              {locationLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
            </TouchableOpacity>
            
            {/* Manual Address Search */}
            <View style={styles.addressSearchContainer}>
              <View style={styles.addressInputContainer}>
                <MaterialIcons name="search" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.addressSearchInput}
                  placeholder="Search for an address..."
                  value={addressSearch}
                  onChangeText={handleAddressSearch}
                  placeholderTextColor={COLORS.gray}
                />
                {addressSearch ? (
                  <TouchableOpacity onPress={() => setAddressSearch('')}>
                    <MaterialIcons name="close" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              {addressSearchLoading && (
                <ActivityIndicator style={styles.addressSearchLoading} color={COLORS.primary} />
              )}
              
              {addressSearchResults.length > 0 && !addressSearchLoading && (
                <View style={styles.addressResultsList}>
                  {addressSearchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.addressResultItem}
                      onPress={() => selectAddress(result)}
                    >
                      <MaterialIcons name="place" size={22} color={COLORS.primary} />
                      <Text style={styles.addressResultText}>{result.formattedAddress}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.savedLocationsHeader}>
              <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
              <TouchableOpacity 
                onPress={() => {
                  setLocationModalVisible(false);
                  navigation.navigate('Profile', { tab: 'addresses' });
                }}
              >
                <Text style={styles.addNewLocationText}>Add New</Text>
              </TouchableOpacity>
            </View>
            
            {savedLocations.length > 0 ? (
              <FlatList
                data={savedLocations}
                keyExtractor={(item) => item._id || item.name}
                renderItem={renderSavedLocationItem}
                contentContainerStyle={styles.savedLocationsList}
              />
            ) : (
              <View style={styles.noSavedLocations}>
                <Text style={styles.noSavedLocationsText}>No saved locations</Text>
                <Text style={styles.noSavedLocationsSubtext}>
                  Add locations from your profile to quickly switch between them
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    marginBottom: SIZES.padding,
  },
  locationText: {
    ...FONTS.body3,
    color: COLORS.black,
    flex: 1,
    marginHorizontal: SIZES.base,
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
  productsList: {
    paddingHorizontal: SIZES.padding / 2,
    paddingBottom: SIZES.padding * 2,
  },
  productCard: {
    flex: 1,
    margin: SIZES.base,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    padding: SIZES.padding,
    paddingBottom: Platform.OS === 'ios' ? SIZES.padding * 2 : SIZES.padding,
    maxHeight: '80%',
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
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  currentLocationText: {
    ...FONTS.body3,
    color: COLORS.black,
    flex: 1,
    marginLeft: SIZES.padding,
  },
  savedLocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    marginTop: SIZES.padding,
  },
  savedLocationsTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  addNewLocationText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  savedLocationsList: {
    paddingBottom: SIZES.padding,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding / 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  locationAddress: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: 2,
  },
  noSavedLocations: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  noSavedLocationsText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  noSavedLocationsSubtext: {
    ...FONTS.body4,
    color: COLORS.gray,
    textAlign: 'center',
  },
  addressSearchContainer: {
    marginBottom: SIZES.padding,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base,
  },
  addressSearchInput: {
    flex: 1,
    paddingHorizontal: SIZES.base,
    ...FONTS.body3,
    color: COLORS.black,
  },
  addressSearchLoading: {
    marginTop: SIZES.padding,
    alignSelf: 'center',
  },
  addressResultsList: {
    marginTop: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
  },
  addressResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  addressResultText: {
    ...FONTS.body3,
    color: COLORS.black,
    marginLeft: SIZES.base,
    flex: 1,
  },
});

export default HomeScreen; 