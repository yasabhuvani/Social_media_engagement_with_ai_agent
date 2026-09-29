import React, { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  PlusCircle,
  Brain,
  MessageSquare,
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Flame,
  TrendingUp,
  Compass,
  Database,
} from 'lucide-react';
import { Brand } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brand: Brand | null;
  totalPosts: number;
  avgER: number;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  brand,
  totalPosts,
  avgER,
  onResetDemo,
  isResetting,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'datasets', label: 'Dataset Hub', icon: Database },
    { id: 'engagement_hub', label: 'Engagement Hub', icon: Compass },
    { id: 'forecasting', label: 'Forecasting (Kaggle)', icon: TrendingUp },
    { id: 'recommender', label: 'Recommendations', icon: Sparkles },
    { id: 'analyzer', label: 'Post Analyzer', icon: PlusCircle },
    { id: 'memory', label: 'Audience Memory', icon: Brain },
    { id: 'chat', label: 'Conversation Agent', icon: MessageSquare },
    { id: 'feedback', label: 'Feedback Loop', icon: RotateCcw },
    { id: 'search', label: 'Memory Search (RAG)', icon: Search },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top bar with Brand context and quick metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Social Media Engagement Agent</h1>
              <span className="hidden sm:inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                Persistent Memory AI
              </span>
            </div>
            {brand && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                Active Brand: <span className="font-semibold text-slate-200">{brand.name}</span>
                <span className="text-slate-500 font-mono">({brand.handle})</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{brand.industry}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Empirical Memory Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-slate-400">Memory Posts:</span>
            <span className="font-bold text-cyan-400">{totalPosts}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Baseline ER:</span>
            <span className="font-bold text-emerald-400">{avgER.toFixed(2)}%</span>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Reset database to the initial 24 realistic posts for Hackathon testing"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Reset to Realistic Demo Data?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              This will reset the database to the 24 realistic historical posts for <strong className="text-white">Synthetix AI</strong>, restore default audience memory rules, and reset past recommendations. Useful for testing features from a clean state.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await onResetDemo();
                }}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <CheckCircle className="w-4 h-4" />
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
