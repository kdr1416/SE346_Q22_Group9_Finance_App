import { useMemo } from 'react';
import { mockBudgets } from '../../data/mockData';

/**
 * useBudgets — tính toán tổng chi tiêu / ngân sách
 */
export default function useBudgets() {
  const totalSpent = useMemo(
    () => mockBudgets.reduce((sum, b) => sum + b.spent, 0),
    []
  );
  const totalLimit = useMemo(
    () => mockBudgets.reduce((sum, b) => sum + b.limit, 0),
    []
  );

  return {
    budgets: mockBudgets,
    totalSpent,
    totalLimit,
  };
}
