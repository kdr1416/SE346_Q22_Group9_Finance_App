import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { getCategoryIcon, getCategoryColor, EXPENSE_CATEGORIES } from '../../constants/Categories';

export default function useBudgets(selectedPeriod) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  
  const [budgets, setBudgets] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mặc định lấy tháng hiện tại (VD: '2024-10')
  const currentPeriod = useMemo(() => {
    if (selectedPeriod) return selectedPeriod;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedPeriod]);

  useEffect(() => {
    if (!user || !isFocused) return;
    
    const fetchBudgetsAndBreakdown = async () => {
      setLoading(true);

      // 1. Lấy Ngân Sách từ Bảng Gốc (Bỏ View để tránh lỗi logic SQL)
      const { data: bData, error: bError } = await supabase
        .from('budgets')
        .select('*');

      // 2. Lấy TOÀN BỘ Transactions mảng Chi ra để Gộp Phân tích (Breakdown)
      const startDate = `${currentPeriod}-01`;
      const [yearStr, monthStr] = currentPeriod.split('-');
      let nextY = parseInt(yearStr);
      let nextM = parseInt(monthStr) + 1;
      if (nextM > 12) { nextM = 1; nextY++; }
      const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

      const { data: tData, error: tError } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lt('date', endDate);

      let grouped = {};
      if (!tError && tData) {
        tData.forEach(t => {
           grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
        });
        const breakdownMapped = Object.entries(grouped)
           .map(([cat, amt]) => ({
              category: cat,
              spent: amt,
              iconName: getCategoryIcon(cat, 'expense'),
              color: getCategoryColor(cat, 'expense')
           }))
           .sort((a, b) => b.spent - a.spent); // Giảm dần
        setBreakdown(breakdownMapped);
      } else {
        setBreakdown([]);
      }

      // 3. Mapping Cục bộ 2 cái lại với nhau (Local Join) -> Đảm bảo chính xác 100%
      if (!bError && bData) {
        const mapped = bData.map(b => ({
          id: b.id,
          category: b.category,
          limit: b.limit, // Dùng đúng cột limit trên Database!
          spent: grouped[b.category] || 0, // Nhúng Số tiền đã tiêu từ Grouped
          iconName: b.icon_name || getCategoryIcon(b.category, 'expense'),
          color: b.color || getCategoryColor(b.category, 'expense'),
          period: currentPeriod,
        }));
        setBudgets(mapped);
      } else {
        setBudgets([]);
      }

      setLoading(false);
    };

    fetchBudgetsAndBreakdown();
  }, [user, isFocused, currentPeriod]);

  const saveBudget = useCallback(async (budgetData) => {
    if (!user) return;
    
    // Payload theo sát đúng 100% hình ảnh Table Scheme
    const dbPayload = {
      user_id: user.id,
      category: budgetData.category,
      limit: budgetData.limit,
      color: getCategoryColor(budgetData.category, 'expense'),
      icon_name: getCategoryIcon(budgetData.category, 'expense'),
    };

    if (budgetData.id) {
      setBudgets(prev => prev.map(b => b.id === budgetData.id ? { ...b, limit: budgetData.limit } : b));
      await supabase.from('budgets').update({ limit: budgetData.limit }).match({ id: budgetData.id });
    } else {
      const tempId = Math.random().toString();
      // Nhúng spent = 0 theo logic, UI tự lo phần render lại nếu có.
      // Tuy nhiên nếu category này đã có chi tiêu, ta có thể mượn lại từ grouped 
      const currentSpent = breakdown.find(c => c.category === budgetData.category)?.spent || 0;

      const newB = {
        id: tempId,
        category: budgetData.category,
        limit: budgetData.limit,
        spent: currentSpent,
        iconName: dbPayload.icon_name,
        color: dbPayload.color,
        period: currentPeriod,
      };
      setBudgets(prev => [...prev, newB]);
      
      const { data, error } = await supabase.from('budgets').insert(dbPayload).select().single();
      if (data) {
        setBudgets(prev => prev.map(b => b.id === tempId ? { ...b, id: data.id } : b));
      }
    }
  }, [user, currentPeriod, breakdown]);

  const deleteBudget = useCallback(async (id) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    await supabase.from('budgets').delete().match({ id });
  }, []);

  const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + b.spent, 0), [budgets]);
  const totalLimit = useMemo(() => budgets.reduce((sum, b) => sum + b.limit, 0), [budgets]);

  const availableCategories = useMemo(() => {
    const used = budgets.map(b => b.category);
    return EXPENSE_CATEGORIES.filter(c => !used.includes(c.value));
  }, [budgets]);

  return {
    budgets,
    breakdown,
    totalSpent,
    totalLimit,
    currentPeriod,
    saveBudget,
    deleteBudget,
    availableCategories,
    loading
  };
}
