import { useState, useCallback, useMemo } from 'react';

const INITIAL_BILLS = [
  { id: 'bill1', title: 'Netflix', dueDate: 'Ngày 1', amount: 12.99, isPaid: false, iconName: 'tv-outline' },
  { id: 'bill2', title: 'Internet', dueDate: 'Ngày 3', amount: 55.00, isPaid: false, iconName: 'wifi-outline' },
  { id: 'bill3', title: 'Điện', dueDate: 'Ngày 15', amount: 85.00, isPaid: false, iconName: 'flash-outline' },
  { id: 'bill4', title: 'Nước', dueDate: 'Ngày 18', amount: 30.00, isPaid: false, iconName: 'water-outline' },
  { id: 'bill5', title: 'Spotify', dueDate: 'Ngày 20', amount: 9.99, isPaid: true, iconName: 'musical-notes-outline' },
  { id: 'bill6', title: 'Bảo hiểm', dueDate: 'Ngày 25', amount: 120.00, isPaid: false, iconName: 'shield-checkmark-outline' },
];

/**
 * useBills — quản lý danh sách hóa đơn và trạng thái đã thanh toán
 */
export default function useBills() {
  const [bills, setBills] = useState(INITIAL_BILLS);

  /** Đánh dấu / bỏ đánh dấu đã trả */
  const togglePaid = useCallback((id) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
      )
    );
  }, []);

  const unpaid = useMemo(() => bills.filter((b) => !b.isPaid), [bills]);
  const paid = useMemo(() => bills.filter((b) => b.isPaid), [bills]);

  const totalDue = useMemo(
    () => unpaid.reduce((sum, b) => sum + b.amount, 0),
    [unpaid]
  );
  const totalPaid = useMemo(
    () => paid.reduce((sum, b) => sum + b.amount, 0),
    [paid]
  );

  return {
    bills,
    unpaid,
    paid,
    totalDue,
    totalPaid,
    togglePaid,
  };
}
