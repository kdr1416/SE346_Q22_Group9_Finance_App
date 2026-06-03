// moderate-community-post — Supabase Edge Function
// Deploy: supabase functions deploy moderate-community-post
// Secrets:
//   supabase secrets set GEMINI_API_KEY=your_key_here
//   supabase secrets set GEMINI_MODEL=gemini-2.5-flash

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ModerationDecision = 'approved' | 'flagged' | 'rejected';

type ModerationResult = {
  decision: ModerationDecision;
  riskScore: number;
  categories: string[];
  reason: string;
};

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

const corsHeaders = {
  // TODO: Thay domain cu the cua app khi deploy production
    'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/** Strip HTML tags → plain text */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeModerationResult(parsed: any): ModerationResult {
  const validDecisions: ModerationDecision[] = [
    'approved',
    'flagged',
    'rejected',
  ];

  const decision: ModerationDecision = validDecisions.includes(parsed?.decision)
    ? parsed.decision
    : 'flagged';

  const rawScore = Number(parsed?.riskScore);
  const riskScore = Number.isFinite(rawScore)
    ? Math.min(1, Math.max(0, rawScore))
    : 0.5;

  const categories = Array.isArray(parsed?.categories)
    ? parsed.categories.map((item: unknown) => String(item))
    : [];

  const reason =
    typeof parsed?.reason === 'string' && parsed.reason.trim()
      ? parsed.reason.trim()
      : 'Không có lý do cụ thể';

  return {
    decision,
    riskScore,
    categories,
    reason,
  };
}

/** Gọi Gemini API để phân tích nội dung */
async function analyzeWithGemini(
  apiKey: string,
  title: string,
  plainContent: string
): Promise<ModerationResult> {
  const prompt = `Bạn là hệ thống kiểm duyệt nội dung cho một cộng đồng tài chính cá nhân dành cho sinh viên Việt Nam.

Nhiệm vụ:
Phân tích bài đăng dưới đây và trả về JSON hợp lệ. Không dùng markdown. Không giải thích thêm ngoài JSON.

Tiêu đề:
${title}

Nội dung:
${plainContent}

Trả về đúng format JSON sau:
{
  "decision": "approved" | "flagged" | "rejected",
  "riskScore": 0.0,
  "categories": [],
  "reason": "Lý do ngắn gọn bằng tiếng Việt"
}

Quy tắc phân loại:
- "approved": Nội dung an toàn, phù hợp cộng đồng tài chính cá nhân. riskScore < 0.3.
- "flagged": Có dấu hiệu nghi ngờ nhẹ hoặc trung bình, cần admin xem lại. 0.3 <= riskScore < 0.7. Ví dụ: quảng cáo nhẹ, link lạ, ngôn ngữ thiếu lịch sự, lời khuyên tài chính thiếu căn cứ.
- "rejected": Vi phạm quy tắc rõ ràng, nghiêm trọng. riskScore >= 0.7. Ví dụ: lừa đảo tài chính, spam nghiêm trọng, kích động thù ghét, bạo lực, nội dung tình dục, tiết lộ thông tin cá nhân, hướng dẫn hành vi nguy hiểm, lời khuyên tài chính gây hiểu lầm nghiêm trọng.

Danh mục vi phạm có thể gồm:
"spam", "scam", "hate_speech", "violence", "sexual_content", "personal_info", "misleading_financial_advice", "advertising", "harassment", "other"

Hạn chế hiện tại: Phien lam viec nay chi phan tich text, chua phan tich anh.
Đề xuất: Nếu muốn kiểm duyệt ảnh, dùng Gemini Vision API (multimodal) hoặc thêm OCR.

Lưu ý:
- Chỉ trả về JSON hợp lệ.`;

  const apiVersion = 'v1beta';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const rawResponse = await res.text();

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${rawResponse}`);
  }

  let data: any;
  try {
    data = JSON.parse(rawResponse);
  } catch {
    throw new Error(`Cannot parse Gemini API response: ${rawResponse.slice(0, 300)}`);
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!rawText) {
    throw new Error('Gemini returned empty text response');
  }

  let parsed: any;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Cannot extract JSON from Gemini response: ${rawText.slice(0, 300)}`);
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  return normalizeModerationResult(parsed);
}

async function updatePostModeration(
  supabaseAdmin: any,
  postId: string,
  result: ModerationResult
) {
  const now = new Date().toISOString();
  
  const postUpdate: Record<string, unknown> = {
    moderation_status: result.decision,
    moderation_score: result.riskScore,
    moderation_reason: result.reason,
    moderation_categories: result.categories,
    moderated_at: now,
  };

  // Nếu rejected -> tự động ẩn bài viết (status = 'hidden')
  if (result.decision === 'rejected') {
    postUpdate.status = 'hidden';
  }

  const { error } = await supabaseAdmin
    .from('community_posts')
    .update(postUpdate)
    .eq('id', postId);

  if (error) {
    throw new Error(`Update community_posts failed: ${error.message}`);
  }
}

async function insertModerationLog(
  supabaseAdmin: any,
  params: {
    postId: string;
    authorId?: string | null;
    result: ModerationResult;
  }
) {
  const { error } = await supabaseAdmin
    .from('ai_moderation_logs')
    .insert({
      post_id: params.postId,
      author_id: params.authorId || null,
      decision: params.result.decision,
      risk_score: params.result.riskScore,
      categories: params.result.categories,
      reason: params.result.reason,
    });

  if (error) {
    console.error('[moderate-community-post] Insert ai_moderation_logs error:', error);
  }
}

/**
 * Gửi thông báo đến tác giả bài đăng nếu bài viết bị Rejected (ẩn bài).
 */
async function notifyUserIfRejected(
  supabaseAdmin: any,
  params: {
    postId: string;
    authorId?: string | null;
    title: string;
    result: ModerationResult;
  }
) {
  if (params.result.decision !== 'rejected' || !params.authorId) return;

  const reasonText = params.result.reason || 'Vi phạm quy tắc cộng đồng';
  const categoryText = params.result.categories.length > 0
    ? ` (${params.result.categories.join(', ')})`
    : '';

  const { error } = await supabaseAdmin
    .from('community_notifications')
    .insert({
      user_id: params.authorId,
      actor_id: params.authorId,
      type: 'moderation',
      target_type: 'post',
      target_id: params.postId,
      content: `Bài viết "${params.title.slice(0, 50)}" đã bị ẩn do vi phạm: ${reasonText}${categoryText}. Liên hệ admin nếu bạn cho rằng đây là nhầm lẫn.`,
    });

  if (error) {
    console.error('[moderate-community-post] Send notification error:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    let body: any = {};

    try {
      body = await req.json();
    } catch (e) {
      console.error(
        '[moderate-community-post] Failed to parse request body:',
        e instanceof Error ? e.message : e
      );
      body = {};
    }

    console.log('[moderate-community-post] Received body:', JSON.stringify(body));

    const { postId, authorId, title, content, cron } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiKey) {
      console.error('[moderate-community-post] GEMINI_API_KEY not set');

      // Không trả 500 để client không hiểu nhầm là đăng bài thất bại.
      return jsonResponse({
        success: false,
        error: 'AI service not configured',
        decision: 'pending_ai',
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[moderate-community-post] Missing Supabase env variables');

      return jsonResponse({
        success: false,
        error: 'Supabase service not configured',
        decision: 'pending_ai',
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // =========================================================
    // CRON MODE: quét các bài pending_ai bị kẹt
    // =========================================================
    if (cron === true || cron === 'true' || String(cron).toLowerCase() === 'true') {
      console.log('[moderate-community-post] Running cron job to moderate pending posts...');

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data: pendingPosts, error: fetchError } = await supabaseAdmin
        .from('community_posts')
        .select('id, author_id, title, content')
        .eq('moderation_status', 'pending_ai')
        .eq('status', 'active')
        .lt('created_at', twoMinutesAgo)
        .limit(10);

      if (fetchError) {
        console.error('[moderate-community-post] Fetch pending posts error:', fetchError);
        return jsonResponse({ success: false, error: fetchError.message }, 500);
      }

      if (!pendingPosts || pendingPosts.length === 0) {
        console.log('[moderate-community-post] No pending posts to moderate.');
        return jsonResponse({ success: true, processed: 0, results: [] });
      }

      console.log(
        `[moderate-community-post] Found ${pendingPosts.length} pending posts. Moderating...`
      );

      const results = [];

      for (const post of pendingPosts) {
        try {
          const plainContent = stripHtml(post.content || '');

          const result = await analyzeWithGemini(
            geminiKey,
            post.title || '',
            plainContent
          );

          await updatePostModeration(supabaseAdmin, post.id, result);

          await insertModerationLog(supabaseAdmin, {
            postId: post.id,
            authorId: post.author_id || null,
            result,
          });

          await notifyUserIfRejected(supabaseAdmin, {
            postId: post.id,
            authorId: post.author_id,
            title: post.title || '',
            result,
          });

          results.push({
            postId: post.id,
            decision: result.decision,
            riskScore: result.riskScore,
            success: true,
          });
        } catch (postErr) {
          const message =
            postErr instanceof Error ? postErr.message : String(postErr);

          console.error(
            `[moderate-community-post] Error moderating post ${post.id}:`,
            message
          );

          // Không ẩn bài. Không đổi status. Giữ pending_ai để cron có thể thử lại sau.
          results.push({
            postId: post.id,
            error: message,
            success: false,
          });
        }
      }

      return jsonResponse({
        success: true,
        processed: pendingPosts.length,
        results,
      });
    }

    // =========================================================
    // NORMAL MODE: hậu kiểm 1 bài vừa đăng
    // =========================================================
    if (!postId || !title) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing postId or title',
        },
        400
      );
    }

    const plainContent = stripHtml(content || '');

    let result: ModerationResult;

    try {
      result = await analyzeWithGemini(geminiKey, title, plainContent);
    } catch (aiErr) {
      const message = aiErr instanceof Error ? aiErr.message : String(aiErr);

      console.error(
        `[moderate-community-post] AI failed for post ${postId}:`,
        message
      );

      // Quan trọng:
      // User đã đăng bài public rồi, nên không rollback, không hidden, không trả 500.
      return jsonResponse({
        success: false,
        postId,
        decision: 'pending_ai',
        error: 'AI moderation failed. Post remains public and pending.',
        detail: message,
      });
    }

    try {
      await updatePostModeration(supabaseAdmin, postId, result);

      await insertModerationLog(supabaseAdmin, {
        postId,
        authorId: authorId || null,
        result,
      });

      await notifyUserIfRejected(supabaseAdmin, {
        postId,
        authorId,
        title,
        result,
      });
    } catch (dbErr) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr);

      console.error(
        `[moderate-community-post] DB update/log failed for post ${postId}:`,
        message
      );

      // Không trả 500 để client không hiểu nhầm là bài đăng thất bại.
      // Bài vẫn public, chỉ là kết quả AI chưa lưu được.
      return jsonResponse({
        success: false,
        postId,
        decision: 'pending_ai',
        error: 'AI moderation result could not be saved. Post remains public.',
        detail: message,
      });
    }

    return jsonResponse({
      success: true,
      postId,
      decision: result.decision,
      riskScore: result.riskScore,
      categories: result.categories,
      reason: result.reason,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error('[moderate-community-post] Unhandled error:', message);

    return jsonResponse(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});
