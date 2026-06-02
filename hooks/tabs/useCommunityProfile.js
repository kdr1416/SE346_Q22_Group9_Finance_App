import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCommunityProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getPosts,
} from '../../services/communityService';

export const useCommunityProfile = (profileUserId) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const targetUserId = profileUserId || currentUserId; // Mặc định là tài khoản hiện tại nếu không truyền profileUserId
  const isOwnProfile = targetUserId === currentUserId;

  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'followers' | 'following'

  const loadProfileData = useCallback(async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const profileData = await getCommunityProfile(targetUserId, currentUserId);
      setProfile(profileData);

      // Load dữ liệu tùy theo tab đang chọn để tối ưu hiệu năng
      if (activeTab === 'posts') {
        const posts = await getPosts({ authorId: targetUserId, userId: currentUserId });
        setUserPosts(posts);
      } else if (activeTab === 'followers') {
        const list = await getFollowers(targetUserId);
        setFollowers(list);
      } else if (activeTab === 'following') {
        const list = await getFollowing(targetUserId);
        setFollowing(list);
      }
    } catch (error) {
      console.error('Lỗi tải hồ sơ cộng đồng:', error.message);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, currentUserId, activeTab]);

  const handleRefresh = useCallback(async () => {
    if (!targetUserId) return;
    setRefreshing(true);
    try {
      const profileData = await getCommunityProfile(targetUserId, currentUserId);
      setProfile(profileData);

      const posts = await getPosts({ authorId: targetUserId, userId: currentUserId });
      setUserPosts(posts);

      const listFollowers = await getFollowers(targetUserId);
      setFollowers(listFollowers);

      const listFollowing = await getFollowing(targetUserId);
      setFollowing(listFollowing);
    } catch (error) {
      console.error('Lỗi refresh hồ sơ:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [targetUserId, currentUserId]);

  const handleToggleFollow = async () => {
    if (isOwnProfile) {
      Alert.alert('Thông báo', 'Bạn không thể tự theo dõi chính mình.');
      return;
    }
    if (!currentUserId) return;

    // Optimistic UI update
    const previousProfile = { ...profile };
    const nextIsFollowing = !profile.isFollowing;
    const nextFollowersCount = profile.followersCount + (nextIsFollowing ? 1 : -1);

    setProfile((prev) => ({
      ...prev,
      isFollowing: nextIsFollowing,
      followersCount: nextFollowersCount,
    }));

    try {
      await toggleFollow(currentUserId, targetUserId);
      // Cập nhật lại danh sách người theo dõi của profile đó nếu đang ở tab followers
      if (activeTab === 'followers') {
        const list = await getFollowers(targetUserId);
        setFollowers(list);
      }
    } catch (error) {
      console.error('Lỗi theo dõi/hủy theo dõi:', error.message);
      Alert.alert('Lỗi', error.message || 'Không thể thực hiện thao tác.');
      // Rollback
      setProfile(previousProfile);
    }
  };

  return {
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
  };
};
