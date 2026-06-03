import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchFundDetail,
  fetchGroupMembers,
  fetchPendingJoinRequests,
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
  approveJoinRequest,
  rejectJoinRequest,
  updateGroupFundInfo,
  leaveGroup,
  closeGroupFund,
  stopPaymentRequest,
  getGroupFundStats,
  getGroupFundChartData,
} from '../../services/groupFundService';

export default function useGroupFundDetail(fundParam) {
  const { user } = useAuth();

  // Số dư realtime (thay vì dùng fund cũ từ route param)
  const [fundDetail, setFundDetail] = useState(fundParam);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  const myRole = fundParam?.myRole;
  const isOwner = myRole === 'owner';
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  const loadAll = useCallback(async () => {
    if (!fundParam?.id) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchFundDetail(fundParam.id),
        fetchGroupMembers(fundParam.id),
        fetchPendingJoinRequests(fundParam.id),
        fetchPaymentRequests(fundParam.id),
        fetchGroupExpenses(fundParam.id),
        fetchActivityLogs(fundParam.id),
        getGroupFundStats(fundParam.id),
        getGroupFundChartData(fundParam.id),
      ]);

      if (results[0].status === 'fulfilled') setFundDetail(results[0].value);
      else console.warn('Lỗi tải quỹ:', results[0].reason?.message);

      if (results[1].status === 'fulfilled') setMembers(results[1].value);
      else console.warn('Lỗi tải thành viên:', results[1].reason?.message);

      if (results[2].status === 'fulfilled') setPendingRequests(results[2].value);
      else console.warn('Lỗi tải yêu cầu tham gia:', results[2].reason?.message);

      if (results[3].status === 'fulfilled') setPaymentRequests(results[3].value);
      else console.warn('Lỗi tải thu quỹ:', results[3].reason?.message);

      if (results[4].status === 'fulfilled') setExpenses(results[4].value);
      else console.warn('Lỗi tải chi quỹ:', results[4].reason?.message);

      if (results[5].status === 'fulfilled') setActivityLogs(results[5].value);
      else console.warn('Lỗi tải lịch sử:', results[5].reason?.message);

      if (results[6].status === 'fulfilled') setStats(results[6].value);
      else console.warn('Lỗi tải thống kê:', results[6].reason?.message);

      if (results[7].status === 'fulfilled') setChartData(results[7].value);
      else console.warn('Lỗi tải biểu đồ:', results[7].reason?.message);

    } catch (error) {
      console.error('Lỗi không xác định:', error?.message);
    } finally {
      setLoading(false);
    }
  }, [fundParam?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ===== DUYỆT THÀNH VIÊN =====
  const handleApproveJoin = async (memberId, memberName) => {
    try {
      await approveJoinRequest(memberId, fundParam.id, user.id, memberName);
      Alert.alert('Đã duyệt ✅', `${memberName} đã trở thành thành viên.`);
      await loadAll();
    } catch (e) { Alert.alert('Lỗi', e.message); }
  };

  const handleRejectJoin = async (memberId, memberName) => {
    Alert.alert('Từ chối', `Từ chối ${memberName} vào nhóm?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Từ chối', style: 'destructive', onPress: async () => {
        try {
          await rejectJoinRequest(memberId, fundParam.id, user.id, memberName);
          Alert.alert('Đã từ chối', `${memberName} đã bị từ chối.`);
          await loadAll();
        } catch (e) { Alert.alert('Lỗi', e.message); }
      }},
    ]);
  };

  // ===== THU QUỸ =====
  const handleCreatePaymentRequest = async (title, description, amountPerMember, dueDate) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    if (fundDetail?.status !== 'active') {
      Alert.alert('Quỹ đã đóng 🔒', 'Không thể tạo yêu cầu nộp trên quỹ đã đóng.');
      return;
    }
    const parsedAmount = Number(amountPerMember);
 if (isNaN(parsedAmount) || parsedAmount <= 0) {
  Alert.alert('Lỗi', 'Số tiền mỗi người phải lớn hơn 0.');
  return;
 }
 await createPaymentRequest(fundParam.id, user.id, title, description, parsedAmount, dueDate, members);
    await loadAll();
  };

  const handleSubmitPayment = async (paymentRequestMemberId, note) => {
    await submitPayment(paymentRequestMemberId, note);
    await loadAll();
  };

  const handleConfirmPayment = async (paymentRequestMemberId, paymentRequestId, amountDue) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await confirmPayment(paymentRequestMemberId, paymentRequestId, fundParam.id, user.id, amountDue);
    await loadAll();
  };

  // ===== CHI QUỸ =====
  const handleCreateExpense = async (title, amount, category, expenseDate, note) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    if (fundDetail?.status !== 'active') {
      Alert.alert('Quỹ đã đóng 🔒', 'Không thể đề xuất chi trên quỹ đã đóng.');
      return;
    }
 const parsedAmount = Number(amount);
 if (isNaN(parsedAmount) || parsedAmount <= 0) {
  Alert.alert('Lỗi', 'Số tiền chi phải lớn hơn 0.');
  return;
 }
    if (parsedAmount > (fundDetail?.currentBalance || 0)) {
      Alert.alert(
        'Số dư không đủ 💸',
        `Số dư hiện tại: ${(fundDetail?.currentBalance || 0).toLocaleString('vi-VN')}đ\nSố tiền chi: ${parsedAmount.toLocaleString('vi-VN')}đ`
      );
      return;
    }
    await createGroupExpense(fundParam.id, user.id, title, parsedAmount, category, expenseDate, note, myRole);
    await loadAll();
  };

  const handleApproveExpense = async (expenseId, amount) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    if (amount > (fundDetail?.currentBalance || 0)) {
      Alert.alert(
        'Số dư không đủ 💸',
        `Số dư hiện tại: ${(fundDetail?.currentBalance || 0).toLocaleString('vi-VN')}đ\nSố tiền chi: ${amount.toLocaleString('vi-VN')}đ`
      );
      return;
    }
    await approveExpense(expenseId, fundParam.id, user.id, amount);
    await loadAll();
  };

  const handleRejectExpense = async (expenseId) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await rejectExpense(expenseId, fundParam.id, user.id);
    await loadAll();
  };

  // ===== CÀI ĐẶT & QUẢN LÝ QUỸ =====
  const handleUpdateFund = async (name, description, targetAmount) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await updateGroupFundInfo(fundParam.id, { name, description, targetAmount }, user.id);
    await loadAll();
  };

  const handleLeaveGroup = async () => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await leaveGroup(fundParam.id, user.id);
  };

  const handleCloseGroup = async () => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await closeGroupFund(fundParam.id, user.id);
    await loadAll();
  };

  const handleStopPaymentRequest = async (paymentRequestId, requestTitle) => {
    if (!user?.id) throw new Error('Người dùng chưa đăng nhập.');
    await stopPaymentRequest(paymentRequestId, fundParam.id, user.id, requestTitle);
    await loadAll();
  };

  // ===== LOAD CHI TIẾT PAYMENT REQUEST =====
  const loadRequestMembers = async (paymentRequestId) => {
    return await fetchPaymentRequestMembers(paymentRequestId);
  };

  return {
    fundDetail,
    members,
    pendingRequests,
    paymentRequests,
    expenses,
    activityLogs,
    stats,
    chartData,
    loading,
    activeSection,
    setActiveSection,
    myRole,
    isOwner,
    isAdminOrOwner,
    refreshAll: loadAll,
    handleApproveJoin,
    handleRejectJoin,
    handleCreatePaymentRequest,
    handleSubmitPayment,
    handleConfirmPayment,
    handleCreateExpense,
    handleApproveExpense,
    handleRejectExpense,
    handleUpdateFund,
    handleLeaveGroup,
    handleCloseGroup,
    handleStopPaymentRequest,
    loadRequestMembers,
  };
}
