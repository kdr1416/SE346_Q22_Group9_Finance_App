import { useState, useMemo } from 'react';
import { mockTransactions } from '../../data/mockData';

export const CATEGORIES = [
  'Tất cả',
  'Income',
  'Dining Out',
  'Groceries',
  'Entertainment',
  'Transport',
  'Shopping',
];

/**
 * useTransactions — quản lý state lọc và danh sách giao dịch
 */
export default function useTransactions() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const filtered = useMemo(() => {
    if (activeCategory === 'Tất cả') return mockTransactions;
    if (activeCategory === 'Income') {
      return mockTransactions.filter((t) => t.type === 'income');
    }
    return mockTransactions.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  return {
    activeCategory,
    setActiveCategory,
    filtered,
    categories: CATEGORIES,
  };
}
