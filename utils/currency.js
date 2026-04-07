/**
 * utils/currency.js
 * Tiện ích định dạng tiền tệ VND cho toàn bộ ứng dụng
 */

/**
 * Định dạng số tiền VND cơ bản
 * Ví dụ: 4836000 → "4.836.000đ"
 */
export const formatVND = (amount) => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

/**
 * Định dạng giao dịch có dấu +/-
 * Ví dụ: income 12000000 → "+12.000.000đ"
 */
export const formatTransaction = (amount, type) => {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${formatVND(amount)}`;
};

/**
 * Định dạng số tiền gọn (dùng cho số lớn)
 * Ví dụ: 12000000 → "12tr" | 1500000 → "1,5tr" | 500000 → "500k"
 */
export const formatCompact = (amount) => {
  if (amount >= 1_000_000) {
    const tr = amount / 1_000_000;
    return (tr % 1 === 0 ? tr : tr.toFixed(1)) + 'tr';
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return (k % 1 === 0 ? k : k.toFixed(0)) + 'k';
  }
  return formatVND(amount);
};
