import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Layers,
  ArrowRight,
  Brain,
  Hash,
  Lightbulb,
} from 'lucide-react';
import { Brand, ContentFormat, PlatformType } from '../types';
import { BadgeTag } from './BadgeTag';

interface ContentGeneratorViewProps {
  brand: Brand;
  initialTopic?: string;
  initialFormat?: string;
  onSendToAnalyzer: (postData: {
    topic: string;
    caption: string;
    hook: string;
    hashtags: string[];
    contentFormat: ContentFormat;
    platform: PlatformType;
  }) => void;
}

export const ContentGeneratorView: React.FC<ContentGeneratorViewProps> = ({
  brand,
  initialTopic = 'Building Self-Healing Agent Loops',
  initialFormat = 'short_video',
  onSendToAnalyzer,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [format, setFormat] = useState<ContentFormat>((initialFormat as ContentFormat) || 'short_video');
  const [platform, setPlatform] = useState<PlatformType>('LinkedIn');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          targetFormat: format,
          targetPlatform: platform,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedResult(data.content);
      }
    } catch (err) {
      console.error('Failed to generate content:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">AI Content Generator</h2>
            <BadgeTag type="insight" label="Audience Informed" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Generates high-performing hooks, captions, and platform variants adapted to {brand.name}'s audience patterns. Incorporates learned preferences like code snippets, question hooks, and technical teardowns.
          </p>
        </div>

        {/* Input Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Topic or Angle
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Streaming JSON parser with retry backoff..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ContentFormat)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="short_video">Short Video (Top ER)</option>
              <option value="carousel">Educational Carousel</option>
              <option value="thread">Twitter/X Thread</option>
              <option value="text_post">Text Post</option>
              <option value="single_image">Single Image</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter/X">Twitter/X</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin text-cyan-300' : 'text-cyan-300'}`} />
            <span>{isGenerating ? 'Generating with Audience Memory...' : 'Generate Tailored Content'}</span>
          </button>
        </div>
      </div>

      {/* Generated Content Output */}
      {generatedResult && (
        <div className="space-y-6">
          {/* Learned Preferences Applied Tag Banner */}
          {generatedResult.learnedPreferencesApplied && (
            <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Learned Audience Preferences Applied to this Draft:
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {generatedResult.learnedPreferencesApplied.map((pref: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-purple-900/30">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{pref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hook & Short-form Post Idea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  High-Impact Hook Line
                </span>
                <button
                  onClick={() => copyToClipboard(generatedResult.hook, 'hook')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'hook' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-cyan-300">
                "{generatedResult.hook}"
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  Visual / Storyboard Structure
                </span>
                <button
                  onClick={() => copyToClipboard(generatedResult.shortFormIdea, 'idea')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'idea' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'idea' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                {generatedResult.shortFormIdea}
              </p>
            </div>
          </div>

          {/* Full Caption */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Primary Post Caption ({platform})
                </span>
                <p className="text-xs text-slate-500">Includes hook, technical explanation, and call-to-action.</p>
              </div>
              <button
                onClick={() => copyToClipboard(generatedResult.caption, 'caption')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                {copiedKey === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'caption' ? 'Copied' : 'Copy Caption'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {generatedResult.caption}
            </div>

            {/* Hashtags */}
            {generatedResult.hashtags && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                {generatedResult.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs text-cyan-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Action: Send to Post Analyzer */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Published this post? Send it to the Post Analyzer to record engagement metrics and update memory.
              </span>
              <button
                onClick={() =>
                  onSendToAnalyzer({
                    topic,
                    caption: generatedResult.caption,
                    hook: generatedResult.hook,
                    hashtags: generatedResult.hashtags || [],
                    contentFormat: format,
                    platform,
                  })
                }
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <span>Send to Post Analyzer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Platform Adaptations */}
          {generatedResult.platformAdaptations && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Cross-Platform Adaptations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LinkedIn */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedResult.platformAdaptations.linkedin, 'li')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'li' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {generatedResult.platformAdaptations.linkedin}
                  </p>
                </div>

                {/* Twitter / X */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Twitter className="w-4 h-4 text-cyan-400" />
                      Twitter/X Thread
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedResult.platformAdaptations.twitter, 'tw')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'tw' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {generatedResult.platformAdaptations.twitter}
                  </p>
                </div>

                {/* Instagram */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-pink-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-4 h-4" />
                      Instagram Reel / Carousel
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedResult.platformAdaptations.instagram, 'ig')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'ig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {generatedResult.platformAdaptations.instagram}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
