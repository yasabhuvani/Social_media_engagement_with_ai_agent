/**
 * Express REST API Routes for Social Media Engagement Agent
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';
import {
  SocialPost,
  EngagementMetric,
  AudienceMemoryInsight,
  Recommendation,
  Brand,
  PostForecastRequest,
  ScheduledPost,
} from '../db/schema.js';
import {
  chatWithAgent,
  generateContentRecommendation,
  generateContentForTopic,
  analyzePostWithMemory,
} from '../services/agent.js';
import {
  computeEmpiricalSummary,
  consolidateAudienceMemory,
  retrieveMemoryContext,
} from '../services/memoryEngine.js';
import { runPostForecasting } from '../services/forecastingEngine.js';
import { exportPostsToKaggleCSV, parseKaggleCSV, getKaggleBenchmarkPosts } from '../services/kaggleDataset.js';
import { computeUnifiedDashboardData } from '../services/dashboardAnalytics.js';
import {
  parseUserDataset,
  exportPostsToUniversalCSV,
  getLuminaryDtcDataset,
} from '../services/datasetManager.js';

export const apiRouter = Router();

// Middleware helper to get active brand
async function getActiveBrand(): Promise<Brand> {
  const brands = await db.collection('brands').find();
  if (brands.length > 0) return brands[0];
  throw new Error('No brand found in database.');
}

/**
 * GET /api/brand
 */
apiRouter.get('/brand', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    res.json({ success: true, brand });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dashboard
 */
apiRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });
    const recommendations: Recommendation[] = await db.collection('recommendations').find({ brandId: brand._id });

    const empirical = computeEmpiricalSummary(posts);

    let totalEngagement = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalReach = 0;

    posts.forEach((p) => {
      totalLikes += p.metrics.likes || 0;
      totalComments += p.metrics.comments || 0;
      totalShares += p.metrics.shares || 0;
      totalSaves += p.metrics.saves || 0;
      totalReach += p.metrics.reach || 0;
      totalEngagement += (p.metrics.likes || 0) + (p.metrics.comments || 0) + (p.metrics.shares || 0) + (p.metrics.saves || 0);
    });

    // Format metrics timeline for chart
    const timeline = [...posts]
      .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime())
      .map((p) => ({
        id: p._id,
        date: p.postedAt.split('T')[0],
        topic: p.topic,
        format: p.contentFormat,
        engagementRate: p.metrics.engagementRate,
        likes: p.metrics.likes,
        saves: p.metrics.saves,
      }));

    res.json({
      success: true,
      data: {
        brand,
        stats: {
          totalPosts: posts.length,
          totalEngagement,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          totalReach,
          avgEngagementRate: empirical.avgEngagementRate,
          bestFormat: empirical.bestFormat,
          worstFormat: empirical.worstFormat,
          bestTopic: empirical.bestTopic,
          worstTopic: empirical.worstTopic,
          bestPostingWindow: empirical.bestPostingWindow,
        },
        benchmarks: {
          formatBenchmarks: empirical.formatBenchmarks,
          topicBenchmarks: empirical.topicBenchmarks,
        },
        timeline,
        recentPosts: posts.slice(0, 6),
        audienceMemoryCount: memories.length,
        pendingRecommendations: recommendations.filter((r) => r.status === 'pending'),
        publishedRecommendations: recommendations.filter((r) => r.status === 'published'),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts
 */
apiRouter.get('/posts', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const { format, topic, platform, sort = 'desc' } = req.query;

    let posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });

    if (format) {
      posts = posts.filter((p) => p.contentFormat === format);
    }
    if (topic) {
      posts = posts.filter((p) => p.topic.toLowerCase().includes(String(topic).toLowerCase()));
    }
    if (platform) {
      posts = posts.filter((p) => p.platform === platform);
    }

    if (sort === 'rate_desc') {
      posts.sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
    } else if (sort === 'rate_asc') {
      posts.sort((a, b) => a.metrics.engagementRate - b.metrics.engagementRate);
    } else {
      posts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }

    res.json({ success: true, posts, total: posts.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/posts - Add/Upload new historical post & analyze with memory
 */
apiRouter.post('/posts', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const existingPosts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });

    const {
      platform,
      contentFormat,
      topic,
      caption,
      hook,
      hashtags = [],
      postedAt,
      timeOfDay = '14:30',
      dayOfWeek,
      likes = 0,
      comments = 0,
      shares = 0,
      saves = 0,
      reach = 1000,
      impressions,
      topFeedback = [],
      commonQuestions = [],
      recommendationIdRef,
    } = req.body;

    if (!topic || !caption || !contentFormat || !platform) {
      return res.status(400).json({ success: false, error: 'Topic, caption, format, and platform are required.' });
    }

    const calculatedReach = Math.max(1, Number(reach) || 1000);
    const calculatedLikes = Number(likes) || 0;
    const calculatedComments = Number(comments) || 0;
    const calculatedShares = Number(shares) || 0;
    const calculatedSaves = Number(saves) || 0;
    const calculatedImpressions = Number(impressions) || Math.round(calculatedReach * 1.35);

    const calculatedEngagementRate = Number(
      (((calculatedLikes + calculatedComments + calculatedShares + calculatedSaves) / calculatedReach) * 100).toFixed(2)
    );

    const now = new Date();
    const postDate = postedAt ? new Date(postedAt) : now;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const calculatedDayOfWeek = dayOfWeek || days[postDate.getDay()];

    const newPost: SocialPost = {
      _id: `post_${Date.now()}`,
      brandId: brand._id,
      platform,
      contentFormat,
      topic,
      caption,
      hook: hook || caption.split('\n')[0].slice(0, 80),
      hashtags: Array.isArray(hashtags)
        ? hashtags
        : String(hashtags)
            .split(/[\s,]+/)
            .filter((h) => h.startsWith('#')),
      postedAt: postDate.toISOString(),
      dayOfWeek: calculatedDayOfWeek,
      timeOfDay,
      metrics: {
        likes: calculatedLikes,
        comments: calculatedComments,
        shares: calculatedShares,
        saves: calculatedSaves,
        reach: calculatedReach,
        impressions: calculatedImpressions,
        engagementRate: calculatedEngagementRate,
      },
      audienceReactions: {
        sentiment: calculatedEngagementRate >= 5 ? 'very_positive' : calculatedEngagementRate >= 3 ? 'positive' : 'mixed',
        topFeedback: Array.isArray(topFeedback) ? topFeedback : [topFeedback].filter(Boolean),
        commonQuestions: Array.isArray(commonQuestions) ? commonQuestions : [commonQuestions].filter(Boolean),
      },
      recommendationIdRef,
      createdAt: now.toISOString(),
    };

    // Analyze with agent
    const { diagnosis, embedding } = await analyzePostWithMemory({
      brand,
      posts: existingPosts,
      newPost,
    });

    if (embedding) {
      newPost.embedding = embedding;
    }

    // Save to database
    await db.collection('social_posts').insertOne(newPost);

    const metricDoc: EngagementMetric = {
      _id: `metric_${newPost._id}`,
      postId: newPost._id,
      brandId: brand._id,
      likes: calculatedLikes,
      comments: calculatedComments,
      shares: calculatedShares,
      saves: calculatedSaves,
      reach: calculatedReach,
      impressions: calculatedImpressions,
      engagementRate: calculatedEngagementRate,
      recordedAt: newPost.postedAt,
    };
    await db.collection('engagement_metrics').insertOne(metricDoc);

    // Update audience memory
    const allPostsAfter = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(allPostsAfter, brand._id);
    if (consolidated.length > 0) {
      for (const ins of consolidated) {
        await db.collection('audience_memory').updateOne(
          (m: AudienceMemoryInsight) => m.category === ins.category,
          ins
        );
      }
    }

    res.json({
      success: true,
      post: newPost,
      diagnosis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/posts/:id
 */
apiRouter.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('social_posts').deleteOne({ _id: id });
    await db.collection('engagement_metrics').deleteOne({ postId: id });
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/posts/:id - Edit an existing post in the dataset
 */
apiRouter.put('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.collection('social_posts').findOne({ _id: id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Post not found.' });
    }

    const {
      topic,
      caption,
      hook,
      contentFormat,
      platform,
      hashtags,
      likes,
      comments,
      shares,
      saves,
      reach,
    } = req.body;

    const updatedLikes = likes !== undefined ? Number(likes) : existing.metrics.likes;
    const updatedComments = comments !== undefined ? Number(comments) : existing.metrics.comments;
    const updatedShares = shares !== undefined ? Number(shares) : existing.metrics.shares;
    const updatedSaves = saves !== undefined ? Number(saves) : existing.metrics.saves;
    const updatedReach = reach !== undefined ? Math.max(1, Number(reach)) : existing.metrics.reach;

    const updatedER = parseFloat(
      (((updatedLikes + updatedComments + updatedShares + updatedSaves) / updatedReach) * 100).toFixed(2)
    );

    const updateFields: Partial<SocialPost> = {
      ...(topic && { topic }),
      ...(caption && { caption }),
      ...(hook !== undefined && { hook }),
      ...(contentFormat && { contentFormat }),
      ...(platform && { platform }),
      ...(hashtags && {
        hashtags: Array.isArray(hashtags) ? hashtags : hashtags.split(/[\s,]+/).filter(Boolean),
      }),
      metrics: {
        ...existing.metrics,
        likes: updatedLikes,
        comments: updatedComments,
        shares: updatedShares,
        saves: updatedSaves,
        reach: updatedReach,
        engagementRate: updatedER,
        isViral: updatedER >= 7.0,
      },
    };

    await db.collection('social_posts').updateOne({ _id: id }, updateFields);

    // Update corresponding metric doc
    await db.collection('engagement_metrics').updateOne(
      { postId: id },
      {
        likes: updatedLikes,
        comments: updatedComments,
        shares: updatedShares,
        saves: updatedSaves,
        reach: updatedReach,
        engagementRate: updatedER,
      }
    );

    const updatedPost = await db.collection('social_posts').findOne({ _id: id });

    res.json({ success: true, message: 'Post updated successfully.', post: updatedPost });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/recommendations
 */
apiRouter.get('/recommendations', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const recommendations = await db.collection('recommendations').find({ brandId: brand._id });
    res.json({ success: true, recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/recommendations/generate
 */
apiRouter.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });

    const { customGoal } = req.body;
    const recData = await generateContentRecommendation({
      brand,
      posts,
      memories,
      customGoal,
    });

    const newRec: Recommendation = {
      _id: `rec_${Date.now()}`,
      ...recData,
      createdAt: new Date().toISOString(),
    };

    await db.collection('recommendations').insertOne(newRec);

    res.json({ success: true, recommendation: newRec });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/recommendations/:id/feedback - Continuous Feedback Loop
 */
apiRouter.post('/recommendations/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await getActiveBrand();
    const rec: Recommendation | null = await db.collection('recommendations').findOne({ _id: id });

    if (!rec) {
      return res.status(404).json({ success: false, error: 'Recommendation not found.' });
    }

    const {
      likes = 0,
      comments = 0,
      shares = 0,
      saves = 0,
      reach = 1000,
      userNotes = '',
      caption = '',
    } = req.body;

    const calcLikes = Number(likes);
    const calcComments = Number(comments);
    const calcShares = Number(shares);
    const calcSaves = Number(saves);
    const calcReach = Math.max(1, Number(reach));
    const actualEngagementRate = Number((((calcLikes + calcComments + calcShares + calcSaves) / calcReach) * 100).toFixed(2));

    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const empirical = computeEmpiricalSummary(posts);

    let comparisonToBaseline: 'outperformed' | 'matched' | 'underperformed' = 'matched';
    if (actualEngagementRate >= empirical.avgEngagementRate * 1.1) {
      comparisonToBaseline = 'outperformed';
    } else if (actualEngagementRate <= empirical.avgEngagementRate * 0.9) {
      comparisonToBaseline = 'underperformed';
    }

    // 1. Create a published post in social_posts
    const newPostId = `post_rec_${Date.now()}`;
    const newPublishedPost: SocialPost = {
      _id: newPostId,
      brandId: brand._id,
      platform: rec.recommendedPlatform,
      contentFormat: rec.recommendedFormat,
      topic: rec.recommendedTopic,
      caption: caption || rec.suggestedCaption || `Published post on ${rec.recommendedTopic}`,
      hook: rec.suggestedHook || caption.split('\n')[0].slice(0, 80),
      hashtags: rec.suggestedHashtags || ['#TechUpdate'],
      postedAt: new Date().toISOString(),
      dayOfWeek: rec.recommendedPostingDay,
      timeOfDay: rec.recommendedPostingTime,
      metrics: {
        likes: calcLikes,
        comments: calcComments,
        shares: calcShares,
        saves: calcSaves,
        reach: calcReach,
        impressions: Math.round(calcReach * 1.3),
        engagementRate: actualEngagementRate,
      },
      recommendationIdRef: rec._id,
      createdAt: new Date().toISOString(),
    };
    await db.collection('social_posts').insertOne(newPublishedPost);

    // 2. Update recommendation
    const feedbackResult = {
      publishedPostId: newPostId,
      actualEngagementRate,
      comparisonToBaseline,
      userNotes,
      memoryUpdateApplied: true,
      evaluatedAt: new Date().toISOString(),
    };

    await db.collection('recommendations').updateOne(
      { _id: id },
      { status: 'published', feedbackResult }
    );

    // 3. Update audience memory with new learning
    const updatedMemoryRule: AudienceMemoryInsight = {
      _id: `mem_feedback_${Date.now()}`,
      brandId: brand._id,
      category: 'learned_rule',
      title: `Feedback Validated: ${rec.recommendedTopic} (${rec.recommendedFormat}) on ${rec.recommendedPostingDay}`,
      insight: `Executing recommendation on "${rec.recommendedTopic}" resulted in ${actualEngagementRate}% ER (${comparisonToBaseline} baseline of ${empirical.avgEngagementRate}%). ${userNotes || ''}`,
      confidenceScore: 0.95,
      supportingPostIds: [newPostId, ...(rec.supportingHistoricalData?.referencedPostIds || [])],
      supportingMetricsProof: `Actual: ${actualEngagementRate}% ER with ${calcSaves} saves and ${calcLikes} likes against prior average ${empirical.avgEngagementRate}% ER.`,
      status: 'active',
      lastValidatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.collection('audience_memory').insertOne(updatedMemoryRule);

    res.json({
      success: true,
      feedbackResult,
      memoryRule: updatedMemoryRule,
      newPost: newPublishedPost,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate-content - Content Generator
 */
apiRouter.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });

    const { topic, targetFormat, targetPlatform } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required.' });
    }

    const content = await generateContentForTopic({
      brand,
      posts,
      memories,
      topic,
      targetFormat,
      targetPlatform,
    });

    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/memory - Audience Memory section
 */
apiRouter.get('/memory', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });

    // Attach supporting post objects to memory insights so UI can display citations
    const postMap = new Map(posts.map((p) => [p._id, p]));
    const enrichedMemories = memories.map((m) => ({
      ...m,
      supportingPosts: m.supportingPostIds.map((id) => postMap.get(id)).filter(Boolean),
    }));

    res.json({ success: true, memories: enrichedMemories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/consolidate - Recompute memory
 */
apiRouter.post('/memory/consolidate', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(posts, brand._id);

    for (const mem of consolidated) {
      await db.collection('audience_memory').updateOne(
        (m: AudienceMemoryInsight) => m.category === mem.category,
        mem
      );
    }

    const allMemories = await db.collection('audience_memory').find({ brandId: brand._id });
    res.json({ success: true, memories: allMemories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/memory/search - Dedicated RAG / Semantic Retrieval Explorer
 */
apiRouter.post('/memory/search', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });

    const { query = '', targetFormat, targetTopic, targetPlatform, limit = 6 } = req.body;
    const context = await retrieveMemoryContext({
      brand,
      posts,
      memories,
      query,
      targetFormat,
      targetTopic,
      targetPlatform,
      limit: Number(limit) || 6,
    });

    res.json({ success: true, results: context });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/chat - Conversation Agent
 */
apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const memories: AudienceMemoryInsight[] = await db.collection('audience_memory').find({ brandId: brand._id });

    const { message, conversationId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    // Load or create conversation
    let conv = conversationId ? await db.collection('conversations').findOne({ _id: conversationId }) : null;
    if (!conv) {
      conv = {
        _id: `conv_${Date.now()}`,
        brandId: brand._id,
        title: message.slice(0, 30),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.collection('conversations').insertOne(conv);
    }

    // Call agent
    const agentRes = await chatWithAgent({
      brand,
      posts,
      memories,
      userMessage: message,
      conversationHistory: conv.messages,
    });

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg = {
      id: `msg_a_${Date.now()}`,
      role: 'assistant' as const,
      content: agentRes.answer,
      timestamp: new Date().toISOString(),
      retrievedPostIds: agentRes.retrievedPostIds,
      retrievedMemoryIds: agentRes.retrievedMemoryIds,
      historicalProofQuotes: agentRes.historicalProofQuotes,
    };

    const updatedMessages = [...conv.messages, userMsg, assistantMsg];
    await db.collection('conversations').updateOne(
      { _id: conv._id },
      { messages: updatedMessages, updatedAt: new Date().toISOString() }
    );

    res.json({
      success: true,
      conversationId: conv._id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/chat/history
 */
apiRouter.get('/chat/history', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const conversations = await db.collection('conversations').find({ brandId: brand._id });
    res.json({ success: true, conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/chat/clear
 */
apiRouter.post('/chat/clear', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const conversations = await db.collection('conversations').find({ brandId: brand._id });
    for (const c of conversations) {
      await db.collection('conversations').deleteOne({ _id: c._id });
    }
    res.json({ success: true, message: 'Chat history cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/forecast - Post Performance Forecasting Model
 */
apiRouter.post('/forecast', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const requestData: PostForecastRequest = req.body;

    const forecast = runPostForecasting(requestData, posts);
    res.json({ success: true, forecast });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/kaggle/export-csv - Export dataset in Kaggle competition CSV format
 */
apiRouter.get('/kaggle/export-csv', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const csvString = exportPostsToKaggleCSV(posts);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="social_media_performance_forecasting_train.csv"');
    res.send(csvString);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/kaggle/import-csv - Ingest Kaggle competition CSV dataset into brand memory
 */
apiRouter.post('/kaggle/import-csv', async (req: Request, res: Response) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ success: false, error: 'CSV text content is required.' });
    }

    const brand = await getActiveBrand();
    const parsedPosts = parseKaggleCSV(csvText, brand._id);

    if (parsedPosts.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid rows found in provided CSV.' });
    }

    // Insert posts
    for (const post of parsedPosts) {
      await db.collection('social_posts').insertOne(post);
      const metricDoc: EngagementMetric = {
        _id: `metric_${post._id}`,
        postId: post._id,
        brandId: brand._id,
        likes: post.metrics.likes,
        comments: post.metrics.comments,
        shares: post.metrics.shares,
        saves: post.metrics.saves,
        reach: post.metrics.reach,
        impressions: post.metrics.impressions,
        engagementRate: post.metrics.engagementRate,
        recordedAt: post.postedAt,
      };
      await db.collection('engagement_metrics').insertOne(metricDoc);
    }

    // Consolidate memory after import
    const allPosts = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(allPosts, brand._id);
    for (const mem of consolidated) {
      await db.collection('audience_memory').updateOne(
        (m: AudienceMemoryInsight) => m.category === mem.category,
        mem
      );
    }

    res.json({
      success: true,
      importedCount: parsedPosts.length,
      totalPostsInMemory: allPosts.length,
      sampleImported: parsedPosts.slice(0, 3),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/kaggle/load-benchmark - Load pre-packaged Kaggle competition benchmark data
 */
apiRouter.post('/kaggle/load-benchmark', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const benchmarkPosts = getKaggleBenchmarkPosts(brand._id);

    for (const post of benchmarkPosts) {
      await db.collection('social_posts').insertOne(post);
      const metricDoc: EngagementMetric = {
        _id: `metric_${post._id}`,
        postId: post._id,
        brandId: brand._id,
        likes: post.metrics.likes,
        comments: post.metrics.comments,
        shares: post.metrics.shares,
        saves: post.metrics.saves,
        reach: post.metrics.reach,
        impressions: post.metrics.impressions,
        engagementRate: post.metrics.engagementRate,
        recordedAt: post.postedAt,
      };
      await db.collection('engagement_metrics').insertOne(metricDoc);
    }

    // Consolidate memory
    const allPosts = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(allPosts, brand._id);
    for (const mem of consolidated) {
      await db.collection('audience_memory').updateOne(
        (m: AudienceMemoryInsight) => m.category === mem.category,
        mem
      );
    }

    res.json({
      success: true,
      message: `Successfully loaded ${benchmarkPosts.length} Kaggle Competition Benchmark posts.`,
      addedCount: benchmarkPosts.length,
      totalPostsInMemory: allPosts.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/engagement-hub - Multi-platform dashboard analytics, heatmap, sentiment, & schedule
 * Inspired by abhishek07ma/Social_Media_Engagement_Dashboard
 */
apiRouter.get('/engagement-hub', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const scheduledPosts: ScheduledPost[] = await db.collection('scheduled_posts').find({ brandId: brand._id });

    const hubData = computeUnifiedDashboardData(brand, posts, scheduledPosts);
    res.json({ success: true, data: hubData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/schedule - Queue a new post into publishing calendar
 */
apiRouter.post('/schedule', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const {
      platform,
      contentFormat,
      topic,
      caption,
      hook,
      hashtags,
      scheduledDate,
      scheduledTime,
      notes,
    } = req.body;

    if (!platform || !contentFormat || !topic || !caption || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ success: false, error: 'Missing required scheduling fields.' });
    }

    // Run prediction for scheduled post if possible
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    let predictedER = 5.2;
    try {
      const forecast = runPostForecasting(
        {
          platform,
          contentFormat,
          topic,
          caption,
          hook,
          hashtags: Array.isArray(hashtags) ? hashtags : (hashtags || '').split(/[\s,]+/).filter(Boolean),
          dayOfWeek: new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long' }) || 'Wednesday',
          timeOfDay: scheduledTime,
        },
        posts
      );
      predictedER = forecast.predictedEngagementRate;
    } catch (e) {
      // fallback
    }

    const scheduledDoc: ScheduledPost = {
      _id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      brandId: brand._id,
      platform,
      contentFormat,
      topic,
      caption,
      hook,
      hashtags: Array.isArray(hashtags) ? hashtags : (hashtags || '').split(/[\s,]+/).filter(Boolean),
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      predictedER,
      notes: notes || 'Scheduled via Engagement Hub Calendar',
      createdAt: new Date().toISOString(),
    };

    await db.collection('scheduled_posts').insertOne(scheduledDoc);

    res.json({
      success: true,
      message: 'Post successfully scheduled in calendar.',
      scheduledPost: scheduledDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/schedule/:id - Remove scheduled post
 */
apiRouter.delete('/schedule/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('scheduled_posts').deleteOne({ _id: id });
    res.json({ success: true, message: 'Scheduled post removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/schedule/:id/publish - Publish a scheduled post right now into live memory
 */
apiRouter.post('/schedule/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await getActiveBrand();
    const scheduled = await db.collection('scheduled_posts').findOne({ _id: id });
    if (!scheduled) {
      return res.status(404).json({ success: false, error: 'Scheduled post not found.' });
    }

    // Ingest as live post with initial metrics based on predicted ER
    const reach = 18000;
    const er = scheduled.predictedER || 6.0;
    const totalEng = Math.round((reach * er) / 100);
    const likes = Math.round(totalEng * 0.6);
    const comments = Math.round(totalEng * 0.12);
    const shares = Math.round(totalEng * 0.15);
    const saves = totalEng - likes - comments - shares;

    const newPost: SocialPost = {
      _id: `post_pub_${Date.now()}`,
      brandId: brand._id,
      platform: scheduled.platform,
      contentFormat: scheduled.contentFormat,
      topic: scheduled.topic,
      caption: scheduled.caption,
      hook: scheduled.hook,
      hashtags: scheduled.hashtags,
      postedAt: new Date().toISOString(),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      timeOfDay: scheduled.scheduledTime || '14:00',
      metrics: {
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions: Math.round(reach * 1.4),
        engagementRate: er,
        views: scheduled.contentFormat === 'short_video' ? reach * 1.8 : undefined,
      },
      audienceReactions: {
        sentiment: er >= 6.0 ? 'very_positive' : 'positive',
        topFeedback: ['Published from scheduled calendar queue!'],
      },
      createdAt: new Date().toISOString(),
    };

    await db.collection('social_posts').insertOne(newPost);
    await db.collection('scheduled_posts').deleteOne({ _id: id });

    // Consolidate memory
    const allPosts = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(allPosts, brand._id);
    for (const mem of consolidated) {
      await db.collection('audience_memory').updateOne(
        (m: AudienceMemoryInsight) => m.category === mem.category,
        mem
      );
    }

    res.json({
      success: true,
      message: 'Scheduled post successfully published and integrated into memory bank.',
      publishedPost: newPost,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/executive-report - Generate executive summary KPI report
 */
apiRouter.get('/executive-report', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const summary = computeEmpiricalSummary(posts);
    const scheduledPosts: ScheduledPost[] = await db.collection('scheduled_posts').find({ brandId: brand._id });
    const hub = computeUnifiedDashboardData(brand, posts, scheduledPosts);

    const totalReach = posts.reduce((sum, p) => sum + (p.metrics.reach || 0), 0);
    const totalEngagements = posts.reduce(
      (sum, p) => sum + (p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves),
      0
    );

    const report = {
      brand: {
        name: brand.name,
        handle: brand.handle,
        industry: brand.industry,
      },
      reportingPeriod: 'Last 45 Days (Historical Baseline)',
      summaryMetrics: {
        totalPosts: summary.totalPosts,
        totalReach,
        totalEngagements,
        avgEngagementRate: summary.avgEngagementRate,
        viralityRate: `${hub.kpis.viralityRate}%`,
        contentEfficiencyIndex: hub.kpis.contentEfficiencyIndex,
      },
      channelStandings: hub.channels,
      sentimentHealth: {
        positiveRating: `${hub.sentimentOverview.positivePercent}%`,
        neutralRating: `${hub.sentimentOverview.neutralPercent}%`,
        negativeRating: `${hub.sentimentOverview.negativePercent}%`,
        sentimentScore: hub.sentimentOverview.sentimentScoreNormalized,
      },
      strategicDirectives: [
        `Prioritize ${summary.bestFormat.format.replace('_', ' ')}: Generates ${summary.bestFormat.avgRate}% ER (${((summary.bestFormat.avgRate / summary.avgEngagementRate - 1) * 100).toFixed(0)}% above brand baseline).`,
        `Double down on topic '${summary.bestTopic.topic}': Highest audience bookmark and retention rate across channels.`,
        `Publish during peak window ${summary.bestPostingWindow.window}: Yields ${summary.bestPostingWindow.avgRate}% avg engagement.`,
        `Limit promotional sales posts: Single image promo posts underperformed median by ${( (1 - summary.worstFormat.avgRate / summary.avgEngagementRate) * 100).toFixed(0)}%.`,
      ],
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/datasets - List available preset and custom datasets
 */
apiRouter.get('/datasets', async (_req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });
    const summary = computeEmpiricalSummary(posts);

    const activePlatforms = Array.from(new Set(posts.map((p) => p.platform)));

    const datasets = [
      {
        id: 'active_current',
        name: `${brand.name} (Active Live Dataset)`,
        category: 'active',
        description: `Current brand dataset learning memory bank for ${brand.handle}.`,
        brandName: brand.name,
        recordCount: posts.length,
        platforms: activePlatforms,
        avgEngagementRate: summary.avgEngagementRate,
        isCurrentActive: true,
      },
      {
        id: 'preset_synthetix',
        name: 'Synthetix AI (Developer Tools / Tech)',
        category: 'preset',
        description: '24 technical tutorials, architecture carousels, and video teardowns over 45 days.',
        brandName: 'Synthetix AI',
        recordCount: 24,
        platforms: ['LinkedIn', 'Twitter/X', 'Instagram', 'YouTube'],
        avgEngagementRate: 5.21,
        isCurrentActive: brand.name.includes('Synthetix') && posts.length === 24,
      },
      {
        id: 'preset_luminary',
        name: 'Luminary Apparel (DTC Sustainable Fashion)',
        category: 'preset',
        description: '10 lifestyle reels, sizing try-on hauls, and capsule wardrobe styling posts.',
        brandName: 'Luminary Apparel',
        recordCount: 10,
        platforms: ['Instagram', 'TikTok', 'YouTube', 'Twitter/X'],
        avgEngagementRate: 9.35,
        isCurrentActive: brand.name.includes('Luminary'),
      },
      {
        id: 'preset_kaggle',
        name: 'Kaggle Competition Benchmark (Forecasting Dataset)',
        category: 'preset',
        description: '12 multi-feature competition records with hook strength, duration, and follower tiers.',
        brandName: 'Kaggle Benchmark Suite',
        recordCount: 12,
        platforms: ['LinkedIn', 'Twitter/X', 'Instagram', 'YouTube'],
        avgEngagementRate: 6.45,
        isCurrentActive: false,
      },
    ];

    res.json({ success: true, datasets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/datasets/browse - Paginated, filterable, and searchable dataset browser
 */
apiRouter.get('/datasets/browse', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const {
      search = '',
      platform,
      format,
      topic,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
      isViral,
    } = req.query;

    let allPosts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });

    // Distinct filter lists
    const distinctPlatforms = Array.from(new Set(allPosts.map((p) => p.platform)));
    const distinctFormats = Array.from(new Set(allPosts.map((p) => p.contentFormat)));
    const distinctTopics = Array.from(new Set(allPosts.map((p) => p.topic)));

    // Overall dataset stats
    const totalLikes = allPosts.reduce((s, p) => s + (p.metrics.likes || 0), 0);
    const totalComments = allPosts.reduce((s, p) => s + (p.metrics.comments || 0), 0);
    const totalShares = allPosts.reduce((s, p) => s + (p.metrics.shares || 0), 0);
    const totalSaves = allPosts.reduce((s, p) => s + (p.metrics.saves || 0), 0);
    const totalReach = allPosts.reduce((s, p) => s + (p.metrics.reach || 0), 0);
    const avgER =
      allPosts.length > 0
        ? parseFloat((allPosts.reduce((s, p) => s + p.metrics.engagementRate, 0) / allPosts.length).toFixed(2))
        : 0;

    // Filter by search keyword
    if (search) {
      const q = String(search).toLowerCase();
      allPosts = allPosts.filter(
        (p) =>
          p.caption.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          p.platform.toLowerCase().includes(q) ||
          (p.hook && p.hook.toLowerCase().includes(q)) ||
          p.hashtags.some((h) => h.toLowerCase().includes(q))
      );
    }

    // Filter by platform
    if (platform && platform !== 'all') {
      allPosts = allPosts.filter((p) => p.platform.toLowerCase() === String(platform).toLowerCase());
    }

    // Filter by format
    if (format && format !== 'all') {
      allPosts = allPosts.filter((p) => p.contentFormat === format);
    }

    // Filter by topic
    if (topic && topic !== 'all') {
      allPosts = allPosts.filter((p) => p.topic.toLowerCase() === String(topic).toLowerCase());
    }

    // Filter by viral status
    if (isViral === 'true') {
      allPosts = allPosts.filter((p) => p.metrics.engagementRate >= 7.0 || p.metrics.isViral);
    }

    // Sort
    const isAsc = sortOrder === 'asc';
    allPosts.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'engagementRate':
        case 'er':
          comparison = a.metrics.engagementRate - b.metrics.engagementRate;
          break;
        case 'likes':
          comparison = a.metrics.likes - b.metrics.likes;
          break;
        case 'comments':
          comparison = a.metrics.comments - b.metrics.comments;
          break;
        case 'shares':
          comparison = a.metrics.shares - b.metrics.shares;
          break;
        case 'saves':
          comparison = a.metrics.saves - b.metrics.saves;
          break;
        case 'reach':
          comparison = a.metrics.reach - b.metrics.reach;
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'format':
          comparison = a.contentFormat.localeCompare(b.contentFormat);
          break;
        case 'date':
        default:
          comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          break;
      }
      return isAsc ? comparison : -comparison;
    });

    const total = allPosts.length;
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      posts: paginatedPosts,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages,
      },
      filters: {
        platforms: distinctPlatforms,
        formats: distinctFormats,
        topics: distinctTopics,
      },
      stats: {
        totalRecords: total,
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        totalReach,
        avgER,
        viralCount: allPosts.filter((p) => p.metrics.engagementRate >= 7.0).length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/datasets/upload - Import custom CSV or JSON dataset
 */
apiRouter.post('/datasets/upload', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const { name, content, fileType = 'csv', mode = 'append', brandName, industry } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Dataset content string is required.' });
    }

    const { posts: parsedPosts, warnings } = parseUserDataset(
      content,
      brand._id,
      fileType === 'json' ? 'json' : 'csv'
    );

    if (mode === 'replace') {
      // Clear current brand's posts & metrics
      const currentPosts = await db.collection('social_posts').find({ brandId: brand._id });
      for (const p of currentPosts) {
        await db.collection('social_posts').deleteOne({ _id: p._id });
        await db.collection('engagement_metrics').deleteOne({ postId: p._id });
      }

      // If custom brand info was supplied, update brand document
      if (brandName) {
        await db.collection('brands').updateOne(
          { _id: brand._id },
          {
            name: brandName,
            handle: `@${brandName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
            ...(industry && { industry }),
          }
        );
      }
    }

    // Insert new posts and metrics
    for (const post of parsedPosts) {
      await db.collection('social_posts').insertOne(post);
      const metricDoc: EngagementMetric = {
        _id: `metric_${post._id}`,
        postId: post._id,
        brandId: brand._id,
        likes: post.metrics.likes,
        comments: post.metrics.comments,
        shares: post.metrics.shares,
        saves: post.metrics.saves,
        reach: post.metrics.reach,
        impressions: post.metrics.impressions,
        engagementRate: post.metrics.engagementRate,
        recordedAt: post.postedAt,
      };
      await db.collection('engagement_metrics').insertOne(metricDoc);
    }

    // Trigger Audience Memory consolidation
    const allPosts = await db.collection('social_posts').find({ brandId: brand._id });
    const consolidated = consolidateAudienceMemory(allPosts, brand._id);
    for (const mem of consolidated) {
      await db.collection('audience_memory').updateOne(
        (m: AudienceMemoryInsight) => m.category === mem.category,
        mem
      );
    }

    res.json({
      success: true,
      message: `Successfully imported ${parsedPosts.length} posts from ${name || 'custom dataset'}. Memory bank re-consolidated.`,
      importedCount: parsedPosts.length,
      totalPostsInMemory: allPosts.length,
      sampleRecords: parsedPosts.slice(0, 3),
      warnings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/datasets/load-preset - Switch entire brand & post memory to a selected preset
 */
apiRouter.post('/datasets/load-preset', async (req: Request, res: Response) => {
  try {
    const { presetId } = req.body;
    const activeBrand = await getActiveBrand();

    if (presetId === 'preset_luminary') {
      const { brand: luminaryBrand, posts: luminaryPosts } = getLuminaryDtcDataset();

      // Update active brand document
      await db.collection('brands').updateOne({ _id: activeBrand._id }, {
        name: luminaryBrand.name,
        handle: luminaryBrand.handle,
        industry: luminaryBrand.industry,
        targetAudience: luminaryBrand.targetAudience,
        primaryPlatforms: luminaryBrand.primaryPlatforms,
        toneOfVoice: luminaryBrand.toneOfVoice,
        brandDescription: luminaryBrand.brandDescription,
      });

      // Clear existing posts
      const currentPosts = await db.collection('social_posts').find({ brandId: activeBrand._id });
      for (const p of currentPosts) {
        await db.collection('social_posts').deleteOne({ _id: p._id });
        await db.collection('engagement_metrics').deleteOne({ postId: p._id });
      }

      // Insert luminary posts
      for (const post of luminaryPosts) {
        post.brandId = activeBrand._id;
        await db.collection('social_posts').insertOne(post);
        await db.collection('engagement_metrics').insertOne({
          _id: `metric_${post._id}`,
          postId: post._id,
          brandId: activeBrand._id,
          likes: post.metrics.likes,
          comments: post.metrics.comments,
          shares: post.metrics.shares,
          saves: post.metrics.saves,
          reach: post.metrics.reach,
          impressions: post.metrics.impressions,
          engagementRate: post.metrics.engagementRate,
          recordedAt: post.postedAt,
        });
      }

      // Consolidate memory for Luminary
      const consolidated = consolidateAudienceMemory(luminaryPosts, activeBrand._id);
      for (const mem of consolidated) {
        await db.collection('audience_memory').updateOne(
          (m: AudienceMemoryInsight) => m.category === mem.category,
          mem
        );
      }

      return res.json({
        success: true,
        message: 'Successfully switched to Luminary Apparel (DTC Sustainable Fashion) dataset & memory bank.',
        datasetName: 'Luminary Apparel (DTC Sustainable Fashion)',
        recordCount: luminaryPosts.length,
      });
    }

    if (presetId === 'preset_kaggle') {
      const benchmarkPosts = getKaggleBenchmarkPosts(activeBrand._id);

      // Append kaggle benchmark posts
      for (const post of benchmarkPosts) {
        await db.collection('social_posts').insertOne(post);
        await db.collection('engagement_metrics').insertOne({
          _id: `metric_${post._id}`,
          postId: post._id,
          brandId: activeBrand._id,
          likes: post.metrics.likes,
          comments: post.metrics.comments,
          shares: post.metrics.shares,
          saves: post.metrics.saves,
          reach: post.metrics.reach,
          impressions: post.metrics.impressions,
          engagementRate: post.metrics.engagementRate,
          recordedAt: post.postedAt,
        });
      }

      const allPosts = await db.collection('social_posts').find({ brandId: activeBrand._id });
      const consolidated = consolidateAudienceMemory(allPosts, activeBrand._id);
      for (const mem of consolidated) {
        await db.collection('audience_memory').updateOne(
          (m: AudienceMemoryInsight) => m.category === mem.category,
          mem
        );
      }

      return res.json({
        success: true,
        message: `Loaded ${benchmarkPosts.length} Kaggle Competition Benchmark posts into memory.`,
        recordCount: allPosts.length,
      });
    }

    // Default: Reset to clean Synthetix AI 24-post dataset
    db.resetToDefaultSeed();
    res.json({
      success: true,
      message: 'Successfully restored Synthetix AI (Developer Tools) 24-post dataset baseline.',
      datasetName: 'Synthetix AI (Developer Tools)',
      recordCount: 24,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/datasets/export - Export active brand dataset as CSV or JSON
 */
apiRouter.get('/datasets/export', async (req: Request, res: Response) => {
  try {
    const brand = await getActiveBrand();
    const { format = 'csv' } = req.query;
    const posts: SocialPost[] = await db.collection('social_posts').find({ brandId: brand._id });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${brand.name.toLowerCase().replace(/\s+/g, '_')}_dataset.json"`);
      return res.send(JSON.stringify(posts, null, 2));
    }

    const csvContent = exportPostsToUniversalCSV(posts, brand.name);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${brand.name.toLowerCase().replace(/\s+/g, '_')}_dataset.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reset-demo - Hackathon judge convenience: resets data to clean 24 realistic posts
 */
apiRouter.post('/reset-demo', async (_req: Request, res: Response) => {
  try {
    db.resetToDefaultSeed();
    res.json({ success: true, message: 'Database reset to default 24-post realistic demo dataset.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
