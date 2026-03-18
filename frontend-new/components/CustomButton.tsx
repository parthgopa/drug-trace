import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
      medium: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
      large: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.error,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: theme.typography.fontSize.sm },
      medium: { fontSize: theme.typography.fontSize.md },
      large: { fontSize: theme.typography.fontSize.lg },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: theme.colors.text.inverse },
      secondary: { color: theme.colors.text.inverse },
      outline: { color: theme.colors.primary },
      danger: { color: theme.colors.text.inverse },
    };

    return {
      fontWeight: theme.typography.fontWeight.semibold,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary : theme.colors.text.inverse}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});
