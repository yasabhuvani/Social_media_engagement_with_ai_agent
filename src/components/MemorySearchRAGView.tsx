import React, { useState } from 'react';
import {
  Search,
  Brain,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  ThumbsUp,
  Bookmark,
  Share2,
} from 'lucide-react';
import { Brand, ContentFormat, PlatformType } from '../types';
import { BadgeTag } from './BadgeTag';

interface MemorySearchRAGViewProps {
  brand: Brand;
}

export const MemorySearchRAGView: React.FC<MemorySearchRAGViewProps> = ({ brand }) => {
  const [query, setQuery] = useState('How do AI tutorials perform compared to promotional images?');
  const [targetTopic, setTargetTopic] = useState('');
  const [targetFormat, setTargetFormat] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          targetTopic: targetTopic || undefined,
          targetFormat: targetFormat || undefined,
          targetPlatform: targetPlatform || undefined,
          limit: 6,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Failed to search memory:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const sampleQueries = [
    'RAG chunking strategies and semantic search tutorials',
    'Why do promotional posts fail?',
    'Peak posting hours on Tuesday and Sunday',
    'Short video coding breakdowns',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Memory Search & Retrieval Engine (RAG)
            </h2>
            <BadgeTag type="historical" label="Vector & Metric Search" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Instead of dumping the entire database into the LLM context, the agent uses hybrid vector similarity, keyword matching, and normalized engagement weighting to retrieve the most relevant historical posts and memory rules.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="mt-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query brand memory semantically..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Search className="w-4 h-4 text-cyan-300" />
              <span>{isSearching ? 'Retrieving...' : 'Search Memory'}</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 font-semibold">Optional Filters:</span>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300"
            >
              <option value="">Any Format</option>
              <option value="short_video">Short Video</option>
              <option value="carousel">Carousel</option>
              <option value="thread">Thread</option>
              <option value="single_image">Single Image</option>
            </select>

            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300"
            >
              <option value="">Any Platform</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter/X">Twitter/X</option>
              <option value="Instagram">Instagram</option>
            </select>

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              <span className="text-slate-500">Quick Test:</span>
              {sampleQueries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(sq);
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 transition-colors"
                >
                  {sq.slice(0, 26)}...
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Search Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Empirical Context Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Total Posts Evaluated</span>
              <span className="text-lg font-bold text-white font-mono">{results.empiricalSummary.totalPosts}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Brand Average ER</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {results.empiricalSummary.avgEngagementRate}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Best Format</span>
              <span className="text-sm font-bold text-emerald-400">
                {results.empiricalSummary.bestFormat.format} ({results.empiricalSummary.bestFormat.avgRate}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Peak Posting Window</span>
              <span className="text-xs font-bold text-slate-200">
                {results.empiricalSummary.bestPostingWindow.window}
              </span>
            </div>
          </div>

          {/* Retrieved Historical Posts */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Top Retrieved Historical Posts ({results.relevantPosts?.length || 0})</span>
                <BadgeTag type="historical" />
              </span>
              <span className="text-xs text-slate-400 font-normal">Ranked by Hybrid Relevance Score</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.relevantPosts?.map((post: any, idx: number) => (
                <div
                  key={post._id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 relative hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Rank #{idx + 1} • {post._id}
                    </span>
                    <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800 font-mono font-semibold">
                      Score: {post.relevanceScore} pts
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{post.caption}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {post.platform} • {post.contentFormat}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{post.topic}</span>
                    <span className="font-mono text-cyan-300 font-bold ml-auto">
                      {post.metrics.engagementRate}% ER ({post.metrics.saves} saves)
                    </span>
                  </div>

                  {/* Match reasons */}
                  {post.matchReasons && post.matchReasons.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1">
                      {post.matchReasons.map((reason: string, rIdx: number) => (
                        <span
                          key={rIdx}
                          className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-sm border border-slate-800"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Retrieved Audience Memory Rules */}
          {results.relevantMemories && results.relevantMemories.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Retrieved Audience Memory Insights ({results.relevantMemories.length})</span>
                <BadgeTag type="insight" />
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {results.relevantMemories.map((mem: any) => (
                  <div
                    key={mem._id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">{mem.title}</span>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {(mem.confidenceScore * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{mem.insight}</p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Proof: {mem.supportingMetricsProof}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
