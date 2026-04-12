import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { getCategoryIcon, getCategoryColor, EXPENSE_CATEGORIES } from '../../constants/Categories';
import { Alert } from 'react-native';

export default function useBudgets(defaultMonth = new Date().getMonth() + 1, defaultYear = new Date().getFullYear()) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  
  const [budgets, setBudgets] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const currentPeriod = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedMonth, selectedYear]);

  const today = new Date();
  const currentMonthDate = today.getMonth() + 1;
  const currentYearDate = today.getFullYear();
  const isPastMonth = selectedYear < currentYearDate || (selectedYear === currentYearDate && selectedMonth < currentMonthDate);

  const createdDate = new Date(user?.created_at || '2024-01-01');
  const minMonth = createdDate.getMonth() + 1;
  const minYear = createdDate.getFullYear();

  const canGoPrev = selectedYear > minYear || (selectedYear === minYear && selectedMonth > minMonth);
  const canGoNext = selectedYear < currentYearDate || (selectedYear === currentYearDate && selectedMonth < currentMonthDate);

  const prevMonth = useCallback(() => {
    if (!canGoPrev) return;
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  }, [selectedMonth, canGoPrev]);

  const nextMonth = useCallback(() => {
    if (!canGoNext) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  }, [selectedMonth, canGoNext]);

  useEffect(() => {
    if (!user || !isFocused) return;
    
    const fetchBudgetsAndBreakdown = async () => {
      setLoading(true);

      // 1. Fetch Budgets
      let { data: bData, error: bError } = await supabase
        .from('budgets')
        .select('*')
        .eq('period', currentPeriod);
      
      if (bError) {
        Alert.alert('Lỗi Database Fetch', bError.message);
      }
      
      // AUTO ROLLOVER LOGIC
      if (!bError && bData && bData.length === 0) {
        const { data: lastBudgets } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .order('period', { ascending: false })
          .limit(20);

        if (lastBudgets && lastBudgets.length > 0) {
          const latestPeriod = lastBudgets[0].period;
          const budgetsToCopy = lastBudgets.filter(b => b.period === latestPeriod);
          
          if (budgetsToCopy.length > 0) {
             const newBudgetsPayload = budgetsToCopy.map(b => ({
               user_id: user.id,
               category: b.category,
               limit: b.limit,
               color: b.color,
               icon_name: b.icon_name,
               period: currentPeriod
             }));
             
             const { data: insertedData, error: copyError } = await supabase
               .from('budgets')
               .insert(newBudgetsPayload)
               .select('*');
               
             if (insertedData) bData = insertedData;
             if (copyError) console.error("Lỗi Rollover:", copyError);
          }
        }
      }

      // 2. Fetch Transactions
      const startDate = `${currentPeriod}-01`;
      const [yearStr, monthStr] = currentPeriod.split('-');
      let nextY = parseInt(yearStr);
      let nextM = parseInt(monthStr) + 1;
      if (nextM > 12) { nextM = 1; nextY++; }
      const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

      const { data: tData, error: tError } = await supabase
        .from('transactions')
        .select('category, amount, type')
        .gte('date', startDate)
        .lt('date', endDate);

      let groupedExpense = {};
      let calcInc = 0;
      let calcExp = 0;

      if (!tError && tData) {
        tData.forEach(t => {
           const amt = Number(t.amount);
           if (t.type === 'expense') {
              groupedExpense[t.category] = (groupedExpense[t.category] || 0) + amt;
              calcExp += amt;
           } else if (t.type === 'income') {
              calcInc += amt;
           }
        });
        const breakdownMapped = Object.entries(groupedExpense)
           .map(([cat, amt]) => ({
              category: cat,
              spent: amt,
              iconName: getCategoryIcon(cat, 'expense'),
              color: getCategoryColor(cat, 'expense')
           }))
           .sort((a, b) => b.spent - a.spent); 
        setBreakdown(breakdownMapped);
      } else {
        setBreakdown([]);
      }
      
      setTotalIncome(calcInc);
      setTotalExpense(calcExp);

      // 3. Mapping
      if (!bError && bData) {
        const mapped = bData.map(b => ({
          id: b.id,
          category: b.category,
          limit: b.limit, 
          spent: groupedExpense[b.category] || 0,
          iconName: b.icon_name || getCategoryIcon(b.category, 'expense'),
          color: b.color || getCategoryColor(b.category, 'expense'),
          period: b.period || currentPeriod, // Đề phòng dữ liệu cũ null
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
    
    const dbPayload = {
      user_id: user.id,
      category: budgetData.category,
      limit: budgetData.limit,
      color: getCategoryColor(budgetData.category, 'expense'),
      icon_name: getCategoryIcon(budgetData.category, 'expense'),
      period: currentPeriod, 
    };

    if (budgetData.id) {
      setBudgets(prev => prev.map(b => b.id === budgetData.id ? { ...b, limit: budgetData.limit } : b));
      const { error } = await supabase.from('budgets').update({ limit: budgetData.limit }).match({ id: budgetData.id });
      if (error) Alert.alert('Lỗi Database Update', error.message);
    } else {
      const tempId = Math.random().toString();
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
      if (error) {
         Alert.alert('Lỗi Database Insert', error.message);
         // Rollback optimistic update
         setBudgets(prev => prev.filter(b => b.id !== tempId));
      } else if (data) {
        setBudgets(prev => prev.map(b => b.id === tempId ? { ...b, id: data.id } : b));
      }
    }
  }, [user, currentPeriod, breakdown]);

  const deleteBudget = useCallback(async (id) => {
    if (!id || id.startsWith('0.')) return; 
    setBudgets(prev => prev.filter(b => b.id !== id));
    await supabase.from('budgets').delete().match({ id });
  }, []);

  const totalLimit = useMemo(() => budgets.reduce((sum, b) => sum + b.limit, 0), [budgets]);

  const availableCategories = useMemo(() => {
    const used = budgets.map(b => b.category);
    return EXPENSE_CATEGORIES.filter(c => !used.includes(c.value));
  }, [budgets]);

  return {
    budgets,
    breakdown,
    totalIncome,
    totalExpense,
    totalLimit,
    selectedMonth,
    selectedYear,
    isPastMonth,
    canGoPrev,
    canGoNext,
    prevMonth,
    nextMonth,
    saveBudget,
    deleteBudget,
    availableCategories,
    loading
  };
}
