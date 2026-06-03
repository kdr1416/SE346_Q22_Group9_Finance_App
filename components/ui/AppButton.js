import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function AppButton({ 
  label, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style 
}) {
  const isPrimary = variant === 'primary';
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.bodyMd,
  },
  textPrimary: {
    color: Colors.white,
  },
  textSecondary: {
    color: Colors.onSurface,
  },
});
