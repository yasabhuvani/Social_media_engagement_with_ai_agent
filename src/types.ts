/**
 * Frontend TypeScript Types
 */

export type PlatformType = 'Instagram' | 'LinkedIn' | 'Twitter/X' | 'YouTube' | 'TikTok';
export type ContentFormat = 'short_video' | 'carousel' | 'single_image' | 'text_post' | 'thread';

export interface Brand {
  _id: string;
  userId: string;
  name: string;
  handle: string;
  industry: string;
  targetAudience: string;
  primaryPlatforms: PlatformType[];
  toneOfVoice: string;
  brandDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  _id: string;
  brandId: string;
  platform: PlatformType;
  contentFormat: ContentFormat;
  topic: string;
  caption: string;
  hook?: string;
  hashtags: string[];
  postedAt: string;
  dayOfWeek: string;
  timeOfDay: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
    views?: number;
    clicks?: number;
    watchTimeAvg?: number;
    completionRate?: number;
    isViral?: boolean;
  };
  kaggleFeatures?: {
    captionLength?: number;
    hashtagCount?: number;
    hasMedia?: boolean;
    videoDuration?: number;
    hookStrength?: number;
    creatorFollowerCount?: number;
    creatorType?: 'Nano' | 'Micro' | 'Mid-tier' | 'Macro';
    accountAgeDays?: number;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
  };
  audienceReactions?: {
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'mixed' | 'critical';
    topFeedback?: string[];
    commonQuestions?: string[];
  };
  recommendationIdRef?: string;
  relevanceScore?: number;
  matchReasons?: string[];
  createdAt: string;
}

export interface PostForecastRequest {
  platform: PlatformType;
  contentFormat: ContentFormat;
  topic: string;
  caption: string;
  hook?: string;
  hashtags: string[];
  dayOfWeek: string;
  timeOfDay: string;
  videoDuration?: number;
  hookStrength?: number;
  followerCount?: number;
  hasMedia?: boolean;
}

export interface ForecastFeatureAttribution {
  feature: string;
  value: string | number;
  impactScore: number;
  explanation: string;
  historicalSampleCount: number;
}

export interface PostForecastResult {
  predictedEngagementRate: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  predictedMetrics: {
    estimatedLikes: number;
    estimatedComments: number;
    estimatedShares: number;
    estimatedSaves: number;
    estimatedReach: number;
    estimatedViews: number;
  };
  viralProbability: number;
  expectedCompletionRate?: number;
  performanceTier: 'Exceptional (Top 10%)' | 'Above Average' | 'Average' | 'Underperforming Risk';
  featureAttributions: ForecastFeatureAttribution[];
  dataBackedSuggestions: string[];
  historicalPrecedents: {
    postId: string;
    caption: string;
    actualER: number;
    similarityScore: number;
  }[];
  modelValidationMetrics: {
    meanAbsoluteError: number;
    rmse: number;
    rSquared: number;
    trainingSampleSize: number;
  };
}

export interface AudienceMemoryInsight {
  _id: string;
  brandId: string;
  category: 'frequent_topic' | 'preferred_format' | 'audience_reaction' | 'high_performing_time' | 'low_performing_pattern' | 'learned_rule';
  title: string;
  insight: string;
  confidenceScore: number;
  supportingPostIds: string[];
  supportingMetricsProof: string;
  supportingPosts?: SocialPost[];
  status: 'active' | 'refined' | 'deprecated';
  lastValidatedAt: string;
  createdAt: string;
}

export interface Recommendation {
  _id: string;
  brandId: string;
  recommendedTopic: string;
  recommendedFormat: ContentFormat;
  recommendedPlatform: PlatformType;
  recommendedPostingDay: string;
  recommendedPostingTime: string;
  reason: string;
  supportingHistoricalData: {
    referencedPostIds: string[];
    historicalMetricComparison: string;
    sampleHighPerformingPostCaption?: string;
  };
  expectedEngagementTrend: string;
  suggestedHook?: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  status: 'pending' | 'accepted' | 'published' | 'dismissed';
  feedbackResult?: {
    publishedPostId?: string;
    actualEngagementRate?: number;
    comparisonToBaseline: 'outperformed' | 'matched' | 'underperformed';
    userNotes?: string;
    memoryUpdateApplied: boolean;
    evaluatedAt: string;
  };
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  retrievedMemoryIds?: string[];
  retrievedPostIds?: string[];
  historicalProofQuotes?: string[];
}

export interface Conversation {
  _id: string;
  brandId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalPosts: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalReach: number;
  avgEngagementRate: number;
  bestFormat: { format: string; avgRate: number; count: number };
  worstFormat: { format: string; avgRate: number; count: number };
  bestTopic: { topic: string; avgRate: number; count: number };
  worstTopic: { topic: string; avgRate: number; count: number };
  bestPostingWindow: { window: string; avgRate: number; count: number };
}

export interface FormatBenchmark {
  avgRate: number;
  totalPosts: number;
  avgLikes: number;
  avgSaves: number;
}

export interface DashboardData {
  brand: Brand;
  stats: DashboardStats;
  benchmarks: {
    formatBenchmarks: Record<string, FormatBenchmark>;
    topicBenchmarks: Record<string, FormatBenchmark>;
  };
  timeline: {
    id: string;
    date: string;
    topic: string;
    format: ContentFormat;
    engagementRate: number;
    likes: number;
    saves: number;
  }[];
  recentPosts: SocialPost[];
  audienceMemoryCount: number;
  pendingRecommendations: Recommendation[];
  publishedRecommendations: Recommendation[];
}

// === Social Media Engagement Dashboard (abhishek07ma extension interfaces) ===

export interface ScheduledPost {
  _id: string;
  brandId: string;
  platform: PlatformType;
  contentFormat: ContentFormat;
  topic: string;
  caption: string;
  hook?: string;
  hashtags: string[];
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: 'scheduled' | 'published' | 'draft';
  predictedER?: number;
  notes?: string;
  createdAt: string;
}

export interface ChannelPerformance {
  platform: PlatformType;
  totalPosts: number;
  followersCount: number;
  followerGrowthRate: number; // percentage
  totalReach: number;
  totalImpressions: number;
  avgER: number;
  topContentFormat: ContentFormat;
  topTopic: string;
  sentimentRatio: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SocialListeningTrend {
  id: string;
  keyword: string;
  type: 'hashtag' | 'keyword' | 'competitor_topic';
  mentionCount: number;
  growthRate: number; // percentage
  sentimentScore: number; // -1.0 to +1.0
  avgERLift: number; // percentage lift, e.g. +2.4%
  status: 'rising' | 'peak' | 'steady';
  relatedTopics: string[];
}

export interface BestTimeHeatmapCell {
  dayOfWeek: string;
  hour: number;
  avgER: number;
  postCount: number;
  engagementScore: number; // 0 - 100
  isOptimal: boolean;
}

export interface UnifiedEngagementHubData {
  channels: ChannelPerformance[];
  sentimentOverview: {
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    totalTrackedComments: number;
    sentimentScoreNormalized: number; // 0-100
    topCompliments: string[];
    topCriticismsOrQuestions: string[];
  };
  heatmap: BestTimeHeatmapCell[];
  scheduledPosts: ScheduledPost[];
  socialListening: SocialListeningTrend[];
  kpis: {
    audienceGrowthTotal: number;
    audienceGrowthRate: number;
    contentEfficiencyIndex: number;
    viralityRate: number;
    conversionEstimate: number;
  };
}

