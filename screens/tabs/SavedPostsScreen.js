import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../contexts/AuthContext';
import { getSavedPosts, toggleLike, toggleSave } from '../../services/communityService';
import PostCard from '../../components/community/PostCard';

export default function SavedPostsScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Tải danh sách bài viết đã lưu
  const loadSaved = useCallback(async (showLoading = true) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);

    try {
      const data = await getSavedPosts(userId);
      setPosts(data || []);
    } catch (error) {
      console.error('Lỗi tải bài viết đã lưu:', error.message);
      Alert.alert('Thất bại', 'Không thể tải danh sách bài viết đã lưu.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userId]);

  // Tải lần đầu tiên
  useEffect(() => {
    loadSaved(true);
  }, [loadSaved]);

  // Tự động tải lại mỗi khi màn hình được Focus (quay lại từ chi tiết bài viết)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSaved(false);
    });
    return unsubscribe;
  }, [navigation, loadSaved]);

  // 2. Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSaved(false);
    setRefreshing(false);
  };

  // 3. Thả tim trực tiếp trên danh sách - Optimistic UI
  const handleLike = async (postItem) => {
    if (!userId) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thích bài viết.');
      return;
    }

    const postId = postItem.id;
    const oldIsLiked = postItem.isLiked;
    const oldLikesCount = postItem.likesCount;

    // Cập nhật giao diện lập tức (optimistic)
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !oldIsLiked, likesCount: oldIsLiked ? oldLikesCount - 1 : oldLikesCount + 1 }
          : p
      )
    );

    try {
      const result = await toggleLike(postId, userId);
      // Đồng bộ lại từ kết quả DB
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, isLiked: result.isLiked } : p))
      );
    } catch (error) {
      console.error('Lỗi tương tác Thích:', error.message);
      // Revert lại
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, isLiked: oldIsLiked, likesCount: oldLikesCount } : p
        )
      );
    }
  };

  // 4. Bỏ lưu bài viết (Hủy bookmark) - Xóa ngay khỏi danh sách
  const handleUnsave = async (postItem) => {
    if (!userId) return;

    const postId = postItem.id;

    // Optimistic: Xóa bài đăng khỏi màn hình ngay lập tức
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      const result = await toggleSave(postId, userId);
      if (result.isSaved) {
        // Nếu chẳng may hành động toggle trả về true (tức là đã lưu lại), lấy lại bài đăng
        loadSaved(false);
      }
    } catch (error) {
      console.error('Lỗi hủy lưu bài viết:', error.message);
      // Revert: tải lại toàn bộ danh sách
      loadSaved(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách bài viết...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết đã lưu</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Danh sách */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onLike={() => handleLike(item)}
            onSave={() => handleUnsave(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bookmark-outline" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.emptyText}>Chưa lưu bài viết nào</Text>
            <Text style={styles.emptySubtext}>
              Nhấp vào biểu tượng lưu ở các bài đăng hữu ích trên bảng tin để xem lại tại đây.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl + 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.secondary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});