import { useMemo } from 'react';
import {
  mockBudgets,
  mockUser,
} from '../../data/mockData';
import useBills from './useBills';
import useTransactions from './useTransactions';

/**
 * useOverview — cung cấp dữ liệu cho màn hình Tổng quan
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useOverview(navigation) {
  const { bills, togglePaid } = useBills();
  const { filtered: transactions } = useTransactions();

  // Lấy 4 giao dịch mới nhất
  const recentTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);
  
  const summary = useMemo(() => {
    const today = new Date();
    const currMonth = today.getMonth();
    const currYear = today.getFullYear();
    
    let totalBalance = 0;
    let income = 0;
    let expenses = 0;

    // Tổng số dư toàn thời gian
    transactions.forEach(t => {
      if (t.type === 'income') totalBalance += t.amount;
      else totalBalance -= t.amount;
    });
    
    // Lọc giao dịch tháng này
    const thisMonthTrx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currMonth && d.getFullYear() === currYear;
    });

    thisMonthTrx.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });
    
    return { totalBalance, income, expenses };
  }, [transactions]);

  const recentBudgets = useMemo(() => mockBudgets.slice(0, 3), []);
  // Chỉ hiện 3 hóa đơn chưa trả ở Overview
  const previewBills = useMemo(() => bills.filter(b => !b.isPaid).slice(0, 3), [bills]);

  const goToTransactions = () => navigation.navigate('Transactions');
  const goToBudgets = () => navigation.navigate('Budgets');
  const goToBills = () => navigation.navigate('Bills');

  return {
    user: mockUser,
    summary,
    recentTransactions,
    recentBudgets,
    previewBills,
    togglePaid,
    goToTransactions,
    goToBudgets,
    goToBills,
  };
}
