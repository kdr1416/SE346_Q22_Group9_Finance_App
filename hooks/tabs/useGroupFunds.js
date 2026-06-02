import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { Alert } from 'react-native';
import { fetchMyGroupFunds, createGroupFund, joinGroupFundByCode } from '../../services/groupFundService';

export default function useGroupFunds() {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [groupFunds, setGroupFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroupFunds = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMyGroupFunds(user.id);
      setGroupFunds(data);
    } catch (error) {
      console.error('Lỗi tải quỹ nhóm:', error?.message || error);
      Alert.alert('Lỗi', 'Không thể tải danh sách quỹ nhóm.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      loadGroupFunds();
    }
  }, [isFocused, loadGroupFunds]);

  const handleCreateGroup = async (name, description, fundType, targetAmount) => {
    if (!user) return;
    try {
      await createGroupFund(user.id, name, description, fundType, targetAmount);
      Alert.alert('Thành công 🎉', 'Tạo quỹ nhóm mới thành công!');
      await loadGroupFunds();
    } catch (error) {
      Alert.alert('Thất bại', 'Lỗi tạo quỹ: ' + (error?.message || 'Không xác định'));
    }
  };

  const handleJoinGroup = async (inviteCode) => {
    if (!user) return;
    try {
      const fund = await joinGroupFundByCode(user.id, inviteCode);
      Alert.alert('Đã gửi yêu cầu 📩', `Yêu cầu tham gia quỹ "${fund.name}" đã được gửi.\nVui lòng chờ chủ quỹ duyệt.`);
      await loadGroupFunds();
    } catch (error) {
      Alert.alert('Lỗi tham gia', error?.message || 'Không thể tham gia quỹ.');
    }
  };

  return {
    groupFunds,
    loading,
    refreshFunds: loadGroupFunds,
    handleCreateGroup,
    handleJoinGroup,
  };
}
