/**
 * Main Application Component for Social Media Engagement Agent
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RecommenderView } from './components/RecommenderView';
import { ContentGeneratorView } from './components/ContentGeneratorView';
import { PostAnalyzerView } from './components/PostAnalyzerView';
import { AudienceMemoryView } from './components/AudienceMemoryView';
import { ChatAgentView } from './components/ChatAgentView';
import { FeedbackLoopView } from './components/FeedbackLoopView';
import { FeedbackLoopModal } from './components/FeedbackLoopModal';
import { MemorySearchRAGView } from './components/MemorySearchRAGView';
import { ForecastingKaggleView } from './components/ForecastingKaggleView';
import { EngagementHubView } from './components/EngagementHubView';
import { DatasetHubView } from './components/DatasetHubView';
import { DashboardData, SocialPost, AudienceMemoryInsight, Recommendation, ConversationMessage } from './types';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [memories, setMemories] = useState<AudienceMemoryInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Cross-view state transfers
  const [activeFeedbackRec, setActiveFeedbackRec] = useState<Recommendation | null>(null);
  const [generatorPrefill, setGeneratorPrefill] = useState<{ topic: string; format: string } | null>(null);
  const [analyzerPrefill, setAnalyzerPrefill] = useState<any>(null);

  // Loading states
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isGeneratingRec, setIsGeneratingRec] = useState(false);
  const [isConsolidatingMemory, setIsConsolidatingMemory] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all core datasets
  const loadAllData = async () => {
    try {
      const [dashRes, postsRes, memRes, recRes, chatRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/posts').then((r) => r.json()),
        fetch('/api/memory').then((r) => r.json()),
        fetch('/api/recommendations').then((r) => r.json()),
        fetch('/api/chat/history').then((r) => r.json()),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (postsRes.success) setPosts(postsRes.posts);
      if (memRes.success) setMemories(memRes.memories);
      if (recRes.success) setRecommendations(recRes.recommendations);
      if (chatRes.success && chatRes.conversations && chatRes.conversations.length > 0) {
        const lastConv = chatRes.conversations[chatRes.conversations.length - 1];
        setActiveConversationId(lastConv._id);
        setChatMessages(lastConv.messages || []);
      }
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Action: Reset to 24 clean realistic posts
  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        showToast('✓ Successfully reset database to default 24-post realistic demo data.');
      }
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsResettingDemo(false);
    }
  };

  // Action: Generate new recommendation
  const handleGenerateRecommendation = async (customGoal?: string) => {
    setIsGeneratingRec(true);
    try {
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customGoal }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ New personalized recommendation generated backed by historical data.');
        await loadAllData();
      } else {
        alert(data.error || 'Failed to generate recommendation');
      }
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    } finally {
      setIsGeneratingRec(false);
    }
  };

  // Action: Submit feedback loop
  const handleSubmitFeedback = async (recId: string, feedbackData: any) => {
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/recommendations/${recId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Actual metrics recorded & audience memory bank refined!');
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Action: Consolidate Memory
  const handleConsolidateMemory = async () => {
    setIsConsolidatingMemory(true);
    try {
      const res = await fetch('/api/memory/consolidate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
        showToast('✓ Memory rules re-evaluated across all historical posts.');
      }
    } catch (err) {
      console.error('Failed to consolidate memory:', err);
    } finally {
      setIsConsolidatingMemory(false);
    }
  };

  // Action: Send chat message
  const handleSendChatMessage = async (msg: string) => {
    setIsSendingChat(true);
    // Optimistic user message
    const tempUserMsg: ConversationMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationId: activeConversationId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveConversationId(data.conversationId);
        setChatMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Action: Clear chat
  const handleClearChat = async () => {
    try {
      await fetch('/api/chat/clear', { method: 'POST' });
      setChatMessages([]);
      setActiveConversationId(null);
      showToast('✓ Chat history cleared.');
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // Action: Delete post
  const handlePostDeleted = async (id: string) => {
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      showToast('✓ Post removed from memory.');
      await loadAllData();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-white tracking-tight">Social Media Engagement Agent</h2>
          <p className="text-xs text-slate-400 mt-1">Loading brand memory bank and empirical benchmarks...</p>
        </div>
      </div>
    );
  }

  const brand = dashboardData?.brand || {
    _id: 'brand_synthetix_001',
    userId: 'user_001',
    name: 'Synthetix AI',
    handle: '@synthetix_ai',
    industry: 'Developer Tools & AI',
    targetAudience: 'Software engineers & AI builders',
    primaryPlatforms: ['LinkedIn', 'Twitter/X', 'Instagram'],
    toneOfVoice: 'Technical & practitioner-focused',
    brandDescription: 'Developer-first LLM orchestration framework',
    createdAt: '',
    updatedAt: '',
  };

  const totalPosts = dashboardData?.stats?.totalPosts || posts.length;
  const avgER = dashboardData?.stats?.avgEngagementRate || 5.21;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        brand={brand}
        totalPosts={totalPosts}
        avgER={avgER}
        onResetDemo={handleResetDemo}
        isResetting={isResettingDemo}
      />

      {/* Main Container View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && dashboardData && (
          <DashboardView data={dashboardData} onNavigateToTab={setActiveTab} />
        )}

        {activeTab === 'datasets' && (
          <DatasetHubView
            brand={brand}
            posts={posts}
            avgER={avgER}
            onRefreshData={loadAllData}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'engagement_hub' && (
          <EngagementHubView
            brand={brand}
            posts={posts}
            avgER={avgER}
            onRefreshData={loadAllData}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'recommender' && (
          <div className="space-y-10">
            <RecommenderView
              brand={brand}
              recommendations={recommendations}
              posts={posts}
              onGenerateRecommendation={handleGenerateRecommendation}
              onOpenFeedbackModal={(rec) => setActiveFeedbackRec(rec)}
              onOpenContentGeneratorWithTopic={(t, f) => {
                setGeneratorPrefill({ topic: t, format: f });
                setActiveTab('generator');
              }}
              isGenerating={isGeneratingRec}
            />

            {/* In-tab Content Generator */}
            <div className="pt-8 border-t border-slate-800">
              <ContentGeneratorView
                brand={brand}
                initialTopic={generatorPrefill?.topic || 'Building Self-Healing Agent Loops'}
                initialFormat={generatorPrefill?.format || 'short_video'}
                onSendToAnalyzer={(postData) => {
                  setAnalyzerPrefill(postData);
                  setActiveTab('analyzer');
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <ContentGeneratorView
            brand={brand}
            initialTopic={generatorPrefill?.topic || 'Building Self-Healing Agent Loops'}
            initialFormat={generatorPrefill?.format || 'short_video'}
            onSendToAnalyzer={(postData) => {
              setAnalyzerPrefill(postData);
              setActiveTab('analyzer');
            }}
          />
        )}

        {activeTab === 'analyzer' && (
          <PostAnalyzerView
            brand={brand}
            posts={posts}
            avgER={avgER}
            initialPostData={analyzerPrefill}
            onPostAdded={loadAllData}
            onPostDeleted={handlePostDeleted}
          />
        )}

        {activeTab === 'memory' && (
          <AudienceMemoryView
            brand={brand}
            memories={memories}
            posts={posts}
            onConsolidateMemory={handleConsolidateMemory}
            isConsolidating={isConsolidatingMemory}
          />
        )}

        {activeTab === 'chat' && (
          <ChatAgentView
            brand={brand}
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            onClearChat={handleClearChat}
            isSending={isSendingChat}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackLoopView
            brand={brand}
            recommendations={recommendations}
            posts={posts}
            avgER={avgER}
            onOpenFeedbackModal={(rec) => setActiveFeedbackRec(rec)}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'forecasting' && (
          <ForecastingKaggleView
            brand={brand}
            posts={posts}
            avgER={avgER}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'search' && <MemorySearchRAGView brand={brand} />}
      </main>

      {/* Feedback Loop Modal */}
      {activeFeedbackRec && (
        <FeedbackLoopModal
          recommendation={activeFeedbackRec}
          onClose={() => setActiveFeedbackRec(null)}
          onSubmitFeedback={handleSubmitFeedback}
          isSubmitting={isSubmittingFeedback}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Social Media Engagement Agent • Continuous Brand Learning System</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by Persistent Memory & Gemini 3.8 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
