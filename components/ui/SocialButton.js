import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function SocialButton({ provider, onPress }) {
  const isGoogle = provider === 'Google';
  
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
      <Ionicons 
        name={isGoogle ? 'logo-google' : 'logo-apple'} 
        size={20} 
        color={isGoogle ? '#DB4437' : '#000'} 
      />
      <Text style={styles.text}>Tiếp tục với {provider}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Spacing.radiusLg,
    paddingVertical: 14,
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  text: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
});
