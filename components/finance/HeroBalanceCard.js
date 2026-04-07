import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function HeroBalanceCard({ totalBalance, income, expenses, style }) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>Số dư hiện tại</Text>
      <Text style={styles.balance}>{fmt(totalBalance)}</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.statItem}>
          <View style={styles.dot} />
          <View>
            <Text style={styles.statLabel}>Thu nhập</Text>
            <Text style={styles.statValue}>{fmt(income)}</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.dot, { backgroundColor: Colors.error }]} />
          <View>
            <Text style={styles.statLabel}>Chi tiêu</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>{fmt(expenses)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onPrimary,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayLg,
    color: Colors.onPrimary,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.onPrimary,
    opacity: 0.15,
    marginBottom: Spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  statLabel: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.onPrimary,
    opacity: 0.7,
  },
  statValue: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.titleSm,
    color: Colors.onPrimary,
  },
});
