import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getReports,
  resolveReport,
  restrictUser,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getUserRole,
} from '../../services/communityService';

export const useCommunityAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'topics'
  const [reportsFilter, setReportsFilter] = useState('pending'); // 'pending' | 'reviewed' | 'dismissed'
  const [reports, setReports] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'moderator' | null

  // Kiểm tra role khi mount
  const checkRole = useCallback(async () => {
    if (!user) return;
    try {
      const role = await getUserRole(user.id);
      setUserRole(role);
      if (!role || !['admin', 'moderator'].includes(role)) {
        Alert.alert('Không có quyền', 'Bạn không có quyền truy cập trang quản trị.');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra role:', err.message);
    }
  }, [user]);

  const loadReports = useCallback(async (filter = reportsFilter) => {
    try {
      setLoading(true);
      const data = await getReports(filter, user?.id);
      setReports(data);
    } catch (error) {
      console.error('Lỗi tải báo cáo:', error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách báo cáo vi phạm.');
    } finally {
      setLoading(false);
    }
  }, [reportsFilter]);

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTopics(true); // Lấy cả những topic inactive
      setTopics(data);
    } catch (error) {
      console.error('Lỗi tải chủ đề:', error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách chủ đề.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'reports') {
      await loadReports(reportsFilter);
    } else {
      await loadTopics();
    }
    setRefreshing(false);
  }, [activeTab, reportsFilter, loadReports, loadTopics]);

  const handleResolveReport = async (reportId, action, reviewResult) => {
    if (!reviewResult.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập ghi chú xử lý trước.');
      return;
    }
    try {
      setLoading(true);
      await resolveReport(reportId, user.id, action, reviewResult);
      Alert.alert('Thành công', action === 'dismiss' ? 'Đã bỏ qua báo cáo.' : 'Đã ẩn nội dung vi phạm.');
      loadReports(reportsFilter);
    } catch (error) {
      console.error('Lỗi xử lý báo cáo:', error.message);
      Alert.alert('Lỗi', 'Không thể xử lý báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictUser = async (userId, restrictionType, reason, durationDays) => {
    try {
      setLoading(true);
      await restrictUser(userId, restrictionType, reason, user.id, durationDays);
      Alert.alert('Thành công', 'Đã hạn chế người dùng này thành công.');
    } catch (error) {
      console.error('Lỗi hạn chế người dùng:', error.message);
      Alert.alert('Lỗi', 'Không thể áp dụng hạn chế lên người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (name, iconName, color, sortOrder) => {
    try {
      setLoading(true);
      await createTopic(name, iconName, color, sortOrder);
      Alert.alert('Thành công', 'Đã tạo chủ đề mới.');
      loadTopics();
    } catch (error) {
      console.error('Lỗi tạo chủ đề:', error.message);
      Alert.alert('Lỗi', 'Không thể tạo chủ đề mới.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopic = async (topicId, updates) => {
    try {
      setLoading(true);
      await updateTopic(topicId, updates);
      Alert.alert('Thành công', 'Đã cập nhật chủ đề.');
      loadTopics();
    } catch (error) {
      console.error('Lỗi cập nhật chủ đề:', error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật chủ đề.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = (topicId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn vô hiệu hóa chủ đề này? Người dùng sẽ không thể chọn hoặc xem chủ đề này nữa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vô hiệu hóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteTopic(topicId);
              Alert.alert('Thành công', 'Đã vô hiệu hóa chủ đề.');
              loadTopics();
            } catch (error) {
              console.error('Lỗi vô hiệu hóa chủ đề:', error.message);
              Alert.alert('Lỗi', 'Không thể vô hiệu hóa chủ đề.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return {
    activeTab,
    setActiveTab,
    reportsFilter,
    setReportsFilter,
    reports,
    topics,
    loading,
    refreshing,
    loadReports,
    loadTopics,
    handleRefresh,
    handleResolveReport,
    handleRestrictUser,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    userRole,
    checkRole,
  };
};
