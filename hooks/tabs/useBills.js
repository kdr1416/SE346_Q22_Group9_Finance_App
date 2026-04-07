import { useState, useCallback, useMemo } from 'react';
import { mockBills } from '../../data/mockData';

/**
 * useBills — quản lý danh sách hóa đơn và trạng thái đã thanh toán
 * Dữ liệu ban đầu lấy từ mockData.js
 * TODO: Khi có backend → thay mockBills bằng API call (useEffect + fetch)
 */
export default function useBills() {
  // Khởi tạo từ mockData, dùng state để toggle isPaid
  const [bills, setBills] = useState(mockBills);

  /** Đánh dấu / bỏ đánh dấu đã thanh toán */
  const togglePaid = useCallback((id) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
      )
    );
  }, []);

  // Tính toán derived state bằng useMemo để tránh re-compute mỗi render
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
  const totalAll = useMemo(
    () => bills.reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  return {
    bills,
    unpaid,
    paid,
    totalDue,
    totalPaid,
    totalAll,
    togglePaid,
  };
}
