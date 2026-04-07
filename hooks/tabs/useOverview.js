import { useMemo } from 'react';
import {
  mockSummary,
  mockTransactions,
  mockBudgets,
  mockBills,
  mockUser,
} from '../../data/mockData';

/**
 * useOverview — cung cấp dữ liệu cho màn hình Tổng quan
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useOverview(navigation) {
  // Chỉ lấy 4 giao dịch và 3 ngân sách gần nhất
  const recentTransactions = useMemo(() => mockTransactions.slice(0, 4), []);
  const recentBudgets = useMemo(() => mockBudgets.slice(0, 3), []);

  const goToTransactions = () => navigation.navigate('Transactions');
  const goToBudgets = () => navigation.navigate('Budgets');

  return {
    // Data
    user: mockUser,
    summary: mockSummary,
    recentTransactions,
    recentBudgets,
    bills: mockBills,
    // Navigation handlers
    goToTransactions,
    goToBudgets,
  };
}
