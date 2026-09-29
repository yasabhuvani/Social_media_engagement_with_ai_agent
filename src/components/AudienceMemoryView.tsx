import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  Award,
  Clock,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  ThumbsUp,
  CheckCircle2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { AudienceMemoryInsight, SocialPost, Brand } from '../types';
import { BadgeTag } from './BadgeTag';

interface AudienceMemoryViewProps {
  brand: Brand;
  memories: AudienceMemoryInsight[];
  posts: SocialPost[];
  onConsolidateMemory: () => Promise<void>;
  isConsolidating: boolean;
}

export const AudienceMemoryView: React.FC<AudienceMemoryViewProps> = ({
  brand,
  memories,
  posts,
  onConsolidateMemory,
  isConsolidating,
}) => {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Grouping memories by category
  const categoryIcon = (category: string) => {
    switch (category) {
      case 'preferred_format':
        return <Award className="w-4 h-4 text-cyan-400" />;
      case 'frequent_topic':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'high_performing_time':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'low_performing_pattern':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'audience_reaction':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Brain className="w-4 h-4 text-cyan-400" />;
    }
  };

  const categoryLabel = (category: string) => {
    switch (category) {
      case 'preferred_format':
        return 'Preferred Content Format';
      case 'frequent_topic':
        return 'Top Engaging Topic';
      case 'high_performing_time':
        return 'Peak Posting Window';
      case 'low_performing_pattern':
        return 'Low-Performing Pattern to Avoid';
      case 'audience_reaction':
        return 'Audience Reaction & Tone';
      case 'learned_rule':
        return 'Feedback Loop Validated Rule';
      default:
        return 'Learned Memory Rule';
    }
  };

  // Find supporting posts from post map
  const getSupportingPosts = (postIds: string[]): SocialPost[] => {
    return postIds.map((id) => posts.find((p) => p._id === id)).filter(Boolean) as SocialPost[];
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Audience Memory Bank</h2>
            <BadgeTag type="insight" label="Synthesized Memory" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Persistent learned intelligence about {brand.name}'s audience. Every rule here was discovered from real historical posts and validated performance outcomes.
          </p>
        </div>

        <button
          onClick={onConsolidateMemory}
          disabled={isConsolidating}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-indigo-600/30"
        >
          <RefreshCw className={`w-4 h-4 ${isConsolidating ? 'animate-spin text-cyan-300' : 'text-cyan-300'}`} />
          <span>{isConsolidating ? 'Consolidating Memory...' : 'Re-Evaluate Memory'}</span>
        </button>
      </div>

      {/* Memory Rules List */}
      <div className="grid grid-cols-1 gap-5">
        {memories.map((insight) => {
          const isExpanded = expandedInsightId === insight._id;
          const supporting = getSupportingPosts(insight.supportingPostIds);

          return (
            <div
              key={insight._id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Category pill & Confidence score */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {categoryIcon(insight.category)}
                  </span>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {categoryLabel(insight.category)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">ID: {insight._id}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="font-bold text-cyan-400 font-mono">
                      {(insight.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${insight.confidenceScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Title & Insight Body */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white tracking-tight">{insight.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  {insight.insight}
                </p>
              </div>

              {/* Verified Empirical Metric Proof */}
              <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3.5 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200 leading-relaxed">
                  <strong className="text-blue-300 font-semibold block mb-0.5">
                    Data Proof Backing This Memory:
                  </strong>
                  <span className="font-mono text-slate-300">{insight.supportingMetricsProof}</span>
                </div>
              </div>

              {/* Expandable Supporting Posts Section */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setExpandedInsightId(isExpanded ? null : insight._id)}
                  className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{supporting.length}</span>
                    <span>Supporting Historical Posts Linked to this Learning</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {supporting.map((p) => (
                      <div
                        key={p._id}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span className="text-cyan-400 font-bold">{p._id}</span>
                          <span>{p.dayOfWeek} {p.timeOfDay}</span>
                        </div>
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">"{p.caption}"</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                          <span className="text-slate-400 font-medium">{p.platform} • {p.contentFormat}</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {p.metrics.engagementRate}% ER ({p.metrics.saves} saves)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
