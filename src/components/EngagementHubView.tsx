import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Flame,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  Compass,
  FileText,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Hash,
} from 'lucide-react';
import {
  Brand,
  SocialPost,
  PlatformType,
  ContentFormat,
  UnifiedEngagementHubData,
  ScheduledPost,
} from '../types';
import { BadgeTag } from './BadgeTag';

interface EngagementHubViewProps {
  brand: Brand;
  posts: SocialPost[];
  avgER: number;
  onRefreshData: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export const EngagementHubView: React.FC<EngagementHubViewProps> = ({
  brand,
  posts,
  avgER,
  onRefreshData,
  onNavigateToTab,
}) => {
  const [hubData, setHubData] = useState<UnifiedEngagementHubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>('All');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<any | null>(null);

  // Scheduling Form Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedPlatform, setSchedPlatform] = useState<PlatformType>('LinkedIn');
  const [schedFormat, setSchedFormat] = useState<ContentFormat>('short_video');
  const [schedTopic, setSchedTopic] = useState('AI Tutorials');
  const [schedDate, setSchedDate] = useState('2026-10-03');
  const [schedTime, setSchedTime] = useState('14:30');
  const [schedHook, setSchedHook] = useState('Stop hardcoding prompt templates in production');
  const [schedCaption, setSchedCaption] = useState(
    'Here is our production architecture for dynamic prompt graph resolution with typed context injection. Full 45-second code breakdown.'
  );
  const [schedHashtags, setSchedHashtags] = useState('#AIDevelopment #Python #Architecture');
  const [schedNotes, setSchedNotes] = useState('Scheduled during optimal Tuesday 14:30 window');

  // Executive Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const fetchHubData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/engagement-hub');
      const data = await res.json();
      if (data.success) {
        setHubData(data.data);
      }
    } catch (err) {
      console.error('Failed to load engagement hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, [posts.length]);

  const handleCreateScheduledPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: schedPlatform,
          contentFormat: schedFormat,
          topic: schedTopic,
          caption: schedCaption,
          hook: schedHook,
          hashtags: schedHashtags.split(/[\s,]+/).filter(Boolean),
          scheduledDate: schedDate,
          scheduledTime: schedTime,
          notes: schedNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowScheduleModal(false);
        await fetchHubData();
      } else {
        alert(data.error || 'Failed to schedule post');
      }
    } catch (err) {
      console.error('Error scheduling post:', err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchHubData();
      }
    } catch (err) {
      console.error('Error deleting scheduled post:', err);
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchHubData();
        await onRefreshData();
      }
    } catch (err) {
      console.error('Error publishing scheduled post:', err);
    }
  };

  const handleGenerateReport = async () => {
    setShowReportModal(true);
    setIsLoadingReport(true);
    try {
      const res = await fetch('/api/executive-report');
      const data = await res.json();
      if (data.success) {
        setReportData(data.report);
      }
    } catch (err) {
      console.error('Error generating executive report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  if (isLoading || !hubData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Aggregating multi-platform metrics & computing heatmaps...</p>
      </div>
    );
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hoursOfDay = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const filteredChannels =
    activePlatformFilter === 'All'
      ? hubData.channels
      : hubData.channels.filter((c) => c.platform === activePlatformFilter);

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Social Media Engagement Hub</h1>
            <BadgeTag type="historical" label="Multi-Channel Sync" />
            <BadgeTag type="insight" label="Social Listening" />
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Unified cross-platform operations inspired by{' '}
            <span className="text-cyan-300 font-mono">Social_Media_Engagement_Dashboard</span>. Monitor
            multi-channel growth, best-time publishing heatmaps, audience sentiment radar, and queued calendar posts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Executive Report</span>
          </button>
        </div>
      </div>

      {/* Top Level Strategic Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Aggregated Audience</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {hubData.kpis.audienceGrowthTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3 h-3" /> +{hubData.kpis.audienceGrowthRate}% monthly velocity
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Engagement Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{avgER.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Across {posts.length} tracked posts</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Sentiment Health</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {hubData.sentimentOverview.positivePercent}%
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Score: {hubData.sentimentOverview.sentimentScoreNormalized}/100
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Virality Rate</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{hubData.kpis.viralityRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Posts achieving ER &ge; 7.0%</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Efficiency Index</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {hubData.kpis.contentEfficiencyIndex}/10
          </div>
          <div className="text-[11px] text-purple-400/90 mt-1">Quality & retention ratio</div>
        </div>
      </div>

      {/* SECTION 1: Cross-Channel Platform Comparison */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Multi-Platform Performance Comparison</h2>
              <BadgeTag type="historical" label="Observed Channels" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Comparative benchmark across all connected social media accounts for {brand.name}.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['All', 'LinkedIn', 'Twitter/X', 'Instagram', 'YouTube'].map((plat) => (
              <button
                key={plat}
                onClick={() => setActivePlatformFilter(plat)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  activePlatformFilter === plat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredChannels.map((ch) => {
            const isTopER = ch.avgER >= 6.0;
            return (
              <div
                key={ch.platform}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-5 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{ch.platform}</span>
                    {isTopER && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] rounded font-mono">
                        TOP ROI
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    +{ch.followerGrowthRate}% MoM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Followers</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {ch.followersCount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Avg Engagement</span>
                    <span className="font-bold text-indigo-300 font-mono">{ch.avgER}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Reach</span>
                    <span className="font-medium text-slate-300 font-mono">
                      {(ch.totalReach / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Posts Analyzed</span>
                    <span className="font-medium text-slate-300 font-mono">{ch.totalPosts}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Best Format:</span>
                    <span className="font-medium text-cyan-300 capitalize">
                      {ch.topContentFormat.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Best Topic:</span>
                    <span className="font-medium text-purple-300">{ch.topTopic}</span>
                  </div>
                </div>

                {/* Sentiment Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sentiment Split</span>
                    <span className="text-emerald-400">{ch.sentimentRatio.positive}% pos</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${ch.sentimentRatio.positive}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${ch.sentimentRatio.neutral}%` }}
                      className="bg-slate-400 h-full"
                    />
                    <div
                      style={{ width: `${ch.sentimentRatio.negative}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 7-Day x 24-Hour Best-Time Heatmap Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">7-Day Engagement Intensity Heatmap</h2>
              <BadgeTag type="historical" label="Time Distribution" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Historical engagement intensity by day of week and hour. Dark emerald cells mark optimal publishing slots.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-800" />
              <span>Low (ER &lt; 3%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-indigo-900/60" />
              <span>Normal (3-5%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span>Optimal (ER &ge; 6.5%)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            {/* Hour header */}
            <div className="grid grid-cols-[100px_repeat(14,1fr)] gap-1 mb-2 text-center text-[11px] text-slate-400 font-mono">
              <div className="text-left font-medium">Day / Hour</div>
              {hoursOfDay.map((h) => (
                <div key={h}>{h}:00</div>
              ))}
            </div>

            {/* Rows for each day */}
            <div className="space-y-1.5">
              {daysOfWeek.map((day) => (
                <div key={day} className="grid grid-cols-[100px_repeat(14,1fr)] gap-1 items-center">
                  <span className="text-xs font-medium text-slate-300 truncate">{day}</span>
                  {hoursOfDay.map((hour) => {
                    const cell = hubData.heatmap.find(
                      (c) => c.dayOfWeek === day && c.hour === hour
                    );
                    const score = cell ? cell.engagementScore : 30;
                    const isOpt = cell ? cell.isOptimal : false;
                    const hasPosts = cell && cell.postCount > 0;

                    let bgClass = 'bg-slate-800/50 hover:border-slate-500';
                    if (score >= 80) bgClass = 'bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md shadow-emerald-900/30';
                    else if (score >= 65) bgClass = 'bg-indigo-600/70 text-indigo-100 hover:bg-indigo-500';
                    else if (score >= 45) bgClass = 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900';

                    return (
                      <button
                        key={`${day}_${hour}`}
                        onClick={() => setSelectedHeatmapCell(cell)}
                        className={`h-9 rounded-lg flex flex-col items-center justify-center text-[10px] border border-transparent transition-all cursor-pointer ${bgClass}`}
                        title={`${day} @ ${hour}:00 - Score: ${score}/100, Avg ER: ${cell?.avgER}% (${cell?.postCount || 0} historical posts)`}
                      >
                        <span>{cell?.avgER ? `${cell.avgER}%` : '-'}</span>
                        {hasPosts && (
                          <span className="text-[9px] opacity-75">{cell.postCount}p</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Heatmap Drawer / Helper */}
        {selectedHeatmapCell && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Slot Details: {selectedHeatmapCell.dayOfWeek} at {selectedHeatmapCell.hour}:00
                </span>
                {selectedHeatmapCell.isOptimal && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-semibold">
                    Optimal High-Engagement Window
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Predicted/Observed Engagement Rate: <strong className="text-cyan-300 font-mono">{selectedHeatmapCell.avgER}%</strong> based on {selectedHeatmapCell.postCount} historical posts in memory.
              </p>
            </div>

            <button
              onClick={() => {
                setSchedDate('2026-10-06');
                setSchedTime(`${selectedHeatmapCell.hour}:00`);
                setShowScheduleModal(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule at this Slot</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: Social Listening & Sentiment Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Audience Sentiment & Reaction Radar */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Audience Sentiment & Voice</h3>
                <BadgeTag type="historical" label="Feedback Analysis" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sentiment breakdown across {hubData.sentimentOverview.totalTrackedComments} comments & reaction logs.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {hubData.sentimentOverview.positivePercent}%
              </span>
              <span className="block text-[10px] text-slate-400">Positive Affinity</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${hubData.sentimentOverview.positivePercent}%` }}
                className="bg-emerald-500 h-full"
                title={`Positive: ${hubData.sentimentOverview.positivePercent}%`}
              />
              <div
                style={{ width: `${hubData.sentimentOverview.neutralPercent}%` }}
                className="bg-amber-400 h-full"
                title={`Neutral: ${hubData.sentimentOverview.neutralPercent}%`}
              />
              <div
                style={{ width: `${hubData.sentimentOverview.negativePercent}%` }}
                className="bg-rose-500 h-full"
                title={`Questions/Critical: ${hubData.sentimentOverview.negativePercent}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400">● {hubData.sentimentOverview.positivePercent}% Positive</span>
              <span className="text-amber-300">● {hubData.sentimentOverview.neutralPercent}% Neutral</span>
              <span className="text-rose-400">● {hubData.sentimentOverview.negativePercent}% Inquiries / Critique</span>
            </div>
          </div>

          {/* Qualitative quotes */}
          <div className="space-y-3 pt-2">
            <div>
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                Top Audience Praise Patterns
              </span>
              <div className="space-y-1.5">
                {hubData.sentimentOverview.topCompliments.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200/90 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>"{item}"</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider block mb-2">
                Recurring Community Questions
              </span>
              <div className="space-y-1.5">
                {hubData.sentimentOverview.topCriticismsOrQuestions.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-xs text-cyan-200/90 flex items-start gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>"{item}"</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Social Listening & Hashtag Momentum */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Social Listening & Hashtag Momentum</h3>
              <BadgeTag type="insight" label="Trend Radar" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time keyword tracker identifying terms with highest empirical engagement lift.
            </p>
          </div>

          <div className="space-y-2.5">
            {hubData.socialListening.map((trend) => (
              <div
                key={trend.id}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-cyan-400 rounded-lg">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{trend.keyword}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          trend.status === 'rising'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : trend.status === 'peak'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {trend.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {trend.mentionCount.toLocaleString()} mentions • +{trend.growthRate}% 7d surge
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{trend.avgERLift}% ER Lift
                  </span>
                  <span className="block text-[10px] text-slate-500">Above baseline</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Content Scheduling & Publishing Calendar Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Publishing Calendar & Scheduled Queue</h2>
              <BadgeTag type="recommendation" label="Queue Manager" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active queued content scheduled into optimal AI-recommended time windows.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Draft</span>
          </button>
        </div>

        {hubData.scheduledPosts.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-xs">
            No posts currently queued in the publishing calendar. Click "Schedule New Draft" to plan ahead!
          </div>
        ) : (
          <div className="space-y-3">
            {hubData.scheduledPosts.map((post) => (
              <div
                key={post._id}
                className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded font-semibold">
                      {post.platform}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono capitalize">
                      {post.contentFormat.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded font-mono">
                      {post.topic}
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.scheduledDate} at {post.scheduledTime}
                    </span>
                    {post.predictedER && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono">
                        Pred ER: {post.predictedER}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2">
                    {post.hook ? <strong className="text-white font-medium">"{post.hook}" </strong> : null}
                    {post.caption}
                  </p>

                  {post.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      Note: {post.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePublishNow(post._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Publish immediately & record to persistent memory bank"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </button>
                  <button
                    onClick={() => handleDeleteScheduled(post._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Schedule Social Media Post</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheduledPost} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Platform</label>
                  <select
                    value={schedPlatform}
                    onChange={(e) => setSchedPlatform(e.target.value as PlatformType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Content Format</label>
                  <select
                    value={schedFormat}
                    onChange={(e) => setSchedFormat(e.target.value as ContentFormat)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="short_video">Short Video (Top ER)</option>
                    <option value="carousel">Educational Carousel</option>
                    <option value="single_image">Single Image</option>
                    <option value="thread">Thread / Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Topic Category</label>
                <input
                  type="text"
                  value={schedTopic}
                  onChange={(e) => setSchedTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="e.g. AI Tutorials"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Publishing Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Publishing Time (Peak Window)</label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hook / First Line</label>
                <input
                  type="text"
                  value={schedHook}
                  onChange={(e) => setSchedHook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="Compelling opening statement"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Post Caption & Body</label>
                <textarea
                  rows={3}
                  value={schedCaption}
                  onChange={(e) => setSchedCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hashtags</label>
                <input
                  type="text"
                  value={schedHashtags}
                  onChange={(e) => setSchedHashtags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Scheduling Note</label>
                <input
                  type="text"
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isScheduling ? 'Scheduling...' : 'Confirm & Queue Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXECUTIVE REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-3xl w-full rounded-2xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Executive Engagement & Performance Report</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {isLoadingReport || !reportData ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Synthesizing executive metrics...
              </div>
            ) : (
              <div className="space-y-6 text-xs text-slate-300">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-bold text-white">{reportData.brand.name}</h4>
                    <p className="text-slate-400">{reportData.brand.handle} • {reportData.brand.industry}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Reporting Window</span>
                    <span className="font-mono text-cyan-300 font-semibold">{reportData.reportingPeriod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Total Audience Reach</span>
                    <span className="text-base font-bold text-white font-mono">
                      {reportData.summaryMetrics.totalReach.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Average Engagement Rate</span>
                    <span className="text-base font-bold text-indigo-400 font-mono">
                      {reportData.summaryMetrics.avgEngagementRate}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Virality Rate</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {reportData.summaryMetrics.viralityRate}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Strategic AI Directives
                  </h5>
                  <div className="space-y-2">
                    {reportData.strategicDirectives.map((dir: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-lg flex items-start gap-2 text-indigo-200"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <span>{dir}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Channel Standing
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {reportData.channelStandings.map((ch: any) => (
                      <div key={ch.platform} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                        <span className="font-semibold text-white">{ch.platform}</span>
                        <span className="font-mono text-cyan-300">{ch.avgER}% avg ER • {ch.followersCount.toLocaleString()} followers</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
