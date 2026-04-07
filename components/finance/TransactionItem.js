import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatTransaction } from '../../utils/currency';

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
      <Text style={[styles.amount, { color: isIncome ? Colors.secondary : Colors.onSurface }]}>
        {formatTransaction(item.amount, item.type)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  icon: {
    width: Spacing.iconContainer,
    height: Spacing.iconContainer,
    borderRadius: Spacing.iconContainer / 2,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  title: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  meta: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  amount: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.titleSm,
  },
  income: { color: Colors.secondary },
  expense: { color: Colors.onSurface },
});
