import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetItem from '../../components/finance/BudgetItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useBudgets from '../../hooks/tabs/useBudgets';
import { formatVND } from '../../utils/currency';

export default function BudgetsScreen() {
  const { budgets, totalSpent, totalLimit } = useBudgets();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ngân sách</Text>
        </View>

        {/* Tóm tắt */}
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Tổng chi tiêu</Text>
          <Text style={styles.sumAmount}>{formatVND(totalSpent)}</Text>
          <Text style={styles.sumOf}>trên {formatVND(totalLimit)} ngân sách</Text>
        </View>

        {/* Chi tiết */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
          <View style={styles.card}>
            {budgets.map(b => <BudgetItem key={b.id} item={b} />)}
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sumLabel: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onPrimary,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  sumAmount: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayMd,
    color: Colors.onPrimary,
    letterSpacing: Typography.tightTracking,
    marginBottom: 4,
  },
  sumOf: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onPrimary,
    opacity: 0.7,
  },
  section: { paddingHorizontal: Spacing.lg },
  sectionTitle: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
});
