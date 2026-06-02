import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useCommunityFeed from '../../hooks/tabs/useCommunityFeed';
import TopicChip from '../../components/community/TopicChip';
import PostCard from '../../components/community/PostCard';

export default function CommunityScreen({ navigation }) {
  const {
    topics,
    selectedTopicId,
    userRole,
    posts,
    loading,
    refreshing,
    loadingMore,
    searchQuery,
    searchActive,
    searchTab,
    handleSearchTextChange,
    handleSearchTabChange,
    handleRefresh,
    handleLoadMore,
    handleClearSearch,
    handleTopicSelect,
    handleLikePost,
    handleSavePost,
  } = useCommunityFeed(navigation);

  const renderItem = ({ item }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      onLike={() => handleLikePost(item.id)}
      onSave={() => handleSavePost(item.id)}
    />
  );

  const isAdmin = userRole === 'admin' || userRole === 'moderator';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 1. Header chính */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cộng đồng</Text>
          <Text style={styles.headerSubtitle}>Trao đổi kiến thức tài chính</Text>
        </View>

        <View style={styles.headerActions}>
          {isAdmin ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('CommunityAdmin')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('SavedPosts')}
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark-outline" size={23} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('CommunityNotifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài viết, câu hỏi..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={handleSearchTextChange}
          />
          {searchActive ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.outline} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 3. Lọc theo chủ đề hoặc Sub-tab tìm kiếm */}
      {!searchActive ? (
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            <TopicChip
              topic={{ id: null, name: 'Tất cả', iconName: 'apps-outline', color: Colors.primary }}
              selected={selectedTopicId === null}
              onPress={() => handleTopicSelect(null)}
            />
            {topics.map((t) => (
              <TopicChip key={t.id} topic={t} selected={selectedTopicId === t.id} onPress={() => handleTopicSelect(t.id)} />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.searchTabsRow}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'share', label: 'Chia sẻ' },
            { id: 'question', label: 'Hỏi đáp' },
          ].map((tab) => {
            const active = searchTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.searchTab, active ? styles.searchTabActive : null]}
                onPress={() => handleSearchTabChange(tab.id)}
              >
                <Text style={[styles.searchTabLabel, active ? styles.searchTabLabelActive : null]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 4. Danh sách bảng tin (FlatList) */}
      {loading && posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={() =>
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ paddingVertical: Spacing.md }}
              />
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={searchActive ? 'search-outline' : 'chatbubbles-outline'}
                size={48}
                color={Colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>
                {searchActive ? 'Không tìm thấy kết quả' : 'Cộng đồng chưa có bài viết'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchActive
                  ? 'Hãy thử tìm kiếm bằng từ khóa khác hoặc chủ đề khác.'
                  : 'Hãy là người đầu tiên chia sẻ kiến thức hữu ích hoặc hỏi đáp hôm nay!'}
              </Text>
            </View>
          )}
        />
      )}

      {/* 5. Nút viết bài nổi (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost', { mode: 'share' })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color={Colors.white} />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: Spacing.iconContainer,
    height: Spacing.iconContainer,
    borderRadius: Spacing.iconContainer / 2,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  searchTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    marginBottom: Spacing.md,
  },
  searchTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  searchTabActive: {
    borderBottomColor: Colors.secondary,
  },
  searchTabLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  searchTabLabelActive: {
    fontFamily: Typography.fontHeadline_SemiBold,
    color: Colors.secondary,
  },
  feedContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
