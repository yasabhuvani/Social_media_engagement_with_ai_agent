/**
 * Kaggle "Social Media Post Performance Forecasting" Dataset Integration
 * Provides CSV export, CSV import parser, and pre-packaged Kaggle benchmark records.
 */

import { SocialPost, ContentFormat, PlatformType } from '../db/schema.js';

export const KAGGLE_CSV_HEADERS = [
  'Post_ID',
  'Platform',
  'Content_Type',
  'Category',
  'Caption_Length',
  'Hashtag_Count',
  'Has_Media',
  'Video_Duration_Sec',
  'Hook_Strength',
  'Creator_Follower_Count',
  'Creator_Type',
  'Post_Date',
  'Day_of_Week',
  'Hour_of_Day',
  'Likes',
  'Comments',
  'Shares',
  'Saves',
  'Reach',
  'Impressions',
  'Views',
  'Clicks',
  'Engagement_Rate',
  'Watch_Time_Avg',
  'Completion_Rate',
  'Is_Viral',
  'Post_Content',
];

/**
 * Converts SocialPost objects to Kaggle Competition CSV format string
 */
export function exportPostsToKaggleCSV(posts: SocialPost[]): string {
  const rows: string[] = [];
  rows.push(KAGGLE_CSV_HEADERS.join(','));

  for (const p of posts) {
    const captionClean = `"${p.caption.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const captionLength = p.kaggleFeatures?.captionLength || p.caption.split(/\s+/).length;
    const hashtagCount = p.kaggleFeatures?.hashtagCount || p.hashtags.length;
    const hasMedia = p.kaggleFeatures?.hasMedia !== undefined ? p.kaggleFeatures.hasMedia : p.contentFormat !== 'text_post';
    const videoDuration = p.kaggleFeatures?.videoDuration || (p.contentFormat === 'short_video' ? 45 : 0);
    const hookStrength = p.kaggleFeatures?.hookStrength || (p.metrics.engagementRate > 6 ? 9 : 6);
    const followers = p.kaggleFeatures?.creatorFollowerCount || 48000;
    const creatorType = p.kaggleFeatures?.creatorType || 'Mid-tier';
    const dateStr = p.postedAt.split('T')[0];
    const hour = parseInt((p.timeOfDay || '14:00').split(':')[0], 10);
    const views = p.metrics.views || Math.round(p.metrics.reach * 1.38);
    const clicks = p.metrics.clicks || Math.round(p.metrics.reach * 0.04);
    const watchTime = p.metrics.watchTimeAvg || (p.contentFormat === 'short_video' ? 38 : 0);
    const completionRate = p.metrics.completionRate || (p.metrics.engagementRate > 6 ? 78 : 52);
    const isViral = p.metrics.isViral !== undefined ? p.metrics.isViral : p.metrics.engagementRate >= 7.0;

    const row = [
      p._id,
      p.platform,
      p.contentFormat,
      `"${p.topic}"`,
      captionLength,
      hashtagCount,
      hasMedia ? 'True' : 'False',
      videoDuration,
      hookStrength,
      followers,
      creatorType,
      dateStr,
      p.dayOfWeek,
      hour,
      p.metrics.likes,
      p.metrics.comments,
      p.metrics.shares,
      p.metrics.saves,
      p.metrics.reach,
      p.metrics.impressions,
      views,
      clicks,
      p.metrics.engagementRate.toFixed(2),
      watchTime,
      completionRate,
      isViral ? 1 : 0,
      captionClean,
    ];

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Parses Kaggle Competition CSV and returns SocialPost documents
 */
export function parseKaggleCSV(csvText: string, brandId: string): SocialPost[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const posts: SocialPost[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const c = line[charIdx];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += c;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const postId = row['Post_ID'] || `kaggle_post_${Date.now()}_${i}`;
    const platform = (row['Platform'] as PlatformType) || 'LinkedIn';
    const contentFormat = mapFormat(row['Content_Type'] || 'short_video');
    const topic = row['Category'] || 'AI Tutorials';
    const caption = row['Post_Content'] || `Post content for ${postId}`;
    const dayOfWeek = row['Day_of_Week'] || 'Tuesday';
    const hour = parseInt(row['Hour_of_Day'] || '14', 10);
    const timeOfDay = `${hour.toString().padStart(2, '0')}:00`;
    const postDate = row['Post_Date'] ? new Date(row['Post_Date']).toISOString() : new Date().toISOString();

    const likes = Number(row['Likes']) || 200;
    const comments = Number(row['Comments']) || 25;
    const shares = Number(row['Shares']) || 35;
    const saves = Number(row['Saves']) || 50;
    const reach = Math.max(1, Number(row['Reach']) || 10000);
    const impressions = Number(row['Impressions']) || Math.round(reach * 1.3);
    const engagementRate = row['Engagement_Rate']
      ? parseFloat(row['Engagement_Rate'])
      : Number((((likes + comments + shares + saves) / reach) * 100).toFixed(2));

    const post: SocialPost = {
      _id: postId,
      brandId,
      platform,
      contentFormat,
      topic,
      caption,
      hook: caption.split('\n')[0].slice(0, 80),
      hashtags: ['#KaggleData', `#${topic.replace(/\s+/g, '')}`],
      postedAt: postDate,
      dayOfWeek,
      timeOfDay,
      metrics: {
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions,
        engagementRate,
        views: Number(row['Views']) || Math.round(reach * 1.4),
        clicks: Number(row['Clicks']) || Math.round(reach * 0.03),
        watchTimeAvg: Number(row['Watch_Time_Avg']) || 35,
        completionRate: Number(row['Completion_Rate']) || 65,
        isViral: row['Is_Viral'] === '1' || row['Is_Viral'] === 'True' || engagementRate >= 7.0,
      },
      kaggleFeatures: {
        captionLength: Number(row['Caption_Length']) || caption.split(/\s+/).length,
        hashtagCount: Number(row['Hashtag_Count']) || 4,
        hasMedia: row['Has_Media'] === 'True' || row['Has_Media'] === '1',
        videoDuration: Number(row['Video_Duration_Sec']) || 45,
        hookStrength: Number(row['Hook_Strength']) || 7,
        creatorFollowerCount: Number(row['Creator_Follower_Count']) || 50000,
        creatorType: (row['Creator_Type'] as any) || 'Mid-tier',
      },
      createdAt: postDate,
    };

    posts.push(post);
  }

  return posts;
}

function mapFormat(raw: string): ContentFormat {
  const lower = raw.toLowerCase();
  if (lower.includes('video') || lower.includes('reel')) return 'short_video';
  if (lower.includes('carousel')) return 'carousel';
  if (lower.includes('thread')) return 'thread';
  if (lower.includes('image') || lower.includes('photo')) return 'single_image';
  return 'text_post';
}

/**
 * Returns 30 extended Kaggle Competition Benchmark posts for instant forecasting simulation
 */
export function getKaggleBenchmarkPosts(brandId: string): SocialPost[] {
  const benchmarkCategories = [
    { topic: 'AI Tutorials', format: 'short_video' as ContentFormat, platform: 'LinkedIn' as PlatformType, avgER: 7.1, saves: 420, likes: 980, viral: true },
    { topic: 'AI Tutorials', format: 'short_video' as ContentFormat, platform: 'Twitter/X' as PlatformType, avgER: 6.9, saves: 380, likes: 1100, viral: true },
    { topic: 'AI Tutorials', format: 'carousel' as ContentFormat, platform: 'LinkedIn' as PlatformType, avgER: 6.6, saves: 510, likes: 890, viral: false },
    { topic: 'Educational Carousels', format: 'carousel' as ContentFormat, platform: 'LinkedIn' as PlatformType, avgER: 6.7, saves: 620, likes: 950, viral: true },
    { topic: 'Educational Carousels', format: 'carousel' as ContentFormat, platform: 'Instagram' as PlatformType, avgER: 6.4, saves: 540, likes: 1200, viral: false },
    { topic: 'Product Announcements', format: 'text_post' as ContentFormat, platform: 'Twitter/X' as PlatformType, avgER: 4.8, saves: 110, likes: 580, viral: false },
    { topic: 'Product Announcements', format: 'single_image' as ContentFormat, platform: 'LinkedIn' as PlatformType, avgER: 4.2, saves: 85, likes: 420, viral: false },
    { topic: 'Promotional Posts', format: 'single_image' as ContentFormat, platform: 'LinkedIn' as PlatformType, avgER: 1.5, saves: 10, likes: 90, viral: false },
    { topic: 'Promotional Posts', format: 'single_image' as ContentFormat, platform: 'Twitter/X' as PlatformType, avgER: 1.7, saves: 14, likes: 115, viral: false },
    { topic: 'Short Videos', format: 'short_video' as ContentFormat, platform: 'Instagram' as PlatformType, avgER: 7.3, saves: 790, likes: 1650, viral: true },
    { topic: 'Short Videos', format: 'short_video' as ContentFormat, platform: 'TikTok' as PlatformType, avgER: 7.5, saves: 880, likes: 1900, viral: true },
    { topic: 'Short Videos', format: 'short_video' as ContentFormat, platform: 'YouTube' as PlatformType, avgER: 6.8, saves: 430, likes: 870, viral: false },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['10:00', '14:30', '15:00', '16:30', '11:00', '09:00'];

  const posts: SocialPost[] = [];

  for (let idx = 0; idx < benchmarkCategories.length * 3; idx++) {
    const template = benchmarkCategories[idx % benchmarkCategories.length];
    const day = days[idx % days.length];
    const time = times[idx % times.length];
    const id = `kaggle_bm_${(idx + 1).toString().padStart(3, '0')}`;
    const date = new Date(Date.now() - (idx + 1) * 86400000).toISOString();

    const variance = (Math.sin(idx) * 0.4);
    const er = Number((template.avgER + variance).toFixed(2));
    const reach = 18000 + (idx * 650);
    const likes = Math.round(template.likes * (1 + variance * 0.15));
    const saves = Math.round(template.saves * (1 + variance * 0.15));
    const comments = Math.round(likes * 0.12);
    const shares = Math.round(likes * 0.18);

    posts.push({
      _id: id,
      brandId,
      platform: template.platform,
      contentFormat: template.format,
      topic: template.topic,
      caption: `[Kaggle Benchmark #${idx + 1}] Evaluating ${template.topic} using ${template.format} on ${template.platform}. Analyzed against developer engagement curves.`,
      hook: `Why ${template.topic} yields ${er}% engagement on ${template.platform}`,
      hashtags: ['#KaggleForecasting', '#MachineLearning', '#DataScience'],
      postedAt: date,
      dayOfWeek: day,
      timeOfDay: time,
      metrics: {
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions: Math.round(reach * 1.35),
        engagementRate: er,
        views: Math.round(reach * 1.45),
        clicks: Math.round(reach * 0.04),
        watchTimeAvg: template.format === 'short_video' ? 42 : 0,
        completionRate: template.format === 'short_video' ? 76 : 54,
        isViral: template.viral,
      },
      kaggleFeatures: {
        captionLength: 35 + (idx % 20),
        hashtagCount: 4,
        hasMedia: template.format !== 'text_post',
        videoDuration: template.format === 'short_video' ? 45 : 0,
        hookStrength: er > 6.5 ? 9 : 6,
        creatorFollowerCount: 52000,
        creatorType: 'Mid-tier',
        sentiment: er > 5 ? 'Positive' : 'Neutral',
      },
      createdAt: date,
    });
  }

  return posts;
}
