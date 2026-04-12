import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { createTransaction } from '../../services/transactionService';

export default function usePots() {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [pots, setPots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isFocused) return;

    const fetchPots = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        Alert.alert('Lỗi tải lọ tiết kiệm', error.message);
      } else {
        setPots((data || []).map(mapDbToLocal));
      }
      setLoading(false);
    };

    fetchPots();
  }, [user, isFocused]);

  const mapDbToLocal = (p) => ({
    id: p.id,
    name: p.name,
    targetAmount: Number(p.target_amount),
    savedAmount: Number(p.saved_amount),
    iconName: p.icon_name || 'wallet-outline',
    color: p.color || '#277C78',
    targetDate: p.target_date || null,
    isCompleted: p.is_completed || false,
  });

  // Tạo mới / Sửa lọ
  const savePot = useCallback(async (potData) => {
    if (!user) return;

    const dbPayload = {
      user_id: user.id,
      name: potData.name,
      target_amount: potData.targetAmount,
      icon_name: potData.iconName,
      color: potData.color,
      target_date: potData.targetDate || null,
    };

    if (potData.id) {
      setPots(prev => prev.map(p => p.id === potData.id ? { ...p, ...potData } : p));
      const { error } = await supabase.from('pots').update(dbPayload).match({ id: potData.id });
      if (error) Alert.alert('Lỗi cập nhật lọ', error.message);
    } else {
      const tempId = Math.random().toString();
      setPots(prev => [...prev, { id: tempId, ...potData, savedAmount: 0 }]);

      const { data, error } = await supabase
        .from('pots')
        .insert({ ...dbPayload, saved_amount: 0 })
        .select()
        .single();

      if (error) {
        Alert.alert('Lỗi tạo lọ', error.message);
        setPots(prev => prev.filter(p => p.id !== tempId));
      } else if (data) {
        setPots(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
      }
    }
  }, [user]);

  /**
   * Nạp tiền vào lọ.
   * Sau khi thành công, gọi onTransactionCreated để sync balance ngay lập tức.
   * @param {object} pot
   * @param {number} amount
   * @param {function} onTransactionCreated - callback từ useTransactions.addTransactionLocally
   */
  const depositToPot = useCallback(async (pot, amount, onTransactionCreated) => {
    if (!user || amount <= 0) return;

    const newSaved = pot.savedAmount + amount;

    // 1. Optimistic UI: cập nhật lọ ngay
    setPots(prev => prev.map(p => p.id === pot.id ? { ...p, savedAmount: newSaved } : p));

    // 2. Cập nhật saved_amount trong DB
    const { error: potError } = await supabase
      .from('pots')
      .update({ saved_amount: newSaved })
      .match({ id: pot.id });

    if (potError) {
      Alert.alert('Lỗi nạp tiền', potError.message);
      setPots(prev => prev.map(p => p.id === pot.id ? { ...p, savedAmount: pot.savedAmount } : p));
      return;
    }

    // 3. Tạo giao dịch qua Service (single source of truth)
    const trxPayload = {
      title: `Nạp vào lọ "${pot.name}"`,
      category: 'Tiết kiệm',
      amount,
      type: 'expense',
      iconName: pot.iconName || 'wallet-outline',
      date: new Date().toISOString(),
      linkedPotId: pot.id,
    };

    const { data: newTrx, error: trxError } = await createTransaction(user.id, trxPayload);

    if (trxError) {
      console.error('Lỗi tạo giao dịch cho lọ:', trxError.message);
    } else if (newTrx && onTransactionCreated) {
      // 4. Sync balance real-time qua callback (không cần reload màn hình)
      onTransactionCreated({
        id: newTrx.id,
        title: trxPayload.title,
        category: trxPayload.category,
        amount: trxPayload.amount,
        type: trxPayload.type,
        iconName: trxPayload.iconName,
        date: trxPayload.date,
        linkedBillId: null,
        linkedPotId: pot.id,
      });
    }
  }, [user]);

  /**
   * Rút tiền từ lọ.
   * Giới hạn: Không được rút quá số tiền hiện có.
   * @param {object} pot
   * @param {number} amount
   * @param {function} onTransactionCreated - callback từ useTransactions.addTransactionLocally
   * @returns {boolean} - true nếu thành công
   */
  const withdrawFromPot = useCallback(async (pot, amount, onTransactionCreated) => {
    if (!user || amount <= 0) return false;

    if (amount > pot.savedAmount) {
      Alert.alert(
        'Không đủ tiền',
        `Lọ "${pot.name}" chỉ còn ${pot.savedAmount.toLocaleString('vi-VN')} VND.`
      );
      return false;
    }

    const newSaved = pot.savedAmount - amount;

    // 1. Optimistic UI
    setPots(prev => prev.map(p => p.id === pot.id ? { ...p, savedAmount: newSaved } : p));

    // 2. Cập nhật DB
    const { error: potError } = await supabase
      .from('pots')
      .update({ saved_amount: newSaved })
      .match({ id: pot.id });

    if (potError) {
      Alert.alert('Lỗi rút tiền', potError.message);
      setPots(prev => prev.map(p => p.id === pot.id ? { ...p, savedAmount: pot.savedAmount } : p));
      return false;
    }

    // 3. Tạo giao dịch Thu nhập qua Service
    const trxPayload = {
      title: `Rút từ lọ "${pot.name}"`,
      category: 'Tiết kiệm',
      amount,
      type: 'income',
      iconName: pot.iconName || 'wallet-outline',
      date: new Date().toISOString(),
      linkedPotId: pot.id,
    };

    const { data: newTrx, error: trxError } = await createTransaction(user.id, trxPayload);

    if (trxError) {
      console.error('Lỗi tạo giao dịch rút tiền:', trxError.message);
    } else if (newTrx && onTransactionCreated) {
      onTransactionCreated({
        id: newTrx.id,
        title: trxPayload.title,
        category: trxPayload.category,
        amount: trxPayload.amount,
        type: trxPayload.type,
        iconName: trxPayload.iconName,
        date: trxPayload.date,
        linkedBillId: null,
        linkedPotId: pot.id,
      });
    }

    return true;
  }, [user]);

  /**
   * Kết thúc lọ: Giải ngân toàn bộ saved_amount vào số dư (tạo giao dịch Thu nhập),
   * sau đó đánh dấu is_completed = true.
   * @param {object} pot
   * @param {function} onTransactionCreated - callback sync balance
   */
  const completePot = useCallback(async (pot, onTransactionCreated) => {
    if (!user) return;

    // Optimistic UI
    setPots(prev => prev.map(p => p.id === pot.id ? { ...p, isCompleted: true } : p));

    // 1. Đánh dấu hoàn thành trong DB
    const { error: potError } = await supabase
      .from('pots')
      .update({ is_completed: true })
      .match({ id: pot.id });

    if (potError) {
      Alert.alert('Lỗi kết thúc lọ', potError.message);
      setPots(prev => prev.map(p => p.id === pot.id ? { ...p, isCompleted: false } : p));
      return;
    }

    // 2. Nếu còn tiền → Giải ngân: tạo giao dịch Thu nhập trả về số dư
    if (pot.savedAmount > 0) {
      const trxPayload = {
        title: `Giải ngân lọ "${pot.name}"`,
        category: 'Tiết kiệm',
        amount: pot.savedAmount,
        type: 'income',
        iconName: pot.iconName || 'wallet-outline',
        date: new Date().toISOString(),
        linkedPotId: pot.id,
      };

      const { data: newTrx, error: trxError } = await createTransaction(user.id, trxPayload);

      if (trxError) {
        console.error('Lỗi tạo giao dịch giải ngân:', trxError.message);
      } else if (newTrx && onTransactionCreated) {
        onTransactionCreated({
          id: newTrx.id,
          title: trxPayload.title,
          category: trxPayload.category,
          amount: trxPayload.amount,
          type: trxPayload.type,
          iconName: trxPayload.iconName,
          date: trxPayload.date,
          linkedBillId: null,
          linkedPotId: pot.id,
        });
      }
    }
  }, [user]);

  // Xóa lọ
  const deletePot = useCallback(async (id) => {
    setPots(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('pots').delete().match({ id });
    if (error) Alert.alert('Lỗi xóa lọ', error.message);
  }, []);

  const totalSaved = useMemo(() => pots.reduce((sum, p) => sum + p.savedAmount, 0), [pots]);
  const totalTarget = useMemo(() => pots.reduce((sum, p) => sum + p.targetAmount, 0), [pots]);

  return {
    pots,
    totalSaved,
    totalTarget,
    loading,
    savePot,
    depositToPot,
    withdrawFromPot,
    completePot,
    deletePot,
  };
}
