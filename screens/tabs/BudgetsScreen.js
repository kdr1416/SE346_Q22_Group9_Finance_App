import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BudgetItem from '../../components/finance/BudgetItem';
import BudgetFormModal from '../../components/finance/BudgetFormModal';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useBudgets from '../../hooks/tabs/useBudgets';
import { formatVND } from '../../utils/currency';

export default function BudgetsScreen() {
  const { 
    budgets, 
    breakdown, 
    totalIncome, 
    totalExpense, 
    totalLimit, 
    selectedMonth, 
    selectedYear, 
    isPastMonth, 
    canGoPrev, 
    canGoNext, 
    prevMonth, 
    nextMonth, 
    saveBudget, 
    deleteBudget, 
    availableCategories, 
    loading 
  } = useBudgets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const openAddModal = () => {
    setEditingBudget(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingBudget(item);
    setModalVisible(true);
  };

  const handleSave = (data) => {
    saveBudget(data);
  };

  const handleDelete = (id) => {
    deleteBudget(id);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ngân sách</Text>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={prevMonth} disabled={!canGoPrev} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={24} color={canGoPrev ? Colors.primary : Colors.outline} />
            </TouchableOpacity>
            <Text style={styles.monthText}>Tháng {selectedMonth}/{selectedYear}</Text>
            <TouchableOpacity onPress={nextMonth} disabled={!canGoNext} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={24} color={canGoNext ? Colors.primary : Colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tóm tắt */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9', marginRight: Spacing.sm }]}>
            <Text style={[styles.sumLabel, { color: '#2E7D32' }]}>Tổng tiền vào</Text>
            <Text style={[styles.sumAmount, { color: '#1B5E20' }]}>{formatVND(totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.errorContainer, marginLeft: Spacing.sm }]}>
            <Text style={[styles.sumLabel, { color: Colors.onErrorContainer }]}>Tổng tiền ra</Text>
            <Text style={[styles.sumAmount, { color: Colors.error }]}>{formatVND(totalExpense)}</Text>
          </View>
        </View>

        {/* Chi tiết */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngân sách phòng thủ</Text>
          {loading ? (
             <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.card}>
              {budgets.length > 0 ? (
                budgets.map(b => (
                  <TouchableOpacity key={b.id} onPress={() => openEditModal(b)} disabled={isPastMonth}>
                    <BudgetItem item={b} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>Chưa lập ngân sách phòng thủ nào cho tháng này.</Text>
              )}
            </View>
          )}
        </View>

        {/* Breakdown Chi tiêu thực tế */}
        <View style={[styles.section, { marginTop: Spacing.xl }]}>
           <Text style={styles.sectionTitle}>Chẩn đoán chi tiêu thực tế</Text>
           {loading ? (
             <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
           ) : (
             <View style={styles.card}>
               {breakdown.length > 0 ? (
                 breakdown.map((item, index) => (
                   <View key={item.category} style={[styles.breakdownRow, index === breakdown.length - 1 && { borderBottomWidth: 0 }]}>
                     <View style={styles.breakdownLeft}>
                       <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                         <Ionicons name={item.iconName} size={20} color={item.color} />
                       </View>
                       <Text style={styles.breakdownName}>{item.category}</Text>
                     </View>
                     <Text style={styles.breakdownAmount}>{formatVND(item.spent)}</Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.empty}>Chưa có giao dịch chi tiêu nào trong tháng.</Text>
               )}
             </View>
           )}
        </View>

        <View style={{ height: Spacing.xl + 60 }} />
      </ScrollView>

      {/* FAB Thêm Ngân Sách - Chỉ hiện khi không phải Quá khứ */}
      {!isPastMonth && (
        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Ionicons name="add" size={32} color={Colors.white} />
        </TouchableOpacity>
      )}

      {!isPastMonth && (
        <BudgetFormModal 
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={editingBudget}
          availableCategories={availableCategories}
        />
      )}
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
    paddingVertical: Spacing.base 
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusXl,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  monthBtn: {
    padding: Spacing.xs,
  },
  monthText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    marginHorizontal: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.lg,
  },
  sumLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  sumAmount: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleLg,
    letterSpacing: Typography.tightTracking,
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
  empty: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownName: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  breakdownAmount: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  }
});
