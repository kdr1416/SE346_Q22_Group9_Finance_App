// Dữ liệu mẫu - Finance App

export const mockUser = {
  id: 'u1',
  name: 'Nguyễn Văn Nam',
  email: 'nam@example.com',
};

export const mockSummary = {
  totalBalance: 4836.00,
  income: 3814.00,
  expenses: 978.00,
};

export const mockTransactions = [
  { id: 't1', title: 'Starbucks', category: 'Dining Out', amount: 5.50, type: 'expense', date: '2024-10-06T08:00:00Z', iconName: 'cafe-outline' },
  { id: 't2', title: 'Lương tháng 10', category: 'Income', amount: 3814.00, type: 'income', date: '2024-10-05T09:00:00Z', iconName: 'cash-outline' },
  { id: 't3', title: 'Netflix', category: 'Entertainment', amount: 12.99, type: 'expense', date: '2024-10-01T00:00:00Z', iconName: 'tv-outline' },
  { id: 't4', title: 'Whole Foods', category: 'Groceries', amount: 43.20, type: 'expense', date: '2024-09-29T14:00:00Z', iconName: 'cart-outline' },
  { id: 't5', title: 'Nhà thuốc', category: 'Personal Care', amount: 20.00, type: 'expense', date: '2024-09-28T11:00:00Z', iconName: 'medkit-outline' },
  { id: 't6', title: 'Grab', category: 'Transport', amount: 8.50, type: 'expense', date: '2024-09-27T18:30:00Z', iconName: 'car-outline' },
  { id: 't7', title: 'Shopee', category: 'Shopping', amount: 65.00, type: 'expense', date: '2024-09-25T10:00:00Z', iconName: 'bag-outline' },
];

export const mockBudgets = [
  { id: 'b1', category: 'Dining Out', limit: 200, spent: 87.50, color: '#865400' },
  { id: 'b2', category: 'Groceries', limit: 300, spent: 210.00, color: '#006d4a' },
  { id: 'b3', category: 'Entertainment', limit: 100, spent: 97.99, color: '#9e422c' },
  { id: 'b4', category: 'Transport', limit: 150, spent: 60.00, color: '#625d5b' },
  { id: 'b5', category: 'Shopping', limit: 250, spent: 65.00, color: '#277C78' },
];

export const mockPots = [
  { id: 'p1', name: 'Nghỉ hè', targetAmount: 3000, savedAmount: 1200, color: '#277C78', iconName: 'airplane-outline' },
  { id: 'p2', name: 'Laptop mới', targetAmount: 2000, savedAmount: 800, color: '#865400', iconName: 'laptop-outline' },
  { id: 'p3', name: 'Quỹ khẩn cấp', targetAmount: 5000, savedAmount: 3500, color: '#006d4a', iconName: 'shield-checkmark-outline' },
];

export const mockBills = [
  { id: 'bill1', title: 'Netflix', dueDate: 'Ngày 1', amount: 12.99, isPaid: false, iconName: 'tv-outline' },
  { id: 'bill2', title: 'Internet', dueDate: 'Ngày 3', amount: 55.00, isPaid: false, iconName: 'wifi-outline' },
  { id: 'bill3', title: 'Điện', dueDate: 'Ngày 15', amount: 85.00, isPaid: false, iconName: 'flash-outline' },
];
