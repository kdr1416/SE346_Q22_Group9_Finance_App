import { useMemo } from 'react';
import { mockPots } from '../../data/mockData';

/**
 * usePots — tính tổng tiết kiệm đã có và mục tiêu
 */
export default function usePots() {
  const totalSaved = useMemo(
    () => mockPots.reduce((sum, p) => sum + p.savedAmount, 0),
    []
  );
  const totalTarget = useMemo(
    () => mockPots.reduce((sum, p) => sum + p.targetAmount, 0),
    []
  );

  const handleAddPot = () => {
    // TODO: Mở modal thêm lọ tiết kiệm mới
    console.log('Thêm lọ tiết kiệm');
  };

  return {
    pots: mockPots,
    totalSaved,
    totalTarget,
    handleAddPot,
  };
}
