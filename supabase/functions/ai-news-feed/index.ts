// ai-news-feed — Supabase Edge Function
// Deploy: supabase functions deploy ai-news-feed
// Cron:   0 0,12 * * *  (UTC) = 7:00 & 19:00 Vietnam
// Secrets (dùng chung với moderate-community-post):
//   GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   supabase secrets set NEWS_BOT_USER_ID=<uuid>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Config ──────────────────────────────────────────────
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const MAX_ARTICLES = 5;

const RSS_SOURCES = [
  {
    name: 'VnExpress',
    url: 'https://vnexpress.net/rss/kinh-doanh.rss',
  },
  {
    name: 'Tuổi Trẻ',
    url: 'https://tuoitre.vn/rss/kinh-doanh.rss',
  },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── RSS Parser ──────────────────────────────────────────
interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  sourceName: string;
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Normal: <tag>content</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractImageUrl(itemXml: string): string | null {
  // Try <enclosure url="...">
  const encMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/i);
  if (encMatch) return encMatch[1];

  // Try <image><url>...</url></image> or <media:content url="...">
  const mediaMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/i);
  if (mediaMatch) return mediaMatch[1];

  // Try img tag in description
  const imgMatch = itemXml.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

function parseRss(xml: string, sourceName: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');
    const imageUrl = extractImageUrl(itemXml);

    if (title && link) {
      items.push({
        title: stripHtml(title),
        link,
        description: stripHtml(description).slice(0, 500),
        pubDate,
        imageUrl,
        sourceName,
      });
    }
  }

  return items;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Fetch RSS ───────────────────────────────────────────
async function fetchAllRss(): Promise<RssItem[]> {
  const allItems: RssItem[] = [];

  for (const source of RSS_SOURCES) {
    try {
      console.log(`[ai-news-feed] Fetching RSS from ${source.name}: ${source.url}`);
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'FinanceApp-NewsBot/1.0' },
      });

      if (!res.ok) {
        console.error(`[ai-news-feed] RSS fetch failed for ${source.name}: ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const items = parseRss(xml, source.name);
      console.log(`[ai-news-feed] Parsed ${items.length} items from ${source.name}`);
      allItems.push(...items);
    } catch (err) {
      console.error(`[ai-news-feed] RSS error for ${source.name}:`, err);
    }
  }

  return allItems;
}

// ─── Dedup ───────────────────────────────────────────────
async function filterNewArticles(
  supabaseAdmin: any,
  items: RssItem[]
): Promise<RssItem[]> {
  if (items.length === 0) return [];

  const urls = items.map((i) => i.link);

  // Check which URLs already exist (stored in metadata->original_url)
  const { data: existing } = await supabaseAdmin
    .from('community_posts')
    .select('metadata')
    .eq('post_type', 'ai_news')
    .in('metadata->>original_url', urls);

  const existingUrls = new Set(
    (existing || []).map((p: any) => p.metadata?.original_url).filter(Boolean)
  );

  return items.filter((item) => !existingUrls.has(item.link));
}

// ─── Gemini Analysis ─────────────────────────────────────
interface AiArticle {
  original_title: string;
  original_url: string;
  summary: string;
  highlight: string;
  category_slug: string;
  relevance_score: number;
  source_name: string;
  image_url: string | null;
  pub_date: string;
}

async function analyzeWithGemini(
  apiKey: string,
  items: RssItem[]
): Promise<AiArticle[]> {
  const articlesForAi = items.map((item, i) => ({
    index: i,
    title: item.title,
    description: item.description,
    source: item.sourceName,
  }));

  const prompt = `Bạn là biên tập viên tin tức tài chính Việt Nam. Nhận danh sách ${items.length} bài viết dưới đây.

Nhiệm vụ:
1. Chấm điểm relevance_score (0.0 - 1.0) cho từng bài — chỉ giữ bài thực sự nổi bật, có giá trị thông tin cao.
2. Tóm tắt ngắn gọn 100-150 từ bằng tiếng Việt, giữ nguyên các con số và dữ liệu quan trọng.
3. Viết 1 dòng highlight hấp dẫn (tối đa 80 ký tự).
4. Phân loại vào đúng 1 category_slug từ danh sách: "chung-khoan", "bat-dong-san", "ngan-hang", "crypto", "kinh-te-vi-mo", "tai-chinh-ca-nhan".

Danh sách bài viết:
${JSON.stringify(articlesForAi, null, 2)}

Trả về JSON array chỉ gồm các bài có relevance_score >= 0.6, sắp xếp giảm dần theo relevance_score.
Tối đa ${MAX_ARTICLES} bài.
Bỏ qua bài quảng cáo, PR, nội dung mờ nhạt.

Format:
[
  {
    "index": 0,
    "summary": "...",
    "highlight": "...",
    "category_slug": "chung-khoan",
    "relevance_score": 0.85
  }
]

CHỈ trả về JSON array hợp lệ, không giải thích thêm.`;

  const apiVersion = 'v1beta';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    }
  );

  const rawResponse = await res.text();

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${rawResponse.slice(0, 500)}`);
  }

  const data = JSON.parse(rawResponse);
  console.log("[ai-news-feed] Raw Gemini API response metadata:", JSON.stringify(data.candidates?.[0] ? { finishReason: data.candidates[0].finishReason, safetyRatings: data.candidates[0].safetyRatings } : data));
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  console.log("[ai-news-feed] Raw Gemini response text length:", rawText.length);
  console.log("[ai-news-feed] Raw Gemini response text:", rawText);

  let parsed: any[];
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Cannot extract JSON array from Gemini response: ${rawText.slice(0, 300)}`);
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini did not return a JSON array');
  }

  // Map back to full article data
  return parsed
    .filter((a: any) => a.relevance_score >= 0.6 && a.index != null && a.index < items.length)
    .slice(0, MAX_ARTICLES)
    .map((a: any) => {
      const original = items[a.index];
      return {
        original_title: original.title,
        original_url: original.link,
        summary: a.summary || '',
        highlight: a.highlight || original.title,
        category_slug: a.category_slug || 'kinh-te-vi-mo',
        relevance_score: Math.min(1, Math.max(0, Number(a.relevance_score) || 0.6)),
        source_name: original.sourceName,
        image_url: original.imageUrl,
        pub_date: original.pubDate,
      };
    });
}

// ─── Post to Community ───────────────────────────────────
async function postArticlesToCommunity(
  supabaseAdmin: any,
  articles: AiArticle[],
  botUserId: string,
  topicMap: Record<string, string> // slug -> topic UUID
): Promise<number> {
  if (articles.length === 0) return 0;

  try {
    // 1. Tạo tiêu đề bản tin dựa theo giờ Việt Nam (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = String(vnTime.getUTCDate()).padStart(2, '0');
    const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const year = vnTime.getUTCFullYear();
    const hour = vnTime.getUTCHours();
    const timeOfDay = hour < 12 ? 'Sáng' : 'Tối';
    const bulletinTitle = `Bản tin Tài chính AI - ${timeOfDay} ${day}/${month}/${year}`;

    // 2. Gộp nội dung 5 bài tóm tắt thành dạng HTML danh sách có số thứ tự
    let content = `<p>Chào buổi ${timeOfDay.toLowerCase()} các bạn! Dưới đây là tóm tắt top ${articles.length} tin tức tài chính nổi bật nhất trong 12 giờ qua:</p><p><br/></p><ol>`;

    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      content += `<li style="margin-bottom: 12px; line-height: 20px;"><strong>${art.original_title}</strong> (Nguồn: ${art.source_name})<br/>${art.summary} <a href="${art.original_url}" target="_blank" style="color: #0891b2; text-decoration: underline;">Đọc bài gốc →</a></li>`;
    }

    content += `</ol><p><br/></p><p>🤖 <em>Bản tin được tổng hợp tự động bởi AI Tin tức. Các bạn có thể bật/tắt bộ lọc để tùy chọn theo dõi.</em></p>`;

    // Lấy ảnh đầu tiên làm ảnh đại diện cho bản tin (nếu có)
    const imageUrl = articles.find((a) => a.image_url)?.image_url || null;

    // 3. Insert vào bảng community_posts
    const { data: post, error: postError } = await supabaseAdmin
      .from('community_posts')
      .insert({
        author_id: botUserId,
        title: bulletinTitle,
        content,
        post_type: 'ai_news',
        status: 'active',
        moderation_status: 'approved',
        image_url: imageUrl,
        metadata: {
          is_bulletin: true,
          articles: articles.map((a) => ({
            title: a.original_title,
            url: a.original_url,
            source: a.source_name,
            category_slug: a.category_slug,
            relevance_score: a.relevance_score,
          })),
        },
      })
      .select('id')
      .single();

    if (postError) {
      console.error(`[ai-news-feed] Insert bulletin failed:`, postError.message);
      return 0;
    }

    // 4. Liên kết bản tin với tất cả các chủ đề liên quan
    const uniqueTopicIds = new Set<string>();
    for (const art of articles) {
      const topicId = topicMap[art.category_slug];
      if (topicId) uniqueTopicIds.add(topicId);
    }

    for (const topicId of uniqueTopicIds) {
      const { error: linkError } = await supabaseAdmin
        .from('community_post_topics')
        .insert({ post_id: post.id, topic_id: topicId });

      if (linkError) {
        console.error(`[ai-news-feed] Link topic failed for topic ${topicId}:`, linkError.message);
      }
    }

    console.log(`[ai-news-feed] Posted bulletin: "${bulletinTitle}" with ${articles.length} news items`);
    return 1;
  } catch (err) {
    console.error(`[ai-news-feed] Error posting bulletin:`, err);
    return 0;
  }
}

// ─── Cleanup old articles ────────────────────────────────
async function cleanupOldArticles(supabaseAdmin: any, daysOld = 30) {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabaseAdmin
    .from('community_posts')
    .delete()
    .eq('post_type', 'ai_news')
    .lt('created_at', cutoff);

  if (error) {
    console.error('[ai-news-feed] Cleanup error:', error.message);
  } else {
    console.log(`[ai-news-feed] Cleaned up old articles (before ${cutoff}), count: ${count ?? 'unknown'}`);
  }
}

// ─── Load topic map ──────────────────────────────────────
async function loadTopicMap(supabaseAdmin: any): Promise<Record<string, string>> {
  const slugToName: Record<string, string> = {
    'chung-khoan': 'Chứng khoán',
    'bat-dong-san': 'Bất động sản',
    'ngan-hang': 'Ngân hàng',
    'crypto': 'Crypto',
    'kinh-te-vi-mo': 'Kinh tế vĩ mô',
    'tai-chinh-ca-nhan': 'Tài chính cá nhân',
  };

  const names = Object.values(slugToName);

  const { data: topics } = await supabaseAdmin
    .from('community_topics')
    .select('id, name')
    .in('name', names);

  const map: Record<string, string> = {};
  if (topics) {
    for (const [slug, name] of Object.entries(slugToName)) {
      const t = topics.find((tp: any) => tp.name === name);
      if (t) map[slug] = t.id;
    }
  }

  return map;
}

// ─── Main Handler ────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const botUserId = Deno.env.get('NEWS_BOT_USER_ID');

    if (!geminiKey || !supabaseUrl || !serviceRoleKey || !botUserId) {
      const missing = [
        !geminiKey && 'GEMINI_API_KEY',
        !supabaseUrl && 'SUPABASE_URL',
        !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
        !botUserId && 'NEWS_BOT_USER_ID',
      ].filter(Boolean);
      console.error(`[ai-news-feed] Missing env: ${missing.join(', ')}`);
      return jsonResponse({ success: false, error: `Missing: ${missing.join(', ')}` }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log('[ai-news-feed] Starting news fetch...');

    // 1. Fetch RSS
    const allItems = await fetchAllRss();
    console.log(`[ai-news-feed] Total RSS items: ${allItems.length}`);

    if (allItems.length === 0) {
      return jsonResponse({ success: true, message: 'No RSS items found', posted: 0 });
    }

    // 2. Dedup
    const newItems = await filterNewArticles(supabaseAdmin, allItems);
    console.log(`[ai-news-feed] New (non-duplicate) items: ${newItems.length}`);

    if (newItems.length === 0) {
      return jsonResponse({ success: true, message: 'No new articles', posted: 0 });
    }

    // 3. AI analyze & filter
    const articles = await analyzeWithGemini(geminiKey, newItems.slice(0, 10));
    console.log(`[ai-news-feed] AI selected ${articles.length} articles`);

    if (articles.length === 0) {
      return jsonResponse({ success: true, message: 'AI found no notable articles', posted: 0 });
    }

    // 4. Load topic map
    const topicMap = await loadTopicMap(supabaseAdmin);

    // 5. Post to community
    const posted = await postArticlesToCommunity(supabaseAdmin, articles, botUserId, topicMap);
    console.log(`[ai-news-feed] Successfully posted ${posted} articles`);

    // 6. Cleanup old articles (30 days)
    await cleanupOldArticles(supabaseAdmin);

    return jsonResponse({
      success: true,
      posted,
      articles: articles.map((a) => ({
        title: a.highlight,
        category: a.category_slug,
        score: a.relevance_score,
        source: a.source_name,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-news-feed] Unhandled error:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
});
