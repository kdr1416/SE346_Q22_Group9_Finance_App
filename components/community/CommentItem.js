import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatRelativeTime } from '../../utils/communityHelpers';

const CommentItem = memo(({ comment, currentUserId, onEdit, onDelete, onReport }) => {
  const isOwnComment = comment.authorId === currentUserId;
  const firstLetter = (comment.authorName || 'A')[0].toUpperCase();

  return (
    <View style={styles.container}>
      {/* 1. Avatar tròn */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{firstLetter}</Text>
      </View>

      {/* 2. Phần nội dung chính */}
      <View style={styles.contentBody}>
        {/* Tên và thời gian đăng */}
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{comment.authorName || 'Ẩn danh'}</Text>
          <Text style={styles.timeText}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>

        {/* Nội dung bình luận */}
        <Text style={styles.commentContent}>{comment.content}</Text>
      </View>

      {/* 3. Phím hành động (Sửa, Xóa nếu là của mình / Báo cáo nếu là người khác) */}
      <View style={styles.actionsContainer}>
        {isOwnComment ? (
          <>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => onEdit(comment.id, comment.content)}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => onDelete(comment.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => onReport('comment', comment.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={15} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  contentBody: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing.xs,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.xs,
  },
  authorName: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  timeText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.outline,
  },
  commentContent: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
});

export default CommentItem;
