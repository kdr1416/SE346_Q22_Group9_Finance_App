import { useState, useCallback } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getReports,
  resolveReport,
  restrictUser,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getUserRole,
  getAiNewsPosts,
} from '../../services/communityService';

export const useCommunityAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'topics' | 'ai_review'
  const [reportsFilter, setReportsFilter] = useState('pending'); // 'pending' | 'reviewed' | 'dismissed'
  const [reports, setReports] = useState([]);
  const [topics, setTopics] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [aiNewsPosts, setAiNewsPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'moderator' | null
 const [roleChecked, setRoleChecked] = useState(false); // Đã kiểm tra role chưa
 const [hasAccess, setHasAccess] = useState(false); // Có quyền admin/moderator không

// Kiểm tra role khi mount
 const checkRole = useCallback(async () => {
 if (!user) {
  setRoleChecked(true);
  setHasAccess(false);
  return;
 }
 try {
  const role = await getUserRole(user.id);
  setUserRole(role);
  const isAllowed = !!role && ["admin", "moderator"].includes(role);
  setHasAccess(isAllowed);
  if (!isAllowed) {
   Alert.alert("Không có quyền", "Bạn không có quyền truy cập trang quản trị.");
  }
 } catch (err) {
  console.error("Lỗi kiểm tra role:", err.message);
  setHasAccess(false);
 } finally {
  setRoleChecked(true);
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
    } else if (activeTab === 'ai_review') {
      await loadFlaggedPosts();
    } else if (activeTab === 'ai_news') {
      await loadAiNewsPosts();
    } else {
      await loadTopics();
    }
    setRefreshing(false);
  }, [activeTab, reportsFilter, loadReports, loadTopics]);

  // ===== AI REVIEW =====
  const loadFlaggedPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles:author_id(name)')
        .in('moderation_status', ['flagged', 'needs_review'])
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFlaggedPosts((data || []).map((p) => ({
        id: p.id,
        title: p.title,
        authorName: p.profiles?.name || 'Ẩn danh',
        authorId: p.author_id,
        moderationStatus: p.moderation_status,
        moderationScore: p.moderation_score,
        moderationReason: p.moderation_reason,
        moderationCategories: p.moderation_categories || [],
        createdAt: p.created_at,
      })));
    } catch (error) {
      console.error('Lỗi tải bài cần review:', error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài cần kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprovePost = async (postId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('community_posts')
        .update({ moderation_status: 'approved', moderated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      Alert.alert('Thành công', 'Đã duyệt bài viết.');
      loadFlaggedPosts();
    } catch (error) {
      console.error('Lỗi duyệt bài:', error.message);
      Alert.alert('Lỗi', 'Không thể duyệt bài viết.');
    } finally {
      setLoading(false);
    }
  };

  const handleHidePost = async (postId) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn ẩn bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Ẩn bài',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const { error } = await supabase
              .from('community_posts')
              .update({ status: 'hidden', moderation_status: 'rejected' })
              .eq('id', postId);

            if (error) throw error;
            Alert.alert('Thành công', 'Đã ẩn bài viết.');
            loadFlaggedPosts();
          } catch (error) {
            console.error('Lỗi ẩn bài:', error.message);
            Alert.alert('Lỗi', 'Không thể ẩn bài viết.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

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

  // ===== AI NEWS MANAGEMENT =====
  const loadAiNewsPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAiNewsPosts({ page: 1, limit: 50 });
      setAiNewsPosts(data);
    } catch (error) {
      console.error('Lỗi tải bài tin AI:', error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài tin AI.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteAiPost = (postId) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn ẩn bài tin AI này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Ẩn bài',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const { error } = await supabase
              .from('community_posts')
              .update({ status: 'hidden' })
              .eq('id', postId);

            if (error) throw error;
            setAiNewsPosts((prev) => prev.filter((p) => p.id !== postId));
            Alert.alert('Thành công', 'Đã ẩn bài tin AI.');
          } catch (error) {
            console.error('Lỗi ẩn bài AI:', error.message);
            Alert.alert('Lỗi', 'Không thể ẩn bài tin AI.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const triggerNewsFetch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-news-feed', { body: {} });
      if (error) throw error;
      Alert.alert('Thành công', `Đã đăng ${data?.posted || 0} bài tin mới.`);
      await loadAiNewsPosts();
    } catch (error) {
      console.error('Lỗi trigger news fetch:', error.message);
      Alert.alert('Lỗi', 'Không thể lấy tin tức mới.');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    reportsFilter,
    setReportsFilter,
    reports,
    topics,
    flaggedPosts,
    aiNewsPosts,
    loading,
    refreshing,
    loadReports,
    loadTopics,
    loadFlaggedPosts,
    loadAiNewsPosts,
    handleRefresh,
    handleResolveReport,
    handleRestrictUser,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    handleApprovePost,
    handleHidePost,
    handleDeleteAiPost,
    triggerNewsFetch,
    userRole,
    roleChecked,
    hasAccess,
    checkRole,
  };
};
