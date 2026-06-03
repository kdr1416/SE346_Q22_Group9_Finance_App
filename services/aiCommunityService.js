import { supabase } from '../lib/supabase';

/**
 * Gọi Supabase Edge Function để phân tích nội dung bài đăng bằng AI.
 * Fire-and-forget: không block UI, không throw lỗi ra ngoài.
 *
 * @param {object} post - Object bài đăng vừa tạo (từ createPost)
 * @param {string} post.id - ID bài đăng
 * @param {string} post.author_id - ID tác giả
 * @param {string} post.title - Tiêu đề
 * @param {string} post.content - Nội dung HTML
 */
export const analyzePostAfterPublish = (post) => {
  if (!post?.id) return;

  // Fire-and-forget: không await, không block
  supabase.functions
    .invoke('moderate-community-post', {
      body: {
        postId: post.id,
        authorId: post.author_id,
        title: post.title,
        content: post.content,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.error('[AI Moderation] Edge Function error:', error.message);
      }
    })
    .catch((err) => {
      console.error('[AI Moderation] Network error:', err.message);
    });
};
