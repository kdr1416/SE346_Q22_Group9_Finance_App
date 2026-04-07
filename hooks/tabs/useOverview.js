import { useMemo } from 'react';
import {
  mockSummary,
  mockTransactions,
  mockBudgets,
  mockUser,
} from '../../data/mockData';
import useBills from './useBills';

/**
 * useOverview — cung cấp dữ liệu cho màn hình Tổng quan
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useOverview(navigation) {
  const { bills, togglePaid } = useBills();

  const recentTransactions = useMemo(() => mockTransactions.slice(0, 4), []);
  const recentBudgets = useMemo(() => mockBudgets.slice(0, 3), []);
  // Chỉ hiện 3 hóa đơn chưa trả ở Overview
  const previewBills = useMemo(() => bills.filter(b => !b.isPaid).slice(0, 3), [bills]);

  const goToTransactions = () => navigation.navigate('Transactions');
  const goToBudgets = () => navigation.navigate('Budgets');
  const goToBills = () => navigation.navigate('Bills');

  return {
    user: mockUser,
    summary: mockSummary,
    recentTransactions,
    recentBudgets,
    previewBills,
    togglePaid,
    goToTransactions,
    goToBudgets,
    goToBills,
  };
}
