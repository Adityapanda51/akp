import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  outline?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  containerStyle,
  textStyle,
  outline = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.lightGray;
    if (outline) return COLORS.white;
    
    switch (variant) {
      case 'secondary':
        return COLORS.secondary;
      case 'outline':
        return COLORS.white;
      default:
        return COLORS.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return COLORS.lightGray;
    
    switch (variant) {
      case 'secondary':
        return COLORS.secondary;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.gray;
    if (outline) return COLORS.primary;
    
    switch (variant) {
      case 'outline':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return SIZES.base;
      case 'large':
        return SIZES.padding * 1.5;
      default:
        return SIZES.padding;
    }
  };

  const buttonStyles = [
    styles.container,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      padding: getPadding(),
      borderWidth: outline ? 2 : 0,
    },
    containerStyle,
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: size === 'small' ? SIZES.body3 : SIZES.body2,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={outline ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.small,
  },
  text: {
    ...FONTS.body2,
    textAlign: 'center',
  },
});

export default Button; 