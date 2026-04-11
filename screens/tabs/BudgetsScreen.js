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
  const { budgets, breakdown, totalSpent, totalLimit, availableCategories, saveBudget, deleteBudget, loading } = useBudgets();

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
        </View>

        {/* Tóm tắt */}
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Tổng chi tiêu</Text>
          <Text style={styles.sumAmount}>{formatVND(totalSpent)}</Text>
          <Text style={styles.sumOf}>trên {formatVND(totalLimit)} ngân sách</Text>
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
                  <TouchableOpacity key={b.id} onPress={() => openEditModal(b)}>
                    <BudgetItem item={b} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>Tháng này chưa lập ngân sách phòng thủ nào.</Text>
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

      {/* FAB Thêm Ngân Sách */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      <BudgetFormModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingBudget}
        availableCategories={availableCategories}
      />
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
