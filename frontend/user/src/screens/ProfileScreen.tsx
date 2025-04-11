import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

type RootStackParamList = {
  EditProfile: undefined;
  Orders: undefined;
  Addresses: undefined;
  PaymentMethods: undefined;
  Settings: undefined;
};

const { height } = Dimensions.get('window');
const BOTTOM_TAB_HEIGHT = Platform.OS === 'ios' ? 90 : 75;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <MaterialIcons name="edit" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="person" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Edit Profile</Text>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('Orders')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="list-alt" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>My Orders</Text>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('Addresses')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="location-on" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>My Addresses</Text>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('PaymentMethods')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="payment" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Payment Methods</Text>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Settings')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="settings" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Settings</Text>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <Button
              title="Logout"
              onPress={handleLogout}
              outline
              containerStyle={styles.logoutButton}
            />
          </View>
        </View>
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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? SIZES.padding * 2 : 0,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '20',
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 0 : SIZES.padding,
  },
  content: {
    flex: 1,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: SIZES.radius * 2,
    borderBottomRightRadius: SIZES.radius * 2,
    ...SHADOWS.small,
  },
  avatarContainer: {
    marginBottom: SIZES.base,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  avatarText: {
    ...FONTS.h1,
    color: COLORS.white,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  email: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
    marginLeft: SIZES.base,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding * 0.8,
    paddingHorizontal: SIZES.padding,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '40',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  menuText: {
    ...FONTS.body2,
    color: COLORS.black,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
});

export default ProfileScreen;
