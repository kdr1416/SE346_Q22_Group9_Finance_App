// ============================================================
// MOCK DATA — Finance App (Đơn vị: VND)
// ============================================================

export const mockUser = {
  id: 'u1',
  name: 'Nguyễn Văn Nam',
  email: 'nam@example.com',
  avatarUrl: null,
};

export const mockSummary = {
  totalBalance: 48_360_000,
  income: 38_140_000,
  expenses: 9_780_000,
  month: 'Tháng 10, 2024',
};

export const mockTransactions = [
  { id: 't1', title: 'Phúc Long', category: 'Dining Out', amount: 55_000, type: 'expense', date: '2024-10-06T08:00:00Z', iconName: 'cafe-outline' },
  { id: 't2', title: 'Lương tháng 10', category: 'Income', amount: 38_140_000, type: 'income', date: '2024-10-05T09:00:00Z', iconName: 'cash-outline' },
  { id: 't3', title: 'Netflix', category: 'Entertainment', amount: 130_000, type: 'expense', date: '2024-10-01T00:00:00Z', iconName: 'tv-outline' },
  { id: 't4', title: 'Siêu thị Vinmart', category: 'Groceries', amount: 430_000, type: 'expense', date: '2024-09-29T14:00:00Z', iconName: 'cart-outline' },
  { id: 't5', title: 'Nhà thuốc Long Châu', category: 'Personal Care', amount: 200_000, type: 'expense', date: '2024-09-28T11:00:00Z', iconName: 'medkit-outline' },
  { id: 't6', title: 'Grab', category: 'Transport', amount: 85_000, type: 'expense', date: '2024-09-27T18:30:00Z', iconName: 'car-outline' },
  { id: 't7', title: 'Shopee', category: 'Shopping', amount: 650_000, type: 'expense', date: '2024-09-25T10:00:00Z', iconName: 'bag-outline' },
  { id: 't8', title: 'Highlands Coffee', category: 'Dining Out', amount: 75_000, type: 'expense', date: '2024-09-24T15:00:00Z', iconName: 'cafe-outline' },
];

export const mockBudgets = [
  { id: 'b1', category: 'Dining Out', limit: 2_000_000, spent: 875_000, color: '#865400', iconName: 'restaurant-outline' },
  { id: 'b2', category: 'Groceries', limit: 3_000_000, spent: 2_100_000, color: '#006d4a', iconName: 'cart-outline' },
  { id: 'b3', category: 'Entertainment', limit: 1_000_000, spent: 979_000, color: '#9e422c', iconName: 'tv-outline' },
  { id: 'b4', category: 'Transport', limit: 1_500_000, spent: 600_000, color: '#625d5b', iconName: 'car-outline' },
  { id: 'b5', category: 'Shopping', limit: 2_500_000, spent: 650_000, color: '#277C78', iconName: 'bag-outline' },
];

export const mockPots = [
  { id: 'p1', name: 'Nghỉ hè', targetAmount: 30_000_000, savedAmount: 12_000_000, color: '#277C78', iconName: 'airplane-outline' },
  { id: 'p2', name: 'Laptop mới', targetAmount: 20_000_000, savedAmount: 8_000_000, color: '#865400', iconName: 'laptop-outline' },
  { id: 'p3', name: 'Quỹ khẩn cấp', targetAmount: 50_000_000, savedAmount: 35_000_000, color: '#006d4a', iconName: 'shield-checkmark-outline' },
];

export const mockBills = [
  { id: 'bill1', title: 'Netflix', dueDate: 'Ngày 1', dueDayOfMonth: 1, amount: 130_000, isPaid: false, iconName: 'tv-outline', category: 'Giải trí' },
  { id: 'bill2', title: 'Internet FPT', dueDate: 'Ngày 3', dueDayOfMonth: 3, amount: 280_000, isPaid: false, iconName: 'wifi-outline', category: 'Tiện ích' },
  { id: 'bill3', title: 'Điện EVN', dueDate: 'Ngày 15', dueDayOfMonth: 15, amount: 850_000, isPaid: false, iconName: 'flash-outline', category: 'Tiện ích' },
  { id: 'bill4', title: 'Nước', dueDate: 'Ngày 18', dueDayOfMonth: 18, amount: 300_000, isPaid: false, iconName: 'water-outline', category: 'Tiện ích' },
  { id: 'bill5', title: 'Spotify', dueDate: 'Ngày 20', dueDayOfMonth: 20, amount: 99_000, isPaid: true, iconName: 'musical-notes-outline', category: 'Giải trí' },
  { id: 'bill6', title: 'Bảo hiểm sức khỏe', dueDate: 'Ngày 25', dueDayOfMonth: 25, amount: 1_200_000, isPaid: false, iconName: 'shield-checkmark-outline', category: 'Bảo hiểm' },
];
