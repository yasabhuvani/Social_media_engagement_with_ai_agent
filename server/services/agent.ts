/**
 * Social Media Engagement Agent
 * Coordinates LLM reasoning, RAG memory injection, personalized recommendations,
 * post analysis, and the continuous learning feedback loop.
 */

import {
  Brand,
  SocialPost,
  AudienceMemoryInsight,
  Recommendation,
  PlatformType,
  ContentFormat,
} from '../db/schema.js';
import { generateAgentText, getEmbedding } from './gemini.js';
import { retrieveMemoryContext, computeEmpiricalSummary, consolidateAudienceMemory } from './memoryEngine.js';

export interface ChatAgentResponse {
  answer: string;
  retrievedPostIds: string[];
  retrievedMemoryIds: string[];
  historicalProofQuotes: string[];
}

/**
 * Handle conversational user questions using RAG and empirical brand memory
 */
export async function chatWithAgent(params: {
  brand: Brand;
  posts: SocialPost[];
  memories: AudienceMemoryInsight[];
  userMessage: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}): Promise<ChatAgentResponse> {
  const { brand, posts, memories, userMessage, conversationHistory } = params;

  // Strict check: if not enough data
  if (posts.length < 2) {
    return {
      answer: `There is not enough brand-specific data yet. Currently, ${brand.name} has only ${posts.length} historical post(s) recorded in memory. Please add at least 3-5 historical posts with engagement metrics so I can analyze audience behavior and provide data-grounded recommendations.`,
      retrievedPostIds: [],
      retrievedMemoryIds: [],
      historicalProofQuotes: ['Insufficient brand-specific historical data.'],
    };
  }

  // Retrieve relevant historical context
  const context = await retrieveMemoryContext({
    brand,
    posts,
    memories,
    query: userMessage,
    limit: 6,
  });

  const empirical = context.empiricalSummary;

  // Prepare structured memory prompt
  const memoryContextText = `
=== BRAND PROFILE ===
Brand Name: ${brand.name} (${brand.handle})
Industry: ${brand.industry}
Target Audience: ${brand.targetAudience}
Tone of Voice: ${brand.toneOfVoice}

=== VERIFIED EMPIRICAL METRICS (DO NOT INVENT DIFFERENT NUMBERS) ===
Total Historical Posts Analyzed: ${empirical.totalPosts}
Overall Brand Average Engagement Rate: ${empirical.avgEngagementRate}%
Best-Performing Format: ${empirical.bestFormat.format} (${empirical.bestFormat.avgRate}% avg ER, ${empirical.bestFormat.count} posts)
Worst-Performing Format: ${empirical.worstFormat.format} (${empirical.worstFormat.avgRate}% avg ER, ${empirical.worstFormat.count} posts)
Best-Performing Topic: "${empirical.bestTopic.topic}" (${empirical.bestTopic.avgRate}% avg ER, ${empirical.bestTopic.count} posts)
Lowest-Performing Topic: "${empirical.worstTopic.topic}" (${empirical.worstTopic.avgRate}% avg ER, ${empirical.worstTopic.count} posts)
Peak Engagement Window: ${empirical.bestPostingWindow.window} (${empirical.bestPostingWindow.avgRate}% avg ER)

Format Benchmarks:
${Object.entries(empirical.formatBenchmarks)
  .map(([f, s]) => `- ${f}: ${s.avgRate}% ER (Posts: ${s.totalPosts}, Avg Likes: ${s.avgLikes}, Avg Saves: ${s.avgSaves})`)
  .join('\n')}

Topic Benchmarks:
${Object.entries(empirical.topicBenchmarks)
  .map(([t, s]) => `- ${t}: ${s.avgRate}% ER (Posts: ${s.totalPosts}, Avg Likes: ${s.avgLikes}, Avg Saves: ${s.avgSaves})`)
  .join('\n')}

=== RETRIEVED RELEVANT HISTORICAL POSTS ===
${context.relevantPosts
  .map(
    (p, i) => `[Post #${i + 1} | ID: ${p._id}]
Platform: ${p.platform} | Format: ${p.contentFormat} | Topic: ${p.topic}
Posted: ${p.dayOfWeek} at ${p.timeOfDay} (${p.postedAt})
Metrics: ${p.metrics.engagementRate}% ER | ${p.metrics.likes} likes, ${p.metrics.comments} comments, ${p.metrics.shares} shares, ${p.metrics.saves} saves, Reach: ${p.metrics.reach}
Caption: "${p.caption}"
${p.audienceReactions ? `Audience Feedback: ${p.audienceReactions.topFeedback?.join(' | ') || 'None'}` : ''}
Match Reasons: ${p.matchReasons.join(', ')}`
  )
  .join('\n\n')}

=== RETRIEVED AUDIENCE MEMORY RULES ===
${context.relevantMemories
  .map(
    (m) => `[Memory ID: ${m._id}] ${m.title}
Insight: ${m.insight}
Supporting Proof: ${m.supportingMetricsProof} (Confidence: ${(m.confidenceScore * 100).toFixed(0)}%)`
  )
  .join('\n\n')}
`;

  const systemInstruction = `
You are the "Social Media Engagement Agent", a dedicated AI strategist for ${brand.name}.
CRITICAL OPERATING RULES:
1. You are NOT a generic chatbot. DO NOT give generic advice like "Videos perform well on social media" or "Use trending hashtags".
2. ALWAYS explain recommendations and answers using ${brand.name}'s OWN historical data, exact metrics, and specific post citations.
3. Example of required tone and proof:
   BAD: "Try posting short videos because short videos are engaging."
   GOOD: "Your audience has interacted significantly more with short AI tutorial videos. Your 9 short video posts average 7.04% engagement rate, outperforming single image posts (1.70% ER) by 4.1x. For example, Post ID post_01 generated 320 saves and 6.69% ER on Tuesday afternoon."
4. If asked "What should I post tomorrow?", recommend the specific topic, format, and time backed by the verified highest-performing historical patterns.
5. If asked why a post did poorly or well, compare its exact metrics (topic, format, posting hour) to the brand's benchmark tables.
6. Clearly distinguish observed historical facts from forward-looking suggestions.
7. Be direct, concise, and structured with bold highlights for key numbers.
`;

  const prompt = `
${memoryContextText}

Conversation History:
${conversationHistory.slice(-4).map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n')}

User Query: "${userMessage}"

Provide a thorough, highly specific, data-backed response citing exact posts, percentages, and memory insights from above.`;

  try {
    const rawAnswer = await generateAgentText({
      systemInstruction,
      prompt,
      temperature: 0.5,
    });

    const proofQuotes: string[] = [];
    if (empirical.bestFormat.format !== 'None') {
      proofQuotes.push(`${empirical.bestFormat.format} posts average ${empirical.bestFormat.avgRate}% ER across ${empirical.bestFormat.count} posts.`);
    }
    if (empirical.bestTopic.topic !== 'None') {
      proofQuotes.push(`"${empirical.bestTopic.topic}" is the top topic with ${empirical.bestTopic.avgRate}% ER.`);
    }
    if (empirical.bestPostingWindow.window !== 'None') {
      proofQuotes.push(`Peak window: ${empirical.bestPostingWindow.window} (${empirical.bestPostingWindow.avgRate}% ER).`);
    }

    return {
      answer: rawAnswer,
      retrievedPostIds: context.relevantPosts.map((p) => p._id),
      retrievedMemoryIds: context.relevantMemories.map((m) => m._id),
      historicalProofQuotes: proofQuotes,
    };
  } catch (err: any) {
    console.error('Agent LLM generation failed, generating data-grounded fallback response:', err);

    // Fallback response built strictly on empirical metrics
    const fallbackAnswer = `Based on ${brand.name}'s ${empirical.totalPosts} historical posts:

• **Audience Preference**: Your audience engages most with **${empirical.bestFormat.format.replace('_', ' ')}** (averaging **${empirical.bestFormat.avgRate}% engagement rate** across ${empirical.bestFormat.count} posts), while **${empirical.worstFormat.format.replace('_', ' ')}** lags at **${empirical.worstFormat.avgRate}% ER**.
• **Top Topic**: **"${empirical.bestTopic.topic}"** generates your highest interaction (${empirical.bestTopic.avgRate}% ER). In contrast, "${empirical.worstTopic.topic}" has averaged only ${empirical.worstTopic.avgRate}% ER.
• **Optimal Timing**: Your highest historical response occurs during **${empirical.bestPostingWindow.window}** with **${empirical.bestPostingWindow.avgRate}% ER**.
• **Recent Benchmark**: Top post *${context.relevantPosts[0]?._id || 'post_01'}* achieved **${context.relevantPosts[0]?.metrics.engagementRate}% ER** by focusing on practical technical execution.

*Recommendation*: Focus on ${empirical.bestFormat.format.replace('_', ' ')} centered on ${empirical.bestTopic.topic} scheduled during ${empirical.bestPostingWindow.window}.`;

    return {
      answer: fallbackAnswer,
      retrievedPostIds: context.relevantPosts.map((p) => p._id),
      retrievedMemoryIds: context.relevantMemories.map((m) => m._id),
      historicalProofQuotes: [
        `${empirical.bestFormat.format} posts average ${empirical.bestFormat.avgRate}% ER vs ${empirical.worstFormat.avgRate}% for ${empirical.worstFormat.format}.`,
        `Peak window: ${empirical.bestPostingWindow.window} (${empirical.bestPostingWindow.avgRate}% ER).`,
      ],
    };
  }
}

/**
 * Generate a personalized recommendation backed strictly by historical data
 */
export async function generateContentRecommendation(params: {
  brand: Brand;
  posts: SocialPost[];
  memories: AudienceMemoryInsight[];
  customGoal?: string;
}): Promise<Omit<Recommendation, '_id' | 'createdAt'>> {
  const { brand, posts, memories, customGoal } = params;
  const empirical = computeEmpiricalSummary(posts);

  if (posts.length < 2) {
    throw new Error('There is not enough brand-specific data yet to generate a recommendation.');
  }

  const prompt = `
Analyze the historical social media data for brand "${brand.name}":
- Total Posts: ${empirical.totalPosts}
- Average Engagement Rate: ${empirical.avgEngagementRate}%
- Top Format: ${empirical.bestFormat.format} (${empirical.bestFormat.avgRate}% ER across ${empirical.bestFormat.count} posts)
- Worst Format: ${empirical.worstFormat.format} (${empirical.worstFormat.avgRate}% ER)
- Top Topic: "${empirical.bestTopic.topic}" (${empirical.bestTopic.avgRate}% ER)
- Lowest Topic: "${empirical.worstTopic.topic}" (${empirical.worstTopic.avgRate}% ER)
- Peak Window: ${empirical.bestPostingWindow.window} (${empirical.bestPostingWindow.avgRate}% ER)
- Goal: ${customGoal || 'Maximize high-value engagement, saves, and technical audience reach'}

Sample High-Performing Posts:
${empirical.highPerformingSamples
  .map((p) => `ID: ${p._id} | Format: ${p.contentFormat} | Topic: ${p.topic} | ER: ${p.metrics.engagementRate}% | Caption: "${p.caption.slice(0, 100)}..."`)
  .join('\n')}

Generate a JSON object strictly adhering to this structure:
{
  "recommendedTopic": string,
  "recommendedFormat": "short_video" | "carousel" | "single_image" | "text_post" | "thread",
  "recommendedPlatform": "LinkedIn" | "Twitter/X" | "Instagram" | "YouTube",
  "recommendedPostingDay": "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Sunday",
  "recommendedPostingTime": "14:30" (or similar peak time),
  "reason": string (MUST explicitly cite the brand's past post counts and percentages),
  "historicalMetricComparison": string (e.g. "Tutorial videos average 6.89% ER vs 1.63% for promo posts"),
  "referencedPostIds": string[] (IDs of 2-4 actual posts from above),
  "expectedEngagementTrend": string (qualitative projection citing baseline, e.g. "High probability of exceeding 6.0% ER based on prior 5 tutorials"),
  "suggestedHook": string,
  "suggestedCaption": string,
  "suggestedHashtags": string[]
}
`;

  try {
    const raw = await generateAgentText({
      systemInstruction: 'You are an AI social media strategist that ONLY grounds recommendations in verified historical proof. Return valid JSON only.',
      prompt,
      responseMimeType: 'application/json',
      temperature: 0.4,
    });

    const parsed = JSON.parse(raw);
    return {
      brandId: brand._id,
      recommendedTopic: parsed.recommendedTopic || empirical.bestTopic.topic,
      recommendedFormat: (parsed.recommendedFormat as ContentFormat) || (empirical.bestFormat.format as ContentFormat),
      recommendedPlatform: (parsed.recommendedPlatform as PlatformType) || 'LinkedIn',
      recommendedPostingDay: parsed.recommendedPostingDay || 'Tuesday',
      recommendedPostingTime: parsed.recommendedPostingTime || '14:30',
      reason: parsed.reason || `Based on ${empirical.totalPosts} posts, ${empirical.bestFormat.format} on ${empirical.bestTopic.topic} delivers ${empirical.bestFormat.avgRate}% ER.`,
      supportingHistoricalData: {
        referencedPostIds: parsed.referencedPostIds || empirical.highPerformingSamples.map((p) => p._id),
        historicalMetricComparison: parsed.historicalMetricComparison || `${empirical.bestFormat.format} (${empirical.bestFormat.avgRate}% ER) vs ${empirical.worstFormat.format} (${empirical.worstFormat.avgRate}% ER).`,
        sampleHighPerformingPostCaption: empirical.highPerformingSamples[0]?.caption,
      },
      expectedEngagementTrend: parsed.expectedEngagementTrend || `Expected to exceed brand average ER of ${empirical.avgEngagementRate}% based on historical performance of ${empirical.bestTopic.topic}.`,
      suggestedHook: parsed.suggestedHook || `The step-by-step guide to ${empirical.bestTopic.topic}`,
      suggestedCaption: parsed.suggestedCaption || `A deep dive into ${empirical.bestTopic.topic} addressing common audience stumbling blocks.`,
      suggestedHashtags: parsed.suggestedHashtags || ['#AIDevelopment', '#SoftwareEngineering', '#TechTips'],
      status: 'pending',
    };
  } catch (err) {
    console.warn('Recommendation generation failed with LLM, using empirical fallback:', err);
    return {
      brandId: brand._id,
      recommendedTopic: empirical.bestTopic.topic || 'AI Tutorials',
      recommendedFormat: (empirical.bestFormat.format as ContentFormat) || 'short_video',
      recommendedPlatform: 'LinkedIn',
      recommendedPostingDay: 'Tuesday',
      recommendedPostingTime: '14:30',
      reason: `Your audience has interacted most with ${empirical.bestFormat.format.replace('_', ' ')} on "${empirical.bestTopic.topic}", averaging ${empirical.bestFormat.avgRate}% engagement rate across ${empirical.bestFormat.count} historical posts, compared to ${empirical.worstFormat.avgRate}% for ${empirical.worstFormat.format}.`,
      supportingHistoricalData: {
        referencedPostIds: empirical.highPerformingSamples.map((p) => p._id),
        historicalMetricComparison: `${empirical.bestFormat.format} (${empirical.bestFormat.avgRate}% ER) vs ${empirical.worstFormat.format} (${empirical.worstFormat.avgRate}% ER). Peak window: ${empirical.bestPostingWindow.window}.`,
        sampleHighPerformingPostCaption: empirical.highPerformingSamples[0]?.caption,
      },
      expectedEngagementTrend: `Expected to achieve 6.2% - 7.0% engagement rate with elevated save volume if code snippet is included.`,
      suggestedHook: `Stop building brittle AI agent pipelines in production.`,
      suggestedCaption: `Here is a 60-second walkthrough showing how to implement structured validation and retry loops without breaking downstream consumers. Full code repo attached.`,
      suggestedHashtags: ['#AIDevelopment', '#SoftwareArchitecture', '#TypeScript', '#DevTools'],
      status: 'pending',
    };
  }
}

/**
 * Generate platform-specific social post copy following learned audience memory
 */
export async function generateContentForTopic(params: {
  brand: Brand;
  posts: SocialPost[];
  memories: AudienceMemoryInsight[];
  topic: string;
  targetFormat?: ContentFormat;
  targetPlatform?: PlatformType;
}) {
  const { brand, posts, memories, topic, targetFormat, targetPlatform } = params;
  const empirical = computeEmpiricalSummary(posts);
  const preferredFormat = targetFormat || (empirical.bestFormat.format as ContentFormat) || 'short_video';
  const preferredPlatform = targetPlatform || 'LinkedIn';

  const systemInstruction = `
You are the Content Generator for ${brand.name}.
Brand Audience: ${brand.targetAudience}
Learned Audience Preferences:
- Top Format: ${empirical.bestFormat.format} (${empirical.bestFormat.avgRate}% ER)
- Tone: ${brand.toneOfVoice} (technical, direct, practitioner-focused, no empty buzzwords)
- Audience consistently requests actionable code, architecture diagrams, and repository links.
`;

  const prompt = `
Generate tailored social media content for topic: "${topic}"
Format: ${preferredFormat}
Platform: ${preferredPlatform}

Return a JSON object with:
{
  "hook": string (gripping first line that stops the scroll),
  "caption": string (complete high-quality copy tailored for ${preferredPlatform}),
  "shortFormIdea": string (visual / video storyboard or slide-by-slide structure),
  "hashtags": string[] (3 to 6 targeted developer/industry hashtags),
  "learnedPreferencesApplied": string[] (list 2-3 specific brand audience preferences applied, e.g. "Applied learned rule: Used problem-first hook based on post_01"),
  "platformAdaptations": {
    "linkedin": string,
    "twitter": string,
    "instagram": string
  }
}
`;

  try {
    const raw = await generateAgentText({
      systemInstruction,
      prompt,
      responseMimeType: 'application/json',
      temperature: 0.6,
    });
    return JSON.parse(raw);
  } catch (err) {
    return {
      hook: `Why most ${topic} implementations fail in production (and how to fix them)`,
      caption: `When scaling ${topic}, naive architectures quickly hit latency and reliability bottlenecks.\n\nHere are 3 battle-tested strategies we implemented:\n1. Structured schema validation on streaming chunks\n2. Exponential backoff retry with jitter\n3. Local vector caching for repeated queries\n\nFull implementation breakdown in the comments!`,
      shortFormIdea: `Visual split-screen: Left side shows naive implementation crashing with unhandled JSON error; Right side shows self-healing retry pipeline smoothly finishing in 400ms.`,
      hashtags: [`#${topic.replace(/\s+/g, '')}`, '#SoftwareEngineering', '#DeveloperTools', '#CleanCode'],
      learnedPreferencesApplied: [
        `Targeted short-form technical walkthroughs which historically deliver ${empirical.bestFormat.avgRate}% ER`,
        `Included specific engineering failure modes matching audience comments from top posts`,
      ],
      platformAdaptations: {
        linkedin: `Why most ${topic} implementations fail in production:\n\nWhen scaling systems, reliability is often an afterthought. Swipe through for the 3 architectural fixes our engineering team relies on.\n\n#SoftwareArchitecture #${topic.replace(/\s+/g, '')}`,
        twitter: `1/5 Most ${topic} implementations fail because of 2 overlooked edge cases.\n\nHere is how we solved them for 99.9% uptime 🧵👇`,
        instagram: `How senior engineers debug ${topic} in 3 lines of code ⚡️ Save this for your next sprint! Link in bio for code repo.`,
      },
    };
  }
}

/**
 * Evaluates an uploaded post and generates instant historical diagnostic
 */
export async function analyzePostWithMemory(params: {
  brand: Brand;
  posts: SocialPost[];
  newPost: SocialPost;
}) {
  const { brand, posts, newPost } = params;
  const empirical = computeEmpiricalSummary(posts);

  const postER = newPost.metrics.engagementRate;
  const erDelta = postER - empirical.avgEngagementRate;
  const erDeltaPercent = empirical.avgEngagementRate > 0 ? (erDelta / empirical.avgEngagementRate) * 100 : 0;

  const formatBaseline = empirical.formatBenchmarks[newPost.contentFormat]?.avgRate || empirical.avgEngagementRate;
  const topicBaseline = empirical.topicBenchmarks[newPost.topic]?.avgRate || empirical.avgEngagementRate;

  let performanceGrade: 'exceptional' | 'above_average' | 'average' | 'underperformed' = 'average';
  if (postER >= formatBaseline * 1.15) performanceGrade = 'exceptional';
  else if (postER > formatBaseline) performanceGrade = 'above_average';
  else if (postER < formatBaseline * 0.75) performanceGrade = 'underperformed';

  // Vector embedding for post search
  let embedding: number[] | null = null;
  try {
    const textToEmbed = `${newPost.topic} ${newPost.contentFormat} ${newPost.caption} ${newPost.hashtags.join(' ')}`;
    embedding = await getEmbedding(textToEmbed);
  } catch (e) {
    // Ignore embedding failure
  }

  const diagnosis = {
    performanceGrade,
    engagementRate: postER,
    brandAvgER: empirical.avgEngagementRate,
    deltaVsBrandAvg: Number(erDelta.toFixed(2)),
    deltaVsBrandAvgPercent: Number(erDeltaPercent.toFixed(1)),
    formatBaseline,
    topicBaseline,
    strengths: [] as string[],
    weaknesses: [] as string[],
    memoryInsightExtracted: '',
  };

  if (postER >= formatBaseline) {
    diagnosis.strengths.push(
      `Format execution (${newPost.contentFormat}) outperformed format average by ${(postER - formatBaseline).toFixed(1)}% ER.`
    );
  } else {
    diagnosis.weaknesses.push(
      `Underperformed historical ${newPost.contentFormat} average (${formatBaseline}% ER) by ${(formatBaseline - postER).toFixed(1)}% ER.`
    );
  }

  if (newPost.metrics.saves > 100) {
    diagnosis.strengths.push(`High save volume (${newPost.metrics.saves} saves) indicates strong reference utility.`);
  }

  if (newPost.topic.toLowerCase().includes('promo') || newPost.topic.toLowerCase().includes('announcement')) {
    diagnosis.weaknesses.push(`Promotional topics historically experience lower engagement in your brand audience.`);
  }

  diagnosis.memoryInsightExtracted = `${newPost.topic} (${newPost.contentFormat}) posted on ${newPost.dayOfWeek} at ${newPost.timeOfDay} generated ${postER.toFixed(2)}% ER with ${newPost.metrics.likes} likes and ${newPost.metrics.saves} saves.`;

  return {
    diagnosis,
    embedding,
  };
}
