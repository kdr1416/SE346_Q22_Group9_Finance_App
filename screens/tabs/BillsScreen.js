import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BillItem from '../../components/finance/BillItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useBills from '../../hooks/tabs/useBills';
import { formatVND } from '../../utils/currency';
import BillFormModal from '../../components/finance/BillFormModal';

export default function BillsScreen({ navigation }) {
  const { 
    bills, unpaid, paid, totalDue, totalPaid, 
    selectedMonth, selectedYear,
    canGoPrev, canGoNext, prevMonth, nextMonth, 
    togglePaid, saveBill, deleteBill
  } = useBills();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const openAddModal = () => {
    setEditingBill(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingBill(item);
    setModalVisible(true);
  };

  const handleSave = (data) => {
    saveBill(data);
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    deleteBill(id);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Hóa đơn</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        <TouchableOpacity 
          onPress={prevMonth} 
          style={[styles.periodBtn, !canGoPrev && styles.periodBtnDisabled]}
          disabled={!canGoPrev}
        >
          <Ionicons name="chevron-back" size={20} color={canGoPrev ? Colors.onSurface : Colors.outlineVariant} />
        </TouchableOpacity>
        <Text style={styles.periodText}>Tháng {selectedMonth}, {selectedYear}</Text>
        <TouchableOpacity 
          onPress={nextMonth} 
          style={[styles.periodBtn, !canGoNext && styles.periodBtnDisabled]}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? Colors.onSurface : Colors.outlineVariant} />
        </TouchableOpacity>
      </View>

      {/* Tóm tắt */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Chưa trả ({unpaid.length})</Text>
          <Text style={[styles.sumAmount, { color: Colors.error }]}>
            {formatVND(totalDue)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Đã trả ({paid.length})</Text>
          <Text style={[styles.sumAmount, { color: Colors.secondary }]}>
            {formatVND(totalPaid)}
          </Text>
        </View>
      </View>

      {/* Danh sách */}
      <FlatList
        data={bills}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <BillItem item={item} onToggle={togglePaid} onEdit={openEditModal} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>Chạm vào ô tròn để đánh dấu đã trả. Chạm vào thẻ để sửa.</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có hóa đơn nào vào tháng này</Text>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* Form Modal */}
      <BillFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={handleSave} 
        onDelete={handleDelete}
        initialData={editingBill}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  periodBtn: {
    padding: Spacing.sm,
  },
  periodBtnDisabled: {
    opacity: 0.5,
  },
  periodText: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.bodyLg,
    marginHorizontal: Spacing.xl,
    color: Colors.onSurface,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  sumLabel: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  sumAmount: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    letterSpacing: Typography.tightTracking,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 80,
  },
  listHeader: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginLeft: Spacing.iconContainer + Spacing.md,
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
  }
});
