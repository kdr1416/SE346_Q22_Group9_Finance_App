import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

const fmtAmount = (amount, type) => `${type === 'income' ? '+' : '-'}$${amount.toFixed(2)}`;

const fmtDate = (dateString) => {
  const date = new Date(dateString);
  const diffH = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (diffH < 24) return `${diffH} giờ trước`;
  if (diffH < 48) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
};

export default function TransactionItem({ item }) {
  const isIncome = item.type === 'income';
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={item.iconName ?? 'cash-outline'} size={20} color={Colors.onSurfaceVariant} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.category} · {fmtDate(item.date)}</Text>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {fmtAmount(item.amount, item.type)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  icon: { width: Spacing.iconContainer, height: Spacing.iconContainer, borderRadius: Spacing.iconContainer / 2, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  info: { flex: 1 },
  title: { fontSize: Typography.titleSm, fontWeight: Typography.medium, color: Colors.onSurface, marginBottom: 2 },
  meta: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant },
  amount: { fontSize: Typography.titleSm, fontWeight: Typography.medium },
  income: { color: Colors.secondary },
  expense: { color: Colors.onSurface },
});
