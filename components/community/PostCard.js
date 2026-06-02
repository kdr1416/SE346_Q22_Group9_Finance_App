import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return past.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function PostCard({ post, onPress, onLike, onSave }) {
  const {
    authorName,
    title,
    content,
    postType,
    imageUrl,
    likesCount,
    commentsCount,
    createdAt,
    topics,
    isLiked,
    isSaved,
  } = post;

  const plainContent = stripHtml(content);
  const avatarLetter = authorName ? authorName.charAt(0).toUpperCase() : 'U';

  return (
    <Pressable style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.metaTextContainer}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(createdAt)}</Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            postType === 'share' ? styles.badgeShare : styles.badgeQuestion,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              postType === 'share' ? styles.badgeTextShare : styles.badgeTextQuestion,
            ]}
          >
            {postType === 'share' ? 'Chia sẻ' : 'Hỏi đáp'}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {plainContent ? (
        <Text style={styles.contentSnippet} numberOfLines={3}>
          {plainContent}
        </Text>
      ) : null}

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      {topics && topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {topics.map((t) => (
            <View
              key={t.id}
              style={[
                styles.topicTag,
                { backgroundColor: (t.color || Colors.secondary) + '15' },
              ]}
            >
              <Text style={[styles.topicTagText, { color: t.color || Colors.secondary }]}>#{t.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Pressable
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onLike();
          }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? Colors.error : Colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.actionText,
              isLiked ? { color: Colors.error, fontFamily: Typography.fontBody_SemiBold } : null,
            ]}
          >
            {likesCount}
          </Text>
        </Pressable>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={19} color={Colors.onSurfaceVariant} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>

        <Pressable
          style={[styles.actionButton, { marginLeft: 'auto' }]}
          onPress={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? Colors.secondary : Colors.onSurfaceVariant}
          />
          <Text style={[styles.actionText, isSaved ? { color: Colors.secondary } : null]}>
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: Typography.titleSm,
    color: Colors.primary,
  },
  metaTextContainer: {
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
  },
  timeText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radiusSm,
  },
  badgeShare: {
    backgroundColor: Colors.secondaryContainer,
  },
  badgeQuestion: {
    backgroundColor: Colors.tertiaryContainer,
  },
  badgeText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
  },
  badgeTextShare: {
    color: Colors.secondary,
  },
  badgeTextQuestion: {
    color: Colors.tertiary,
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  contentSnippet: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.sm,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  topicTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.radiusSm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  topicTagText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginVertical: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginLeft: 6,
  },
});
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

// Helper loại bỏ thẻ HTML để làm preview nội dung text sạch sẽ
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Xóa các tag HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

// Helper chuyển đổi thời gian tương đối thân thiện bằng tiếng Việt
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return past.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function PostCard({ post, onPress, onLike, onSave }) {
  const {
    authorName,
    title,
    content,
    postType,
    imageUrl,
    likesCount,
    commentsCount,
    createdAt,
    topics,
    isLiked,
    isSaved,
  } = post;

  const plainContent = stripHtml(content);

  // Fallback avatar hiển thị chữ cái đầu của tên tác giả
  const avatarLetter = authorName ? authorName.charAt(0).toUpperCase() : 'U';

  return (
    <Pressable style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Phần đầu: Thông tin tác giả */}
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.metaTextContainer}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(createdAt)}</Text>
          </View>
        </View>

        {/* Badge phân loại Chia sẻ / Hỏi đáp */}
        <View
          style={[
            styles.badge,
            postType === 'share' ? styles.badgeShare : styles.badgeQuestion,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              postType === 'share' ? styles.badgeTextShare : styles.badgeTextQuestion,
            ]}
          >
            {postType === 'share' ? 'Chia sẻ' : 'Hỏi đáp'}
          </Text>
        </View>
      </View>

      {/* Tiêu đề bài viết */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Xem trước nội dung bài viết */}
      {plainContent ? (
        <Text style={styles.contentSnippet} numberOfLines={3}>
          {plainContent}
        </Text>
      ) : null}

      {/* Ảnh đính kèm (nếu có) */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      {/* Danh sách chủ đề bài viết thuộc về */}
      {topics && topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {topics.map((t) => (
            <View
              key={t.id}
              style={[
                styles.topicTag,
                { backgroundColor: (t.color || Colors.secondary) + '15' }, // Độ mờ 10%
              ]}
            >
              <Text style={[styles.topicTagText, { color: t.color || Colors.secondary }]}>#{t.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Đường gạch ngang nhỏ ngăn cách */}
      <View style={styles.divider} />

      {/* Phần cuối: Nút tương tác nhanh */}
      <View style={styles.footer}>
        <Pressable
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation(); // Tránh kích hoạt sự kiện tap cả card bài viết
            onLike();
          }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? Colors.error : Colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.actionText,
              isLiked ? { color: Colors.error, fontFamily: Typography.fontBody_SemiBold } : null,
            ]}
          >
            {likesCount}
          </Text>
        </Pressable>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={19} color={Colors.onSurfaceVariant} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>

        <Pressable
          style={[styles.actionButton, { marginLeft: 'auto' }]}
          onPress={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? Colors.secondary : Colors.onSurfaceVariant}
          />
          <Text style={[styles.actionText, isSaved ? { color: Colors.secondary } : null]}>
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: Typography.titleSm,
    color: Colors.primary,
  },
  metaTextContainer: {
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
  },
  timeText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radiusSm,
  },
  badgeShare: {
    backgroundColor: Colors.secondaryContainer,
  },
  badgeQuestion: {
    backgroundColor: Colors.tertiaryContainer,
  },
  badgeText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
  },
  badgeTextShare: {
    color: Colors.secondary,
  },
  badgeTextQuestion: {
    color: Colors.tertiary,
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  contentSnippet: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.sm,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  topicTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.radiusSm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  topicTagText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginVertical: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginLeft: 6,
  },
});
