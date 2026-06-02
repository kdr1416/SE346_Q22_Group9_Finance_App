import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import {
  createPost,
  updatePost,
  getPostById,
  checkUserRestriction,
  getTopics,
} from '../../services/communityService';

export default function useCreatePost(navigation, route) {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Lấy các tham số chỉnh sửa nếu có từ navigation route
  const editPostId = route?.params?.postId || null;
  const initialMode = route?.params?.mode || 'share'; // 'share' hoặc 'question'

  // Trạng thái dữ liệu tĩnh
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Chuỗi HTML từ Rich Text Editor
  const [postType, setPostType] = useState(initialMode);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  
  // Trạng thái dùng để chuyển đổi ban đầu khi ở chế độ Edit
  const [initialContent, setInitialContent] = useState('');

  // 1. Tải danh sách các Chủ đề khả dụng
  const loadTopics = useCallback(async () => {
    try {
      const activeTopics = await getTopics();
      setTopics(activeTopics);
    } catch (error) {
      console.error('Lỗi tải danh sách chủ đề:', error.message);
    }
  }, []);

  // 2. Điền trước thông tin cũ nếu đang ở chế độ Chỉnh Sửa (Edit Mode)
  const loadPostForEdit = useCallback(async (postId) => {
    if (!postId || !userId) return;
    setLoading(true);
    try {
      const post = await getPostById(postId, userId);
      if (post) {
        // Bảo vệ: Chỉ tác giả bài đăng hoặc Admin mới được phép chỉnh sửa
        if (post.authorId !== userId) {
          Alert.alert('Không có quyền', 'Bạn không thể chỉnh sửa bài viết của người khác.');
          navigation.goBack();
          return;
        }
        setTitle(post.title);
        setPostType(post.postType);
        setImageUri(post.imageUrl); // Link ảnh hiện tại trên Cloud Storage
        setSelectedTopicIds((post.topics || []).map(t => t.id));
        setInitialContent(post.content);
        setContent(post.content);
      }
    } catch (error) {
      console.error('Lỗi tải bài viết để chỉnh sửa:', error.message);
      Alert.alert('Thất bại', 'Không thể lấy thông tin bài viết cũ.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => {
    loadTopics();
    if (editPostId) {
      loadPostForEdit(editPostId);
    }
  }, [loadTopics, editPostId, loadPostForEdit]);

  // 3. Chọn ảnh từ thư viện điện thoại (expo-image-picker)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Yêu cầu quyền', 'Ứng dụng cần quyền truy cập thư viện để chọn ảnh.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Lỗi chọn hình ảnh:', error.message);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện.');
    }
  };

  // 4. Gỡ hình ảnh đã chọn khỏi form
  const removeImage = () => {
    setImageUri(null);
  };

  // 5. Chọn / Hủy chọn chủ đề bài đăng
  const toggleTopic = (topicId) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId) // Hủy chọn
        : [...prev, topicId] // Chọn
    );
  };

  // 6. Gửi form (Đăng bài hoặc Lưu chỉnh sửa)
  const submitPost = async (htmlContent) => {
    if (!userId) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để đăng tải bài viết.');
      return;
    }

    const trimmedTitle = title.trim();
    const cleanTextContent = htmlContent.replace(/<[^>]*>/g, '').trim(); // Loại bỏ tag để kiểm tra độ dài text

    // === VALIDATION FORM (BR-COM02) ===
    if (!trimmedTitle) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề bài viết.');
      return;
    }

    if (!cleanTextContent || cleanTextContent.length < 10) {
      Alert.alert('Nội dung quá ngắn', 'Nội dung bài viết phải chứa ít nhất 10 ký tự.');
      return;
    }

    if (selectedTopicIds.length === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng gắn ít nhất 1 chủ đề cho bài viết.');
      return;
    }

    setSubmitting(true);

    try {
      // === KIỂM TRA HẠN CHẾ NGƯỜI DÙNG (BR-COM14) ===
      const restriction = await checkUserRestriction(userId);
      if (restriction && (restriction.restrictionType === 'post' || restriction.restrictionType === 'all')) {
        const expiresStr = restriction.expiresAt 
          ? new Date(restriction.expiresAt).toLocaleDateString('vi-VN') 
          : 'Vô thời hạn';
        
        Alert.alert(
          'Tài khoản bị khóa chức năng 🚫',
          `Bạn đang bị hạn chế đăng bài cộng đồng.\nLý do: ${restriction.reason}\nHạn chế đến ngày: ${expiresStr}`
        );
        setSubmitting(false);
        return;
      }

      if (editPostId) {
        // CHẾ ĐỘ CẬP NHẬT BÀI VIẾT CŨ
        await updatePost(editPostId, {
          title: trimmedTitle,
          content: htmlContent,
          topicIds: selectedTopicIds,
          imageUri: imageUri, // Service tự động check nếu là link cũ hoặc file:// mới để xử lý upload
        });
        Alert.alert('Thành công 🎉', 'Bài viết của bạn đã được cập nhật thành công.');
      } else {
        // CHẾ ĐỘ ĐĂNG BÀI VIẾT MỚI
        await createPost({
          authorId: userId,
          title: trimmedTitle,
          content: htmlContent,
          postType,
          topicIds: selectedTopicIds,
          imageUri: imageUri,
        });
        Alert.alert('Thành công 🎉', 'Bài viết đã được đăng tải lên bảng tin cộng đồng.');
      }

      // Quay lại màn hình trước (focus listener sẽ tự tải lại bảng tin)
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi lưu bài viết:', error.message);
      Alert.alert('Thất bại', 'Đã xảy ra lỗi trong quá trình đăng tải.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    postType,
    setPostType,
    selectedTopicIds,
    topics,
    imageUri,
    loading,
    submitting,
    initialContent,
    editPostId,
    pickImage,
    removeImage,
    toggleTopic,
    submitPost,
  };
}