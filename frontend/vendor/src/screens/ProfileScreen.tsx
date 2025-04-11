import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ImageStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../utils/theme';
import Input from '../components/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
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
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.address) newErrors.address = 'Address is required';
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
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        setLoading(true);
        const response = await api.post<ApiResponse>('/vendor/upload-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success && response.data.imageUrl) {
          updateProfile({ ...user, profilePicture: response.data.imageUrl });
          Alert.alert('Success', 'Profile image updated successfully');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await api.put<ApiResponse>('/vendor/profile', formData);
      if (response.data.success) {
        updateProfile({ 
          ...user, 
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          storeAddress: formData.address
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.imageContainer}>
        {user?.profilePicture ? (
          <Image
            source={{ uri: user.profilePicture }}
            style={styles.profileImage as ImageStyle}
          />
        ) : (
          <View style={[styles.profileImage, styles.defaultAvatar]}>
            <MaterialIcons name="person" size={60} color={COLORS.gray} />
          </View>
        )}
        <TouchableOpacity
          style={styles.imageEditButton}
          onPress={handleImagePick}
          disabled={loading}
        >
          <MaterialIcons name="edit" size={20} color={COLORS.white} />
        </TouchableOpacity>
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

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.white} style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },
  imageContainer: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: SIZES.padding * 2,
    right: '50%',
    marginRight: -60,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  form: {
    padding: SIZES.padding,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 