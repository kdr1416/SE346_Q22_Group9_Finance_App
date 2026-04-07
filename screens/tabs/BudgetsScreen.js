import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetItem from '../../components/finance/BudgetItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { mockBudgets } from '../../data/mockData';

export default function BudgetsScreen() {
  const totalSpent = mockBudgets.reduce((s, b) => s + b.spent, 0);
  const totalLimit = mockBudgets.reduce((s, b) => s + b.limit, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ngân sách</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Đã chi tháng này</Text>
          <Text style={styles.sumAmount}>${totalSpent.toFixed(2)}</Text>
          <Text style={styles.sumOf}>trên ${totalLimit.toFixed(0)} ngân sách</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
          <View style={styles.card}>
            {mockBudgets.map(b => <BudgetItem key={b.id} item={b} />)}
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
  title: { fontSize: Typography.headlineMd, fontWeight: Typography.bold, color: Colors.onSurface, letterSpacing: Typography.tightTracking },
  summaryCard: { backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: Spacing.radiusXl, padding: Spacing.xl, marginBottom: Spacing.xl },
  sumLabel: { fontSize: Typography.labelMd, color: Colors.onPrimary, opacity: 0.7, marginBottom: Spacing.xs },
  sumAmount: { fontSize: Typography.displayMd, fontWeight: Typography.bold, color: Colors.onPrimary, letterSpacing: Typography.tightTracking, marginBottom: 4 },
  sumOf: { fontSize: Typography.bodyMd, color: Colors.onPrimary, opacity: 0.7 },
  section: { paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: Typography.headlineSm, fontWeight: Typography.semiBold, color: Colors.onSurface, letterSpacing: Typography.tightTracking, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, padding: Spacing.base, shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
});
