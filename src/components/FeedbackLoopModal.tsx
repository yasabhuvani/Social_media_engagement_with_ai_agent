import React, { useState } from 'react';
import { Recommendation } from '../types';
import { RotateCcw, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { BadgeTag } from './BadgeTag';

interface FeedbackLoopModalProps {
  recommendation: Recommendation;
  onClose: () => void;
  onSubmitFeedback: (recId: string, feedbackData: any) => Promise<void>;
  isSubmitting: boolean;
}

export const FeedbackLoopModal: React.FC<FeedbackLoopModalProps> = ({
  recommendation,
  onClose,
  onSubmitFeedback,
  isSubmitting,
}) => {
  const [likes, setLikes] = useState<number>(880);
  const [comments, setComments] = useState<number>(105);
  const [shares, setShares] = useState<number>(180);
  const [saves, setSaves] = useState<number>(340);
  const [reach, setReach] = useState<number>(22000);
  const [caption, setCaption] = useState(recommendation.suggestedCaption || '');
  const [userNotes, setUserNotes] = useState(
    'Published as recommended. The code sample in the video drove a spike in saves and developer comments.'
  );

  const totalInteractions = (Number(likes) || 0) + (Number(comments) || 0) + (Number(shares) || 0) + (Number(saves) || 0);
  const safeReach = Math.max(1, Number(reach) || 1);
  const liveER = Number(((totalInteractions / safeReach) * 100).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitFeedback(recommendation._id, {
      likes: Number(likes),
      comments: Number(comments),
      shares: Number(shares),
      saves: Number(saves),
      reach: safeReach,
      caption,
      userNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BadgeTag type="feedback" />
            <h3 className="text-base font-bold text-white">Record Performance & Update Memory</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Recommended Post Target:
            </span>
            <div className="font-semibold text-white">
              {recommendation.recommendedTopic} ({recommendation.recommendedFormat}) on{' '}
              {recommendation.recommendedPlatform}
            </div>
            <div className="text-slate-400 mt-0.5">
              Scheduled window: {recommendation.recommendedPostingDay} @ {recommendation.recommendedPostingTime} UTC
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Actual Published Caption</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              required
            />
          </div>

          {/* Actual metrics */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Actual Engagement Recorded
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block">Likes</label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Comments</label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Shares</label>
                <input
                  type="number"
                  min={0}
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Saves</label>
                <input
                  type="number"
                  min={0}
                  value={saves}
                  onChange={(e) => setSaves(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Reach</label>
                <input
                  type="number"
                  min={1}
                  value={reach}
                  onChange={(e) => setReach(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Calculated ER Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Resulting Actual Engagement Rate:</span>
            <span className="text-base font-extrabold text-cyan-400 font-mono">{liveER}% ER</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Post Mortem / Qualitative Notes</label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="What worked or failed? (e.g., Code sample drove saves, hook worked well)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Updating Memory...' : 'Submit & Refine Agent Memory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
