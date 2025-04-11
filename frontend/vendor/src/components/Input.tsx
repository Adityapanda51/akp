import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  style?: StyleProp<TextStyle>;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const inputStyle: StyleProp<TextStyle> = [
    styles.input,
    error ? styles.inputError : undefined,
    style,
  ].filter(Boolean);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={inputStyle}
        placeholderTextColor={COLORS.gray}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.base,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.lightGray + '20',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    ...FONTS.body3,
    color: COLORS.black,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  error: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
  },
});

export default Input; 