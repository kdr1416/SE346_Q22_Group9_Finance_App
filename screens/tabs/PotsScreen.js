import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PotItem from '../../components/finance/PotItem';
import PotFormModal from '../../components/finance/PotFormModal';
import PotActionModal from '../../components/finance/PotActionModal';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import usePots from '../../hooks/tabs/usePots';
import useTransactions from '../../hooks/tabs/useTransactions';
import { formatVND } from '../../utils/currency';

export default function PotsScreen() {
  const { pots, totalSaved, totalTarget, loading, savePot, depositToPot, withdrawFromPot, completePot, deletePot } = usePots();
  const { addTransactionLocally, transactions } = useTransactions();

  // Tính số dư thực tế từ toàn bộ lịch sử giao dịch
  const availableBalance = useMemo(() => {
    return transactions.reduce((balance, t) => {
      return t.type === 'income' ? balance + t.amount : balance - t.amount;
    }, 0);
  }, [transactions]);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);

  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  const handleDeposit = (pot) => {
    setSelectedPot(pot);
    setActionModalVisible(true);
  };

  const handleEdit = (pot) => {
    setSelectedPot(pot);
    setFormModalVisible(true);
  };

  const handleComplete = (pot) => {
    const msg = pot.savedAmount > 0
      ? `Bạn muốn kết thúc lọ "${pot.name}"?\n\nSố tiền ${formatVND(pot.savedAmount)} sẽ được giải ngân và cộng vào số dư tài khoản.`
      : `Bạn muốn kết thúc lọ "${pot.name}"?\n\nLọ không còn tiền, chỉ đánh dấu hoàn thành.`;

    Alert.alert('Kết thúc lọ tiết kiệm 🏁', msg, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: pot.savedAmount > 0 ? 'Giải ngân & Kết thúc' : 'Kết thúc',
        onPress: () => completePot(pot, addTransactionLocally),
      },
    ]);
  };

  const handleDelete = (pot) => {
    Alert.alert(
      'Xóa lọ tiết kiệm',
      `Xóa lọ "${pot.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deletePot(pot.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Lọ tiết kiệm</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setSelectedPot(null); setFormModalVisible(true); }}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.sumLabel}>Tổng đã tiết kiệm</Text>
              <Text style={styles.sumAmount}>{formatVND(totalSaved)}</Text>
              <Text style={styles.sumOf}>trên {formatVND(totalTarget)} mục tiêu</Text>
            </View>
            <View style={styles.percentCircle}>
              <Text style={styles.percentText}>{Math.round(overallProgress * 100)}%</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(overallProgress * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Danh sách lọ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các lọ tiết kiệm</Text>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.card}>
              {pots.length > 0 ? (
                pots.map(p => (
                  <PotItem
                    key={p.id}
                    item={p}
                    onDeposit={() => handleDeposit(p)}
                    onEdit={() => handleEdit(p)}
                    onComplete={() => handleComplete(p)}
                    onDelete={() => handleDelete(p)}
                  />
                ))
              ) : (
                <Text style={styles.empty}>Chưa có lọ tiết kiệm nào. Nhấn + để tạo lọ đầu tiên!</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl + 60 }} />
      </ScrollView>

      {/* Modal Tạo / Sửa Lọ */}
      <PotFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={savePot}
        onDelete={(id) => { deletePot(id); setFormModalVisible(false); }}
        initialData={selectedPot?.isCompleted ? null : selectedPot}
      />

      {/* Modal Nạp / Rút Tiền */}
      <PotActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        pot={selectedPot}
        availableBalance={availableBalance}
        onDeposit={(pot, amt) => depositToPot(pot, amt, addTransactionLocally)}
        onWithdraw={(pot, amt) => withdrawFromPot(pot, amt, addTransactionLocally)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  sumLabel: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.labelMd, color: Colors.onSecondary, opacity: 0.8, marginBottom: Spacing.xs },
  sumAmount: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayMd, color: Colors.onSecondary, letterSpacing: Typography.tightTracking, marginBottom: 4 },
  sumOf: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSecondary, opacity: 0.8 },
  percentCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  percentText: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSecondary },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.onSecondary, borderRadius: 4 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
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
  empty: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
