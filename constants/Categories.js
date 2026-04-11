import { Colors } from './Colors';

export const EXPENSE_CATEGORIES = [
  { value: 'Ăn uống', icon: 'restaurant-outline', color: '#FF9800' },     // Cam
  { value: 'Trà Sữa/Cà Phê', icon: 'cafe-outline', color: '#795548' },    // Nâu
  { value: 'Siêu thị', icon: 'cart-outline', color: '#4CAF50' },          // Xanh lá
  { value: 'Giải trí', icon: 'game-controller-outline', color: '#9C27B0' }, // Tím
  { value: 'Di chuyển', icon: 'bus-outline', color: '#FBC02D' },          // Vàng
  { value: 'Mua sắm', icon: 'bag-handle-outline', color: '#E91E63' },     // Hồng
  { value: 'Giáo dục', icon: 'school-outline', color: '#2196F3' },        // Xanh biển
  { value: 'Sức khỏe', icon: 'medkit-outline', color: '#F44336' },        // Đỏ
  { value: 'Hóa đơn', icon: 'receipt-outline', color: '#607D8B' },        // Xám xanh
  { value: 'Khác', icon: 'card-outline', color: '#9E9E9E' },              // Xám
];

export const INCOME_CATEGORIES = [
  { value: 'Lương', icon: 'wallet-outline', color: '#4CAF50' },           // Xanh lá
  { value: 'Thưởng', icon: 'gift-outline', color: '#FFC107' },            // Vàng
  { value: 'Đầu tư', icon: 'trending-up-outline', color: '#2196F3' },     // Xanh biển
  { value: 'Khác', icon: 'cash-outline', color: '#9E9E9E' },              // Xám
];

// Helper để lấy màu của một Category bất kỳ
export const getCategoryColor = (categoryName, type = 'expense') => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const match = list.find(c => c.value === categoryName);
  return match ? match.color : list[list.length - 1].color; // Default color
};

export const getCategoryIcon = (categoryName, type = 'expense') => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const match = list.find(c => c.value === categoryName);
  return match ? match.icon : list[list.length - 1].icon; // Default icon
};
