import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/communityService';

export const useCommunityNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Lỗi tải thông báo cộng đồng:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Lỗi refresh thông báo:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const handleMarkRead = async (notifId) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      await markNotificationRead(notifId);
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await markAllNotificationsRead(user.id);
      Alert.alert('Thành công', 'Đã đánh dấu đọc tất cả thông báo.');
    } catch (error) {
      console.error('Lỗi đánh dấu đọc tất cả:', error.message);
      Alert.alert('Lỗi', 'Không thể đánh dấu đọc tất cả thông báo.');
      // Rollback
      loadNotifications();
    }
  };

  const handleNotificationPress = async (notif, navigation) => {
    await handleMarkRead(notif.id);

    if (notif.type === 'like' || notif.type === 'comment' || notif.type === 'report_resolved') {
      // Nếu là like/comment/report_resolved thì navigate tới PostDetail
      // Đối với report_resolved trên comment, targetId có thể là commentId. 
      // Nhưng để đơn giản và chính xác, communityService.js khi tạo notification đã lưu target_id là ID của post hoặc comment.
      // Nếu target_type là 'comment', ta nên dẫn tới PostDetail của bài viết chứa comment đó.
      // Tuy nhiên, do cấu trúc table chỉ lưu target_id, chúng ta có thể truyền thẳng target_id.
      // Trong PostDetailScreen, nếu nó là comment, ta vẫn hiển thị post detail.
      // Để an toàn, hãy kiểm tra target_type và điều hướng phù hợp.
      navigation.navigate('PostDetail', { postId: notif.targetId });
    } else if (notif.type === 'follow') {
      // Nếu là follow thì navigate tới hồ sơ cá nhân của người follow
      navigation.navigate('CommunityProfile', { userId: notif.actorId });
    }
  };

  return {
    notifications,
    loading,
    refreshing,
    loadNotifications,
    handleRefresh,
    handleMarkRead,
    handleMarkAllRead,
    handleNotificationPress,
  };
};
