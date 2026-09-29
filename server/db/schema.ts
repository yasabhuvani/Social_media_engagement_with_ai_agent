/**
 * MongoDB Document Schemas & Interfaces for Social Media Engagement Agent
 */

export interface User {
  _id: string;
  email: string;
  name: string;
  currentBrandId: string;
  createdAt: string;
}

export interface Brand {
  _id: string;
  userId: string;
  name: string;
  handle: string;
  industry: string;
  targetAudience: string;
  primaryPlatforms: ('Instagram' | 'LinkedIn' | 'Twitter/X' | 'YouTube' | 'TikTok')[];
  toneOfVoice: string;
  brandDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentFormat = 'short_video' | 'carousel' | 'single_image' | 'text_post' | 'thread';
export type PlatformType = 'Instagram' | 'LinkedIn' | 'Twitter/X' | 'YouTube' | 'TikTok';

export interface EngagementMetric {
  _id: string;
  postId: string;
  brandId: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number; // calculated as ((likes + comments + shares + saves) / reach) * 100
  recordedAt: string;
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
  postedAt: string; // ISO string
  dayOfWeek: string; // Monday, Tuesday, etc.
  timeOfDay: string; // e.g. "14:30" or "10:00"
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
    watchTimeAvg?: number; // seconds
    completionRate?: number; // percentage (0-100)
    isViral?: boolean;
  };
  kaggleFeatures?: {
    captionLength?: number;
    hashtagCount?: number;
    hasMedia?: boolean;
    videoDuration?: number; // seconds
    hookStrength?: number; // 1-10 scale
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
  recommendationIdRef?: string; // If this post was published from a recommendation
  embedding?: number[]; // Vector embedding for semantic search
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
  impactScore: number; // positive or negative percentage contribution
  explanation: string;
  historicalSampleCount: number;
}

export interface PostForecastResult {
  predictedEngagementRate: number; // e.g. 6.84%
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
  viralProbability: number; // 0 to 100%
  expectedCompletionRate?: number; // For video/carousel
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
  confidenceScore: number; // 0 to 1.0
  supportingPostIds: string[];
  supportingMetricsProof: string; // e.g. "Based on 5 tutorial videos averaging 6.4% ER vs 1.8% ER for promo images"
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
  expectedEngagementTrend: string; // Qualitatively grounded in data, e.g. "Expected to outperform brand median ER (3.2%) based on previous 4 AI technical guides"
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

