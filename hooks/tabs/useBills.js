import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function useBills(defaultMonth = new Date().getMonth() + 1, defaultYear = new Date().getFullYear()) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
        .select('*');
        
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
      return { ...bill, isPaid, currentPeriod: checkPeriod };
    });
  }, [visibleBills, payments, currentPeriod, currentYearPeriod]);

  const togglePaid = useCallback(async (id, currentIsPaid, period) => {
    if (!user) return;
    
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    // Optimistic Update: Sửa UI ngay lập tức
    if (currentIsPaid) {
      setPayments(prev => prev.filter(p => !(p.billId === id && p.period === period)));
      
      // 1. Hủy xác nhận thanh toán Hóa Đơn
      await supabase
        .from('bill_payments')
        .delete()
        .match({ bill_id: id, period: period });
        
      // 2. Hủy bỏ Giao dịch đã sinh ra
      await supabase
        .from('transactions')
        .delete()
        .match({ linked_bill_id: id, linked_period: period });
    } else {
      const tempId = Math.random().toString();
      setPayments(prev => [...prev, { id: tempId, billId: id, period }]);
      
      const { data } = await supabase
        .from('bill_payments')
        .insert({ bill_id: id, period: period, user_id: user.id })
        .select()
        .single();
        
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
  }, [user, bills]);

  const deleteBill = useCallback(async (id) => {
    // Optimistic Update: Soft Delete - Chặn xóa cứng để bảo vệ Balance Lịch Sử
    setBills(prev => prev.filter(bill => bill.id !== id));
    
    await supabase.from('bills').update({ is_archived: true }).match({ id });
  }, []);

  const saveBill = useCallback(async (billData) => {
    if (!user) return;
    
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

    if (billData.id) {
      // Cập nhật hóa đơn
      setBills(prev => prev.map(b => b.id === billData.id ? { ...b, ...billData } : b));
      await supabase.from('bills').update(dbPayload).match({ id: billData.id });
    } else {
      // Tạo hóa đơn mới
      const tempId = Math.random().toString();
      const newBill = { ...billData, id: tempId };
      setBills(prev => [newBill, ...prev]);
      
      const { data } = await supabase
        .from('bills')
        .insert(dbPayload)
        .select()
        .single();
        
      if (data) {
        setBills(prev => prev.map(b => b.id === tempId ? { ...b, id: data.id } : b));
      }
    }
  }, [user]);

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
