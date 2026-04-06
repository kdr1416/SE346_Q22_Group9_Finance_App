import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import ProgressBar from '../ui/ProgressBar';

export default function BudgetItem({ item }) {
  const progress = item.spent / item.limit;
  const remaining = item.limit - item.spent;
  const over = progress > 1;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={[styles.spent, over && { color: Colors.error }]}>
          ${item.spent.toFixed(0)} <Text style={styles.limit}>/ ${item.limit}</Text>
        </Text>
      </View>
      <ProgressBar progress={progress} color={over ? Colors.error : item.color} style={{ marginBottom: Spacing.xs }} />
      <Text style={styles.remaining}>
        {over ? `Vượt $${Math.abs(remaining).toFixed(0)}` : `Còn lại $${remaining.toFixed(0)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  category: { fontSize: Typography.titleSm, fontWeight: Typography.medium, color: Colors.onSurface },
  spent: { fontSize: Typography.bodyMd, fontWeight: Typography.medium, color: Colors.onSurface },
  limit: { fontWeight: Typography.regular, color: Colors.onSurfaceVariant },
  remaining: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant },
});
