import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  Bookmark,
  MessageSquare,
  Share2,
  ThumbsUp,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { SocialPost, Brand, ContentFormat, PlatformType } from '../types';
import { BadgeTag } from './BadgeTag';

interface DatasetMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  brandName: string;
  recordCount: number;
  platforms: PlatformType[];
  avgEngagementRate: number;
  isCurrentActive: boolean;
}

interface DatasetHubViewProps {
  brand: Brand;
  posts: SocialPost[];
  avgER: number;
  onRefreshData: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export const DatasetHubView: React.FC<DatasetHubViewProps> = ({
  brand,
  posts,
  avgER,
  onRefreshData,
  onNavigateToTab,
}) => {
  // Datasets list
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  // Browser state
  const [browserPosts, setBrowserPosts] = useState<SocialPost[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [isViralFilter, setIsViralFilter] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingBrowser, setIsLoadingBrowser] = useState(false);

  // Filter options
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [browserStats, setBrowserStats] = useState<any | null>(null);

  // Modals & Drawers
  const [inspectingPost, setInspectingPost] = useState<SocialPost | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Upload Form State
  const [uploadName, setUploadName] = useState('My Custom Social Dataset');
  const [uploadFileType, setUploadFileType] = useState<'csv' | 'json'>('csv');
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [uploadContent, setUploadContent] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Edit Post Form State
  const [editTopic, setEditTopic] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHook, setEditHook] = useState('');
  const [editFormat, setEditFormat] = useState<ContentFormat>('short_video');
  const [editPlatform, setEditPlatform] = useState<PlatformType>('LinkedIn');
  const [editLikes, setEditLikes] = useState(0);
  const [editComments, setEditComments] = useState(0);
  const [editShares, setEditShares] = useState(0);
  const [editSaves, setEditSaves] = useState(0);
  const [editReach, setEditReach] = useState(1000);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch list of datasets
  const fetchDatasets = async () => {
    try {
      setIsLoadingDatasets(true);
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (data.success) {
        setDatasets(data.datasets);
      }
    } catch (e) {
      console.error('Error fetching datasets:', e);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  // Fetch browser data
  const fetchBrowserData = async () => {
    try {
      setIsLoadingBrowser(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchQuery,
        platform: platformFilter,
        format: formatFilter,
        topic: topicFilter,
        sortBy,
        sortOrder,
        ...(isViralFilter && { isViral: 'true' }),
      });

      const res = await fetch(`/api/datasets/browse?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBrowserPosts(data.posts);
        setTotalRecords(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setAvailablePlatforms(data.filters.platforms || []);
        setAvailableFormats(data.filters.formats || []);
        setAvailableTopics(data.filters.topics || []);
        setBrowserStats(data.stats);
      }
    } catch (e) {
      console.error('Error browsing dataset:', e);
    } finally {
      setIsLoadingBrowser(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [posts.length]);

  useEffect(() => {
    fetchBrowserData();
  }, [page, pageSize, searchQuery, platformFilter, formatFilter, topicFilter, isViralFilter, sortBy, sortOrder, posts.length]);

  // Load Preset Action
  const handleLoadPreset = async (presetId: string) => {
    try {
      const res = await fetch('/api/datasets/load-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPresetModal(false);
        await onRefreshData();
        await fetchDatasets();
        await fetchBrowserData();
      }
    } catch (e) {
      console.error('Error loading preset:', e);
    }
  };

  // Handle CSV/JSON File Upload input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    if (file.name.endsWith('.json')) {
      setUploadFileType('json');
    } else {
      setUploadFileType('csv');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadContent(text);
    };
    reader.readAsText(file);
  };

  // Submit Upload Dataset
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadContent.trim()) {
      alert('Please provide or upload CSV/JSON dataset content.');
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName,
          content: uploadContent,
          fileType: uploadFileType,
          mode: uploadMode,
          brandName: customBrandName || undefined,
          industry: customIndustry || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadMessage(`✓ ${data.message}`);
        setTimeout(async () => {
          setShowUploadModal(false);
          setUploadContent('');
          setUploadMessage(null);
          await onRefreshData();
          await fetchDatasets();
          await fetchBrowserData();
        }, 1200);
      } else {
        alert(data.error || 'Failed to upload dataset.');
      }
    } catch (e: any) {
      console.error('Error uploading dataset:', e);
      alert(e.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Post
  const handleOpenEdit = (post: SocialPost) => {
    setEditingPost(post);
    setEditTopic(post.topic);
    setEditCaption(post.caption);
    setEditHook(post.hook || '');
    setEditFormat(post.contentFormat);
    setEditPlatform(post.platform);
    setEditLikes(post.metrics.likes);
    setEditComments(post.metrics.comments);
    setEditShares(post.metrics.shares);
    setEditSaves(post.metrics.saves);
    setEditReach(post.metrics.reach);
  };

  // Save Post Edit
  const handleSavePostEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: editTopic,
          caption: editCaption,
          hook: editHook,
          contentFormat: editFormat,
          platform: editPlatform,
          likes: editLikes,
          comments: editComments,
          shares: editShares,
          saves: editSaves,
          reach: editReach,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingPost(null);
        if (inspectingPost && inspectingPost._id === editingPost._id) {
          setInspectingPost(data.post);
        }
        await onRefreshData();
        await fetchBrowserData();
      } else {
        alert(data.error || 'Failed to update post.');
      }
    } catch (e) {
      console.error('Error editing post:', e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post from the dataset?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (inspectingPost?._id === id) setInspectingPost(null);
        await onRefreshData();
        await fetchBrowserData();
      }
    } catch (e) {
      console.error('Error deleting post:', e);
    }
  };

  // Download Dataset File
  const handleDownload = (format: 'csv' | 'json') => {
    window.location.href = `/api/datasets/export?format=${format}`;
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dataset Hub & In-App Browser</h1>
            <BadgeTag type="historical" label="Dataset Explorer" />
            <BadgeTag type="insight" label="Live Memory Ingestion" />
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Upload custom CSV/JSON social media datasets, inspect historical post records, filter by engagement
            multipliers, and switch brand benchmarks directly within the app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Dataset (CSV/JSON)</span>
          </button>

          <button
            onClick={() => setShowPresetModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Switch Preset Benchmark</span>
          </button>

          <div className="flex items-center border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <button
              onClick={() => handleDownload('csv')}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download active dataset as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800" />
            <button
              onClick={() => handleDownload('json')}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download active dataset as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 text-xs block mb-1">Active Posts in Dataset</span>
          <span className="text-2xl font-bold text-white font-mono">{posts.length}</span>
          <span className="text-[11px] text-cyan-400 block mt-1">Grounding Agent Memory</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 text-xs block mb-1">Average Engagement Rate</span>
          <span className="text-2xl font-bold text-indigo-400 font-mono">{avgER.toFixed(2)}%</span>
          <span className="text-[11px] text-slate-400 block mt-1">Across all formats</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 text-xs block mb-1">Total Audience Reach</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {((browserStats?.totalReach || 0) / 1000).toFixed(1)}k
          </span>
          <span className="text-[11px] text-emerald-400/90 block mt-1">Total impressions logged</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 text-xs block mb-1">Viral Posts (&ge;7% ER)</span>
          <span className="text-2xl font-bold text-amber-400 font-mono">
            {browserStats?.viralCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Outperforming baseline</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 text-xs block mb-1">Total Saves / Bookmarks</span>
          <span className="text-2xl font-bold text-purple-400 font-mono">
            {(browserStats?.totalSaves || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-purple-400/90 block mt-1">High retention signal</span>
        </div>
      </div>

      {/* Dataset Presets Row */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Installed Dataset Repositories
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {datasets.length} Available
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Click any repository to activate its audience memory profile
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {datasets.map((ds) => {
            const isActive = ds.isCurrentActive || ds.id === 'active_current';
            return (
              <div
                key={ds.id}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-950/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs truncate max-w-[200px]">
                      {ds.name}
                    </span>
                    {isActive ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
                        {ds.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{ds.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px]">
                  <span className="font-mono text-cyan-300">{ds.recordCount} Posts • {ds.avgEngagementRate}% ER</span>
                  {!isActive && (
                    <button
                      onClick={() => handleLoadPreset(ds.id)}
                      className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      Load & Learn →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dataset Browser */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Interactive Dataset Table</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
                {totalRecords} records matching
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse, search, sort, inspect, and edit individual posts in the active memory bank.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsViralFilter(!isViralFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isViralFilter
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Viral Only (&ge;7%)</span>
            </button>
            <button
              onClick={fetchBrowserData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all cursor-pointer"
              title="Refresh dataset view"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search caption, topic, hook..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Platform Filter */}
          <div>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Platforms</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <select
              value={formatFilter}
              onChange={(e) => {
                setFormatFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Content Formats</option>
              {availableFormats.map((f) => (
                <option key={f} value={f}>
                  {f.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="engagementRate">Engagement Rate (ER)</option>
              <option value="likes">Likes</option>
              <option value="saves">Saves / Bookmarks</option>
              <option value="reach">Audience Reach</option>
              <option value="comments">Comments</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dataset Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Platform & Date</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Hook & Caption Snippet</th>
                <th className="py-3 px-3 text-right">Reach</th>
                <th className="py-3 px-3 text-right">Likes</th>
                <th className="py-3 px-3 text-right">Saves</th>
                <th className="py-3 px-3 text-right">ER %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoadingBrowser ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                      <span>Loading dataset rows...</span>
                    </div>
                  </td>
                </tr>
              ) : browserPosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching post records found in dataset. Try resetting search filters or upload new records.
                  </td>
                </tr>
              ) : (
                browserPosts.map((post) => {
                  const isViral = post.metrics.engagementRate >= 7.0 || post.metrics.isViral;
                  return (
                    <tr
                      key={post._id}
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setInspectingPost(post)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              post.platform === 'LinkedIn'
                                ? 'bg-blue-900/40 text-blue-300'
                                : post.platform === 'Twitter/X'
                                ? 'bg-slate-800 text-slate-200'
                                : post.platform === 'Instagram'
                                ? 'bg-pink-950/40 text-pink-300'
                                : post.platform === 'TikTok'
                                ? 'bg-cyan-950/40 text-cyan-300'
                                : 'bg-red-950/40 text-red-300'
                            }`}
                          >
                            {post.platform}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {post.postedAt.split('T')[0]}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 capitalize font-mono">
                          {post.contentFormat.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                        {post.topic}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-400 group-hover:text-slate-200 transition-colors">
                        {post.hook ? <span className="font-semibold text-white">"{post.hook}" </span> : null}
                        {post.caption}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {post.metrics.reach.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {post.metrics.likes.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-purple-300">
                        {post.metrics.saves.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isViral
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : post.metrics.engagementRate >= avgER
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {post.metrics.engagementRate}%
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setInspectingPost(post)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-all"
                            title="Inspect complete record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(post)}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-all"
                            title="Edit post in dataset"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {browserPosts.length > 0 ? (page - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* POST INSPECTION DRAWER / MODAL */}
      {inspectingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-900/30 text-blue-300 text-xs font-semibold rounded-lg">
                  {inspectingPost.platform}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {inspectingPost._id}
                </span>
                {inspectingPost.metrics.engagementRate >= 7.0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Viral Post
                  </span>
                )}
              </div>
              <button
                onClick={() => setInspectingPost(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono capitalize">
                  {inspectingPost.contentFormat.replace('_', ' ')}
                </span>
                <span className="px-2 py-1 bg-purple-950 text-purple-300 rounded font-mono">
                  {inspectingPost.topic}
                </span>
                <span className="text-slate-400 font-mono">
                  Published: {inspectingPost.postedAt.split('T')[0]} ({inspectingPost.dayOfWeek} at {inspectingPost.timeOfDay})
                </span>
              </div>

              {/* Hook & Caption */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                {inspectingPost.hook && (
                  <div className="text-sm font-bold text-white border-l-2 border-blue-500 pl-3">
                    "{inspectingPost.hook}"
                  </div>
                )}
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {inspectingPost.caption}
                </p>
                {inspectingPost.hashtags && inspectingPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 text-cyan-400 font-mono text-[11px]">
                    {inspectingPost.hashtags.map((h, i) => (
                      <span key={i}>{h.startsWith('#') ? h : `#${h}`}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Likes</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {inspectingPost.metrics.likes.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Comments</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {inspectingPost.metrics.comments.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Shares</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {inspectingPost.metrics.shares.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Saves</span>
                  <span className="font-bold text-purple-300 font-mono text-sm">
                    {inspectingPost.metrics.saves.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Reach</span>
                  <span className="font-bold text-slate-300 font-mono text-sm">
                    {inspectingPost.metrics.reach.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-blue-500/40 text-center">
                  <span className="text-[10px] text-blue-400 block font-semibold">ER %</span>
                  <span className="font-bold text-blue-300 font-mono text-sm">
                    {inspectingPost.metrics.engagementRate}%
                  </span>
                </div>
              </div>

              {/* Qualitative Audience Sentiment */}
              {inspectingPost.audienceReactions && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Audience Sentiment Rating:</span>
                    <span className="font-mono text-emerald-400 font-semibold uppercase">
                      {inspectingPost.audienceReactions.sentiment.replace('_', ' ')}
                    </span>
                  </div>
                  {inspectingPost.audienceReactions.topFeedback &&
                    inspectingPost.audienceReactions.topFeedback.length > 0 && (
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-500 block">Top Community Praise:</span>
                        <ul className="list-disc pl-4 space-y-0.5 mt-1 text-emerald-300">
                          {inspectingPost.audienceReactions.topFeedback.map((f, i) => (
                            <li key={i}>"{f}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleDeletePost(inspectingPost._id)}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(inspectingPost);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POST MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Edit Dataset Post</h3>
              </div>
              <button onClick={() => setEditingPost(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePostEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Platform</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value as PlatformType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Content Format</label>
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as ContentFormat)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="short_video">Short Video</option>
                    <option value="carousel">Educational Carousel</option>
                    <option value="single_image">Single Image</option>
                    <option value="thread">Thread</option>
                    <option value="text_post">Text Post</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Topic</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hook / Title</label>
                <input
                  type="text"
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Caption</label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Likes</label>
                  <input
                    type="number"
                    value={editLikes}
                    onChange={(e) => setEditLikes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Comments</label>
                  <input
                    type="number"
                    value={editComments}
                    onChange={(e) => setEditComments(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Shares</label>
                  <input
                    type="number"
                    value={editShares}
                    onChange={(e) => setEditShares(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Saves</label>
                  <input
                    type="number"
                    value={editSaves}
                    onChange={(e) => setEditSaves(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Reach</label>
                  <input
                    type="number"
                    value={editReach}
                    onChange={(e) => setEditReach(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes & Update Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DATASET MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Upload Your Own Social Media Dataset</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Dataset Name</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    placeholder="e.g. Q3 Growth Campaign"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Import Mode</label>
                  <select
                    value={uploadMode}
                    onChange={(e) => setUploadMode(e.target.value as 'append' | 'replace')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="append">Append to Current Brand Memory</option>
                    <option value="replace">Replace Dataset (New Brand Profile)</option>
                  </select>
                </div>
              </div>

              {uploadMode === 'replace' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={customBrandName}
                      onChange={(e) => setCustomBrandName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                      placeholder="e.g. Acme Tech"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                      placeholder="e.g. SaaS / FinTech"
                    />
                  </div>
                </div>
              )}

              {/* File Upload Selector */}
              <div>
                <label className="text-slate-400 block mb-1">Upload File (.csv or .json)</label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              {/* Or paste content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Or Paste CSV / JSON Content</label>
                  <span className="text-[10px] text-slate-500">
                    Auto-detects Platform, Format, Topic, Caption, Likes, Comments, Shares, Saves, Reach
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder={`Platform,Content_Format,Topic,Caption,Likes,Comments,Shares,Saves,Reach\nInstagram,short_video,AI Tutorials,"How to build agents in 60s",1200,85,140,410,18000\nLinkedIn,carousel,System Design,"Architecture teardown",850,92,210,540,15000`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px] placeholder-slate-600"
                />
              </div>

              {uploadMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadContent.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? 'Ingesting Dataset & Learning...' : 'Confirm & Import Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWITCH PRESET MODAL */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Switch Brand & Dataset Benchmark</h3>
              </div>
              <button onClick={() => setShowPresetModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                onClick={() => handleLoadPreset('preset_synthetix')}
                className="p-4 rounded-xl border border-slate-800 hover:border-blue-500/60 bg-slate-950 cursor-pointer transition-all space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Synthetix AI (DevTools Baseline)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[10px]">
                    24 Posts • 5.21% ER
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Developer-first software orchestration brand. High video & carousel tutorial engagement.
                </p>
              </div>

              <div
                onClick={() => handleLoadPreset('preset_luminary')}
                className="p-4 rounded-xl border border-slate-800 hover:border-purple-500/60 bg-slate-950 cursor-pointer transition-all space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Luminary Apparel (DTC Sustainable Fashion)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-mono text-[10px]">
                    10 Posts • 9.35% ER
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Direct-to-consumer lifestyle brand. High TikTok try-on haul, sizing test, and linen care engagement.
                </p>
              </div>

              <div
                onClick={() => handleLoadPreset('preset_kaggle')}
                className="p-4 rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-slate-950 cursor-pointer transition-all space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Kaggle Post Forecasting Benchmark</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-mono text-[10px]">
                    12 Posts • 6.45% ER
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Official competition evaluation records featuring hook strength, video duration, and follower tiers.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
