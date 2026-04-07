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
import { mockSummary, mockTransactions, mockBudgets, mockBills, mockUser } from '../../data/mockData';

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
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.greeting}>Chào buổi sáng 👋</Text>
            <Text style={styles.userName}>{mockUser.name}</Text>
          </View>
          <TouchableOpacity style={styles.notif}>
            <Ionicons name="notifications-outline" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        <HeroBalanceCard
          totalBalance={mockSummary.totalBalance}
          income={mockSummary.income}
          expenses={mockSummary.expenses}
          style={{ marginBottom: Spacing.xl }}
        />

        <View style={styles.section}>
          <SectionHeader title="Hóa đơn tháng này" />
          <View style={styles.card}>
            {mockBills.map(b => <BillItem key={b.id} item={b} />)}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Ngân sách" onSeeAll={() => navigation.navigate('Budgets')} />
          <View style={styles.card}>
            {mockBudgets.slice(0, 3).map(b => <BudgetItem key={b.id} item={b} />)}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Giao dịch gần đây" onSeeAll={() => navigation.navigate('Transactions')} />
          <View style={styles.card}>
            {mockTransactions.slice(0, 4).map(t => <TransactionItem key={t.id} item={t} />)}
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
});
