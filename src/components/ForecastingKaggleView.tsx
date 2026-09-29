import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  Download,
  Upload,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  Clock,
  Video,
  FileSpreadsheet,
  Check,
  ChevronRight,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { Brand, SocialPost, ContentFormat, PlatformType, PostForecastResult } from '../types';
import { BadgeTag } from './BadgeTag';

interface ForecastingKaggleViewProps {
  brand: Brand;
  posts: SocialPost[];
  avgER: number;
  onRefreshData: () => Promise<void>;
}

export const ForecastingKaggleView: React.FC<ForecastingKaggleViewProps> = ({
  brand,
  posts,
  avgER,
  onRefreshData,
}) => {
  // Simulator Inputs
  const [platform, setPlatform] = useState<PlatformType>('LinkedIn');
  const [contentFormat, setContentFormat] = useState<ContentFormat>('short_video');
  const [topic, setTopic] = useState('AI Tutorials');
  const [caption, setCaption] = useState(
    'Step-by-step: How to build a self-healing streaming JSON parser in TypeScript with retry exponential backoff. Full 50-line code pattern walkthrough.'
  );
  const [hook, setHook] = useState('Why your AI agents crash on partial streaming JSON');
  const [hashtags, setHashtags] = useState('#AIDevelopment #TypeScript #Architecture');
  const [dayOfWeek, setDayOfWeek] = useState('Tuesday');
  const [timeOfDay, setTimeOfDay] = useState('14:30');
  const [hookStrength, setHookStrength] = useState<number>(9);
  const [videoDuration, setVideoDuration] = useState<number>(45);
  const [followerCount, setFollowerCount] = useState<number>(54000);
  const [hasMedia, setHasMedia] = useState<boolean>(true);

  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<PostForecastResult | null>(null);

  // CSV Import state
  const [csvInput, setCsvInput] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quick preset profiles
  const applyPreset = (type: 'high_video' | 'deep_carousel' | 'sales_banner') => {
    if (type === 'high_video') {
      setPlatform('LinkedIn');
      setContentFormat('short_video');
      setTopic('AI Tutorials');
      setCaption('60-second engineering teardown: Implementing speculative decoding to slash model response latency by 48%. Code repo attached.');
      setHook('Slash agent latency by 48% with speculative decoding');
      setHashtags('#AIEngineering #LatencyOptimization #Python');
      setDayOfWeek('Tuesday');
      setTimeOfDay('14:30');
      setHookStrength(9);
      setVideoDuration(42);
      setHasMedia(true);
    } else if (type === 'deep_carousel') {
      setPlatform('LinkedIn');
      setContentFormat('carousel');
      setTopic('Educational Carousels');
      setCaption('The 2026 Production LLM Latency & Cost Optimization Checklist: 7 core architecture rules before shipping to 50k users. Swipe ➡️');
      setHook('The 2026 LLM Optimization Checklist (Swipe ➡️)');
      setHashtags('#SystemDesign #CloudArchitecture #DevOps');
      setDayOfWeek('Friday');
      setTimeOfDay('10:00');
      setHookStrength(8);
      setVideoDuration(0);
      setHasMedia(true);
    } else {
      setPlatform('Twitter/X');
      setContentFormat('single_image');
      setTopic('Promotional Posts');
      setCaption('Sign up today for our annual pro plan and save 25% on agent compute credits! Limited time discount.');
      setHook('Get 25% off annual cloud plans');
      setHashtags('#SaaSDiscount #CloudHosting');
      setDayOfWeek('Wednesday');
      setTimeOfDay('11:00');
      setHookStrength(4);
      setVideoDuration(0);
      setHasMedia(true);
    }
  };

  // Run Forecast API
  const handleRunForecast = async () => {
    setIsForecasting(true);
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentFormat,
          topic,
          caption,
          hook,
          hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
          dayOfWeek,
          timeOfDay,
          hookStrength: Number(hookStrength),
          videoDuration: contentFormat === 'short_video' ? Number(videoDuration) : 0,
          followerCount: Number(followerCount),
          hasMedia,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setForecastResult(data.forecast);
      }
    } catch (err) {
      console.error('Forecast failed:', err);
    } finally {
      setIsForecasting(false);
    }
  };

  useEffect(() => {
    handleRunForecast();
  }, []);

  // Export to Kaggle CSV
  const handleExportCSV = () => {
    window.location.href = '/api/kaggle/export-csv';
  };

  // Load Kaggle Benchmark Dataset
  const handleLoadBenchmark = async () => {
    setIsLoadingBenchmark(true);
    try {
      const res = await fetch('/api/kaggle/load-benchmark', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`✓ Loaded ${data.addedCount} Kaggle Competition Benchmark posts into memory!`);
        await onRefreshData();
        await handleRunForecast();
      }
    } catch (err) {
      console.error('Failed to load benchmark:', err);
    } finally {
      setIsLoadingBenchmark(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  // Import CSV text
  const handleImportCsv = async () => {
    if (!csvInput.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/kaggle/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvInput }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`✓ Successfully ingested ${data.importedCount} rows from Kaggle CSV into memory!`);
        setShowCsvModal(false);
        setCsvInput('');
        await onRefreshData();
        await handleRunForecast();
      } else {
        alert(data.error || 'Failed to parse CSV');
      }
    } catch (err) {
      console.error('CSV import failed:', err);
    } finally {
      setIsImporting(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Post Performance Forecasting Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold uppercase tracking-wider">
                Kaggle Competition Benchmark
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on the Kaggle <em>"Social Media Post Performance Forecasting"</em> dataset schema. Predict post engagement rate, viral probability, views, likes, and watch retention before publishing.
            </p>
          </div>

          {/* Dataset Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download full dataset formatted for Kaggle competition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export train.csv</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Import custom Kaggle competition CSV dataset"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import Kaggle CSV</span>
            </button>

            <button
              onClick={handleLoadBenchmark}
              disabled={isLoadingBenchmark}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30"
              title="Load 36 Kaggle benchmark records into active memory"
            >
              <Sparkles className={`w-4 h-4 ${isLoadingBenchmark ? 'animate-spin' : ''}`} />
              <span>{isLoadingBenchmark ? 'Loading Data...' : 'Load Kaggle Benchmark (36 Posts)'}</span>
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Model Accuracy & Training Validation Stats */}
      {forecastResult?.modelValidationMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Training Dataset Size</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {forecastResult.modelValidationMetrics.trainingSampleSize}{' '}
              <span className="text-xs text-slate-400 font-normal">posts</span>
            </div>
            <span className="text-[11px] text-slate-400">Validated on brand history</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Mean Absolute Error (MAE)</span>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">
              ±{forecastResult.modelValidationMetrics.meanAbsoluteError}%
            </div>
            <span className="text-[11px] text-slate-400">Residual engagement delta</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">RMSE (Root Mean Square)</span>
            <div className="text-xl font-extrabold text-indigo-400 font-mono mt-0.5">
              {forecastResult.modelValidationMetrics.rmse}
            </div>
            <span className="text-[11px] text-slate-400">Penalizes large forecast variance</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">R² Score (Explained Variance)</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {forecastResult.modelValidationMetrics.rSquared}
            </div>
            <span className="text-[11px] text-emerald-300/80">Strong historical predictive fit</span>
          </div>
        </div>
      )}

      {/* Main Forecasting Grid: Inputs (Left) vs Output Prediction (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Pre-Publish Simulator Form */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Pre-Publish Post Simulator</span>
            </h3>

            {/* Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyPreset('high_video')}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-cyan-300 hover:bg-slate-700"
              >
                High Video
              </button>
              <button
                type="button"
                onClick={() => applyPreset('deep_carousel')}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-indigo-300 hover:bg-slate-700"
              >
                Carousel
              </button>
              <button
                type="button"
                onClick={() => applyPreset('sales_banner')}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-rose-300 hover:bg-slate-700"
              >
                Sales Ad
              </button>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter/X">Twitter/X</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Content Format</label>
                <select
                  value={contentFormat}
                  onChange={(e) => setContentFormat(e.target.value as ContentFormat)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="short_video">Short Video (Top ER)</option>
                  <option value="carousel">Carousel</option>
                  <option value="single_image">Single Image</option>
                  <option value="text_post">Text Post</option>
                  <option value="thread">Thread</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category / Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., AI Tutorials, Educational Carousels..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Opening Hook Line</label>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Opening hook..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Draft Caption Copy</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
              />
            </div>

            {/* Sliders for Kaggle Features */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Hook Strength Score (Kaggle Feature)</span>
                  <span className="text-cyan-400 font-bold font-mono">{hookStrength} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={hookStrength}
                  onChange={(e) => setHookStrength(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {contentFormat === 'short_video' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Video Duration (seconds)</span>
                    <span className="text-indigo-400 font-bold font-mono">{videoDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
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

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Hour of Day (UTC)</label>
                  <input
                    type="text"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunForecast}
              disabled={isForecasting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <TrendingUp className={`w-4 h-4 ${isForecasting ? 'animate-spin' : ''}`} />
              <span>{isForecasting ? 'Simulating Forecast...' : 'Run Forecast Model'}</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Multi-variable Forecast Outputs */}
        {forecastResult && (
          <div className="lg:col-span-7 space-y-5">
            {/* Primary Forecast Card */}
            <div className="bg-slate-900/90 border border-indigo-700/50 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BadgeTag type="insight" label="Forecast Model Prediction" />
                  <span className="text-xs text-slate-400 font-mono">
                    Baseline: {avgER}% ER
                  </span>
                </div>

                {/* Performance Tier Pill */}
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    forecastResult.performanceTier.includes('Top')
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : forecastResult.performanceTier.includes('Above')
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : forecastResult.performanceTier.includes('Risk')
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {forecastResult.performanceTier}
                </span>
              </div>

              {/* Main Predicted Number & Confidence Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Predicted Engagement Rate
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-cyan-400 font-mono">
                      {forecastResult.predictedEngagementRate}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      CI: [{forecastResult.confidenceInterval.low}% - {forecastResult.confidenceInterval.high}%]
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {forecastResult.predictedEngagementRate >= avgER ? (
                      <span className="text-emerald-400 font-semibold">
                        +{(forecastResult.predictedEngagementRate - avgER).toFixed(2)}% above historical brand median
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        {(forecastResult.predictedEngagementRate - avgER).toFixed(2)}% below historical brand median
                      </span>
                    )}
                  </p>
                </div>

                {/* Viral Probability Meter */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Viral Probability Score
                    </span>
                    <span className="font-extrabold text-amber-400 font-mono">
                      {forecastResult.viralProbability}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${forecastResult.viralProbability}%` }}
                    />
                  </div>
                  {forecastResult.expectedCompletionRate && (
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Est. Video Watch Completion:</span>
                      <span className="text-white font-mono font-bold">
                        {forecastResult.expectedCompletionRate}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Numerical Metrics Grid */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
                  Estimated Numerical Target Outcomes
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Est. Reach</span>
                    <span className="font-bold text-white font-mono">
                      {forecastResult.predictedMetrics.estimatedReach.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Est. Views</span>
                    <span className="font-bold text-white font-mono">
                      {forecastResult.predictedMetrics.estimatedViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Likes</span>
                    <span className="font-bold text-cyan-300 font-mono">
                      {forecastResult.predictedMetrics.estimatedLikes}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Comments</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {forecastResult.predictedMetrics.estimatedComments}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Shares</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {forecastResult.predictedMetrics.estimatedShares}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Saves</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {forecastResult.predictedMetrics.estimatedSaves}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainable AI / Feature Attribution (SHAP-style) */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Feature Attribution & Impact Drivers</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Delta vs Baseline</span>
                </div>

                <div className="space-y-2 text-xs">
                  {forecastResult.featureAttributions.map((attr, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{attr.feature}</span>
                          <span className="text-slate-400">({attr.value})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{attr.explanation}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-sm ${
                            attr.impactScore > 0
                              ? 'text-emerald-400'
                              : attr.impactScore < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {attr.impactScore > 0 ? `+${attr.impactScore}%` : `${attr.impactScore}%`}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          n={attr.historicalSampleCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data-backed Recommendations for the post */}
              {forecastResult.dataBackedSuggestions.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-1.5">
                  <span className="font-bold text-amber-300 uppercase tracking-wide block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Recommended Adjustments to Maximize Performance:
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {forecastResult.dataBackedSuggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nearest Historical Precedents */}
              {forecastResult.historicalPrecedents.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-500 block">
                    Closest Historical Precedents in Brand Memory:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {forecastResult.historicalPrecedents.map((prec, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1"
                      >
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span className="text-cyan-400">{prec.postId}</span>
                          <span>{prec.similarityScore}% match</span>
                        </div>
                        <p className="text-slate-300 line-clamp-2 text-[11px]">"{prec.caption}"</p>
                        <span className="font-bold text-emerald-400 font-mono block">
                          Actual: {prec.actualER}% ER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Import Kaggle Competition CSV Dataset</h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Paste CSV data conforming to the Kaggle <em>"Social Media Post Performance Forecasting"</em> schema. The engine will ingest the rows, parse engagement metrics and content features, and re-train the memory baseline.
              </p>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Paste CSV text (including header line):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvInput(`Post_ID,Platform,Content_Type,Category,Caption_Length,Hashtag_Count,Has_Media,Video_Duration_Sec,Hook_Strength,Creator_Follower_Count,Creator_Type,Post_Date,Day_of_Week,Hour_of_Day,Likes,Comments,Shares,Saves,Reach,Impressions,Views,Clicks,Engagement_Rate,Watch_Time_Avg,Completion_Rate,Is_Viral,Post_Content
kaggle_sample_01,LinkedIn,short_video,"AI Tutorials",32,4,True,45,9,55000,Mid-tier,2026-09-24,Tuesday,14,920,115,180,340,22000,31000,29000,850,7.07,42,80,1,"How to stream JSON structured tool calls in 3 lines of code without parsing crashes."
kaggle_sample_02,Twitter/X,thread,"AI Tutorials",45,3,False,0,8,48000,Mid-tier,2026-09-22,Sunday,16,1150,90,380,620,31000,44000,41000,920,7.23,0,0,1,"1/6 The hidden flaw in 80% of RAG chunking algorithms: why sliding windows fail on markdown."`);
                    }}
                    className="text-cyan-400 hover:underline"
                  >
                    Paste Sample Row
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Post_ID,Platform,Content_Type,Category,Caption_Length..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportCsv}
                  disabled={isImporting || !csvInput.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Parsing & Ingesting...' : 'Parse & Ingest into Memory'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
