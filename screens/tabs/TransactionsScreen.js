import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TransactionItem from '../../components/finance/TransactionItem';
import TransactionFormModal from '../../components/finance/TransactionFormModal';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useTransactions from '../../hooks/tabs/useTransactions';

export default function TransactionsScreen() {
  const { 
    categories, activeCategory, setActiveCategory, 
    filtered, saveTransaction, deleteTransaction 
  } = useTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTrx, setEditingTrx] = useState(null);

  const openAddModal = () => {
    setEditingTrx(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    if (item.linkedBillId || item.linkedPotId) {
      const msg = item.linkedBillId
        ? 'Giao dịch tự động từ Hóa Đơn. Sang tab Hóa Đơn để hủy việc trả tiền.'
        : 'Giao dịch tự động từ Lọ Tiết Kiệm. Dùng chức năng Rút tiền trong lọ để hoàn tác.';
      Alert.alert('Giao dịch bị khóa 🔒', msg, [{ text: 'Đã rõ' }]);
      return;
    }
    setEditingTrx(item);
    setModalVisible(true);
  };

  const handleSave = (data) => {
    saveTransaction(data);
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Giao dịch</Text>
      </View>

      {/* Filter chips */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeCategory === item && styles.chipActive]}
            onPress={() => setActiveCategory(item)}
          >
            <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0, marginBottom: Spacing.sm }}
      />

      {/* Danh sách giao dịch */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionItem item={item} onEdit={openEditModal} />}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={styles.empty}>Không có giao dịch nào</Text>}
        showsVerticalScrollIndicator={false}
      />

      {/* Nút Thêm (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* Modal biểu mẫu giao dịch */}
      <TransactionFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={handleSave} 
        onDelete={handleDelete}
        initialData={editingTrx}
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
  filterList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  chipTextActive: { color: Colors.onPrimary },
  sep: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginLeft: Spacing.iconContainer + Spacing.md,
  },
  empty: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingTop: Spacing.xxxl,
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
