import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTopics,
  getPosts,
  searchPosts,
  toggleLike,
  toggleSave,
  getUserRole,
} from '../../services/communityService';
import { Alert } from 'react-native';

export default function useCommunityFeed(navigation) {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Dữ liệu tĩnh & Phân quyền
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // State quản lý danh sách bảng tin chính
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // State quản lý phần Tìm kiếm bài viết
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchTab, setSearchTab] = useState('all'); // 'all', 'share', 'question'
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);

  // Ref quản lý hoãn kích hoạt tìm kiếm (Debounce)
  const searchTimeoutRef = useRef(null);

  // Refs để tránh stale closures
  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const searchHasMoreRef = useRef(searchHasMore);
  useEffect(() => {
    searchHasMoreRef.current = searchHasMore;
  }, [searchHasMore]);

  // Refs bảo vệ chống click nhanh liên tục (Double-tap guard)
  const likeInProgressRef = useRef(new Set());
  const saveInProgressRef = useRef(new Set());

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 1. Tải danh sách Chủ đề & Phân quyền của người dùng hiện tại
  const loadInitialData = useCallback(async () => {
    try {
      const activeTopics = await getTopics();
      setTopics(activeTopics);

      if (userId) {
        const role = await getUserRole(userId);
        setUserRole(role);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu ban đầu cộng đồng:', error.message);
    }
  }, [userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Tự động tải lại bảng tin khi quay lại màn hình (ví dụ sau khi đăng bài xong)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!searchActive) {
        fetchFeed(1, true);
      }
    });
    return unsubscribe;
  }, [navigation, searchActive]);

  // 2. Tải danh sách bài đăng chính (Có phân trang)
  const fetchFeed = useCallback(
    async (pageNum, isRefresh = false) => {
      if (!isRefresh && pageNum > 1 && !hasMoreRef.current) return;

      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const activeTopicIds = selectedTopicId ? [selectedTopicId] : [];
        const fetchedPosts = await getPosts({
          topicIds: activeTopicIds,
          page: pageNum,
          limit: 10,
          userId,
        });

        if (isRefresh || pageNum === 1) {
          setPosts(fetchedPosts);
          setPage(1);
          setHasMore(fetchedPosts.length === 10);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPosts = fetchedPosts.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
          setPage(pageNum);
          setHasMore(fetchedPosts.length === 10);
        }
      } catch (error) {
        console.error('Lỗi tải bài viết:', error.message);
        Alert.alert('Lỗi', 'Không thể tải danh sách bài viết.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedTopicId, userId]
  );

  // Tự động tải lại bảng tin khi thay đổi lọc chủ đề
  useEffect(() => {
    if (!searchActive) {
      fetchFeed(1, false);
    }
  }, [selectedTopicId, searchActive]);

  // 3. Nghiệp vụ Tìm kiếm bài viết (Có phân trang)
  const fetchSearch = useCallback(
    async (query, tabType, pageNum, isRefresh = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const fetchedResults = await searchPosts(query.trim(), tabType, pageNum, 10, userId);

        if (isRefresh || pageNum === 1) {
          setSearchResults(fetchedResults);
          setSearchPage(1);
          setSearchHasMore(fetchedResults.length === 10);
        } else {
          setSearchResults((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newResults = fetchedResults.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newResults];
          });
          setSearchPage(pageNum);
          setSearchHasMore(fetchedResults.length === 10);
        }
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  // Debounce tìm kiếm: chỉ chạy sau khi ngưng gõ phím 500ms
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
    if (!searchActive) setSearchActive(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setSearchHasMore(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSearch(text, searchTab, 1, false);
    }, 500);
  };

  // Thay đổi tab tìm kiếm ('all' | 'share' | 'question')
  const handleSearchTabChange = (tab) => {
    setSearchTab(tab);
    fetchSearch(searchQuery, tab, 1, false);
  };

  // Kéo xuống để tải lại (Pull-to-refresh)
  const handleRefresh = () => {
    if (searchActive) {
      fetchSearch(searchQuery, searchTab, 1, true);
    } else {
      fetchFeed(1, true);
    }
  };

  // Cuộn xuống để tải thêm (Infinite Scroll)
  const handleLoadMore = () => {
    if (loading || refreshing || loadingMore) return;

    if (searchActive) {
      if (searchHasMoreRef.current) {
        fetchSearch(searchQuery, searchTab, searchPage + 1, false);
      }
    } else {
      if (hasMoreRef.current) {
        fetchFeed(page + 1, false);
      }
    }
  };

  // Tắt chế độ tìm kiếm, quay lại bảng tin mặc định
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    setSearchResults([]);
    setSearchPage(1);
    setSearchHasMore(true);
    fetchFeed(1, false);
  };

  // Lọc chủ đề: Chọn hoặc Bỏ chọn
  const handleTopicSelect = (topicId) => {
    if (selectedTopicId === topicId) {
      setSelectedTopicId(null);
    } else {
      setSelectedTopicId(topicId);
    }
  };

  // Optimistic UI Update: Xử lý Thích/Bỏ thích bài viết lập tức trên UI
  const handleLikePost = async (postId) => {
    if (!userId) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để tương tác với bài viết.');
      return;
    }

    if (likeInProgressRef.current.has(postId)) return;
    likeInProgressRef.current.add(postId);

    const updateLocalList = (list) =>
      list.map((p) => {
        if (p.id === postId) {
          const isLikedNow = !p.isLiked;
          return {
            ...p,
            isLiked: isLikedNow,
            likesCount: isLikedNow ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      });

    // Cập nhật UI ngay lập tức
    if (searchActive) {
      setSearchResults(updateLocalList);
    } else {
      setPosts(updateLocalList);
    }

    try {
      await toggleLike(postId, userId);
    } catch (error) {
      console.error('Lỗi tương tác Like:', error.message);
      // Revert lại trạng thái cũ nếu server báo lỗi
      const revertLocalList = (list) =>
        list.map((p) => {
          if (p.id === postId) {
            const wasLiked = !p.isLiked;
            return {
              ...p,
              isLiked: wasLiked,
              likesCount: wasLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        });

      if (searchActive) {
        setSearchResults(revertLocalList);
      } else {
        setPosts(revertLocalList);
      }
      Alert.alert('Thất bại', 'Không thể hoàn tất thao tác thích bài viết.');
    } finally {
      likeInProgressRef.current.delete(postId);
    }
  };

  // Optimistic UI Update: Xử lý Lưu/Bỏ lưu bài viết lập tức trên UI
  const handleSavePost = async (postId) => {
    if (!userId) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để tương tác với bài viết.');
      return;
    }

    if (saveInProgressRef.current.has(postId)) return;
    saveInProgressRef.current.add(postId);

    const updateLocalList = (list) =>
      list.map((p) => {
        if (p.id === postId) {
          return { ...p, isSaved: !p.isSaved };
        }
        return p;
      });

    // Cập nhật UI ngay lập tức
    if (searchActive) {
      setSearchResults(updateLocalList);
    } else {
      setPosts(updateLocalList);
    }

    try {
      await toggleSave(postId, userId);
    } catch (error) {
      console.error('Lỗi tương tác Save:', error.message);
      // Revert lại trạng thái cũ nếu lỗi
      const revertLocalList = (list) =>
        list.map((p) => {
          if (p.id === postId) {
            return { ...p, isSaved: !p.isSaved };
          }
          return p;
        });

      if (searchActive) {
        setSearchResults(revertLocalList);
      } else {
        setPosts(revertLocalList);
      }
      Alert.alert('Thất bại', 'Không thể hoàn tất thao tác lưu bài viết.');
    } finally {
      saveInProgressRef.current.delete(postId);
    }
  };

  return {
    topics,
    selectedTopicId,
    userRole,
    posts: searchActive ? searchResults : posts,
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
  };
}
