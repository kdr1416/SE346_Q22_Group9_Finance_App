import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function AppInput({ 
  label, 
  error, 
  iconName, 
  secureTextEntry, 
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError
        ]}
      >
        {iconName && (
          <Ionicons 
            name={iconName} 
            size={20} 
            color={error ? Colors.error : (isFocused ? Colors.primary : Colors.tertiary)} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, { paddingLeft: iconName ? 0 : Spacing.md }]}
          placeholderTextColor={Colors.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPasswordHidden}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          >
            <Ionicons 
              name={isPasswordHidden ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={Colors.tertiary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: Spacing.radiusLg,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  inputError: {
    borderColor: Colors.error,
  },
  icon: {
    paddingHorizontal: Spacing.md,
  },
  eyeIcon: {
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  errorText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
});
