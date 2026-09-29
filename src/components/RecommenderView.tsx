import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Share2,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Recommendation, SocialPost, Brand } from '../types';
import { BadgeTag } from './BadgeTag';

interface RecommenderViewProps {
  brand: Brand;
  recommendations: Recommendation[];
  posts: SocialPost[];
  onGenerateRecommendation: (goal?: string) => Promise<void>;
  onOpenFeedbackModal: (rec: Recommendation) => void;
  onOpenContentGeneratorWithTopic: (topic: string, format: string) => void;
  isGenerating: boolean;
}

export const RecommenderView: React.FC<RecommenderViewProps> = ({
  brand,
  recommendations,
  posts,
  onGenerateRecommendation,
  onOpenFeedbackModal,
  onOpenContentGeneratorWithTopic,
  isGenerating,
}) => {
  const [customGoal, setCustomGoal] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const publishedRecs = recommendations.filter((r) => r.status === 'published');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      {/* Top Banner & Generation Controller */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">AI Content Recommender</h2>
            <BadgeTag type="recommendation" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            The agent does not provide generic social media advice. It inspects {brand.name}'s historical database, calculates performance baselines across content formats, and recommends what to post based on empirical proof.
          </p>

          {/* Prompt/Goal input */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="E.g., Target senior engineers, focus on RAG optimization, or launch technical guide..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => onGenerateRecommendation(customGoal)}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Synthesizing Memory...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate New Recommendation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Recommendations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Actionable Recommendations</span>
            <span className="text-xs bg-slate-800 text-cyan-300 px-2.5 py-0.5 rounded-full border border-slate-700">
              {pendingRecs.length} pending
            </span>
          </h3>
        </div>

        {pendingRecs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <Lightbulb className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No pending recommendations right now.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Generate New Recommendation" above to have the agent evaluate current memory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingRecs.map((rec) => (
              <div
                key={rec._id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-xl space-y-5"
              >
                {/* Header Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeTag type="recommendation" />
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 text-cyan-300 border border-indigo-700/50 text-xs font-semibold">
                      {rec.recommendedTopic}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      {formatName(rec.recommendedFormat)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      {rec.recommendedPlatform}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{rec.recommendedPostingDay}</span>
                    <span className="text-slate-600">@</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{rec.recommendedPostingTime} UTC</span>
                  </div>
                </div>

                {/* Reason citing Brand Data */}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Why the Agent Recommends This:</span>
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    {rec.reason}
                  </p>
                </div>

                {/* Supporting Historical Data & Proof */}
                <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <BadgeTag type="historical" size="sm" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                      Supporting Historical Evidence:
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {rec.supportingHistoricalData.historicalMetricComparison}
                  </p>
                  {rec.supportingHistoricalData.referencedPostIds && rec.supportingHistoricalData.referencedPostIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                      <span>Referenced Posts:</span>
                      {rec.supportingHistoricalData.referencedPostIds.map((id) => (
                        <span key={id} className="bg-slate-900 text-blue-300 px-2 py-0.5 rounded-sm border border-slate-800 font-mono">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expected Engagement Trend */}
                <div className="flex items-start gap-2.5 text-xs text-emerald-300/90 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300">Expected Engagement Trend:</strong>{' '}
                    <span>{rec.expectedEngagementTrend}</span>
                  </div>
                </div>

                {/* Suggested Hook & Caption */}
                {(rec.suggestedHook || rec.suggestedCaption) && (
                  <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    {rec.suggestedHook && (
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Suggested Hook</span>
                        <div className="text-sm font-semibold text-cyan-300 mt-0.5">
                          "{rec.suggestedHook}"
                        </div>
                      </div>
                    )}
                    {rec.suggestedCaption && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Draft Caption</span>
                          <button
                            onClick={() => copyToClipboard(rec.suggestedCaption || '', rec._id)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            {copiedId === rec._id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Caption</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {rec.suggestedCaption}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Connect to Content Generator & Feedback Loop */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onOpenContentGeneratorWithTopic(rec.recommendedTopic, rec.recommendedFormat)}
                      className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open in Content Generator</span>
                    </button>
                    <button
                      onClick={() => onOpenFeedbackModal(rec)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Published & Add Feedback</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Created: {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed / Published Recommendations History */}
      {publishedRecs.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Feedback Loop History (Published Recommendations)</span>
            <BadgeTag type="feedback" />
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {publishedRecs.map((rec) => {
              const fb = rec.feedbackResult;
              const isOutperformed = fb?.comparisonToBaseline === 'outperformed';
              const isUnderperformed = fb?.comparisonToBaseline === 'underperformed';

              return (
                <div
                  key={rec._id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rec.recommendedTopic}</span>
                      <span className="text-[11px] text-slate-400">({formatName(rec.recommendedFormat)})</span>
                      {isOutperformed && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-semibold">
                          Outperformed Baseline
                        </span>
                      )}
                      {isUnderperformed && (
                        <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800 font-semibold">
                          Underperformed Baseline
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{fb?.userNotes || rec.reason.slice(0, 100) + '...'}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Actual Engagement</span>
                      <span className="text-sm font-extrabold text-cyan-400 font-mono">
                        {fb?.actualEngagementRate}% ER
                      </span>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-lg border border-slate-700">
                      Memory Updated ✓
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
