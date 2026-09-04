import React, { useState, useRef } from 'react';
import { ReviewFormData } from '../types';
import {
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Edit3,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface Step4ReviewResultProps {
  formData: ReviewFormData;
  reviewText: string;
  sheetSyncStatus: 'synced' | 'failed' | 'pending' | 'idle';
  sheetSyncMessage?: string;
  onRetrySheetSync?: () => void;
  onUpdateReview: (text: string) => void;
  onRegenerateVariation: () => void;
  onEdit: () => void;
  onRestart: () => void;
  onLogAiStatus: (status: 'Success' | 'Timeout / Fallback' | 'Failed', improvedReview?: string) => void;
  onLogGoogleReviewOpened?: () => void;
}

export const Step4ReviewResult: React.FC<Step4ReviewResultProps> = ({
  formData,
  reviewText,
  sheetSyncStatus,
  sheetSyncMessage,
  onRetrySheetSync,
  onUpdateReview,
  onRegenerateVariation,
  onEdit,
  onRestart,
  onLogAiStatus,
  onLogGoogleReviewOpened,
}) => {
  const [copied, setCopied] = useState(false);
  const [isImprovingAi, setIsImprovingAi] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [isAiSuccess, setIsAiSuccess] = useState(false);
  const [openedGoogleReview, setOpenedGoogleReview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Exact Google Review destination for B.U. Bhandari Honda – Camp Showroom
  const GOOGLE_REVIEW_URL = 'https://g.page/r/Celyo2_hpzj6EBM/review';

  // Copy exact displayed review text to clipboard without modifying or regenerating
  const handleCopyReview = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reviewText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = reviewText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Focus textarea when "Edit Text" is clicked
  const handleEditReviewFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  };

  // Open Google Review: copy review to clipboard, track open status, and open review URL in a new tab
  const handlePostGoogleReview = () => {
    // Copy review text first
    handleCopyReview();
    setOpenedGoogleReview(true);

    if (onLogGoogleReviewOpened) {
      onLogGoogleReviewOpened();
    }

    // Open exact Google Review URL
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
  };

  const handleImproveWithAi = async () => {
    if (isImprovingAi) return;

    setIsImprovingAi(true);
    setAiStatusMessage(null);
    setIsAiSuccess(false);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 5000);

    try {
      const response = await fetch('/api/improve-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceType: formData.experienceType,
          rating: formData.rating,
          employeeName: formData.employeeName,
          teamName: formData.teamName,
          selectedAspects: formData.selectedAspects,
          additionalComments: formData.additionalComments,
          currentReview: reviewText,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.review) {
        onUpdateReview(data.review);
        if (data.isFallback) {
          setAiStatusMessage('Your review is ready.');
          onLogAiStatus('Timeout / Fallback', data.review);
        } else {
          setIsAiSuccess(true);
          setAiStatusMessage('✨ Review refined with AI!');
          onLogAiStatus('Success', data.review);
        }
      } else {
        setAiStatusMessage('Your review is ready.');
        onLogAiStatus('Timeout / Fallback', reviewText);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('AI enhancement fallback triggered:', err);
      setAiStatusMessage('Your review is ready.');
      onLogAiStatus(err.name === 'AbortError' ? 'Timeout / Fallback' : 'Failed', reviewText);
    } finally {
      setIsImprovingAi(false);
    }
  };

  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0;
  const ratingStars = formData.rating?.startsWith('5')
    ? 5
    : formData.rating?.startsWith('4')
    ? 4
    : formData.rating?.startsWith('3')
    ? 3
    : formData.rating?.startsWith('2')
    ? 2
    : 1;

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      {/* Ready Banner & Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your Review is Ready</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase">
          CUSTOMER REVIEW
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          B.U. Bhandari Honda – Camp Showroom • {formData.experienceType}
        </p>
      </div>

      {/* Review Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 relative transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 text-xs">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < ratingStars
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            ))}
            <span className="text-slate-700 ml-1 font-medium">{formData.rating}</span>
          </div>

          <span className="text-slate-400">{wordCount} words</span>
        </div>

        {/* Editable Review Textarea / Output */}
        <textarea
          ref={textareaRef}
          id="review-output-text"
          rows={5}
          value={reviewText}
          onChange={(e) => onUpdateReview(e.target.value)}
          className="w-full text-slate-800 text-sm sm:text-base leading-relaxed bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:bg-white resize-y font-normal"
          placeholder="Your review text will appear here..."
        />

        {/* AI Status Notification */}
        {aiStatusMessage && (
          <div
            className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              isAiSuccess
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isAiSuccess ? (
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <Check className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{aiStatusMessage}</span>
          </div>
        )}

        {/* Action Controls for Edit / Variations */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            id="btn-variation"
            onClick={onRegenerateVariation}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Generate another phrasing variation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Another Variation</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-edit-text"
              onClick={handleEditReviewFocus}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Click to edit text directly"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Text</span>
            </button>

            <button
              type="button"
              id="btn-edit-details"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Go back to edit review details"
            >
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1 & 2 Action Buttons */}
      <div className="mt-5 space-y-3">
        {/* Step 1: Copy Review Button */}
        <button
          id="btn-copy-review"
          type="button"
          onClick={handleCopyReview}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer border ${
            copied
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>1. Review Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-600" />
              <span>1. Copy Generated Review</span>
            </>
          )}
        </button>

        {/* Step 2: Post Google Review Button */}
        <button
          id="btn-post-google-review"
          type="button"
          onClick={handlePostGoogleReview}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
        >
          <span>2. Post Google Review</span>
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Optional AI Polish Button */}
        <button
          id="btn-improve-with-ai"
          type="button"
          disabled={isImprovingAi}
          onClick={handleImproveWithAi}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isImprovingAi ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>Improving with AI (max 5s)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>✨ Improve with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Google Sheet Sync Status Indicator */}
      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Google Sheet Tracking:</span>
            {sheetSyncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Review activity saved.</span>
              </span>
            )}
            {sheetSyncStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving review activity to Sheet...</span>
              </span>
            )}
            {sheetSyncStatus === 'failed' && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Sync Pending: {sheetSyncMessage || 'API retry queued'}</span>
              </span>
            )}
            {sheetSyncStatus === 'idle' && (
              <span className="text-slate-500">Ready</span>
            )}
          </div>

          {sheetSyncStatus === 'failed' && onRetrySheetSync && (
            <button
              type="button"
              onClick={onRetrySheetSync}
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>

        {openedGoogleReview && (
          <p className="mt-1.5 text-[11px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded-md border border-emerald-100">
            ✓ Google Review page opened in a new tab. Please paste your copied review and select your stars on Google to complete submission.
          </p>
        )}
      </div>

      {/* Clear Instructions */}
      <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
        <p className="font-bold text-amber-900 flex items-center gap-1.5">
          <span>How to submit your review on Google:</span>
        </p>
        <ol className="list-decimal list-inside space-y-1 text-amber-900/90 pl-0.5">
          <li>Click <strong>1. Copy Generated Review</strong> above.</li>
          <li>Click <strong>2. Post Google Review</strong> to open the official Google Review page for B.U. Bhandari Honda.</li>
          <li>Paste your copied text into the Google review box, select your star rating, and click <strong>Post</strong>.</li>
        </ol>
      </div>

      {/* Start Over Button */}
      <div className="mt-5 text-center">
        <button
          id="btn-start-over"
          type="button"
          onClick={onRestart}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-3 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Start New Review
        </button>
      </div>
    </div>
  );
};
