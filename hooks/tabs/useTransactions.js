import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

import { getCategoryIcon, getCategoryColor, EXPENSE_CATEGORIES } from '../../constants/Categories';

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

  // Lấy dữ liệu mỗi khi màn hình bật lên
  useEffect(() => {
    if (!user || !isFocused) return;

    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        // Map db snake_case sang camelCase (nếu cần)
        const mapped = data.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          amount: t.amount,
          type: t.type,
          iconName: t.icon_name,
          date: t.date,
          linkedBillId: t.linked_bill_id, // Lưu cờ để khóa UI
        }));
        setTransactions(mapped);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [user, isFocused]);

  const saveTransaction = useCallback(async (trxData) => {
    if (!user) return;

    const dbPayload = {
      title: trxData.title,
      category: trxData.category,
      amount: trxData.amount,
      type: trxData.type,
      icon_name: trxData.iconName,
      date: trxData.date,
      user_id: user.id
    };

    if (trxData.id) {
      // Sửa Giao dịch - Optimistic UI
      setTransactions(prev => prev.map(t => t.id === trxData.id ? { ...t, ...trxData } : t));
      await supabase.from('transactions').update(dbPayload).match({ id: trxData.id });
    } else {
      // Thêm mới Giao dịch - Optimistic UI
      const tempId = Math.random().toString();
      const newTrx = { ...trxData, id: tempId };
      // Thêm lên đầu danh sách để thấy luôn
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
  }, [user]);

  const deleteTransaction = useCallback(async (id) => {
    // Optimistic UI xoá
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().match({ id });
  }, []);

  // Lọc dữ liệu qua View Cục bộ để tránh gọi DB nhiều lần
  const filtered = useMemo(() => {
    if (activeCategory === 'Tất cả') return transactions;
    if (activeCategory === 'Thu nhập') {
      return transactions.filter((t) => t.type === 'income');
    }
    return transactions.filter((t) => t.category === activeCategory);
  }, [transactions, activeCategory]);

  return {
    loading,
    activeCategory,
    setActiveCategory,
    filtered,
    categories: CATEGORIES,
    saveTransaction,
    deleteTransaction
  };
}
