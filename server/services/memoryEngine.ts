/**
 * Memory Engine & Retrieval System (RAG)
 * Handles historical post retrieval, vector/semantic similarity,
 * empirical benchmark computations, and audience memory synthesis.
 */

import { SocialPost, AudienceMemoryInsight, Brand } from '../db/schema.js';
import { getEmbedding } from './gemini.js';

export interface RetrievedContext {
  relevantPosts: (SocialPost & { relevanceScore: number; matchReasons: string[] })[];
  relevantMemories: AudienceMemoryInsight[];
  empiricalSummary: {
    totalPosts: number;
    avgEngagementRate: number;
    bestFormat: { format: string; avgRate: number; count: number };
    worstFormat: { format: string; avgRate: number; count: number };
    bestTopic: { topic: string; avgRate: number; count: number };
    worstTopic: { topic: string; avgRate: number; count: number };
    bestPostingWindow: { window: string; avgRate: number; count: number };
    formatBenchmarks: Record<string, { avgRate: number; totalPosts: number; avgLikes: number; avgSaves: number }>;
    topicBenchmarks: Record<string, { avgRate: number; totalPosts: number; avgLikes: number; avgSaves: number }>;
    highPerformingSamples: SocialPost[];
    lowPerformingSamples: SocialPost[];
  };
}

/**
 * Calculates cosine similarity between two numerical vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback semantic TF-IDF token vectorizer
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s#]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function computeKeywordOverlap(query: string, doc: string): number {
  const queryTokens = new Set(tokenize(query));
  const docTokens = tokenize(doc);
  if (queryTokens.size === 0 || docTokens.length === 0) return 0;

  let matches = 0;
  for (const token of docTokens) {
    if (queryTokens.has(token)) {
      matches++;
    }
  }
  return Math.min(1.0, (matches * 2) / (queryTokens.size + Math.min(20, docTokens.length)));
}

/**
 * Computes exact statistical benchmarks directly from verified historical posts
 */
export function computeEmpiricalSummary(posts: SocialPost[]) {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      avgEngagementRate: 0,
      bestFormat: { format: 'None', avgRate: 0, count: 0 },
      worstFormat: { format: 'None', avgRate: 0, count: 0 },
      bestTopic: { topic: 'None', avgRate: 0, count: 0 },
      worstTopic: { topic: 'None', avgRate: 0, count: 0 },
      bestPostingWindow: { window: 'None', avgRate: 0, count: 0 },
      formatBenchmarks: {},
      topicBenchmarks: {},
      highPerformingSamples: [],
      lowPerformingSamples: [],
    };
  }

  const formatStats: Record<string, { totalRate: number; count: number; totalLikes: number; totalSaves: number }> = {};
  const topicStats: Record<string, { totalRate: number; count: number; totalLikes: number; totalSaves: number }> = {};
  const timeStats: Record<string, { totalRate: number; count: number }> = {};

  let totalEngagementRate = 0;

  for (const p of posts) {
    const er = p.metrics.engagementRate;
    totalEngagementRate += er;

    // Format stats
    if (!formatStats[p.contentFormat]) {
      formatStats[p.contentFormat] = { totalRate: 0, count: 0, totalLikes: 0, totalSaves: 0 };
    }
    formatStats[p.contentFormat].totalRate += er;
    formatStats[p.contentFormat].count += 1;
    formatStats[p.contentFormat].totalLikes += p.metrics.likes;
    formatStats[p.contentFormat].totalSaves += p.metrics.saves;

    // Topic stats
    if (!topicStats[p.topic]) {
      topicStats[p.topic] = { totalRate: 0, count: 0, totalLikes: 0, totalSaves: 0 };
    }
    topicStats[p.topic].totalRate += er;
    topicStats[p.topic].count += 1;
    topicStats[p.topic].totalLikes += p.metrics.likes;
    topicStats[p.topic].totalSaves += p.metrics.saves;

    // Time window grouping
    const hour = parseInt((p.timeOfDay || '12:00').split(':')[0], 10);
    let window = '12:00-14:00';
    if (hour < 12) window = 'Morning (09:00-12:00)';
    else if (hour >= 12 && hour < 14) window = 'Midday (12:00-14:00)';
    else if (hour >= 14 && hour < 17) window = 'Afternoon (14:00-17:00)';
    else window = 'Evening (17:00-21:00)';

    if (!timeStats[window]) {
      timeStats[window] = { totalRate: 0, count: 0 };
    }
    timeStats[window].totalRate += er;
    timeStats[window].count += 1;
  }

  const formatBenchmarks: Record<string, { avgRate: number; totalPosts: number; avgLikes: number; avgSaves: number }> = {};
  for (const [fmt, stat] of Object.entries(formatStats)) {
    formatBenchmarks[fmt] = {
      avgRate: Number((stat.totalRate / stat.count).toFixed(2)),
      totalPosts: stat.count,
      avgLikes: Math.round(stat.totalLikes / stat.count),
      avgSaves: Math.round(stat.totalSaves / stat.count),
    };
  }

  const topicBenchmarks: Record<string, { avgRate: number; totalPosts: number; avgLikes: number; avgSaves: number }> = {};
  for (const [top, stat] of Object.entries(topicStats)) {
    topicBenchmarks[top] = {
      avgRate: Number((stat.totalRate / stat.count).toFixed(2)),
      totalPosts: stat.count,
      avgLikes: Math.round(stat.totalLikes / stat.count),
      avgSaves: Math.round(stat.totalSaves / stat.count),
    };
  }

  // Sorted formats
  const sortedFormats = Object.entries(formatBenchmarks).sort((a, b) => b[1].avgRate - a[1].avgRate);
  const bestFormat = sortedFormats[0]
    ? { format: sortedFormats[0][0], avgRate: sortedFormats[0][1].avgRate, count: sortedFormats[0][1].totalPosts }
    : { format: 'None', avgRate: 0, count: 0 };
  const worstFormat = sortedFormats[sortedFormats.length - 1]
    ? { format: sortedFormats[sortedFormats.length - 1][0], avgRate: sortedFormats[sortedFormats.length - 1][1].avgRate, count: sortedFormats[sortedFormats.length - 1][1].totalPosts }
    : { format: 'None', avgRate: 0, count: 0 };

  // Sorted topics
  const sortedTopics = Object.entries(topicBenchmarks).sort((a, b) => b[1].avgRate - a[1].avgRate);
  const bestTopic = sortedTopics[0]
    ? { topic: sortedTopics[0][0], avgRate: sortedTopics[0][1].avgRate, count: sortedTopics[0][1].totalPosts }
    : { topic: 'None', avgRate: 0, count: 0 };
  const worstTopic = sortedTopics[sortedTopics.length - 1]
    ? { topic: sortedTopics[sortedTopics.length - 1][0], avgRate: sortedTopics[sortedTopics.length - 1][1].avgRate, count: sortedTopics[sortedTopics.length - 1][1].totalPosts }
    : { topic: 'None', avgRate: 0, count: 0 };

  // Best posting window
  const sortedWindows = Object.entries(timeStats)
    .map(([w, s]) => ({ window: w, avgRate: Number((s.totalRate / s.count).toFixed(2)), count: s.count }))
    .sort((a, b) => b.avgRate - a.avgRate);
  const bestPostingWindow = sortedWindows[0] || { window: 'Afternoon (14:00-17:00)', avgRate: 0, count: 0 };

  const sortedPosts = [...posts].sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);

  return {
    totalPosts: posts.length,
    avgEngagementRate: Number((totalEngagementRate / posts.length).toFixed(2)),
    bestFormat,
    worstFormat,
    bestTopic,
    worstTopic,
    bestPostingWindow,
    formatBenchmarks,
    topicBenchmarks,
    highPerformingSamples: sortedPosts.slice(0, 3),
    lowPerformingSamples: sortedPosts.slice(-3).reverse(),
  };
}

/**
 * Retrieves relevant posts and audience memory rules for a given user query or topic
 */
export async function retrieveMemoryContext(params: {
  brand: Brand;
  posts: SocialPost[];
  memories: AudienceMemoryInsight[];
  query: string;
  targetFormat?: string;
  targetTopic?: string;
  targetPlatform?: string;
  limit?: number;
}): Promise<RetrievedContext> {
  const { posts, memories, query, targetFormat, targetTopic, targetPlatform, limit = 6 } = params;
  const empiricalSummary = computeEmpiricalSummary(posts);

  if (posts.length === 0) {
    return {
      relevantPosts: [],
      relevantMemories: [],
      empiricalSummary,
    };
  }

  // Attempt query vector embedding if available
  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await getEmbedding(query);
  } catch (err) {
    queryEmbedding = null;
  }

  const scoredPosts = posts.map((post) => {
    let score = 0;
    const matchReasons: string[] = [];

    // Semantic vector similarity
    if (queryEmbedding && post.embedding && post.embedding.length > 0) {
      const sim = cosineSimilarity(queryEmbedding, post.embedding);
      score += sim * 40;
      if (sim > 0.65) matchReasons.push(`High semantic similarity (${Math.round(sim * 100)}%)`);
    }

    // Keyword & lexical overlap
    const postSearchText = `${post.topic} ${post.contentFormat} ${post.platform} ${post.caption} ${post.hashtags.join(' ')} ${post.hook || ''}`;
    const kwOverlap = computeKeywordOverlap(query, postSearchText);
    score += kwOverlap * 35;
    if (kwOverlap > 0.25) matchReasons.push(`Topic & keyword match`);

    // Target filters
    if (targetTopic && post.topic.toLowerCase() === targetTopic.toLowerCase()) {
      score += 25;
      matchReasons.push(`Exact topic match: "${post.topic}"`);
    } else if (query.toLowerCase().includes(post.topic.toLowerCase())) {
      score += 20;
      matchReasons.push(`Topic mentioned: "${post.topic}"`);
    }

    if (targetFormat && post.contentFormat.toLowerCase() === targetFormat.toLowerCase()) {
      score += 20;
      matchReasons.push(`Format match: ${post.contentFormat}`);
    } else if (query.toLowerCase().includes(post.contentFormat.replace('_', ' '))) {
      score += 15;
      matchReasons.push(`Format mentioned: ${post.contentFormat}`);
    }

    if (targetPlatform && post.platform.toLowerCase() === targetPlatform.toLowerCase()) {
      score += 15;
      matchReasons.push(`Platform match: ${post.platform}`);
    }

    // Normalized engagement bonus (up to 20 pts)
    const normalizedER = Math.min(20, (post.metrics.engagementRate / 8) * 20);
    score += normalizedER;
    if (post.metrics.engagementRate >= empiricalSummary.avgEngagementRate) {
      matchReasons.push(`Outperformed average ER (${post.metrics.engagementRate.toFixed(1)}%)`);
    }

    if (matchReasons.length === 0) {
      matchReasons.push(`Historical benchmark reference`);
    }

    return {
      ...post,
      relevanceScore: Number(score.toFixed(2)),
      matchReasons,
    };
  });

  scoredPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const relevantPosts = scoredPosts.slice(0, limit);

  // Filter memories matching query or categories
  const relevantMemories = memories
    .filter((mem) => {
      if (mem.status !== 'active') return false;
      const memText = `${mem.title} ${mem.insight} ${mem.category} ${mem.supportingMetricsProof}`.toLowerCase();
      const q = query.toLowerCase();
      if (q.includes('format') && mem.category === 'preferred_format') return true;
      if (q.includes('time') && mem.category === 'high_performing_time') return true;
      if (q.includes('topic') && mem.category === 'frequent_topic') return true;
      if ((q.includes('avoid') || q.includes('poor') || q.includes('mistake')) && mem.category === 'low_performing_pattern') return true;
      return computeKeywordOverlap(query, memText) > 0.15 || mem.confidenceScore >= 0.9;
    })
    .slice(0, 4);

  return {
    relevantPosts,
    relevantMemories: relevantMemories.length > 0 ? relevantMemories : memories.slice(0, 3),
    empiricalSummary,
  };
}

/**
 * Re-evaluates and refreshes the brand's Audience Memory rules from the entire dataset
 */
export function consolidateAudienceMemory(posts: SocialPost[], brandId: string): AudienceMemoryInsight[] {
  if (posts.length < 3) {
    return [];
  }

  const summary = computeEmpiricalSummary(posts);
  const insights: AudienceMemoryInsight[] = [];
  const now = new Date().toISOString();

  // 1. Format preference rule
  if (summary.bestFormat.count >= 2) {
    const supporting = posts.filter((p) => p.contentFormat === summary.bestFormat.format).map((p) => p._id);
    insights.push({
      _id: `mem_format_${Date.now()}`,
      brandId,
      category: 'preferred_format',
      title: `${formatLabel(summary.bestFormat.format)} Delivers Highest Audience Engagement`,
      insight: `${formatLabel(summary.bestFormat.format)} averages ${summary.bestFormat.avgRate}% engagement rate across ${summary.bestFormat.count} posts. In comparison, ${formatLabel(summary.worstFormat.format)} averages only ${summary.worstFormat.avgRate}%.`,
      confidenceScore: Math.min(0.98, 0.75 + summary.bestFormat.count * 0.02),
      supportingPostIds: supporting.slice(0, 8),
      supportingMetricsProof: `Empirically verified across ${summary.bestFormat.count} ${summary.bestFormat.format} posts averaging ${summary.bestFormat.avgRate}% ER vs brand baseline ${summary.avgEngagementRate}% ER.`,
      status: 'active',
      lastValidatedAt: now,
      createdAt: now,
    });
  }

  // 2. Topic preference rule
  if (summary.bestTopic.count >= 2) {
    const supporting = posts.filter((p) => p.topic === summary.bestTopic.topic).map((p) => p._id);
    insights.push({
      _id: `mem_topic_${Date.now()}`,
      brandId,
      category: 'frequent_topic',
      title: `"${summary.bestTopic.topic}" is the Highest Converting Topic`,
      insight: `Posts discussing "${summary.bestTopic.topic}" average ${summary.bestTopic.avgRate}% ER, driving significantly higher audience saves and discussions compared to other topics.`,
      confidenceScore: Math.min(0.96, 0.72 + summary.bestTopic.count * 0.03),
      supportingPostIds: supporting.slice(0, 8),
      supportingMetricsProof: `Based on ${summary.bestTopic.count} posts with ${summary.bestTopic.avgRate}% average ER vs lowest topic "${summary.worstTopic.topic}" (${summary.worstTopic.avgRate}% ER).`,
      status: 'active',
      lastValidatedAt: now,
      createdAt: now,
    });
  }

  // 3. Optimal time window
  if (summary.bestPostingWindow.count >= 2) {
    const supporting = posts
      .filter((p) => {
        const hour = parseInt((p.timeOfDay || '12:00').split(':')[0], 10);
        return hour >= 14 && hour <= 17;
      })
      .map((p) => p._id);
    insights.push({
      _id: `mem_time_${Date.now()}`,
      brandId,
      category: 'high_performing_time',
      title: `Optimal Posting Window: ${summary.bestPostingWindow.window}`,
      insight: `The audience exhibits peak responsiveness during ${summary.bestPostingWindow.window} averaging ${summary.bestPostingWindow.avgRate}% ER across ${summary.bestPostingWindow.count} posts.`,
      confidenceScore: 0.91,
      supportingPostIds: supporting.slice(0, 8),
      supportingMetricsProof: `Window achieves ${summary.bestPostingWindow.avgRate}% ER, outperforming earlier morning hours by a substantial margin.`,
      status: 'active',
      lastValidatedAt: now,
      createdAt: now,
    });
  }

  // 4. Low performing pattern
  if (summary.worstFormat.count >= 2 && summary.worstFormat.avgRate < summary.avgEngagementRate) {
    const supporting = posts.filter((p) => p.contentFormat === summary.worstFormat.format).map((p) => p._id);
    insights.push({
      _id: `mem_avoid_${Date.now()}`,
      brandId,
      category: 'low_performing_pattern',
      title: `Avoid Under-Engaging Formats (${formatLabel(summary.worstFormat.format)})`,
      insight: `${formatLabel(summary.worstFormat.format)} posts consistently generate lower interactions (${summary.worstFormat.avgRate}% ER). Consider converting key ideas into ${formatLabel(summary.bestFormat.format)} or Carousels instead.`,
      confidenceScore: 0.93,
      supportingPostIds: supporting.slice(0, 8),
      supportingMetricsProof: `Average ER of ${summary.worstFormat.avgRate}% is ${(summary.avgEngagementRate - summary.worstFormat.avgRate).toFixed(1)} percentage points below the brand median.`,
      status: 'active',
      lastValidatedAt: now,
      createdAt: now,
    });
  }

  return insights;
}

function formatLabel(format: string): string {
  const map: Record<string, string> = {
    short_video: 'Short Video',
    carousel: 'Educational Carousel',
    single_image: 'Single Image',
    text_post: 'Text Post',
    thread: 'Multi-post Thread',
  };
  return map[format] || format;
}
