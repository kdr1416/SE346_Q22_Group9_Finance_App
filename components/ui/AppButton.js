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
  fullWidth = true,
  style,
}) {
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.onPrimary : Colors.primary} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Spacing.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fullWidth: { width: '100%' },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.primaryContainer },
  ghost: { backgroundColor: Colors.transparent },
  label: { fontSize: Typography.titleSm, fontWeight: Typography.semiBold, letterSpacing: 0.1 },
  primaryLabel: { color: Colors.onPrimary },
  secondaryLabel: { color: Colors.primary },
  ghostLabel: { color: Colors.primary },
  disabled: { opacity: 0.45 },
});
