import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import usePostDetail from '../../hooks/tabs/usePostDetail';
import CommentItem from '../../components/community/CommentItem';
import ReportModal from '../../components/community/ReportModal';
import { formatRelativeTime } from '../../utils/communityHelpers';

export default function PostDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const {
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
  } = usePostDetail(navigation, route);

  // Định cấu hình kiểu dáng CSS cho trình render HTML
  const tagsStyles = {
    body: {
      fontFamily: Typography.fontBody_Regular,
      fontSize: Typography.bodyLg,
      color: Colors.onSurface,
      lineHeight: 22,
    },
    p: {
      marginTop: 0,
      marginBottom: Spacing.sm,
    },
    strong: {
      fontFamily: Typography.fontHeadline_SemiBold,
    },
    em: {
      fontStyle: 'italic',
    },
    a: {
      color: Colors.secondary,
      textDecorationLine: 'underline',
    },
    ul: {
      marginTop: 0,
      marginBottom: Spacing.sm,
      paddingLeft: Spacing.md,
    },
    ol: {
      marginTop: 0,
      marginBottom: Spacing.sm,
      paddingLeft: Spacing.md,
    },
    li: {
      fontFamily: Typography.fontBody_Regular,
      fontSize: Typography.bodyLg,
      color: Colors.onSurface,
      marginBottom: 2,
    },
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài viết...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài viết.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backHomeBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnPost = post.authorId === userId;
  const firstLetter = (post.authorName || 'A')[0].toUpperCase();

  // Render header bài viết làm phần đầu của FlatList
  const renderPostHeader = () => (
    <View style={styles.postCard}>
      {/* 1. Thông tin tác giả */}
      <View style={styles.authorRow}>
        <TouchableOpacity
          style={styles.authorClickable}
          onPress={() => navigation.navigate('CommunityProfile', { userId: post.authorId })}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{post.authorName || 'Ẩn danh'}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <View style={[
          styles.badge,
          post.postType === 'share' ? styles.badgeShare : styles.badgeQuestion
        ]}>
          <Text style={[
            styles.badgeText,
            post.postType === 'share' ? styles.badgeTextShare : styles.badgeTextQuestion
          ]}>
            {post.postType === 'share' ? 'Chia sẻ' : 'Hỏi đáp'}
          </Text>
        </View>
      </View>

      {/* 2. Tiêu đề */}
      <Text style={styles.postTitle}>{post.title}</Text>

      {/* 3. Nội dung HTML bài viết */}
      <View style={styles.contentContainer}>
        <RenderHtml
          contentWidth={width - Spacing.lg * 2}
          source={{ html: post.content }}
          tagsStyles={tagsStyles}
        />
      </View>

      {/* 4. Hình ảnh đính kèm (nếu có) */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* 5. Gắn nhãn Chủ đề */}
      {post.topics && post.topics.length > 0 && (
        <View style={styles.topicsRow}>
          {post.topics.map((t) => (
            <View
              key={t.id}
              style={[styles.topicTag, { backgroundColor: `${t.color}15` }]}
            >
              <Text style={[styles.topicTagText, { color: t.color }]}>
                #{t.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 6. Thanh tương tác (Like, Save) */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.isLiked ? Colors.error : Colors.onSurfaceVariant}
          />
          <Text style={[styles.actionButtonText, post.isLiked ? styles.likedText : null]}>
            Thích ({post.likesCount || 0})
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.onSurfaceVariant} />
          <Text style={styles.actionButtonText}>
            Phản hồi ({post.commentsCount || 0})
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { marginLeft: 'auto' }]}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={post.isSaved ? Colors.secondary : Colors.onSurfaceVariant}
          />
          <Text style={[styles.actionButtonText, post.isSaved ? styles.savedText : null]}>
            {post.isSaved ? 'Đã lưu' : 'Lưu'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionDivider} />

      {/* Tiêu đề mục Bình luận */}
      <Text style={styles.commentsTitle}>
        Bình luận ({comments.length})
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header tùy chỉnh */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>

        <View style={styles.headerActions}>
          {isOwnPost ? (
            <>
              <TouchableOpacity onPress={handleEditPost} style={styles.headerActionBtn}>
                <Ionicons name="pencil-outline" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeletePost} style={styles.headerActionBtn}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => handleOpenReport('post', post.id)}
              style={styles.headerActionBtn}
            >
              <Ionicons name="flag-outline" size={20} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách bình luận & bài viết lồng nhau bằng FlatList để tối ưu hóa Scroll */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              currentUserId={userId}
              onEdit={handleStartEditComment}
              onDelete={handleDeleteComment}
              onReport={handleOpenReport}
            />
          )}
          ListHeaderComponent={renderPostHeader}
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
            <View style={styles.emptyCommentsCard}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.outlineVariant} />
              <Text style={styles.emptyCommentsText}>Chưa có bình luận nào.</Text>
              <Text style={styles.emptyCommentsSubtext}>Hãy là người đầu tiên chia sẻ ý kiến của bạn!</Text>
            </View>
          }
          windowSize={5}
          maxToRenderPerBatch={5}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        {/* Khung nhập bình luận (Fixed bottom) */}
        <View style={styles.bottomBar}>
          {/* Trạng thái hiển thị khi đang chỉnh sửa bình luận */}
          {editingCommentId && (
            <View style={styles.editIndicatorRow}>
              <Ionicons name="pencil" size={14} color={Colors.secondary} />
              <Text style={styles.editIndicatorText}>Đang chỉnh sửa bình luận của bạn...</Text>
              <TouchableOpacity onPress={handleCancelEditComment} style={styles.cancelEditBtn}>
                <Ionicons name="close-circle" size={16} color={Colors.outline} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết câu trả lời hoặc thảo luận..."
              placeholderTextColor={Colors.outline}
              value={editingCommentId ? editingText : commentText}
              onChangeText={editingCommentId ? setEditingText : setCommentText}
              multiline
              maxLength={500}
              editable={!submittingComment}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !(editingCommentId ? editingText.trim() : commentText.trim()) || submittingComment
                  ? styles.sendBtnDisabled
                  : null,
              ]}
              onPress={editingCommentId ? handleSaveEditComment : handleAddComment}
              disabled={!(editingCommentId ? editingText.trim() : commentText.trim()) || submittingComment}
              activeOpacity={0.8}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons
                  name={editingCommentId ? 'checkmark' : 'send'}
                  size={18}
                  color={Colors.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal báo cáo vi phạm */}
      <ReportModal
        visible={reportModalVisible}
        targetType={reportTarget?.type}
        onClose={() => {
          setReportModalVisible(false);
          setReportTarget(null);
        }}
        onSubmit={handleSubmitReport}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl + 40,
  },
  postCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  authorClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.primary,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
  },
  timeText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.outline,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSm,
  },
  badgeShare: {
    backgroundColor: `${Colors.secondary}15`,
  },
  badgeQuestion: {
    backgroundColor: `${Colors.tertiary}15`,
  },
  badgeText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.labelSm,
  },
  badgeTextShare: {
    color: Colors.secondary,
  },
  badgeTextQuestion: {
    color: Colors.tertiary,
  },
  postTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm - 2,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
    lineHeight: 26,
  },
  contentContainer: {
    marginBottom: Spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.md,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  topicTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radiusFull,
  },
  topicTagText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  likedText: {
    color: Colors.error,
    fontFamily: Typography.fontHeadline_SemiBold,
  },
  savedText: {
    color: Colors.secondary,
    fontFamily: Typography.fontHeadline_SemiBold,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: Spacing.lg,
  },
  commentsTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  emptyCommentsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  emptyCommentsText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
  },
  emptyCommentsSubtext: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.outline,
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  editIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.secondary}10`,
    padding: Spacing.xs + 2,
    borderRadius: Spacing.radiusSm,
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  editIndicatorText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.secondary,
    flex: 1,
  },
  cancelEditBtn: {
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs + 4,
    paddingBottom: Spacing.xs + 4,
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.outlineVariant,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  backHomeBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.primary,
  },
  backHomeBtnText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.white,
  },
});