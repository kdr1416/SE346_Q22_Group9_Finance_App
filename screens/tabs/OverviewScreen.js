import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HeroBalanceCard from '../../components/finance/HeroBalanceCard';
import TransactionItem from '../../components/finance/TransactionItem';
import BudgetItem from '../../components/finance/BudgetItem';
import BillItem from '../../components/finance/BillItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useOverview from '../../hooks/tabs/useOverview';

function SectionHeader({ title, onSeeAll = null }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={styles.seeAll}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function OverviewScreen({ navigation }) {
  const {
    user, summary,
    recentTransactions, recentBudgets,
    previewBills, togglePaid,
    goToTransactions, goToBudgets, goToBills,
  } = useOverview(navigation);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.greeting}>Chào buổi sáng 👋</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.notif}>
            <Ionicons name="notifications-outline" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <HeroBalanceCard
          totalBalance={summary.totalBalance}
          income={summary.income}
          expenses={summary.expenses}
          style={{ marginBottom: Spacing.xl }}
        />

        {/* Hóa đơn — có nút "Xem tất cả" + toggle đã trả */}
        <View style={styles.section}>
          <SectionHeader title="Hóa đơn tháng này" onSeeAll={goToBills} />
          <View style={styles.card}>
            {previewBills.length > 0 ? (
              previewBills.map(b => (
                <BillItem key={b.id} item={b} onToggle={togglePaid} />
              ))
            ) : (
              <View style={styles.allPaid}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.secondary} />
                <Text style={styles.allPaidText}>Tất cả đã thanh toán! 🎉</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ngân sách */}
        <View style={styles.section}>
          <SectionHeader title="Ngân sách" onSeeAll={goToBudgets} />
          <View style={styles.card}>
            {recentBudgets.map(b => <BudgetItem key={b.id} item={b} />)}
          </View>
        </View>

        {/* Giao dịch gần đây */}
        <View style={styles.section}>
          <SectionHeader title="Giao dịch gần đây" onSeeAll={goToTransactions} />
          <View style={styles.card}>
            {recentTransactions.map(t => <TransactionItem key={t.id} item={t} />)}
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  greeting: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  userName: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  notif: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  seeAll: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  allPaid: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  allPaidText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.secondary,
  },
});
