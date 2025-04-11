import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = () => {
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    emailUpdates: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Error', 'Account deletion is not implemented yet.');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <MaterialIcons name={icon as any} size={24} color={COLORS.black} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        {renderSettingItem(
          'notifications',
          'Push Notifications',
          settings.notifications,
          () => handleToggle('notifications')
        )}
        {renderSettingItem(
          'dark-mode',
          'Dark Mode',
          settings.darkMode,
          () => handleToggle('darkMode')
        )}
        {renderSettingItem(
          'mail',
          'Email Updates',
          settings.emailUpdates,
          () => handleToggle('emailUpdates')
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => {/* TODO: Navigate to change password */}}
        >
          <MaterialIcons name="lock" size={24} color={COLORS.black} />
          <Text style={styles.accountButtonText}>Change Password</Text>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={[styles.dangerButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color={COLORS.white} />
          <Text style={styles.dangerButtonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerButton, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <MaterialIcons name="delete-forever" size={24} color={COLORS.white} />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
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
  section: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.black,
    marginLeft: SIZES.base,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.base,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.black,
    flex: 1,
    marginLeft: SIZES.base,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
  },
  logoutButton: {
    backgroundColor: COLORS.warning,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
});

export default SettingsScreen; 