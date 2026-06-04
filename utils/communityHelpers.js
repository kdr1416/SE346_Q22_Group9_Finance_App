/**
 * Các hàm tiện ích dùng chung cho tính năng Cộng đồng
 */

// Constants
export const POSTS_PER_PAGE = 10;
export const NOTIFICATION_PREVIEW_LENGTH = 30;
export const SEARCH_DEBOUNCE_MS = 500;
export const IMAGE_MAX_DIMENSION = 1200;

/**
 * Định dạng thời gian tương đối sang tiếng Việt thân thiện
 * @param {string} isoString 
 * @returns {string}
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const past = new Date(isoString);
  const now = new Date();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return past.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Chuẩn hóa dữ liệu bài viết từ raw database sang post object
 * @param {object} p - Bài viết thô từ Supabase
 * @param {Set<string>} likedPostIds 
 * @param {Set<string>} savedPostIds 
 * @returns {object}
 */
export const mapPostData = (p, likedPostIds = new Set(), savedPostIds = new Set()) => {
  if (!p) return null;
  return {
    id: p.id,
    authorId: p.author_id,
    authorName: p.profiles?.name || 'Ẩn danh',
    title: p.title || '',
    content: p.content || '',
    postType: p.post_type,
    imageUrl: p.image_url,
    status: p.status,
    likesCount: p.likes_count || 0,
    commentsCount: p.comments_count || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    topics: (p.community_post_topics || []).map((pt) => pt.topic).filter(Boolean),
    isLiked: likedPostIds instanceof Set ? likedPostIds.has(p.id) : Array.isArray(likedPostIds) ? likedPostIds.includes(p.id) : !!likedPostIds,
    isSaved: savedPostIds instanceof Set ? savedPostIds.has(p.id) : Array.isArray(savedPostIds) ? savedPostIds.includes(p.id) : !!savedPostIds,
    metadata: p.metadata || null,
    isBot: p.profiles?.is_bot || false,
  };
};

/**
 * Loại bỏ các ký tự đặc biệt nguy hiểm làm lỗi filter .or() của PostgREST
 * @param {string} str 
 * @returns {string}
 */
export const escapePostgrestFilter = (str) => {
  if (!str) return '';
  return str.replace(/[(),]/g, ' ');
};
