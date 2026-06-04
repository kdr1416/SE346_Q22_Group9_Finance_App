import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatRelativeTime } from '../../utils/communityHelpers';

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

const PostCard = memo(({ post, onPress, onLike, onSave }) => {
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
    metadata,
  } = post;

  const isAiNews = postType === 'ai_news';
  const sourceUrl = metadata?.original_url;
  const sourceName = metadata?.source;

  const plainContent = stripHtml(content);
  const avatarLetter = authorName ? authorName.charAt(0).toUpperCase() : 'U';

  return (
    <Pressable style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <View style={[styles.avatar, isAiNews && styles.avatarBot]}>
            {isAiNews ? (
              <Ionicons name="sparkles" size={18} color="#0891b2" />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
          </View>
          <View style={styles.metaTextContainer}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(createdAt)}</Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            isAiNews
              ? styles.badgeAiNews
              : postType === 'share'
                ? styles.badgeShare
                : styles.badgeQuestion,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isAiNews
                ? styles.badgeTextAiNews
                : postType === 'share'
                  ? styles.badgeTextShare
                  : styles.badgeTextQuestion,
            ]}
          >
            {isAiNews ? '🤖 Tin AI' : postType === 'share' ? 'Chia sẻ' : 'Hỏi đáp'}
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

      {isAiNews && sourceName ? (
        <Pressable
          style={styles.sourceRow}
          onPress={() => sourceUrl && Linking.openURL(sourceUrl)}
        >
          <Ionicons name="newspaper-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.sourceText}>Nguồn: {sourceName}</Text>
          {sourceUrl ? (
            <Text style={styles.sourceLink}>Đọc bài gốc →</Text>
          ) : null}
        </Pressable>
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
});

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
  avatarBot: {
    backgroundColor: '#0891b2' + '15',
  },
  badgeAiNews: {
    backgroundColor: '#0891b2' + '20',
  },
  badgeTextAiNews: {
    color: '#0891b2',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingVertical: 4,
  },
  sourceText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  sourceLink: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.labelSm,
    color: '#0891b2',
    marginLeft: 'auto',
  },
});

export default PostCard;
