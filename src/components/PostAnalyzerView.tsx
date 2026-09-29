import React, { useState } from 'react';
import {
  PlusCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  Brain,
  Trash2,
  Filter,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Database,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
} from 'lucide-react';
import { SocialPost, Brand, ContentFormat, PlatformType } from '../types';
import { BadgeTag } from './BadgeTag';

interface PostAnalyzerViewProps {
  brand: Brand;
  posts: SocialPost[];
  avgER: number;
  initialPostData?: any;
  onPostAdded: () => Promise<void>;
  onPostDeleted: (id: string) => Promise<void>;
}

export const PostAnalyzerView: React.FC<PostAnalyzerViewProps> = ({
  brand,
  posts,
  avgER,
  initialPostData,
  onPostAdded,
  onPostDeleted,
}) => {
  // Form fields
  const [topic, setTopic] = useState(initialPostData?.topic || 'AI Tutorials');
  const [contentFormat, setContentFormat] = useState<ContentFormat>(initialPostData?.contentFormat || 'short_video');
  const [platform, setPlatform] = useState<PlatformType>(initialPostData?.platform || 'LinkedIn');
  const [caption, setCaption] = useState(initialPostData?.caption || '');
  const [hook, setHook] = useState(initialPostData?.hook || '');
  const [hashtags, setHashtags] = useState(initialPostData?.hashtags?.join(' ') || '#AIDevelopment #TechTips');
  const [dayOfWeek, setDayOfWeek] = useState('Tuesday');
  const [timeOfDay, setTimeOfDay] = useState('14:30');

  // Metrics
  const [likes, setLikes] = useState<number>(850);
  const [comments, setComments] = useState<number>(110);
  const [shares, setShares] = useState<number>(170);
  const [saves, setSaves] = useState<number>(310);
  const [reach, setReach] = useState<number>(21000);
  const [topFeedback, setTopFeedback] = useState('Great code sample, saved for later!');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Table filter & sort
  const [filterTopic, setFilterTopic] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'er_desc' | 'er_asc'>('recent');

  // Live Engagement Rate calculation
  const totalInteractions = (Number(likes) || 0) + (Number(comments) || 0) + (Number(shares) || 0) + (Number(saves) || 0);
  const safeReach = Math.max(1, Number(reach) || 1);
  const liveER = Number(((totalInteractions / safeReach) * 100).toFixed(2));

  // Quick pre-fill templates for judges
  const prefillSample = (type: 'high_tutorial' | 'low_promo' | 'mid_carousel') => {
    if (type === 'high_tutorial') {
      setTopic('AI Tutorials');
      setContentFormat('short_video');
      setPlatform('LinkedIn');
      setCaption('How to stream tool calls with retry backoff directly to React client. Complete 40-line code pattern.');
      setHook('How to stream tool calls without crashing client parsers.');
      setHashtags('#TypeScript #AIArchitecture #FullStack');
      setDayOfWeek('Tuesday');
      setTimeOfDay('14:30');
      setLikes(980);
      setComments(124);
      setShares(210);
      setSaves(420);
      setReach(24000);
      setTopFeedback('The streaming buffer trick resolved our socket dropouts!');
    } else if (type === 'low_promo') {
      setTopic('Promotional Posts');
      setContentFormat('single_image');
      setPlatform('LinkedIn');
      setCaption('Register today for our Q4 Cloud AI Webinar! Limited seats available. Link in bio.');
      setHook('Register today for our Q4 Webinar.');
      setHashtags('#CloudWebinar #TechRegistration');
      setDayOfWeek('Wednesday');
      setTimeOfDay('11:00');
      setLikes(95);
      setComments(8);
      setShares(4);
      setSaves(12);
      setReach(8500);
      setTopFeedback('Felt like standard sales promo');
    } else {
      setTopic('Educational Carousels');
      setContentFormat('carousel');
      setPlatform('LinkedIn');
      setCaption('The 2026 Production LLM Latency Checklist: 7 techniques to keep p95 latency under 500ms. Swipe ➡️');
      setHook('7 Techniques for Sub-500ms LLM Latency');
      setHashtags('#SystemDesign #DevOps #Performance');
      setDayOfWeek('Friday');
      setTimeOfDay('10:00');
      setLikes(890);
      setComments(82);
      setShares(240);
      setSaves(580);
      setReach(26000);
      setTopFeedback('Slide 4 on KV cache eviction is gold.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !topic.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          contentFormat,
          platform,
          caption,
          hook: hook || caption.split('\n')[0].slice(0, 80),
          hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
          dayOfWeek,
          timeOfDay,
          likes: Number(likes),
          comments: Number(comments),
          shares: Number(shares),
          saves: Number(saves),
          reach: safeReach,
          topFeedback: topFeedback ? [topFeedback] : [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.diagnosis);
        await onPostAdded();
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered posts
  const filteredPosts = posts
    .filter((p) => {
      if (filterTopic && !p.topic.toLowerCase().includes(filterTopic.toLowerCase())) return false;
      if (filterFormat && p.contentFormat !== filterFormat) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'er_desc') return b.metrics.engagementRate - a.metrics.engagementRate;
      if (sortBy === 'er_asc') return a.metrics.engagementRate - b.metrics.engagementRate;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

  const formatName = (f: string) => {
    const map: Record<string, string> = {
      short_video: 'Short Video',
      carousel: 'Educational Carousel',
      single_image: 'Single Image',
      text_post: 'Text Post',
      thread: 'Multi-post Thread',
    };
    return map[f] || f;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Post Analyzer & Memory Ingestion</h2>
              <BadgeTag type="historical" label="Ingest & Analyze" />
            </div>
            <p className="text-sm text-slate-300">
              Record a historical or newly published post with engagement metrics. The agent calculates performance deltas against {brand.name}'s empirical baseline and updates the audience memory bank.
            </p>
          </div>

          {/* Quick Pre-fill Template Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold px-1">Quick Sample:</span>
            <button
              type="button"
              onClick={() => prefillSample('high_tutorial')}
              className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-lg border border-cyan-800 transition-colors"
            >
              High ER Video
            </button>
            <button
              type="button"
              onClick={() => prefillSample('mid_carousel')}
              className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-lg border border-indigo-800 transition-colors"
            >
              Tech Carousel
            </button>
            <button
              type="button"
              onClick={() => prefillSample('low_promo')}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition-colors"
            >
              Sales Banner
            </button>
          </div>
        </div>
      </div>

      {/* Main Analyzer Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <span>Enter Social Media Post Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter/X">Twitter/X</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Format</label>
              <select
                value={contentFormat}
                onChange={(e) => setContentFormat(e.target.value as ContentFormat)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="short_video">Short Video</option>
                <option value="carousel">Educational Carousel</option>
                <option value="single_image">Single Image</option>
                <option value="text_post">Text Post</option>
                <option value="thread">Multi-post Thread</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., AI Tutorials, Product Announcement..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Hook Line</label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="First line / scroll-stopping hook..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Post Caption</label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Complete text copy of the social media post..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#AIDev #Python #Tech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Posting Time (UTC)</label>
              <input
                type="text"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                placeholder="14:30"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Metric Inputs */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Engagement Metrics
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block">Likes</label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block">Comments</label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block">Shares</label>
                <input
                  type="number"
                  min={0}
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block">Saves</label>
                <input
                  type="number"
                  min={0}
                  value={saves}
                  onChange={(e) => setSaves(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block">Reach</label>
                <input
                  type="number"
                  min={1}
                  value={reach}
                  onChange={(e) => setReach(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Audience Reaction / Feedback (Optional)</label>
            <input
              type="text"
              value={topFeedback}
              onChange={(e) => setTopFeedback(e.target.value)}
              placeholder="E.g., Followers requested GitHub repo link, asked about latency overhead..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Database className="w-4 h-4 text-cyan-300" />
              <span>{isSubmitting ? 'Analyzing & Storing...' : 'Analyze Post & Store in Memory'}</span>
            </button>
          </div>
        </form>

        {/* Right Col: Live ER Calculator & Instant Diagnostic Card */}
        <div className="space-y-6">
          {/* Live Engagement Rate Calculator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Live Engagement Rate Preview
            </span>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-3xl font-extrabold text-cyan-400 font-mono">{liveER}%</span>
              <span className="text-[11px] text-slate-500 block">Calculated Engagement Rate</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Interactions:</span>
                <span className="font-semibold text-slate-200">{totalInteractions}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reach:</span>
                <span className="font-semibold text-slate-200">{safeReach.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Brand Baseline ER:</span>
                <span className="font-semibold text-emerald-400">{avgER}%</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Difference vs Average:</span>
                <span
                  className={`font-bold font-mono ${
                    liveER >= avgER ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {liveER >= avgER ? `+${(liveER - avgER).toFixed(2)}%` : `${(liveER - avgER).toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Instant Diagnostic Output (if just analyzed) */}
          {analysisResult && (
            <div className="bg-slate-900 border border-indigo-700/50 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  Agent Diagnostic
                </span>
                <span className="text-xs bg-indigo-950 text-cyan-300 px-2 py-0.5 rounded-full border border-indigo-800 font-bold uppercase">
                  {analysisResult.performanceGrade.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs space-y-2 text-slate-300">
                {analysisResult.strengths?.map((s: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
                {analysisResult.weaknesses?.map((w: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-300 block mb-0.5">Memory Bank Updated:</strong>
                {analysisResult.memoryInsightExtracted}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filterable Table of All Historical Posts in Memory */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">All Posts in Memory ({filteredPosts.length})</h3>
              <BadgeTag type="historical" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect, sort, or delete records from {brand.name}'s persistent memory.
            </p>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value="">All Formats</option>
              <option value="short_video">Short Video</option>
              <option value="carousel">Carousel</option>
              <option value="single_image">Single Image</option>
              <option value="text_post">Text Post</option>
              <option value="thread">Thread</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value="recent">Most Recent</option>
              <option value="er_desc">Highest Engagement Rate</option>
              <option value="er_asc">Lowest Engagement Rate</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Post & Caption</th>
                <th className="py-3 px-4">Format & Platform</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Date / Timing</th>
                <th className="py-3 px-4 text-right">Engagement Rate</th>
                <th className="py-3 px-4 text-right">Likes / Saves</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPosts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                    <p className="font-medium text-slate-200 line-clamp-1">{post.caption}</p>
                    <span className="text-[11px] text-slate-500 font-mono">ID: {post._id}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-300 font-medium">{post.platform}</span>
                    <span className="text-slate-500 block text-[11px]">{formatName(post.contentFormat)}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                      {post.topic}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                    <div>{post.dayOfWeek}</div>
                    <span className="text-slate-500 text-[11px] font-mono">{post.timeOfDay} UTC</span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-mono font-bold text-sm ${
                        post.metrics.engagementRate >= avgER ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      {post.metrics.engagementRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    <span className="text-slate-300 font-semibold">{post.metrics.likes}</span> L /{' '}
                    <span className="text-cyan-300 font-semibold">{post.metrics.saves}</span> S
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onPostDeleted(post._id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                      title="Delete post from memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
