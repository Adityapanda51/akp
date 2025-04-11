import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  outline?: boolean;
}

const Button = ({
  title,
  onPress,
  containerStyle,
  textStyle,
  disabled = false,
  loading = false,
  secondary = false,
  outline = false,
}: ButtonProps) => {
  // Determine style based on button type
  const buttonStyle = [
    styles.container,
    secondary && styles.secondaryContainer,
    outline && styles.outlineContainer,
    disabled && styles.disabledContainer,
    containerStyle,
  ];

  const buttonTextStyle = [
    styles.text,
    secondary && styles.secondaryText,
    outline && styles.outlineText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={outline ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    color: COLORS.white,
    ...FONTS.h4,
    fontWeight: '600',
  },
  secondaryContainer: {
    backgroundColor: COLORS.secondary,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabledContainer: {
    backgroundColor: COLORS.lightGray,
  },
  disabledText: {
    color: COLORS.gray,
  },
});

export default Button; 