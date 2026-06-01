import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchGroupMembers,
  fetchPaymentRequests,
  fetchGroupExpenses,
  fetchActivityLogs,
  createPaymentRequest,
  submitPayment,
  confirmPayment,
  createGroupExpense,
  approveExpense,
  rejectExpense,
  fetchPaymentRequestMembers,
} from '../../services/groupFundService';

export default function useGroupFundDetail(fund) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('requests');

  const myRole = fund?.myRole;
  const isOwner = myRole === 'owner';
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  const loadAll = useCallback(async () => {
    if (!fund?.id) return;
    setLoading(true);
    try {
      const [membersData, requestsData, expensesData, logsData] = await Promise.all([
        fetchGroupMembers(fund.id),
        fetchPaymentRequests(fund.id),
        fetchGroupExpenses(fund.id),
        fetchActivityLogs(fund.id),
      ]);
      setMembers(membersData);
      setPaymentRequests(requestsData);
      setExpenses(expensesData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Lỗi tải dữ liệu quỹ:', error?.message || error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu quỹ.');
    } finally {
      setLoading(false);
    }
  }, [fund?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreatePaymentRequest = async (title, description, amountPerMember, dueDate) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await createPaymentRequest(fund.id, user.id, title, description, amountPerMember, dueDate, members);
    await loadAll();
  };

  const handleSubmitPayment = async (paymentRequestMemberId, note) => {
    await submitPayment(paymentRequestMemberId, note);
    await loadAll();
  };

  const handleConfirmPayment = async (paymentRequestMemberId, paymentRequestId, amountDue) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await confirmPayment(paymentRequestMemberId, paymentRequestId, fund.id, user.id, amountDue);
    await loadAll();
  };

  const handleCreateExpense = async (title, amount, category, expenseDate, note) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await createGroupExpense(fund.id, user.id, title, amount, category, expenseDate, note, myRole);
    await loadAll();
  };

  const handleApproveExpense = async (expenseId, amount) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await approveExpense(expenseId, fund.id, user.id, amount);
    await loadAll();
  };

  const handleRejectExpense = async (expenseId) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await rejectExpense(expenseId, fund.id, user.id);
    await loadAll();
  };

  const loadRequestMembers = async (paymentRequestId) => {
    return await fetchPaymentRequestMembers(paymentRequestId);
  };

  return {
    members,
    paymentRequests,
    expenses,
    activityLogs,
    loading,
    activeSection,
    setActiveSection,
    myRole,
    isOwner,
    isAdminOrOwner,
    refreshAll: loadAll,
    handleCreatePaymentRequest,
    handleSubmitPayment,
    handleConfirmPayment,
    handleCreateExpense,
    handleApproveExpense,
    handleRejectExpense,
    loadRequestMembers,
  };
}
