import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Brain,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database,
  CheckCircle2,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';
import { ConversationMessage, Brand } from '../types';
import { BadgeTag } from './BadgeTag';

interface ChatAgentViewProps {
  brand: Brand;
  messages: ConversationMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  onClearChat: () => Promise<void>;
  isSending: boolean;
}

export const ChatAgentView: React.FC<ChatAgentViewProps> = ({
  brand,
  messages,
  onSendMessage,
  onClearChat,
  isSending,
}) => {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    'What should I post tomorrow?',
    'Which topic performed best this month?',
    'What type of content does my audience prefer?',
    'Why did my last promotional post perform poorly?',
    'When should I post to reach peak developer engagement?',
    'Give me 3 ideas based on my previous successful posts.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const text = input;
    setInput('');
    await onSendMessage(text);
  };

  const handlePresetClick = async (q: string) => {
    if (isSending) return;
    await onSendMessage(q);
  };

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {brand.name} Engagement Agent
              </h2>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded-full border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Memory Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded strictly in brand historical metrics, audience feedback, and past recommendations.
            </p>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Clear chat history"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Preset Questions Bar */}
      <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 px-2">
          Ask:
        </span>
        {presetQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetClick(q)}
            disabled={isSending}
            className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-3 py-1 rounded-full border border-slate-700 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Brain className="w-12 h-12 text-slate-700" />
            <div className="max-w-md">
              <h3 className="text-base font-bold text-slate-200">
                Ask {brand.name}'s Social Media Agent
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Click any prompt above or ask a custom question. The agent will retrieve relevant historical posts from memory, compare engagement rates, and formulate advice.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSourcesExpanded = expandedSources[msg.id];
            const hasSources =
              (msg.retrievedPostIds && msg.retrievedPostIds.length > 0) ||
              (msg.historicalProofQuotes && msg.historicalProofQuotes.length > 0);

            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 text-slate-200 rounded-tl-xs border border-slate-800 shadow-md font-sans'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Retrieved Memory Sources Drawer (for Assistant messages) */}
                  {!isUser && hasSources && (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2 max-w-full">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-medium text-purple-300">
                          <Brain className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Retrieved Memory Context</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-sm text-slate-400">
                            {msg.retrievedPostIds?.length || 0} posts
                          </span>
                        </span>
                        {isSourcesExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isSourcesExpanded && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          {msg.historicalProofQuotes && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Verified Proof Derived:
                              </span>
                              <ul className="list-disc list-inside text-slate-300 space-y-0.5 font-mono text-[11px]">
                                {msg.historicalProofQuotes.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.retrievedPostIds && msg.retrievedPostIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">
                                Queried Posts:
                              </span>
                              {msg.retrievedPostIds.map((id) => (
                                <span
                                  key={id}
                                  className="px-2 py-0.5 rounded-sm bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-400"
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono px-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${brand.name}'s audience patterns or future post strategy...`}
          disabled={isSending}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
        >
          {isSending ? (
            <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
          ) : (
            <Send className="w-4 h-4 text-cyan-300" />
          )}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
