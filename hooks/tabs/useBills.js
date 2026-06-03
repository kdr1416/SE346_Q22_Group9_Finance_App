import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function useBills(defaultMonth = new Date().getMonth() + 1, defaultYear = new Date().getFullYear()) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const processing = useRef(false);
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // Fetch dữ liệu từ Supabase mỗi khi màn hình được truy cập (focus)
  useEffect(() => {
    if (!user || !isFocused) return;
    
    const fetchBills = async () => {
      setLoading(true);
      // 1. Lấy danh sách hóa đơn (chỉ lấy hóa đơn chưa bị xóa - is_archived = false)
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false);
      
      if (!billsError && billsData) {
        const mappedBills = billsData.map(b => ({
          id: b.id,
          title: b.title,
          cycle: b.cycle,
          dueDayOfMonth: b.due_day_of_month,
          dueMonthOfYear: b.due_month_of_year,
          amount: b.amount,
          iconName: b.icon_name,
          category: b.category,
        }));
        setBills(mappedBills);
      }

      // 2. Lấy lịch sử thanh toán
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user.id);
        
      if (!paymentsError && paymentsData) {
        const mappedPayments = paymentsData.map(p => ({
          id: p.id,
          billId: p.bill_id,
          period: p.period,
        }));
        setPayments(mappedPayments);
      }
      setLoading(false);
    };

    fetchBills();
  }, [user, isFocused]);

  // Tính ranh giới thời gian
  const today = new Date();
  const currentMonthDate = today.getMonth() + 1;
  const currentYearDate = today.getFullYear();

  const createdDate = new Date(user?.created_at || '2024-01-01');
  const minMonth = createdDate.getMonth() + 1;
  const minYear = createdDate.getFullYear();

  const canGoPrev = selectedYear > minYear || (selectedYear === minYear && selectedMonth > minMonth);
  const canGoNext = selectedYear < currentYearDate || (selectedYear === currentYearDate && selectedMonth < currentMonthDate);

  const prevMonth = useCallback(() => {
    if (!canGoPrev) return;
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  }, [selectedMonth, canGoPrev]);

  const nextMonth = useCallback(() => {
    if (!canGoNext) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  }, [selectedMonth, canGoNext]);

  // Format period for checking payments
  const currentPeriod = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedMonth, selectedYear]);
  
  const currentYearPeriod = String(selectedYear);

  const visibleBills = useMemo(() => {
    return bills.filter(bill => {
      if (bill.cycle === 'monthly') return true;
      if (bill.cycle === 'yearly') {
        return bill.dueMonthOfYear === selectedMonth;
      }
      return false;
    });
  }, [bills, selectedMonth, selectedYear]);

  const mappedBills = useMemo(() => {
    return visibleBills.map(bill => {
      const isYearly = bill.cycle === 'yearly';
      const checkPeriod = isYearly ? currentYearPeriod : currentPeriod;
      
      const isPaid = payments.some(p => p.billId === bill.id && p.period === checkPeriod);

  // Kiem tra qua han
  let billDueDate = null;
  if (isYearly && bill.dueMonthOfYear) {
   const dueDay = bill.dueDayOfMonth || 1;
   billDueDate = new Date(selectedYear, bill.dueMonthOfYear - 1, dueDay);
  } else if (!isYearly && bill.dueDayOfMonth) {
   billDueDate = new Date(selectedYear, selectedMonth - 1, bill.dueDayOfMonth);
  }
  const today = new Date();
  const isOverdue = !isPaid && billDueDate && billDueDate < today;

      return { ...bill, isPaid, currentPeriod: checkPeriod, isOverdue };
    });
  }, [visibleBills, payments, currentPeriod, currentYearPeriod, selectedMonth, selectedYear]);

  const togglePaid = useCallback(async (id, currentIsPaid, period) => {
    if (!user || processing.current) return;
    processing.current = true;
    
    const bill = bills.find(b => b.id === id);
    if (!bill) { processing.current = false; return; }

    // Snapshot for rollback
    const paymentsSnapshot = payments;

    try {
      if (currentIsPaid) {
        // Optimistic: remove payment from UI
        setPayments(prev => prev.filter(p => !(p.billId === id && p.period === period)));
        
        // 1. Hủy xác nhận thanh toán Hóa Đơn
        const { error: delPayErr } = await supabase
          .from('bill_payments')
          .delete()
          .eq('bill_id', id)
          .eq('period', period)
          .eq('user_id', user.id);
          
        if (delPayErr) throw delPayErr;

        // 2. Hủy bỏ Giao dịch đã sinh ra
        await supabase
          .from('transactions')
          .delete()
          .eq('linked_bill_id', id)
          .eq('linked_period', period)
          .eq('user_id', user.id);
      } else {
        const tempId = Math.random().toString();
        setPayments(prev => [...prev, { id: tempId, billId: id, period }]);
        
        const { data, error: insErr } = await supabase
          .from('bill_payments')
          .insert({ bill_id: id, period: period, user_id: user.id })
          .select()
          .single();
        
        if (insErr) throw insErr;

        if (data) {
          setPayments(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
        }
        
        // Khởi tạo Transaction Chi Tiêu Ghi nợ
        await supabase.from('transactions').insert({
          user_id: user.id,
          title: bill.title + ` (Kỳ ${period})`,
          category: bill.category || 'Khác',
          amount: bill.amount,
          type: 'expense',
          icon_name: bill.iconName,
          linked_bill_id: id,
          linked_period: period,
        });
      }
    } catch (err) {
      setPayments(paymentsSnapshot);
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái thanh toán.');
    } finally {
      processing.current = false;
    }
  }, [user, bills, payments]);

  const deleteBill = useCallback(async (id) => {
    if (!id || !user || processing.current) return;
    processing.current = true;
    // Optimistic Update: Soft Delete - Chặn xóa cứng để bảo vệ Balance Lịch Sử
    const snapshot = bills;
    setBills(prev => prev.filter(bill => bill.id !== id));
    
    const { error } = await supabase
      .from('bills')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      setBills(snapshot);
      Alert.alert('Lỗi', error.message || 'Không thể xóa hóa đơn.');
    }
    processing.current = false;
  }, [user, bills]);

  const saveBill = useCallback(async (billData) => {
    if (!user || processing.current) return;
    processing.current = true;
    
    const dbPayload = {
      title: billData.title,
      cycle: billData.cycle,
      due_day_of_month: billData.dueDayOfMonth,
      due_month_of_year: billData.dueMonthOfYear,
      amount: billData.amount,
      icon_name: billData.iconName,
      category: billData.category,
      user_id: user.id
    };

    const snapshot = bills;

    try {
      if (billData.id) {
        // Cập nhật hóa đơn
        setBills(prev => prev.map(b => b.id === billData.id ? { ...b, ...billData } : b));
        const { error } = await supabase
          .from('bills')
          .update(dbPayload)
          .eq('id', billData.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Tạo hóa đơn mới
        const tempId = Math.random().toString();
        const newBill = { ...billData, id: tempId };
        setBills(prev => [newBill, ...prev]);
        
        const { data, error } = await supabase
          .from('bills')
          .insert(dbPayload)
          .select()
          .single();
        
        if (error) throw error;

        if (data) {
          setBills(prev => prev.map(b => b.id === tempId ? { ...b, id: data.id } : b));
        }
      }
    } catch (err) {
      setBills(snapshot);
      Alert.alert('Lỗi', err.message || 'Không thể lưu hóa đơn.');
    } finally {
      processing.current = false;
    }
  }, [user, bills]);

  const unpaid = useMemo(() => mappedBills.filter(b => !b.isPaid), [mappedBills]);
  const paid = useMemo(() => mappedBills.filter(b => b.isPaid), [mappedBills]);

  const totalDue = useMemo(() => unpaid.reduce((sum, b) => sum + b.amount, 0), [unpaid]);
  const totalPaid = useMemo(() => paid.reduce((sum, b) => sum + b.amount, 0), [paid]);
  const totalAll = useMemo(() => mappedBills.reduce((sum, b) => sum + b.amount, 0), [mappedBills]);

  return {
    bills: mappedBills,
    unpaid,
    paid,
    totalDue,
    totalPaid,
    totalAll,
    selectedMonth,
    selectedYear,
    currentPeriod,
    canGoPrev,
    canGoNext,
    prevMonth,
    nextMonth,
    togglePaid,
    deleteBill,
    saveBill,
    loading
  };
}
