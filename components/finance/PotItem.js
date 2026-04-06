import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import ProgressBar from '../ui/ProgressBar';

export default function PotItem({ item }) {
  const progress = item.savedAmount / item.targetAmount;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.iconName ?? 'wallet-outline'} size={20} color={item.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.target}>Mục tiêu: ${item.targetAmount.toLocaleString()}</Text>
        </View>
        <Text style={styles.saved}>${item.savedAmount.toLocaleString()}</Text>
      </View>
      <ProgressBar progress={progress} color={item.color} style={{ marginBottom: Spacing.xs }} />
      <Text style={styles.percent}>{Math.round(progress * 100)}% hoàn thành</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  icon: { width: Spacing.iconContainer, height: Spacing.iconContainer, borderRadius: Spacing.iconContainer / 2, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: Typography.titleSm, fontWeight: Typography.medium, color: Colors.onSurface },
  target: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant },
  saved: { fontSize: Typography.titleMd, fontWeight: Typography.semiBold, color: Colors.onSurface },
  percent: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant, textAlign: 'right' },
});
