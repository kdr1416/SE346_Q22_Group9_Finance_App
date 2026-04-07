import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function AppInput({ label, error, containerStyle, ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={Colors.onSurfaceVariant}
        {...props}
      />
      <View style={[styles.bottomLine, isFocused && styles.focused, !!error && styles.errorLine]} />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
    paddingVertical: Spacing.base,
    paddingHorizontal: 0,
    backgroundColor: Colors.transparent,
  },
  bottomLine: { height: 1, backgroundColor: Colors.outlineVariant, opacity: 0.3 },
  focused: { backgroundColor: Colors.primary, opacity: 1 },
  errorLine: { backgroundColor: Colors.error, opacity: 1 },
  errorText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
