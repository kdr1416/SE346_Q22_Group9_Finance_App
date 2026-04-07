import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import ProgressBar from '../ui/ProgressBar';
import { formatVND } from '../../utils/currency';

export default function BudgetItem({ item, style }) {
  const progress = item.spent / item.limit;
  const remaining = item.limit - item.spent;
  const over = progress > 1;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={[styles.spent, over && { color: Colors.error }]}>
          {formatVND(item.spent)} <Text style={styles.limit}>/ {formatVND(item.limit)}</Text>
        </Text>
      </View>
      <ProgressBar progress={progress} color={over ? Colors.error : item.color} style={{ marginBottom: Spacing.xs }} />
      <Text style={styles.remaining}>
        {over ? `Vượt ${formatVND(Math.abs(remaining))}` : `Còn lại ${formatVND(remaining)}`}
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
