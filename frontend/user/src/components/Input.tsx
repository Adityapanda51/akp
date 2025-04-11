import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  password?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  onPressLeftIcon?: () => void;
}

const Input = ({
  label,
  error,
  password,
  containerStyle,
  leftIcon,
  onPressLeftIcon,
  ...props
}: InputProps) => {
  const [hidePassword, setHidePassword] = useState(password);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
        ]}
      >
        {leftIcon && (
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={onPressLeftIcon}
            disabled={!onPressLeftIcon}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        
        <TextInput
          style={styles.input}
          secureTextEntry={hidePassword}
          placeholderTextColor={COLORS.gray}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {password && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setHidePassword(!hidePassword)}
          >
            <MaterialIcons
              name={hidePassword ? 'visibility-off' : 'visibility'}
              size={24}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding,
    width: '100%',
  },
  label: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    height: 50,
  },
  focusedInput: {
    borderColor: COLORS.primary,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: SIZES.padding / 2,
    color: COLORS.black,
    ...FONTS.body4,
    height: '100%',
  },
  leftIcon: {
    paddingLeft: SIZES.padding / 2,
  },
  eyeIcon: {
    padding: SIZES.padding / 2,
  },
  errorText: {
    ...FONTS.body5,
    color: COLORS.error,
    marginTop: 4,
  },
});

export default Input; 