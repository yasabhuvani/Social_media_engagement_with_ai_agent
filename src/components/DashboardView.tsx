import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Video,
  FileText,
  Layers,
  Sparkles,
  ArrowUpRight,
  Bookmark,
  Share2,
  MessageCircle,
  ThumbsUp,
  Eye,
  Calendar,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { DashboardData, SocialPost } from '../types';
import { BadgeTag } from './BadgeTag';

interface DashboardViewProps {
  data: DashboardData;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigateToTab }) => {
  const { stats, benchmarks, timeline, recentPosts, brand } = data;
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Format label mapper
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
      {/* Visual Legend Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Continuous Brand Learning Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Every metric below is grounded in {brand.name}'s verified {stats.totalPosts} historical social media posts.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-medium px-1">Legend:</span>
          <BadgeTag type="historical" label="Historical Data" />
          <BadgeTag type="insight" label="AI Insight" />
          <BadgeTag type="recommendation" label="Recommendation" />
        </div>
      </div>

      {/* 4 Core Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Posts & Engagement */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Posts In Memory</span>
            <BadgeTag type="historical" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.totalPosts}</span>
            <span className="text-xs text-slate-400">analyzed</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Interactions: <strong className="text-slate-200">{stats.totalEngagement.toLocaleString()}</strong></span>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('datasets')}
                className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Browse Dataset →
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Average Engagement Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Engagement Rate</span>
            <BadgeTag type="historical" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{stats.avgEngagementRate}%</span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              Calculated
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
            <span>Formula:</span>
            <span className="font-mono text-slate-300">(Likes+Comments+Shares+Saves)/Reach</span>
          </div>
        </div>

        {/* Card 3: Best Content Format (Insight) */}
        <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-800/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Top Content Format</span>
            <BadgeTag type="insight" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white capitalize">{formatName(stats.bestFormat.format)}</span>
          </div>
          <p className="text-xs text-purple-200/80 mt-1">
            Averages <strong className="text-cyan-300 font-bold">{stats.bestFormat.avgRate}% ER</strong> across {stats.bestFormat.count} posts ({((stats.bestFormat.avgRate / stats.avgEngagementRate - 1) * 100).toFixed(0)}% above baseline).
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
            <span>Worst Format:</span>
            <span className="text-rose-400 font-medium">{formatName(stats.worstFormat.format)} ({stats.worstFormat.avgRate}%)</span>
          </div>
        </div>

        {/* Card 4: Best Posting Time Window */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-800/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Peak Posting Time</span>
            <BadgeTag type="insight" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white truncate">{stats.bestPostingWindow.window}</span>
          </div>
          <p className="text-xs text-emerald-200/80 mt-1">
            Achieves <strong className="text-emerald-300 font-bold">{stats.bestPostingWindow.avgRate}% ER</strong> (peak developer activity window).
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
            <span>Top Day:</span>
            <span className="text-slate-200 font-medium">Tuesdays & Sundays</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Format & Topic Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Engagement Rate by Content Format */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Performance by Content Format</h3>
                <BadgeTag type="historical" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Comparing average Engagement Rate (%) across formats from {brand.name}'s memory.
              </p>
            </div>
            <Video className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="space-y-4 mt-6">
            {Object.entries(benchmarks.formatBenchmarks)
              .sort((a, b) => b[1].avgRate - a[1].avgRate)
              .map(([fmt, stat]) => {
                const maxRate = 8.5; // for scale
                const percentage = Math.min(100, (stat.avgRate / maxRate) * 100);
                const isBest = fmt === stats.bestFormat.format;
                const isWorst = fmt === stats.worstFormat.format;

                return (
                  <div key={fmt} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        {formatName(fmt)}
                        {isBest && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded-sm border border-emerald-800">
                            Highest
                          </span>
                        )}
                        {isWorst && (
                          <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded-sm border border-rose-800">
                            Lowest
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {stat.avgRate}% ER <span className="text-slate-500 font-normal">({stat.totalPosts} posts)</span>
                      </span>
                    </div>

                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBest
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                            : isWorst
                            ? 'bg-gradient-to-r from-rose-600 to-orange-500'
                            : 'bg-indigo-600/70'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Avg Likes: {stat.avgLikes}</span>
                      <span>Avg Saves: {stat.avgSaves}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-300">Audience Behavior Rule:</strong> Short-form video posts generate
              over <span className="text-white font-semibold">4x more bookmarks/saves</span> than single images for this brand.
              Developers bookmark technical code animations to use later during implementation.
            </div>
          </div>
        </div>

        {/* Right: Performance by Topic */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Engagement by Topic</h3>
                <BadgeTag type="historical" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Measured response to different subject angles in {brand.name}'s history.
              </p>
            </div>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-4 mt-6">
            {Object.entries(benchmarks.topicBenchmarks)
              .sort((a, b) => b[1].avgRate - a[1].avgRate)
              .map(([topic, stat]) => {
                const maxRate = 8.5;
                const percentage = Math.min(100, (stat.avgRate / maxRate) * 100);
                const isBest = topic === stats.bestTopic.topic;
                const isWorst = topic === stats.worstTopic.topic;

                return (
                  <div key={topic} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200 truncate pr-2">
                        {topic}
                        {isBest && (
                          <span className="ml-1.5 text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded-sm border border-emerald-800">
                            Top Converting
                          </span>
                        )}
                        {isWorst && (
                          <span className="ml-1.5 text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded-sm border border-rose-800">
                            Audience Fatigue
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold shrink-0">
                        {stat.avgRate}% ER <span className="text-slate-500 font-normal">({stat.totalPosts})</span>
                      </span>
                    </div>

                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBest
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                            : isWorst
                            ? 'bg-gradient-to-r from-rose-600 to-orange-500'
                            : 'bg-cyan-600/70'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Avg Likes: {stat.avgLikes}</span>
                      <span>Avg Saves: {stat.avgSaves}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Cautionary Trend:</strong> Direct Promotional Posts (sales, discounts, hiring banners)
              average only <span className="text-white font-semibold">1.63% ER</span>. The agent advises wrapping promotional announcements
              inside technical tutorials rather than standalone sales copy.
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Timeline Chart (SVG) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Historical Engagement Rate Timeline</h3>
              <BadgeTag type="historical" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plotting verified engagement rates chronologically across {timeline.length} posts. Hover points to inspect.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Engagement Rate (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-emerald-400" />
              <span className="text-slate-300">Baseline ({stats.avgEngagementRate}%)</span>
            </div>
          </div>
        </div>

        {/* SVG Sparkline / Bar Graph */}
        <div className="h-56 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {timeline.map((point, idx) => {
            const heightPercent = Math.min(100, (point.engagementRate / 9.0) * 100);
            const isAboveAverage = point.engagementRate >= stats.avgEngagementRate;

            return (
              <div
                key={point.id}
                className="flex-1 min-w-[20px] sm:min-w-[28px] flex flex-col items-center gap-1 group relative cursor-pointer"
                onClick={() => {
                  const found = recentPosts.find((p) => p._id === point.id);
                  if (found) setSelectedPost(found);
                }}
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full mb-2 bg-slate-950 text-white text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap z-30">
                  <div className="font-bold text-cyan-400">{point.engagementRate}% ER</div>
                  <div className="text-slate-300">{point.topic}</div>
                  <div className="text-slate-400">{formatName(point.format)}</div>
                  <div className="text-slate-500 font-mono text-[10px]">{point.date}</div>
                  <div className="text-slate-400 mt-1">
                    ❤️ {point.likes} | 💾 {point.saves}
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-44 bg-slate-800/40 rounded-t-sm flex items-end overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isAboveAverage
                        ? 'bg-cyan-500 group-hover:bg-cyan-400'
                        : 'bg-slate-600 group-hover:bg-slate-500'
                    }`}
                  />
                </div>

                <span className="text-[10px] text-slate-500 font-mono scale-90 truncate max-w-full">
                  #{idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 mt-3">
          <span>Oldest (Past 45 Days)</span>
          <span className="text-slate-400">Baseline Target: {stats.avgEngagementRate}% ER</span>
          <span>Latest Posts (Past Week)</span>
        </div>
      </div>

      {/* Action Banner: Get Recommendations or Chat */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-800/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-white">Ready for your next high-converting post?</h3>
            <BadgeTag type="recommendation" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Let the agent synthesize current audience memory into a personalized, data-backed content plan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('recommender')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Recommendation</span>
          </button>
          <button
            onClick={() => onNavigateToTab('chat')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <span>Ask Agent</span>
          </button>
        </div>
      </div>

      {/* Recent Historical Posts Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Recent Historical Posts in Memory</h3>
              <BadgeTag type="historical" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any post to view complete engagement breakdown, reach, and audience sentiment.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('analyzer')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <span>View All & Upload New</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Post & Caption</th>
                <th className="py-3 px-4">Platform & Format</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4 text-right">Engagement Rate</th>
                <th className="py-3 px-4 text-right">Metrics (L/C/S/S)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentPosts.slice(0, 5).map((post) => (
                <tr
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                    <p className="font-medium text-slate-200 truncate">{post.caption}</p>
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
                        post.metrics.engagementRate >= stats.avgEngagementRate ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      {post.metrics.engagementRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    <span title="Likes" className="text-slate-300 font-semibold">{post.metrics.likes}</span> /{' '}
                    <span title="Comments">{post.metrics.comments}</span> /{' '}
                    <span title="Shares">{post.metrics.shares}</span> /{' '}
                    <span title="Saves" className="text-cyan-300 font-semibold">{post.metrics.saves}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BadgeTag type="historical" />
                <span className="text-xs text-slate-400 font-mono">Post #{selectedPost._id}</span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Caption</span>
                <p className="text-sm text-slate-200 mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                  {selectedPost.caption}
                </p>
              </div>

              {selectedPost.hook && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Hook</span>
                  <p className="text-xs text-cyan-300 mt-1 italic">"{selectedPost.hook}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-slate-400 block">Platform & Format</span>
                  <span className="font-semibold text-white">
                    {selectedPost.platform} • {formatName(selectedPost.contentFormat)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-slate-400 block">Topic & Timing</span>
                  <span className="font-semibold text-white">
                    {selectedPost.topic} ({selectedPost.dayOfWeek} {selectedPost.timeOfDay})
                  </span>
                </div>
              </div>

              {/* Exact Metrics Box */}
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Verified Engagement Metrics
                </span>
                <div className="grid grid-cols-3 gap-2 mt-1.5 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Engagement Rate</span>
                    <span className="text-base font-extrabold text-cyan-400">
                      {selectedPost.metrics.engagementRate}%
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Reach</span>
                    <span className="text-base font-bold text-white">
                      {selectedPost.metrics.reach.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Impressions</span>
                    <span className="text-base font-bold text-white">
                      {selectedPost.metrics.impressions.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <ThumbsUp className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                    <span className="font-bold text-white">{selectedPost.metrics.likes}</span>
                    <span className="text-[10px] text-slate-400 block">Likes</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                    <span className="font-bold text-white">{selectedPost.metrics.comments}</span>
                    <span className="text-[10px] text-slate-400 block">Comments</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <Share2 className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                    <span className="font-bold text-white">{selectedPost.metrics.shares}</span>
                    <span className="text-[10px] text-slate-400 block">Shares</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <Bookmark className="w-3.5 h-3.5 mx-auto text-cyan-400 mb-1" />
                    <span className="font-bold text-cyan-300">{selectedPost.metrics.saves}</span>
                    <span className="text-[10px] text-slate-400 block">Saves</span>
                  </div>
                </div>
              </div>

              {/* Audience Reactions */}
              {selectedPost.audienceReactions && (
                <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Audience Reactions & Questions Recorded</span>
                  </div>
                  {selectedPost.audienceReactions.topFeedback && (
                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                      {selectedPost.audienceReactions.topFeedback.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
