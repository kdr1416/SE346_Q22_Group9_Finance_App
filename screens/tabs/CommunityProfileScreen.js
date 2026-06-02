import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useCommunityProfile } from '../../hooks/tabs/useCommunityProfile';
import PostCard from '../../components/community/PostCard';

export default function CommunityProfileScreen({ route, navigation }) {
  // Nhận userId từ route params nếu có (người dùng xem profile người khác)
  const routeUserId = route?.params?.userId;
  const {
    targetUserId,
    isOwnProfile,
    profile,
    userPosts,
    followers,
    following,
    loading,
    refreshing,
    activeTab,
    setActiveTab,
    loadProfileData,
    handleRefresh,
    handleToggleFollow,
  } = useCommunityProfile(routeUserId);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Lấy chữ cái đầu tiên của tên để làm avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const navigateToUserProfile = (userId) => {
    // Để tránh việc push màn hình vô hạn khi nhấn vào profile, 
    // chúng ta sẽ điều hướng bằng stack push mới
    navigation.push('CommunityProfile', { userId });
  };

  const renderPostItem = ({ item }) => {
    return (
      <PostCard
        post={item}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        onLike={() => {
          // Khi nhấn like trên trang profile, ta reload lại data để cập nhật số lượt thích tổng
          loadProfileData();
        }}
        onSave={() => {}}
      />
    );
  };

  const renderUserListItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.userListItem}
        onPress={() => navigateToUserProfile(item.userId)}
      >
        <View style={styles.userListAvatar}>
          <Text style={styles.userAvatarText}>{getInitials(item.name)}</Text>
        </View>
        <Text style={styles.userListName}>{item.name}</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={Colors.onSurfaceVariant} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const getListData = () => {
    if (activeTab === 'posts') return userPosts;
    return activeTab === 'followers' ? followers : following;
  };

  const getListEmptyComponent = () => {
    if (loading && !refreshing) return null;
    let iconName = 'document-text-outline';
    let text = 'Chưa đăng bài viết nào.';
    if (activeTab === 'followers') {
      iconName = 'people-outline';
      text = 'Chưa có người theo dõi nào.';
    } else if (activeTab === 'following') {
      iconName = 'people-outline';
      text = 'Chưa theo dõi người dùng nào.';
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={iconName} size={36} color={Colors.onSurfaceVariant} />
        <Text style={styles.emptyText}>{text}</Text>
      </View>
    );
  };

  const renderProfileHeader = () => (
    <View style={{ backgroundColor: Colors.surface }}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(profile?.name)}</Text>
        </View>
        <Text style={styles.profileName}>{profile?.name}</Text>

        {!isOwnProfile ? (
          <TouchableOpacity
            style={[
              styles.followButton,
              profile?.isFollowing && styles.followingButton,
            ]}
            onPress={handleToggleFollow}
          >
            <Ionicons
              name={profile?.isFollowing ? 'checkmark-outline' : 'person-add-outline'}
              size={16}
              color={profile?.isFollowing ? Colors.primary : Colors.surface}
            />
            <Text
              style={[
                styles.followButtonText,
                profile?.isFollowing && styles.followingButtonText,
              ]}
            >
              {profile?.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ownProfileBadge}>
            <Text style={styles.ownProfileText}>Tài khoản của bạn</Text>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.postsCount}</Text>
            <Text style={styles.statLabel}>Bài đăng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.totalLikes}</Text>
            <Text style={styles.statLabel}>Lượt thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.followersCount}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.followingCount}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
        </View>
      </View>

      {/* Tab Controls */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'posts' && styles.tabBtnTextActive]}>Bài đăng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'followers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'followers' && styles.tabBtnTextActive]}>
            Người theo dõi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'following' && styles.tabBtnActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'following' && styles.tabBtnTextActive]}>
            Đang theo dõi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!profile && loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isOwnProfile ? 'Hồ sơ cộng đồng' : profile?.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={getListData()}
        keyExtractor={(item) => item.id || item.userId}
        renderItem={activeTab === 'posts' ? renderPostItem : renderUserListItem}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={getListEmptyComponent()}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
  },
  scrollContent: { paddingBottom: 30 },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarText: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.primary,
  },
  profileName: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleLg,
    color: Colors.onSurface,
    marginBottom: 12,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  followingButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followButtonText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
    color: Colors.surface,
  },
  followingButtonText: {
    color: Colors.primary,
  },
  ownProfileBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  ownProfileText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
  },
  statLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: Typography.fontBody_Bold,
    color: Colors.primary,
  },
  tabContentContainer: {
    paddingVertical: 8,
  },
  tabLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  userListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  userListName: {
    flex: 1,
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodySm,
    color: Colors.onSurface,
  },
  chevron: {
    marginLeft: 8,
  },
});