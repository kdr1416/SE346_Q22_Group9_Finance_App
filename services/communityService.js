import { supabase } from '../lib/supabase';
import { mapPostData, escapePostgrestFilter, NOTIFICATION_PREVIEW_LENGTH } from '../utils/communityHelpers';

/**
 * Helper: Kiểm tra user có role admin/moderator không.
 * Dùng làm defense-in-depth trước khi gọi query (RLS vẫn là guard chính).
 * @param {string} userId
 * @throws {Error} nếu không phải admin/moderator
 */
const requireAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('user_community_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error('Không thể xác minh quyền quản trị.');
  if (!data || !['admin', 'moderator'].includes(data.role)) {
    throw new Error('Bạn không có quyền thực hiện thao tác này.');
  }
  return data.role;
};

/**
 * Helper: Giải mã chuỗi Base64 thành ArrayBuffer trong React Native
 */
const decodeBase64 = (base64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  const cleanBase64 = base64.replace(/=/g, '');
  const len = cleanBase64.length;
  const bufferLength = Math.floor(len * 0.75);
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const chunk = 
      (lookup[cleanBase64.charCodeAt(i)] << 18) |
      (lookup[cleanBase64.charCodeAt(i + 1)] << 12) |
      ((i + 2 < len ? lookup[cleanBase64.charCodeAt(i + 2)] : 0) << 6) |
      (i + 3 < len ? lookup[cleanBase64.charCodeAt(i + 3)] : 0);
      
    bytes[p++] = (chunk >> 16) & 255;
    if (i + 2 < len && p < bufferLength) {
      bytes[p++] = (chunk >> 8) & 255;
    }
    if (i + 3 < len && p < bufferLength) {
      bytes[p++] = chunk & 255;
    }
  }
  return bytes.buffer;
};

/**
 * Helper: Upload ảnh lên Supabase Storage bucket 'community-images'
 * @param {string} imageUri - Đường dẫn cục bộ của ảnh (file://...)
 * @returns {Promise<string|null>} Public URL của ảnh hoặc null
 */
export const uploadImage = async (imageUri) => {
  if (!imageUri) return null;

  try {
    const ext = imageUri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `posts/${fileName}`;

    // 1. Đọc tệp tin thành Blob bằng XMLHttpRequest
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Lỗi đọc file cục bộ: XMLHttpRequest thất bại"));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', imageUri, true);
      xhr.send(null);
    });

    // 2. Chuyển đổi Blob thành Base64 bằng FileReader (Để tránh lỗi Network request failed của fetch trong React Native)
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error("Lỗi đọc file thành Base64"));
      };
      reader.readAsDataURL(blob);
    });

    // 3. Giải mã Base64 thành ArrayBuffer
    const arrayBuffer = decodeBase64(base64Data);

    // 4. Tải ArrayBuffer lên Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('community-images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${ext}`,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('community-images')
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (error) {
    console.error('Lỗi upload ảnh:', error.message);
    throw error;
  }
};

/**
 * 1. Lấy danh sách các chủ đề đang hoạt động
 */
export const getTopics = async (showInactive = false) => {
  let query = supabase.from('community_topics').select('*');

  if (!showInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) throw error;

  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    iconName: t.icon_name,
    color: t.color,
    sortOrder: t.sort_order,
    isActive: t.is_active,
  }));
};

/**
 * 2. Lấy danh sách bài đăng có phân trang, lọc theo danh mục
 */
export const getPosts = async ({ topicIds = [], page = 1, limit = 10, userId, authorId }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let postIds = [];
    if (topicIds && topicIds.length > 0) {
      const { data: ptData, error: ptError } = await supabase
        .from('community_post_topics')
        .select('post_id')
        .in('topic_id', topicIds);

      if (ptError) throw ptError;
      postIds = (ptData || []).map((pt) => pt.post_id);
      if (postIds.length === 0) return [];
    }

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles!author_id (id, name),
        community_post_topics (
          topic:community_topics (id, name, icon_name, color)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (topicIds && topicIds.length > 0) {
      query = query.in('id', postIds);
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data, error } = await query.range(from, to);
    if (error) throw error;

    let likedPostIds = new Set();
    let savedPostIds = new Set();

    if (userId && data && data.length > 0) {
      const fetchedPostIds = data.map((p) => p.id);
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('community_likes').select('post_id').eq('user_id', userId).in('post_id', fetchedPostIds),
        supabase.from('community_saves').select('post_id').eq('user_id', userId).in('post_id', fetchedPostIds),
      ]);

      (likes || []).forEach((l) => likedPostIds.add(l.post_id));
      (saves || []).forEach((s) => savedPostIds.add(s.post_id));
    }

    return data.map((p) => mapPostData(p, likedPostIds, savedPostIds));
  } catch (error) {
    console.error('Lỗi lấy danh sách bài viết:', error.message);
    throw error;
  }
};

/**
 * 3. Tìm kiếm bài viết có phân trang, hỗ trợ lọc loại bài
 */
export const searchPosts = async (queryStr, type = 'all', page = 1, limit = 10, userId) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const escapedQuery = escapePostgrestFilter(queryStr);

  try {
    let q = supabase
      .from('community_posts')
      .select(`
        *,
        profiles!author_id (id, name),
        community_post_topics (
          topic:community_topics (id, name, icon_name, color)
        )
      `)
      .eq('status', 'active')
      .or(`title.ilike.%${escapedQuery}%,content.ilike.%${escapedQuery}%`)
      .order('created_at', { ascending: false });

    if (type === 'share' || type === 'question') {
      q = q.eq('post_type', type);
    }

    const { data, error } = await q.range(from, to);
    if (error) throw error;

    let likedPostIds = new Set();
    let savedPostIds = new Set();

    if (userId && data && data.length > 0) {
      const fetchedPostIds = data.map((p) => p.id);
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('community_likes').select('post_id').eq('user_id', userId).in('post_id', fetchedPostIds),
        supabase.from('community_saves').select('post_id').eq('user_id', userId).in('post_id', fetchedPostIds),
      ]);

      (likes || []).forEach((l) => likedPostIds.add(l.post_id));
      (saves || []).forEach((s) => savedPostIds.add(s.post_id));
    }

    return data.map((p) => mapPostData(p, likedPostIds, savedPostIds));
  } catch (error) {
    console.error('Lỗi tìm kiếm bài viết:', error.message);
    throw error;
  }
};

/**
 * 4. Lấy chi tiết bài viết
 */
export const getPostById = async (postId, userId) => {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      profiles!author_id (id, name),
      community_post_topics (
        topic:community_topics (id, name, icon_name, color)
      )
    `)
    .eq('id', postId)
    .single();

  if (error) throw error;
  if (!data) return null;

  let isLiked = false;
  let isSaved = false;

  if (userId) {
    const [{ data: like }, { data: save }] = await Promise.all([
      supabase.from('community_likes').select('*').eq('post_id', postId).eq('user_id', userId).maybeSingle(),
      supabase.from('community_saves').select('*').eq('post_id', postId).eq('user_id', userId).maybeSingle(),
    ]);
    isLiked = !!like;
    isSaved = !!save;
  }

  return mapPostData(data, isLiked, isSaved);
};

/**
 * 5. Tạo bài viết hoặc câu hỏi
 */
export const createPost = async ({ authorId, title, content, postType = 'share', topicIds = [], imageUri }) => {
  let imageUrl = null;
  if (imageUri) {
    imageUrl = await uploadImage(imageUri);
  }

  const { data: post, error: postError } = await supabase
    .from('community_posts')
    .insert({
      author_id: authorId,
      title,
      content,
      post_type: postType,
      image_url: imageUrl,
      status: 'active',
  moderation_status: 'pending_ai',
    })
    .select()
    .single();

  if (postError) throw postError;

  if (post && topicIds && topicIds.length > 0) {
    const topicRows = topicIds.map((tId) => ({
      post_id: post.id,
      topic_id: tId,
    }));
    const { error: topicError } = await supabase
      .from('community_post_topics')
      .insert(topicRows);

    if (topicError) throw topicError;
  }

  return post;
};

/**
 * 6. Cập nhật bài viết
 */
export const updatePost = async (postId, { title, content, topicIds = [], imageUri, keepExistingImage = true }) => {
  let imageUrl = undefined;
  if (!keepExistingImage) {
    if (imageUri) {
      imageUrl = await uploadImage(imageUri);
    } else {
      imageUrl = null;
    }
  } else if (imageUri && !imageUri.startsWith('http')) {
    imageUrl = await uploadImage(imageUri);
  }

  const updates = {
    title,
    content,
    updated_at: new Date().toISOString(),
  };
  if (imageUrl !== undefined) {
    updates.image_url = imageUrl;
  }

  const { error: postError } = await supabase
    .from('community_posts')
    .update(updates)
    .eq('id', postId);

  if (postError) throw postError;

  if (topicIds && topicIds.length > 0) {
    await supabase.from('community_post_topics').delete().eq('post_id', postId);

    const topicRows = topicIds.map((tId) => ({
      post_id: postId,
      topic_id: tId,
    }));
    const { error: topicError } = await supabase
      .from('community_post_topics')
      .insert(topicRows);

    if (topicError) throw topicError;
  }
};

/**
 * 7. Soft delete bài viết
 */
export const deletePost = async (postId) => {
  const { error } = await supabase
    .from('community_posts')
    .update({ status: 'deleted' })
    .eq('id', postId);

  if (error) throw error;
};

/**
 * 8. Lấy danh sách bình luận
 */
export const getComments = async (postId) => {
  const { data, error } = await supabase
    .from('community_comments')
    .select(`
      *,
      profiles!author_id (id, name)
    `)
    .eq('post_id', postId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorId: c.author_id,
    authorName: c.profiles?.name || 'Ẩn danh',
    content: c.content,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
};

/**
 * 9. Bình luận vào bài đăng
 */
export const createComment = async (postId, authorId, content) => {
  const { data: comment, error: commentError } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
      status: 'active',
    })
    .select()
    .single();

  if (commentError) throw commentError;

  try {
    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id, title')
      .eq('id', postId)
      .single();

    if (post && post.author_id !== authorId) {
      const { data: commenter } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', authorId)
        .single();

      const commenterName = commenter?.name || 'Ai đó';
      await supabase
        .from('community_notifications')
        .insert({
          user_id: post.author_id,
          actor_id: authorId,
          type: 'comment',
          target_type: 'post',
          target_id: postId,
          content: `${commenterName} đã bình luận về bài đăng của bạn: "${(post?.title || '').substring(0, NOTIFICATION_PREVIEW_LENGTH)}..."`,
        });
    }
  } catch (err) {
    console.error('Lỗi tạo thông báo bình luận:', err.message);
  }

  return comment;
};

/**
 * 10. Chỉnh sửa bình luận
 */
export const updateComment = async (commentId, content) => {
  const { error } = await supabase
    .from('community_comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId);

  if (error) throw error;
};

/**
 * 11. Xóa bình luận
 */
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('community_comments')
    .update({ status: 'deleted' })
    .eq('id', commentId);

  if (error) throw error;
};

/**
 * 12. Like / Bỏ like bài viết
 */
export const toggleLike = async (postId, userId) => {
  const { data: existingLike, error: checkError } = await supabase
    .from('community_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingLike) {
    const { error: unlikeError } = await supabase
      .from('community_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (unlikeError) throw unlikeError;
    return { isLiked: false };
  } else {
    const { error: likeError } = await supabase
      .from('community_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (likeError) throw likeError;

    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('author_id, title')
        .eq('id', postId)
        .single();

      if (post && post.author_id !== userId) {
        const { data: liker } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();

        const likerName = liker?.name || 'Ai đó';
        await supabase
          .from('community_notifications')
          .insert({
            user_id: post.author_id,
            actor_id: userId,
            type: 'like',
            target_type: 'post',
            target_id: postId,
            content: `${likerName} đã thích bài viết của bạn: "${(post?.title || '').substring(0, NOTIFICATION_PREVIEW_LENGTH)}..."`,
          });
      }
    } catch (err) {
      console.error('Lỗi tạo thông báo thích:', err.message);
    }

    return { isLiked: true };
  }
};

/**
 * 13. Lưu / Bỏ lưu bài viết
 */
export const toggleSave = async (postId, userId) => {
  const { data: existingSave, error: checkError } = await supabase
    .from('community_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingSave) {
    const { error: unsaveError } = await supabase
      .from('community_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (unsaveError) throw unsaveError;
    return { isSaved: false };
  } else {
    const { error: saveError } = await supabase
      .from('community_saves')
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (saveError) throw saveError;
    return { isSaved: true };
  }
};

/**
 * 14. Lấy danh sách bài viết đã lưu
 */
export const getSavedPosts = async (userId) => {
  const { data, error } = await supabase
    .from('community_saves')
    .select(`
      post:community_posts (
        *,
        profiles!author_id (id, name),
        community_post_topics (
          topic:community_topics (id, name, icon_name, color)
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const posts = (data || [])
    .map((s) => s.post)
    .filter((p) => p !== null && p.status === 'active');

  let likedPostIds = new Set();
  if (userId && posts.length > 0) {
    const fetchedPostIds = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from('community_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', fetchedPostIds);

    (likes || []).forEach((l) => likedPostIds.add(l.post_id));
  }

  return posts.map((p) => mapPostData(p, likedPostIds, true));
};

/**
 * 15. Tạo báo cáo nội dung xấu
 */
export const createReport = async ({ reporterId, targetType, targetId, reason, detail }) => {
  const { data, error } = await supabase
    .from('community_reports')
    .insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * 16. Admin/Moderator: Xem danh sách báo cáo
 */
export const getReports = async (statusFilter = 'pending', callerId = null) => {
  if (callerId) await requireAdmin(callerId);

  const { data, error } = await supabase
    .from('community_reports')
    .select(`
      *,
      reporter:profiles!reporter_id (id, name)
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const postIds = (data || []).filter(r => r.target_type === 'post').map(r => r.target_id);
  const commentIds = (data || []).filter(r => r.target_type === 'comment').map(r => r.target_id);

  let postsMap = {};
  let commentsMap = {};

  try {
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from('community_posts')
        .select('id, title, author_id, profiles!author_id(name)')
        .in('id', postIds);
      (posts || []).forEach(p => {
        postsMap[p.id] = {
          title: p.title,
          authorId: p.author_id,
          authorName: p.profiles?.name || 'Ẩn danh'
        };
      });
    }

    if (commentIds.length > 0) {
      const { data: comments } = await supabase
        .from('community_comments')
        .select('id, content, author_id, profiles!author_id(name)')
        .in('id', commentIds);
      (comments || []).forEach(c => {
        commentsMap[c.id] = {
          content: c.content,
          authorId: c.author_id,
          authorName: c.profiles?.name || 'Ẩn danh'
        };
      });
    }
  } catch (err) {
    console.error('Lỗi lấy thông tin batch reports:', err.message);
  }

  return (data || []).map((report) => {
    let targetPreview = '';
    let targetAuthorName = '';
    let targetAuthorId = '';

    if (report.target_type === 'post') {
      const post = postsMap[report.target_id];
      targetPreview = post?.title || 'Bài viết không tồn tại';
      targetAuthorName = post?.authorName || 'Ẩn danh';
      targetAuthorId = post?.authorId || '';
    } else {
      const comment = commentsMap[report.target_id];
      targetPreview = comment?.content || 'Bình luận không tồn tại';
      targetAuthorName = comment?.authorName || 'Ẩn danh';
      targetAuthorId = comment?.authorId || '';
    }

    return {
      id: report.id,
      reporterId: report.reporter_id,
      reporterName: report.reporter?.name || 'Ẩn danh',
      targetType: report.target_type,
      targetId: report.target_id,
      reason: report.reason,
      detail: report.detail,
      status: report.status,
      reviewedBy: report.reviewed_by,
      reviewedAt: report.reviewed_at,
      reviewResult: report.review_result,
      createdAt: report.created_at,
      targetPreview,
      targetAuthorName,
      targetAuthorId,
    };
  });
};

/**
 * 17. Admin/Moderator: Xử lý báo cáo nội dung
 */
export const resolveReport = async (reportId, adminId, action, reviewResult) => {
  await requireAdmin(adminId);

  const status = action === 'dismiss' ? 'dismissed' : 'reviewed';

  const { data: report, error: reportError } = await supabase
    .from('community_reports')
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_result: reviewResult,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (reportError) throw reportError;

  if (action === 'hide' && report) {
    if (report.target_type === 'post') {
      await supabase.from('community_posts').update({ status: 'hidden' }).eq('id', report.target_id);
    } else {
      await supabase.from('community_comments').update({ status: 'hidden' }).eq('id', report.target_id);
    }
  }

  try {
    if (report) {
      await supabase
        .from('community_notifications')
        .insert({
          user_id: report.reporter_id,
          actor_id: adminId,
          type: 'report_resolved',
          target_type: report.target_type,
          target_id: report.target_id,
          content: `Báo cáo của bạn về ${report.target_type === 'post' ? 'bài viết' : 'bình luận'} đã được phản hồi: "${reviewResult}"`,
        });
    }
  } catch (err) {
    console.error('Lỗi tạo thông báo xử lý báo cáo:', err.message);
  }
};

/**
 * 18. Admin/Moderator: Tạo mới chủ đề
 */
export const createTopic = async (name, iconName, color, sortOrder = 0) => {
  const { data, error } = await supabase
    .from('community_topics')
    .insert({
      name,
      icon_name: iconName,
      color,
      sort_order: sortOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * 19. Admin/Moderator: Cập nhật chủ đề
 */
export const updateTopic = async (topicId, updates) => {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.iconName !== undefined) mapped.icon_name = updates.iconName;
  if (updates.color !== undefined) mapped.color = updates.color;
  if (updates.sortOrder !== undefined) mapped.sort_order = updates.sortOrder;
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive;

  const { error } = await supabase
    .from('community_topics')
    .update(mapped)
    .eq('id', topicId);

  if (error) throw error;
};

/**
 * 20. Admin/Moderator: Xóa (Vô hiệu hóa) chủ đề
 */
export const deleteTopic = async (topicId) => {
  const { error } = await supabase
    .from('community_topics')
    .update({ is_active: false })
    .eq('id', topicId);

  if (error) throw error;
};

/**
 * 21. Xem thông báo cộng đồng
 */
export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('community_notifications')
    .select(`
      *,
      actor:profiles!actor_id (id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((n) => ({
    id: n.id,
    userId: n.user_id,
    actorId: n.actor_id,
    actorName: n.actor?.name || 'Ẩn danh',
    type: n.type,
    targetType: n.target_type,
    targetId: n.target_id,
    content: n.content,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
};

/**
 * 22. Đánh dấu một thông báo đã đọc
 */
export const markNotificationRead = async (notifId) => {
  const { error } = await supabase
    .from('community_notifications')
    .update({ is_read: true })
    .eq('id', notifId);

  if (error) throw error;
};

/**
 * 23. Đánh dấu tất cả thông báo đã đọc
 */
export const markAllNotificationsRead = async (userId) => {
  const { error } = await supabase
    .from('community_notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * 24. Xem hồ sơ cộng đồng cơ bản và thống kê tương tác
 */
export const getCommunityProfile = async (profileUserId, currentUserId) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileUserId)
    .single();

  if (profileError) throw profileError;

  const [
    { count: postsCount },
    { count: followersCount },
    { count: followingCount },
    isFollowingRes
  ] = await Promise.all([
    supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('author_id', profileUserId).eq('status', 'active'),
    supabase.from('community_follows').select('*', { count: 'exact', head: true }).eq('following_id', profileUserId),
    supabase.from('community_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileUserId),
    currentUserId
      ? supabase.from('community_follows').select('id').eq('follower_id', currentUserId).eq('following_id', profileUserId).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const { data: userPosts } = await supabase
    .from('community_posts')
    .select('likes_count')
    .eq('author_id', profileUserId)
    .eq('status', 'active');

  const totalLikes = (userPosts || []).reduce((acc, p) => acc + (p.likes_count || 0), 0);

  return {
    userId: profile.id,
    name: profile.name,
    postsCount: postsCount || 0,
    totalLikes: totalLikes || 0,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    isFollowing: !!isFollowingRes.data,
  };
};

/**
 * 25. Theo dõi hoặc Hủy theo dõi người dùng
 */
export const toggleFollow = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new Error('Bạn không thể theo dõi chính mình.');
  }

  const { data: existingFollow, error: checkError } = await supabase
    .from('community_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingFollow) {
    const { error: unfollowError } = await supabase
      .from('community_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (unfollowError) throw unfollowError;
    return { isFollowing: false };
  } else {
    const { error: followError } = await supabase
      .from('community_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (followError) throw followError;

    try {
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', followerId)
        .single();

      const followerName = followerProfile?.name || 'Ai đó';
      await supabase
        .from('community_notifications')
        .insert({
          user_id: followingId,
          actor_id: followerId,
          type: 'follow',
          target_type: 'user',
          target_id: followerId,
          content: `${followerName} đã bắt đầu theo dõi bạn.`,
        });
    } catch (err) {
      console.error('Lỗi tạo thông báo follow:', err.message);
    }

    return { isFollowing: true };
  }
};

/**
 * 26. Lấy danh sách người theo dõi (Followers)
 */
export const getFollowers = async (userId) => {
  const { data, error } = await supabase
    .from('community_follows')
    .select(`
      follower:profiles!follower_id (id, name)
    `)
    .eq('following_id', userId);

  if (error) throw error;

  return (data || [])
    .map((f) => f.follower)
    .filter(Boolean)
    .map((u) => ({
      userId: u.id,
      name: u.name,
    }));
};

/**
 * 27. Lấy danh sách đang theo dõi (Following)
 */
export const getFollowing = async (userId) => {
  const { data, error } = await supabase
    .from('community_follows')
    .select(`
      following:profiles!following_id (id, name)
    `)
    .eq('follower_id', userId);

  if (error) throw error;

  return (data || [])
    .map((f) => f.following)
    .filter(Boolean)
    .map((u) => ({
      userId: u.id,
      name: u.name,
    }));
};

/**
 * 28. Kiểm tra vai trò của người dùng trong cộng đồng
 */
export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('user_community_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role || null;
};

/**
 * 29. Kiểm tra xem người dùng có đang bị hạn chế hoạt động không
 */
export const checkUserRestriction = async (userId) => {
  const { data, error } = await supabase
    .from('user_restrictions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('restricted_at', { ascending: false });

  if (error) throw error;

  const activeRestrictions = (data || []).filter((r) => {
    if (r.expires_at && new Date(r.expires_at) < new Date()) {
      supabase
        .from('user_restrictions')
        .update({ is_active: false })
        .eq('id', r.id)
        .then(() => {});
      return false;
    }
    return true;
  });

  if (activeRestrictions.length === 0) return null;

  const res = activeRestrictions[0];
  return {
    restrictionType: res.restriction_type,
    reason: res.reason,
    expiresAt: res.expires_at,
  };
};

/**
 * 30. Admin/Moderator: Hạn chế hoạt động của người dùng
 */
export const restrictUser = async (userId, restrictionType, reason, adminId, durationDays = null) => {
  await requireAdmin(adminId);

  let expiresAt = null;
  if (durationDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
  }

  const { data, error } = await supabase
    .from('user_restrictions')
    .insert({
      user_id: userId,
      restriction_type: restrictionType,
      reason,
      restricted_by: adminId,
      expires_at: expiresAt?.toISOString() || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};