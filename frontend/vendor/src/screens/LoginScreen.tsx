import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import Button from '../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      // Navigation will be handled by the auth state change in App.tsx
    } catch (error: any) {
      console.error('Login error in LoginScreen:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        response: error?.response?.data,
        status: error?.response?.status
      });
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message || 'Failed to login. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vendor Login</Text>
          <Text style={styles.headerSubtitle}>Welcome back to your store!</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
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

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title={isLoading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            containerStyle={styles.loginButton}
            disabled={isLoading}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have a vendor account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    height: 60,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SIZES.padding * 2,
  },
  forgotPasswordText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  loginButton: {
    marginBottom: SIZES.padding,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding,
  },
  registerText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  registerLink: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
});

export default LoginScreen; 