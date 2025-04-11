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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

type RegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Register'>;
};

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    storeName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!formData.storeName.trim()) {
      Alert.alert('Error', 'Please enter your store name');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!formData.storeAddress.trim()) {
      Alert.alert('Error', 'Please enter your store address');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        storeName: formData.storeName,
        storeAddress: formData.storeAddress
      };
      await register(userData);
      navigation.replace('Main');
    } catch (error: any) {
      console.error('Registration error in RegisterScreen:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        response: error?.response?.data,
        status: error?.response?.status
      });
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Store Account</Text>
            <Text style={styles.headerSubtitle}>Start selling your products today!</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="store" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Store Name"
                value={formData.storeName}
                onChangeText={(value) => updateFormData('storeName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Store Address"
                value={formData.storeAddress}
                onChangeText={(value) => updateFormData('storeAddress', value)}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showPassword}
              />
            </View>

            <Button
              title={isLoading ? "Registering..." : "Register"}
              onPress={handleRegister}
              containerStyle={styles.registerButton}
              disabled={isLoading}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: SIZES.padding,
  },
  header: {
    marginTop: Platform.OS === 'android' ? SIZES.padding * 2 : SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SIZES.base,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray + '20',
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    minHeight: 60,
  },
  inputIcon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    ...FONTS.body2,
  },
  passwordToggle: {
    padding: SIZES.base,
  },
  registerButton: {
    marginVertical: SIZES.padding,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SIZES.padding,
  },
  loginText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  loginLink: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
});

export default RegisterScreen; 