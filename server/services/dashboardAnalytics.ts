/**
 * Unified Social Media Engagement Dashboard Analytics Engine
 * Inspired by abhishek07ma/Social_Media_Engagement_Dashboard
 * 
 * Provides:
 * 1. Multi-platform cross-channel comparative analytics
 * 2. 7-Day x 24-Hour Best-Time Engagement Heatmap
 * 3. Audience Sentiment Tracker & Recurring Feedback Radar
 * 4. Content Scheduling & Calendar Queue
 * 5. Social Listening & Trending Hashtag / Keyword Momentum
 * 6. Executive KPI scorecard & Growth analytics
 */

import {
  Brand,
  SocialPost,
  ChannelPerformance,
  SocialListeningTrend,
  BestTimeHeatmapCell,
  UnifiedEngagementHubData,
  ScheduledPost,
  PlatformType,
  ContentFormat,
} from '../db/schema.js';

export function computeUnifiedDashboardData(
  brand: Brand,
  posts: SocialPost[],
  scheduledPosts: ScheduledPost[] = []
): UnifiedEngagementHubData {
  // 1. Cross-Channel Performance Breakdown
  const platforms: PlatformType[] = ['LinkedIn', 'Twitter/X', 'Instagram', 'YouTube'];
  
  // Baseline platform follower profiles for Synthetix AI
  const platformFollowerProfiles: Record<PlatformType, { followers: number; growth: number }> = {
    LinkedIn: { followers: 34200, growth: 14.8 },
    'Twitter/X': { followers: 28500, growth: 9.2 },
    Instagram: { followers: 16800, growth: 6.4 },
    YouTube: { followers: 12400, growth: 22.1 },
    TikTok: { followers: 4200, growth: 5.0 },
  };

  const channels: ChannelPerformance[] = platforms.map((plat) => {
    const platPosts = posts.filter((p) => p.platform === plat);
    const postCount = platPosts.length;
    
    let totalReach = 0;
    let totalImpressions = 0;
    let totalER = 0;
    const formatCounts: Record<string, { count: number; erSum: number }> = {};
    const topicCounts: Record<string, { count: number; erSum: number }> = {};
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;

    platPosts.forEach((p) => {
      totalReach += p.metrics.reach || 0;
      totalImpressions += p.metrics.impressions || (p.metrics.reach * 1.35) || 0;
      totalER += p.metrics.engagementRate || 0;

      // format
      if (!formatCounts[p.contentFormat]) formatCounts[p.contentFormat] = { count: 0, erSum: 0 };
      formatCounts[p.contentFormat].count += 1;
      formatCounts[p.contentFormat].erSum += p.metrics.engagementRate;

      // topic
      if (!topicCounts[p.topic]) topicCounts[p.topic] = { count: 0, erSum: 0 };
      topicCounts[p.topic].count += 1;
      topicCounts[p.topic].erSum += p.metrics.engagementRate;

      // sentiment
      const sent = p.audienceReactions?.sentiment || 'positive';
      if (sent === 'very_positive' || sent === 'positive') posCount++;
      else if (sent === 'neutral') neuCount++;
      else negCount++;
    });

    // determine top format
    let topFormat: ContentFormat = 'short_video';
    let maxFormatER = -1;
    Object.entries(formatCounts).forEach(([fmt, stats]) => {
      const avg = stats.erSum / stats.count;
      if (avg > maxFormatER) {
        maxFormatER = avg;
        topFormat = fmt as ContentFormat;
      }
    });

    // determine top topic
    let topTopic = 'AI Tutorials';
    let maxTopicER = -1;
    Object.entries(topicCounts).forEach(([top, stats]) => {
      const avg = stats.erSum / stats.count;
      if (avg > maxTopicER) {
        maxTopicER = avg;
        topTopic = top;
      }
    });

    const totalSent = posCount + neuCount + negCount || 1;
    const avgER = postCount > 0 ? parseFloat((totalER / postCount).toFixed(2)) : 0;
    const profile = platformFollowerProfiles[plat] || { followers: 10000, growth: 5 };

    return {
      platform: plat,
      totalPosts: postCount,
      followersCount: profile.followers,
      followerGrowthRate: profile.growth,
      totalReach,
      totalImpressions,
      avgER,
      topContentFormat: topFormat,
      topTopic,
      sentimentRatio: {
        positive: Math.round((posCount / totalSent) * 100),
        neutral: Math.round((neuCount / totalSent) * 100),
        negative: Math.round((negCount / totalSent) * 100),
      },
    };
  });

  // 2. Audience Sentiment Overview
  let allPos = 0;
  let allNeu = 0;
  let allNeg = 0;
  let totalTrackedComments = 0;
  const compliments: string[] = [];
  const criticismsOrQuestions: string[] = [];

  posts.forEach((p) => {
    totalTrackedComments += p.metrics.comments || 0;
    const sent = p.audienceReactions?.sentiment || 'positive';
    if (sent === 'very_positive' || sent === 'positive') allPos++;
    else if (sent === 'neutral') allNeu++;
    else allNeg++;

    if (p.audienceReactions?.topFeedback) {
      compliments.push(...p.audienceReactions.topFeedback);
    }
    if (p.audienceReactions?.commonQuestions) {
      criticismsOrQuestions.push(...p.audienceReactions.commonQuestions);
    }
  });

  const totalEvaluated = allPos + allNeu + allNeg || 1;
  const positivePercent = Math.round((allPos / totalEvaluated) * 100);
  const neutralPercent = Math.round((allNeu / totalEvaluated) * 100);
  const negativePercent = Math.round((allNeg / totalEvaluated) * 100);
  // Normalized score: 0 to 100
  const sentimentScoreNormalized = Math.round((allPos * 100 + allNeu * 50) / totalEvaluated);

  // 3. Best-Time Heatmap Matrix (7 days x hours 8..21)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // Bucket historical posts
  const postSlotMap: Record<string, { erSum: number; count: number }> = {};
  posts.forEach((p) => {
    const day = p.dayOfWeek;
    let hour = 14;
    if (p.timeOfDay) {
      const parts = p.timeOfDay.split(':');
      if (parts.length > 0) hour = parseInt(parts[0], 10);
    }
    const key = `${day}_${hour}`;
    if (!postSlotMap[key]) postSlotMap[key] = { erSum: 0, count: 0 };
    postSlotMap[key].erSum += p.metrics.engagementRate;
    postSlotMap[key].count += 1;
  });

  // Calculate brand overall average ER for baseline
  const totalPostsER = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0);
  const brandAvgER = posts.length > 0 ? totalPostsER / posts.length : 5.0;

  const heatmap: BestTimeHeatmapCell[] = [];
  days.forEach((day) => {
    hours.forEach((hour) => {
      const key = `${day}_${hour}`;
      const slot = postSlotMap[key];
      let avgER = 0;
      let postCount = 0;
      let engagementScore = 30; // base

      if (slot && slot.count > 0) {
        avgER = parseFloat((slot.erSum / slot.count).toFixed(2));
        postCount = slot.count;
        // score proportional to ER relative to brand avg
        engagementScore = Math.min(100, Math.max(10, Math.round((avgER / brandAvgER) * 65)));
      } else {
        // Modeled expectation for unpopulated slots
        const isMiddayWeekday = !['Saturday', 'Sunday'].includes(day) && hour >= 10 && hour <= 16;
        const isPeakWindow = (day === 'Tuesday' || day === 'Thursday') && (hour === 14 || hour === 15);
        if (isPeakWindow) {
          engagementScore = 88;
          avgER = parseFloat((brandAvgER * 1.35).toFixed(2));
        } else if (isMiddayWeekday) {
          engagementScore = 60;
          avgER = parseFloat((brandAvgER * 1.05).toFixed(2));
        } else {
          engagementScore = 25;
          avgER = parseFloat((brandAvgER * 0.6).toFixed(2));
        }
      }

      const isOptimal = engagementScore >= 75;

      heatmap.push({
        dayOfWeek: day,
        hour,
        avgER,
        postCount,
        engagementScore,
        isOptimal,
      });
    });
  });

  // 4. Social Listening & Trend Tracker
  const socialListening: SocialListeningTrend[] = [
    {
      id: 'trend_1',
      keyword: '#AIDevelopment',
      type: 'hashtag',
      mentionCount: 1480,
      growthRate: 34.2,
      sentimentScore: 0.88,
      avgERLift: 2.8,
      status: 'rising',
      relatedTopics: ['LLM Engineering', 'Autonomous Agents', 'Model Context Protocol'],
    },
    {
      id: 'trend_2',
      keyword: 'JSON Schema Validation',
      type: 'keyword',
      mentionCount: 890,
      growthRate: 46.5,
      sentimentScore: 0.92,
      avgERLift: 3.4,
      status: 'peak',
      relatedTopics: ['Structured Output', 'Zod', 'Pydantic'],
    },
    {
      id: 'trend_3',
      keyword: '#TypeScript',
      type: 'hashtag',
      mentionCount: 2240,
      growthRate: 12.0,
      sentimentScore: 0.74,
      avgERLift: 1.5,
      status: 'steady',
      relatedTopics: ['Fullstack AI', 'Node.js', 'Vite'],
    },
    {
      id: 'trend_4',
      keyword: 'Streaming Agents',
      type: 'keyword',
      mentionCount: 640,
      growthRate: 52.8,
      sentimentScore: 0.86,
      avgERLift: 3.1,
      status: 'rising',
      relatedTopics: ['SSE', 'WebSockets', 'Realtime AI'],
    },
    {
      id: 'trend_5',
      keyword: '#DevTools',
      type: 'hashtag',
      mentionCount: 1120,
      growthRate: 8.4,
      sentimentScore: 0.62,
      avgERLift: 0.4,
      status: 'steady',
      relatedTopics: ['CLI Tools', 'DX', 'Productivity'],
    },
    {
      id: 'trend_6',
      keyword: 'Vector Embeddings',
      type: 'keyword',
      mentionCount: 980,
      growthRate: 21.6,
      sentimentScore: 0.81,
      avgERLift: 2.1,
      status: 'rising',
      relatedTopics: ['RAG', 'Cosine Distance', 'Vector DB'],
    },
  ];

  // 5. Executive KPIs
  const viralPosts = posts.filter((p) => p.metrics.engagementRate >= 7.0);
  const viralityRate = posts.length > 0 ? Math.round((viralPosts.length / posts.length) * 100) : 0;
  const contentEfficiencyIndex = parseFloat(((brandAvgER * 1.4) + (viralityRate * 0.3)).toFixed(1));

  return {
    channels,
    sentimentOverview: {
      positivePercent,
      neutralPercent,
      negativePercent,
      totalTrackedComments,
      sentimentScoreNormalized,
      topCompliments: compliments.slice(0, 8),
      topCriticismsOrQuestions: criticismsOrQuestions.slice(0, 8),
    },
    heatmap,
    scheduledPosts,
    socialListening,
    kpis: {
      audienceGrowthTotal: 91900, // Total aggregated followers
      audienceGrowthRate: 14.5,
      contentEfficiencyIndex,
      viralityRate,
      conversionEstimate: Math.round(posts.reduce((s, p) => s + (p.metrics.saves || 0), 0) * 0.18),
    },
  };
}
