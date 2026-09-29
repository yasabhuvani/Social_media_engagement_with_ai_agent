/**
 * Universal Dataset Hub & Dataset Management Service
 * Supports importing custom user datasets (CSV / JSON), browsing datasets,
 * and switching between preset brand benchmarks (Tech DevTools, Kaggle Benchmark, DTC E-Commerce).
 */

import { SocialPost, Brand, ContentFormat, PlatformType, EngagementMetric } from '../db/schema.js';
import { getInitialSeedData } from '../db/seed.js';
import { getKaggleBenchmarkPosts } from './kaggleDataset.js';

export interface DatasetMeta {
  id: string;
  name: string;
  category: 'preset' | 'custom';
  description: string;
  brandName: string;
  recordCount: number;
  platforms: PlatformType[];
  avgEngagementRate: number;
  uploadedAt: string;
  isCurrentActive: boolean;
}

// Preset: Luminary DTC Lifestyle & Fashion Brand Dataset
export function getLuminaryDtcDataset(brandId: string = 'brand_luminary_dtc'): { brand: Brand; posts: SocialPost[] } {
  const brand: Brand = {
    _id: brandId,
    userId: 'user_demo_001',
    name: 'Luminary Apparel',
    handle: '@luminary_style',
    industry: 'Direct-to-Consumer Sustainable Fashion',
    targetAudience: 'Eco-conscious Gen-Z & Millennials, capsule wardrobe enthusiasts, minimalist fashion buyers',
    primaryPlatforms: ['Instagram', 'TikTok', 'YouTube', 'Twitter/X'],
    toneOfVoice: 'Aesthetic, authentic, warm, community-driven, transparent sustainability',
    brandDescription: 'Ethically manufactured organic linen & minimalist everyday essentials for modern conscious living.',
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z',
  };

  const rawPosts: Array<Omit<SocialPost, 'createdAt'>> = [
    {
      _id: 'dtc_01',
      brandId,
      platform: 'Instagram',
      contentFormat: 'short_video',
      topic: 'Behind the Scenes & Sustainability',
      caption: 'Meet the master weavers behind our 100% organic French flax linen in Normandy. Zero chemical pesticides, zero plastic waste.',
      hook: 'Where does your linen actually come from?',
      hashtags: ['#SustainableFashion', '#SlowFashion', '#EthicalWardrobe', '#OrganicLinen'],
      postedAt: '2026-09-24T18:00:00.000Z',
      dayOfWeek: 'Thursday',
      timeOfDay: '18:00',
      metrics: {
        likes: 2450,
        comments: 184,
        shares: 412,
        saves: 890,
        reach: 42000,
        impressions: 59000,
        engagementRate: 9.37, // (2450+184+412+890)/42000 * 100
        isViral: true,
      },
      audienceReactions: {
        sentiment: 'very_positive',
        topFeedback: ['This level of transparency is why I only shop here now', 'Stunning footage of Normandy!'],
        commonQuestions: ['Are you restocking the olive green shirt?', 'Do you ship to Canada?'],
      },
    },
    {
      _id: 'dtc_02',
      brandId,
      platform: 'Instagram',
      contentFormat: 'carousel',
      topic: 'Capsule Wardrobe Styling',
      caption: '1 Linen Trouser, 5 Effortless Looks: From weekday meetings to Sunday farmer’s market strolls. Swipe to see all 5 fits.',
      hook: '1 pair of trousers, 5 days of outfits',
      hashtags: ['#CapsuleWardrobe', '#OutfitInspo', '#MinimalistStyle', '#OutfitFormulas'],
      postedAt: '2026-09-22T19:30:00.000Z',
      dayOfWeek: 'Tuesday',
      timeOfDay: '19:30',
      metrics: {
        likes: 3120,
        comments: 245,
        shares: 610,
        saves: 1420,
        reach: 48000,
        impressions: 68000,
        engagementRate: 11.24,
        isViral: true,
      },
      audienceReactions: {
        sentiment: 'very_positive',
        topFeedback: ['Look #3 with the oversized blazer is perfection!', 'Saving this for my fall packing guide.'],
      },
    },
    {
      _id: 'dtc_03',
      brandId,
      platform: 'TikTok',
      contentFormat: 'short_video',
      topic: 'Customer Fit & Sizing Guide',
      caption: 'Trying on our bestselling Trench Coat on 4 different body types (sizes XS, M, L, XL). True to size or size up?',
      hook: 'How our trench coat fits on 4 different body sizes',
      hashtags: ['#SizeInclusive', '#TryOnHaul', '#TrenchCoat', '#FashionTok'],
      postedAt: '2026-09-20T17:15:00.000Z',
      dayOfWeek: 'Sunday',
      timeOfDay: '17:15',
      metrics: {
        likes: 4890,
        comments: 410,
        shares: 880,
        saves: 2150,
        reach: 72000,
        impressions: 112000,
        engagementRate: 11.57,
        isViral: true,
      },
      audienceReactions: {
        sentiment: 'very_positive',
        topFeedback: ['Every brand needs to show multiple sizes like this!', 'Just ordered size M after seeing this!'],
      },
    },
    {
      _id: 'dtc_04',
      brandId,
      platform: 'Instagram',
      contentFormat: 'single_image',
      topic: 'Promotional & Flash Sale',
      caption: 'FLASH 48H SALE: Enjoy 15% off our remaining Summer Capsule collection before it archives. Use code SUMMER15.',
      hook: 'Our end of summer archive sale is live',
      hashtags: ['#Sale', '#SustainableSale', '#Discount'],
      postedAt: '2026-09-17T12:00:00.000Z',
      dayOfWeek: 'Thursday',
      timeOfDay: '12:00',
      metrics: {
        likes: 420,
        comments: 32,
        shares: 18,
        saves: 65,
        reach: 22000,
        impressions: 26000,
        engagementRate: 2.43,
      },
      audienceReactions: {
        sentiment: 'neutral',
        topFeedback: ['Already picked up the tote!'],
      },
    },
    {
      _id: 'dtc_05',
      brandId,
      platform: 'Instagram',
      contentFormat: 'carousel',
      topic: 'Fabric Care & Longevity',
      caption: 'How to wash, dry, and steam raw linen so it lasts 10+ years without shrinking. Your ultimate garment care cheat sheet.',
      hook: 'How to care for linen so it never shrinks',
      hashtags: ['#GarmentCare', '#EcoLiving', '#LinenCare', '#SlowLiving'],
      postedAt: '2026-09-14T20:00:00.000Z',
      dayOfWeek: 'Monday',
      timeOfDay: '20:00',
      metrics: {
        likes: 1890,
        comments: 98,
        shares: 380,
        saves: 1120,
        reach: 31000,
        impressions: 44000,
        engagementRate: 11.25,
      },
      audienceReactions: {
        sentiment: 'very_positive',
        topFeedback: ['I ruined a linen top last year, wish I had this sooner!'],
      },
    },
    {
      _id: 'dtc_06',
      brandId,
      platform: 'YouTube',
      contentFormat: 'short_video',
      topic: 'Capsule Wardrobe Styling',
      caption: 'The only 7 items you need for a complete Autumn Minimalist Capsule. Quick 50-second breakdown.',
      hook: '7 pieces for an entire fall wardrobe',
      hashtags: ['#AutumnFashion', '#CapsuleWardrobe', '#Shorts'],
      postedAt: '2026-09-11T16:30:00.000Z',
      dayOfWeek: 'Friday',
      timeOfDay: '16:30',
      metrics: {
        likes: 1650,
        comments: 110,
        shares: 240,
        saves: 780,
        reach: 28000,
        impressions: 39000,
        engagementRate: 9.93,
      },
    },
    {
      _id: 'dtc_07',
      brandId,
      platform: 'Twitter/X',
      contentFormat: 'thread',
      topic: 'Behind the Scenes & Sustainability',
      caption: 'Why fast fashion brands use polyester blends instead of 100% natural fibers (and how microplastics end up in ocean runoff). A thread on textile transparency 🧵 [1/6]',
      hook: 'The truth about blended polyester fabrics',
      hashtags: ['#FastFashion', '#Sustainability', '#Microplastics'],
      postedAt: '2026-09-08T11:00:00.000Z',
      dayOfWeek: 'Tuesday',
      timeOfDay: '11:00',
      metrics: {
        likes: 840,
        comments: 95,
        shares: 310,
        saves: 420,
        reach: 19000,
        impressions: 29000,
        engagementRate: 8.76,
      },
    },
    {
      _id: 'dtc_08',
      brandId,
      platform: 'Instagram',
      contentFormat: 'short_video',
      topic: 'Customer Fit & Sizing Guide',
      caption: 'Petite sizing test: Does our maxi dress drag on 5’2” frame? Watch the full walking test without heels.',
      hook: 'Petite girl test: Will this maxi dress drag?',
      hashtags: ['#PetiteFashion', '#SummerDress', '#OutfitTips'],
      postedAt: '2026-09-05T19:00:00.000Z',
      dayOfWeek: 'Saturday',
      timeOfDay: '19:00',
      metrics: {
        likes: 2980,
        comments: 260,
        shares: 510,
        saves: 1340,
        reach: 41000,
        impressions: 58000,
        engagementRate: 12.41,
        isViral: true,
      },
    },
    {
      _id: 'dtc_09',
      brandId,
      platform: 'Instagram',
      contentFormat: 'single_image',
      topic: 'Brand Aesthetics & Lookbook',
      caption: 'Morning light in Lisbon wearing the Terracotta Wrap Blouse. Hand-dyed with botanical dyes.',
      hook: 'Golden hour in Lisbon',
      hashtags: ['#LisbonStyle', '#BotanicalDye', '#LinenBlouse'],
      postedAt: '2026-09-02T09:30:00.000Z',
      dayOfWeek: 'Wednesday',
      timeOfDay: '09:30',
      metrics: {
        likes: 1100,
        comments: 42,
        shares: 35,
        saves: 190,
        reach: 24000,
        impressions: 31000,
        engagementRate: 5.7,
      },
    },
    {
      _id: 'dtc_10',
      brandId,
      platform: 'TikTok',
      contentFormat: 'short_video',
      topic: 'Behind the Scenes & Sustainability',
      caption: 'Repurposing 100% of our linen cutting room scrap into reusable lavender sachet bags. Zero fabric goes to landfill.',
      hook: 'What we do with fabric scraps instead of trashing them',
      hashtags: ['#ZeroWaste', '#Crafting', '#SustainableBrand'],
      postedAt: '2026-08-29T18:45:00.000Z',
      dayOfWeek: 'Saturday',
      timeOfDay: '18:45',
      metrics: {
        likes: 5400,
        comments: 380,
        shares: 920,
        saves: 1850,
        reach: 69000,
        impressions: 98000,
        engagementRate: 12.39,
        isViral: true,
      },
    },
  ];

  const posts: SocialPost[] = rawPosts.map((p) => ({
    ...p,
    createdAt: p.postedAt,
  }));

  return { brand, posts };
}

/**
 * Universal CSV / JSON Parser
 * Ingests arbitrary user data and standardizes to SocialPost records
 */
export function parseUserDataset(
  content: string,
  brandId: string,
  format: 'csv' | 'json'
): { posts: SocialPost[]; warnings: string[] } {
  const warnings: string[] = [];
  const posts: SocialPost[] = [];

  if (format === 'json') {
    try {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      items.forEach((item: any, idx: number) => {
        const id = item._id || item.id || `custom_post_${Date.now()}_${idx}`;
        const platform: PlatformType = ['Instagram', 'LinkedIn', 'Twitter/X', 'YouTube', 'TikTok'].includes(item.platform)
          ? item.platform
          : 'LinkedIn';
        const contentFormat: ContentFormat = ['short_video', 'carousel', 'single_image', 'text_post', 'thread'].includes(item.contentFormat)
          ? item.contentFormat
          : 'single_image';
        const topic = item.topic || item.category || 'General';
        const caption = item.caption || item.text || item.content || `Post #${idx + 1}`;
        const hook = item.hook || caption.split('\n')[0].slice(0, 80);
        const hashtags = Array.isArray(item.hashtags)
          ? item.hashtags
          : typeof item.hashtags === 'string'
          ? item.hashtags.split(/[\s,]+/).filter(Boolean)
          : [];

        const likes = Number(item.likes ?? item.metrics?.likes ?? 0);
        const comments = Number(item.comments ?? item.metrics?.comments ?? 0);
        const shares = Number(item.shares ?? item.metrics?.shares ?? 0);
        const saves = Number(item.saves ?? item.metrics?.saves ?? 0);
        const reach = Math.max(1, Number(item.reach ?? item.metrics?.reach ?? 1000));
        const impressions = Number(item.impressions ?? item.metrics?.impressions ?? Math.round(reach * 1.35));

        const er =
          item.engagementRate ??
          item.metrics?.engagementRate ??
          parseFloat((((likes + comments + shares + saves) / reach) * 100).toFixed(2));

        const postedAt = item.postedAt || item.date || new Date().toISOString();
        const dayOfWeek = item.dayOfWeek || new Date(postedAt).toLocaleDateString('en-US', { weekday: 'long' });
        const timeOfDay = item.timeOfDay || '14:00';

        posts.push({
          _id: id,
          brandId,
          platform,
          contentFormat,
          topic,
          caption,
          hook,
          hashtags,
          postedAt,
          dayOfWeek,
          timeOfDay,
          metrics: {
            likes,
            comments,
            shares,
            saves,
            reach,
            impressions,
            engagementRate: er,
            isViral: er >= 7.0,
          },
          audienceReactions: {
            sentiment: er >= 6.0 ? 'very_positive' : 'positive',
            topFeedback: item.topFeedback || [],
            commonQuestions: item.commonQuestions || [],
          },
          createdAt: postedAt,
        });
      });
    } catch (e: any) {
      throw new Error(`JSON parsing failed: ${e.message}`);
    }
  } else {
    // CSV Parser
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least 1 data row.');
    }

    // Helper to split CSV line safely handling quotes
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));

    // Find column index helper
    const getColIndex = (candidates: string[]): number => {
      for (const cand of candidates) {
        const idx = headers.findIndex((h) => h === cand || h.includes(cand));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idIdx = getColIndex(['post_id', 'postid', 'id']);
    const platIdx = getColIndex(['platform', 'channel']);
    const formatIdx = getColIndex(['content_type', 'contenttype', 'format', 'type']);
    const topicIdx = getColIndex(['topic', 'category', 'genre']);
    const captionIdx = getColIndex(['caption', 'text', 'content', 'post']);
    const hookIdx = getColIndex(['hook', 'title', 'headline']);
    const hashIdx = getColIndex(['hashtag', 'hashtags', 'tags']);
    const likesIdx = getColIndex(['likes', 'like_count']);
    const commentsIdx = getColIndex(['comments', 'comment_count']);
    const sharesIdx = getColIndex(['shares', 'share_count', 'retweets']);
    const savesIdx = getColIndex(['saves', 'bookmarks', 'save_count']);
    const reachIdx = getColIndex(['reach', 'audience', 'impressions', 'views']);
    const erIdx = getColIndex(['engagement_rate', 'er', 'engagement']);
    const dateIdx = getColIndex(['date', 'posted_at', 'postedat', 'timestamp', 'time']);

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const rawId = idIdx !== -1 ? cols[idIdx] : '';
      const _id = rawId || `custom_post_${Date.now()}_${i}`;

      let platform: PlatformType = 'LinkedIn';
      if (platIdx !== -1 && cols[platIdx]) {
        const p = cols[platIdx].toLowerCase();
        if (p.includes('insta')) platform = 'Instagram';
        else if (p.includes('twit') || p.includes('x')) platform = 'Twitter/X';
        else if (p.includes('you') || p.includes('yt')) platform = 'YouTube';
        else if (p.includes('tik')) platform = 'TikTok';
        else if (p.includes('link')) platform = 'LinkedIn';
      }

      let contentFormat: ContentFormat = 'short_video';
      if (formatIdx !== -1 && cols[formatIdx]) {
        const f = cols[formatIdx].toLowerCase();
        if (f.includes('car')) contentFormat = 'carousel';
        else if (f.includes('imag') || f.includes('photo')) contentFormat = 'single_image';
        else if (f.includes('thread')) contentFormat = 'thread';
        else if (f.includes('text')) contentFormat = 'text_post';
        else if (f.includes('vid') || f.includes('reel') || f.includes('short')) contentFormat = 'short_video';
      }

      const topic = topicIdx !== -1 && cols[topicIdx] ? cols[topicIdx] : 'General';
      const caption = captionIdx !== -1 && cols[captionIdx] ? cols[captionIdx] : `Dataset record #${i}`;
      const hook = hookIdx !== -1 && cols[hookIdx] ? cols[hookIdx] : caption.split('\n')[0].slice(0, 80);
      const hashtags =
        hashIdx !== -1 && cols[hashIdx]
          ? cols[hashIdx].split(/[\s,]+/).filter(Boolean)
          : [];

      const likes = likesIdx !== -1 ? Number(cols[likesIdx]) || 0 : 0;
      const comments = commentsIdx !== -1 ? Number(cols[commentsIdx]) || 0 : 0;
      const shares = sharesIdx !== -1 ? Number(cols[sharesIdx]) || 0 : 0;
      const saves = savesIdx !== -1 ? Number(cols[savesIdx]) || 0 : 0;
      const reach = reachIdx !== -1 ? Math.max(1, Number(cols[reachIdx]) || 1000) : 1000;

      let er =
        erIdx !== -1 && cols[erIdx]
          ? Number(cols[erIdx].replace('%', '')) || 0
          : 0;

      if (!er) {
        er = parseFloat((((likes + comments + shares + saves) / reach) * 100).toFixed(2));
      }

      const rawDate = dateIdx !== -1 ? cols[dateIdx] : '';
      const dateObj = rawDate ? new Date(rawDate) : new Date();
      const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
      const postedAt = validDate.toISOString();
      const dayOfWeek = validDate.toLocaleDateString('en-US', { weekday: 'long' });

      posts.push({
        _id,
        brandId,
        platform,
        contentFormat,
        topic,
        caption,
        hook,
        hashtags,
        postedAt,
        dayOfWeek,
        timeOfDay: '14:30',
        metrics: {
          likes,
          comments,
          shares,
          saves,
          reach,
          impressions: Math.round(reach * 1.35),
          engagementRate: er,
          isViral: er >= 7.0,
        },
        audienceReactions: {
          sentiment: er >= 6.0 ? 'very_positive' : 'positive',
          topFeedback: [],
        },
        createdAt: postedAt,
      });
    }
  }

  if (posts.length === 0) {
    throw new Error('No valid post records could be extracted from dataset.');
  }

  return { posts, warnings };
}

/**
 * Exports social posts to standard downloadable CSV format
 */
export function exportPostsToUniversalCSV(posts: SocialPost[], brandName: string): string {
  const headers = [
    'Post_ID',
    'Brand',
    'Platform',
    'Content_Format',
    'Topic',
    'Caption',
    'Hook',
    'Hashtags',
    'Posted_Date',
    'Day_Of_Week',
    'Time_Of_Day',
    'Likes',
    'Comments',
    'Shares',
    'Saves',
    'Reach',
    'Impressions',
    'Engagement_Rate',
    'Is_Viral',
    'Sentiment',
  ];

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = posts.map((p) => [
    escapeCSV(p._id),
    escapeCSV(brandName),
    escapeCSV(p.platform),
    escapeCSV(p.contentFormat),
    escapeCSV(p.topic),
    escapeCSV(p.caption),
    escapeCSV(p.hook || ''),
    escapeCSV(p.hashtags.join(' ')),
    escapeCSV(p.postedAt),
    escapeCSV(p.dayOfWeek),
    escapeCSV(p.timeOfDay),
    p.metrics.likes,
    p.metrics.comments,
    p.metrics.shares,
    p.metrics.saves,
    p.metrics.reach,
    p.metrics.impressions,
    p.metrics.engagementRate,
    p.metrics.isViral ? 'TRUE' : 'FALSE',
    escapeCSV(p.audienceReactions?.sentiment || 'positive'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
