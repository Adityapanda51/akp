import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Settings'>;
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
    // Here you would typically save this preference to AsyncStorage or a backend
    AsyncStorage.setItem('notificationsEnabled', (!notificationsEnabled).toString());
  };

  const toggleLocationTracking = () => {
    setLocationTrackingEnabled(previousState => !previousState);
    // Here you would typically save this preference to AsyncStorage or a backend
    AsyncStorage.setItem('locationTrackingEnabled', (!locationTrackingEnabled).toString());
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(previousState => !previousState);
    // Here you would typically save this preference to AsyncStorage or a backend
    AsyncStorage.setItem('darkModeEnabled', (!darkModeEnabled).toString());
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              // The AuthContext should handle the navigation after logout
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear locally stored data. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              // Clear all app data except authentication
              const token = await AsyncStorage.getItem('token');
              const user = await AsyncStorage.getItem('user');
              
              await AsyncStorage.clear();
              
              // Restore authentication data
              if (token) await AsyncStorage.setItem('token', token);
              if (user) await AsyncStorage.setItem('user', user);
              
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingContent}>
            <Ionicons name="log-out-outline" size={24} color="#d9534f" />
            <Text style={[styles.settingText, { color: '#d9534f' }]}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Push Notifications</Text>
          </View>
          <Switch
            trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
            thumbColor={notificationsEnabled ? '#4CAF50' : '#f5f5f5'}
            onValueChange={toggleNotifications}
            value={notificationsEnabled}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="location-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Location Tracking</Text>
          </View>
          <Switch
            trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
            thumbColor={locationTrackingEnabled ? '#4CAF50' : '#f5f5f5'}
            onValueChange={toggleLocationTracking}
            value={locationTrackingEnabled}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="moon-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
            thumbColor={darkModeEnabled ? '#4CAF50' : '#f5f5f5'}
            onValueChange={toggleDarkMode}
            value={darkModeEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
          <View style={styles.settingContent}>
            <Ionicons name="trash-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Clear Cache</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="information-circle-outline" size={24} color="#555" />
            <Text style={styles.settingText}>About</Text>
          </View>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="document-text-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="document-outline" size={24} color="#555" />
            <Text style={styles.settingText}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen; 