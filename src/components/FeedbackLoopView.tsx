import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Brain,
  PlusCircle,
} from 'lucide-react';
import { Recommendation, Brand, SocialPost } from '../types';
import { BadgeTag } from './BadgeTag';

interface FeedbackLoopViewProps {
  brand: Brand;
  recommendations: Recommendation[];
  posts: SocialPost[];
  avgER: number;
  onOpenFeedbackModal: (rec: Recommendation) => void;
  onNavigateToTab: (tab: string) => void;
}

export const FeedbackLoopView: React.FC<FeedbackLoopViewProps> = ({
  brand,
  recommendations,
  posts,
  avgER,
  onOpenFeedbackModal,
  onNavigateToTab,
}) => {
  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const publishedRecs = recommendations.filter((r) => r.status === 'published');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner explaining the Continuous Learning Cycle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Continuous Feedback Loop Engine</h2>
          <BadgeTag type="feedback" />
        </div>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          The core differentiator of this agent is that it learns whether its previous advice actually succeeded. When a recommended post is published and its metrics are recorded, the agent evaluates the delta against baseline and updates the audience memory bank.
        </p>

        {/* Closed-loop Visual Architecture Pipeline */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] text-xs">
            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto font-bold">1</span>
              <span className="font-semibold text-white block">Recommendation</span>
              <span className="text-[11px] text-slate-500">Agent proposes post</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto font-bold">2</span>
              <span className="font-semibold text-white block">Post Published</span>
              <span className="text-[11px] text-slate-500">Live on platform</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-amber-600/30 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto font-bold">3</span>
              <span className="font-semibold text-white block">Metrics Logged</span>
              <span className="text-[11px] text-slate-500">Actual ER computed</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center mx-auto font-bold">4</span>
              <span className="font-semibold text-white block">Outcome Evaluation</span>
              <span className="text-[11px] text-slate-500">Delta vs baseline</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto font-bold">5</span>
              <span className="font-semibold text-white block">Memory Refinement</span>
              <span className="text-[11px] text-slate-500">Rules consolidated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Recommendations Awaiting Feedback */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Pending Recommendations Ready for Feedback</span>
          <span className="text-xs bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full border border-slate-700">
            {pendingRecs.length}
          </span>
        </h3>

        {pendingRecs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
            No recommendations waiting for feedback right now.
            <button
              onClick={() => onNavigateToTab('recommender')}
              className="text-cyan-400 hover:underline ml-1 font-medium"
            >
              Generate a recommendation first.
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRecs.map((rec) => (
              <div
                key={rec._id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <BadgeTag type="recommendation" />
                    <span className="text-sm font-bold text-white">{rec.recommendedTopic}</span>
                    <span className="text-xs text-slate-400">({rec.recommendedFormat})</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Target: {rec.recommendedPostingDay} @ {rec.recommendedPostingTime} UTC on {rec.recommendedPlatform}
                  </div>
                </div>

                <button
                  onClick={() => onOpenFeedbackModal(rec)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Enter Actual Metrics</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Feedback Loops History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Validated Feedback Outcomes ({publishedRecs.length})</span>
          <BadgeTag type="feedback" />
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {publishedRecs.map((rec) => {
            const fb = rec.feedbackResult;
            const actualER = fb?.actualEngagementRate || 0;
            const delta = actualER - avgER;
            const isOutperformed = fb?.comparisonToBaseline === 'outperformed';
            const isUnderperformed = fb?.comparisonToBaseline === 'underperformed';

            return (
              <div
                key={rec._id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{rec.recommendedTopic}</span>
                    <span className="text-xs text-slate-400">({rec.recommendedFormat})</span>
                    <span className="text-xs text-slate-500">• {rec.recommendedPlatform}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOutperformed && (
                      <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Outperformed Baseline (+{delta.toFixed(2)}% ER)
                      </span>
                    )}
                    {isUnderperformed && (
                      <span className="text-xs bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-800 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Underperformed Baseline ({delta.toFixed(2)}% ER)
                      </span>
                    )}
                    {!isOutperformed && !isUnderperformed && (
                      <span className="text-xs bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-800 font-bold">
                        Matched Baseline
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Initial Recommendation Hypothesis
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rec.reason}</p>
                    <div className="text-slate-400 font-mono text-[11px] pt-1">
                      Expected: {rec.expectedEngagementTrend}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Actual Observed Performance
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                        {actualER}% ER
                      </span>
                      <span className="text-slate-400">vs brand baseline {avgER}%</span>
                    </div>
                    {fb?.userNotes && (
                      <p className="text-slate-300 italic pt-1 leading-relaxed">
                        "{fb.userNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>Memory Update Applied: Continuous learning confirmed this topic & timing pattern.</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Evaluated: {fb?.evaluatedAt ? new Date(fb.evaluatedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
