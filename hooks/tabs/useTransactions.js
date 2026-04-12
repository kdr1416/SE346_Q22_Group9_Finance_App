import { useState, useMemo, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { EXPENSE_CATEGORIES } from '../../constants/Categories';
import { isLocked, removeTransaction } from '../../services/transactionService';

export const CATEGORIES = [
  'Tất cả',
  'Thu nhập',
  ...EXPENSE_CATEGORIES.map(c => c.value)
];

export default function useTransactions() {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  useEffect(() => {
    if (!user || !isFocused) return;

    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbToLocal);
        setTransactions(mapped);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [user, isFocused]);

  // Helper map DB row → local camelCase
  const mapDbToLocal = (t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    amount: Number(t.amount),
    type: t.type,
    iconName: t.icon_name,
    date: t.date,
    linkedBillId: t.linked_bill_id || null,
    linkedPotId: t.linked_pot_id || null,
  });

  /**
   * Thêm 1 giao dịch vào local state ngay lập tức (không fetch DB).
   * Dùng cho các module khác (Pots, Bills) sau khi đã insert DB thành công.
   * @param {object} trx - object camelCase
   */
  const addTransactionLocally = useCallback((trx) => {
    setTransactions(prev => [trx, ...prev]);
  }, []);

  /**
   * Xóa 1 giao dịch khỏi local state ngay lập tức (không fetch DB).
   * Dùng khi các module khác rollback (VD: usePots rút tiền → xóa giao dịch nạp cũ).
   * @param {string} id
   */
  const removeTransactionLocally = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const saveTransaction = useCallback(async (trxData) => {
    if (!user) return;

    const dbPayload = {
      title: trxData.title,
      category: trxData.category,
      amount: trxData.amount,
      type: trxData.type,
      icon_name: trxData.iconName,
      date: trxData.date,
      user_id: user.id,
      linked_bill_id: trxData.linkedBillId || null,
      linked_pot_id: trxData.linkedPotId || null,
    };

    if (trxData.id) {
      // UPDATE — không cho sửa giao dịch bị khóa
      const existing = transactions.find(t => t.id === trxData.id);
      if (existing && isLocked(existing)) {
        Alert.alert('Không thể sửa', 'Giao dịch này được tạo tự động bởi hệ thống.');
        return;
      }
      setTransactions(prev => prev.map(t => t.id === trxData.id ? { ...t, ...trxData } : t));
      await supabase.from('transactions').update(dbPayload).match({ id: trxData.id });
    } else {
      // INSERT mới
      const tempId = Math.random().toString();
      const newTrx = { ...trxData, id: tempId };
      setTransactions(prev => [newTrx, ...prev]);

      const { data } = await supabase
        .from('transactions')
        .insert(dbPayload)
        .select()
        .single();

      if (data) {
        setTransactions(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
      }
    }
  }, [user, transactions]);

  const deleteTransaction = useCallback(async (id) => {
    const trx = transactions.find(t => t.id === id);

    // Kiểm tra khóa trước khi xóa
    if (trx && isLocked(trx)) {
      Alert.alert(
        'Không thể xóa',
        'Giao dịch này được tạo tự động bởi hệ thống.\n\n• Giao dịch Hóa đơn: Bỏ tích "Đã trả" để hoàn tác.\n• Giao dịch Lọ tiết kiệm: Rút tiền từ lọ để hoàn tác.'
      );
      return;
    }

    // Optimistic UI
    setTransactions(prev => prev.filter(t => t.id !== id));
    const { error } = await removeTransaction(id);
    if (error) {
      // Rollback nếu lỗi
      Alert.alert('Lỗi xóa giao dịch', error.message);
    }
  }, [transactions]);

  const filtered = useMemo(() => {
    if (activeCategory === 'Tất cả') return transactions;
    if (activeCategory === 'Thu nhập') return transactions.filter(t => t.type === 'income');
    return transactions.filter(t => t.category === activeCategory);
  }, [transactions, activeCategory]);

  return {
    loading,
    activeCategory,
    setActiveCategory,
    filtered,
    transactions, // export raw list cho useOverview
    categories: CATEGORIES,
    saveTransaction,
    deleteTransaction,
    addTransactionLocally,
    removeTransactionLocally,
  };
}
