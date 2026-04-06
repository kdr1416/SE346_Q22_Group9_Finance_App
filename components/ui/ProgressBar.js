import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

export default function ProgressBar({ progress, color = Colors.primary, trackColor = Colors.surfaceContainerHigh, height = 6, style }) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[{ backgroundColor: trackColor, height, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <View style={{ width: `${clamped * 100}%`, backgroundColor: color, height, borderRadius: height / 2 }} />
    </View>
  );
}
