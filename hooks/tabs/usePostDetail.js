import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPostById,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  toggleSave,
  deletePost,
  createReport,
  checkUserRestriction,
} from '../../services/communityService';

export default function usePostDetail(navigation, route) {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Lấy postId từ params
  const postId = route?.params?.postId || null;

  // Trạng thái dữ liệu
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  // Refs bảo vệ chống click nhanh liên tục (Double-tap guard)
  const likeInProgressRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Trạng thái bình luận
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Trạng thái Báo cáo
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'post' | 'comment', id: string }

  // 1. Tải chi tiết bài viết và bình luận
  const loadData = useCallback(async (showLoading = true) => {
    if (!postId) return;
    if (showLoading) setLoading(true);

    try {
      const [fetchedPost, fetchedComments] = await Promise.all([
        getPostById(postId, userId),
        getComments(postId),
      ]);

      if (!fetchedPost) {
        Alert.alert('Lỗi', 'Bài viết không tồn tại hoặc đã bị xóa.');
        navigation.goBack();
        return;
      }

      setPost(fetchedPost);
      setComments(fetchedComments || []);
    } catch (error) {
      console.error('Lỗi tải chi tiết bài viết:', error.message);
      Alert.alert('Thất bại', 'Không thể tải dữ liệu chi tiết bài viết.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [postId, userId, navigation]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // 2. Pull to Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  // 3. Thả tim (Like) - Optimistic UI
  const handleLike = async () => {
    if (!userId) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thực hiện hành động này.');
      return;
    }
    if (!post) return;

    if (likeInProgressRef.current) return;
    likeInProgressRef.current = true;

    const oldIsLiked = post.isLiked;
    const oldLikesCount = post.likesCount;

    // Optimistic Update
    setPost(prev => ({
      ...prev,
      isLiked: !oldIsLiked,
      likesCount: oldIsLiked ? oldLikesCount - 1 : oldLikesCount + 1,
    }));

    try {
      const result = await toggleLike(postId, userId);
      // Đồng bộ lại từ kết quả chính xác của DB
      setPost(prev => ({
        ...prev,
        isLiked: result.isLiked,
      }));
    } catch (error) {
      console.error('Lỗi thích bài viết:', error.message);
      // Revert lại nếu lỗi
      setPost(prev => ({
        ...prev,
        isLiked: oldIsLiked,
        likesCount: oldLikesCount,
      }));
    } finally {
      likeInProgressRef.current = false;
    }
  };

  // 4. Lưu bài viết (Save) - Optimistic UI
  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thực hiện hành động này.');
      return;
    }
    if (!post) return;

    if (saveInProgressRef.current) return;
    saveInProgressRef.current = true;

    const oldIsSaved = post.isSaved;

    // Optimistic Update
    setPost(prev => ({
      ...prev,
      isSaved: !oldIsSaved,
    }));

    try {
      const result = await toggleSave(postId, userId);
      setPost(prev => ({
        ...prev,
        isSaved: result.isSaved,
      }));
    } catch (error) {
      console.error('Lỗi lưu bài viết:', error.message);
      setPost(prev => ({
        ...prev,
        isSaved: oldIsSaved,
      }));
    } finally {
      saveInProgressRef.current = false;
    }
  };

  // 5. Thêm Bình luận mới (UC-COM10, BR-COM14)
  const handleAddComment = async () => {
    if (!userId) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để bình luận.');
      return;
    }

    const trimmedText = commentText.trim();
    if (!trimmedText) {
      Alert.alert('Lỗi', 'Nội dung bình luận không được để trống.');
      return;
    }

    setSubmittingComment(true);

    try {
      // Kiểm tra hạn chế người dùng (BR-COM14)
      const restriction = await checkUserRestriction(userId);
      if (restriction && (restriction.restrictionType === 'comment' || restriction.restrictionType === 'all')) {
        const expiresStr = restriction.expiresAt 
          ? new Date(restriction.expiresAt).toLocaleDateString('vi-VN') 
          : 'Vô thời hạn';
        
        Alert.alert(
          'Tài khoản bị hạn chế bình luận 🚫',
          `Lý do: ${restriction.reason}\nHạn chế đến ngày: ${expiresStr}`
        );
        return;
      }

      await createComment(postId, userId, trimmedText);
      setCommentText('');
      // Reload lại danh sách bình luận + tăng commentsCount local
      const updatedComments = await getComments(postId);
      setComments(updatedComments);
      setPost(prev => ({
        ...prev,
        commentsCount: (prev.commentsCount || 0) + 1,
      }));
    } catch (error) {
      console.error('Lỗi gửi bình luận:', error.message);
      Alert.alert('Lỗi', 'Không thể gửi bình luận vào lúc này.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 6. Bắt đầu chỉnh sửa bình luận
  const handleStartEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditingText(currentContent);
  };

  // 7. Hủy chỉnh sửa bình luận
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  // 8. Lưu chỉnh sửa bình luận (BR-COM06)
  const handleSaveEditComment = async () => {
    const trimmedText = editingText.trim();
    if (!trimmedText) {
      Alert.alert('Lỗi', 'Nội dung bình luận không được để trống.');
      return;
    }

    try {
      await updateComment(editingCommentId, trimmedText);
      setComments(prev => 
        prev.map(c => c.id === editingCommentId ? { ...c, content: trimmedText, updatedAt: new Date().toISOString() } : c)
      );
      handleCancelEditComment();
    } catch (error) {
      console.error('Lỗi sửa bình luận:', error.message);
      Alert.alert('Thất bại', 'Không thể cập nhật bình luận.');
    }
  };

  // 9. Xóa bình luận (BR-COM06)
  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Xóa bình luận 🗑️',
      'Bạn có chắc chắn muốn xóa bình luận này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              // Lọc bỏ bình luận vừa xóa khỏi danh sách hiển thị
              setComments(prev => prev.filter(c => c.id !== commentId));
              // Giảm commentCount local
              setPost(prev => ({
                ...prev,
                commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
              }));
            } catch (error) {
              console.error('Lỗi xóa bình luận:', error.message);
              Alert.alert('Thất bại', 'Không thể xóa bình luận này.');
            }
          },
        },
      ]
    );
  };

  // 10. Mở Modal báo cáo (UC-COM11)
  const handleOpenReport = (targetType, targetId) => {
    if (!userId) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để gửi báo cáo.');
      return;
    }
    setReportTarget({ type: targetType, id: targetId });
    setReportModalVisible(true);
  };

  // 11. Gửi báo cáo vi phạm lên DB (BR-COM10)
  const handleSubmitReport = async (reason, detail) => {
    if (!reportTarget) return;

    try {
      await createReport({
        reporterId: userId,
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason,
        detail,
      });

      Alert.alert('Thành công 🎉', 'Báo cáo của bạn đã được gửi đi và đang được kiểm duyệt.');
    } catch (error) {
      console.error('Lỗi gửi báo cáo:', error.message);
      if (error.message.includes('unique') || error.code === '23505') {
        Alert.alert('Đã báo cáo ⚠️', 'Bạn đã báo cáo nội dung này trước đó rồi.');
      } else {
        Alert.alert('Lỗi', 'Không thể gửi báo cáo vào lúc này.');
      }
    } finally {
      setReportModalVisible(false);
      setReportTarget(null);
    }
  };

  // 12. Xóa bài viết của bản thân
  const handleDeletePost = () => {
    if (!post) return;
    Alert.alert(
      'Xóa bài viết 🗑️',
      'Bạn có chắc chắn muốn xóa bài đăng này vĩnh viễn khỏi cộng đồng không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              Alert.alert('Thành công', 'Bài viết đã được gỡ bỏ.');
              navigation.goBack();
            } catch (error) {
              console.error('Lỗi xóa bài đăng:', error.message);
              Alert.alert('Lỗi', 'Không thể xóa bài đăng của bạn.');
            }
          },
        },
      ]
    );
  };

  // 13. Chuyển sang trang sửa bài viết
  const handleEditPost = () => {
    if (!post) return;
    navigation.navigate('CreatePost', { postId: post.id });
  };

  return {
    post,
    comments,
    loading,
    refreshing,
    commentText,
    setCommentText,
    submittingComment,
    editingCommentId,
    editingText,
    setEditingText,
    reportModalVisible,
    setReportModalVisible,
    reportTarget,
    setReportTarget,
    userId,
    handleRefresh,
    handleLike,
    handleSave,
    handleAddComment,
    handleStartEditComment,
    handleCancelEditComment,
    handleSaveEditComment,
    handleDeleteComment,
    handleOpenReport,
    handleSubmitReport,
    handleDeletePost,
    handleEditPost,
  };
}
