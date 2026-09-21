import React, { useState } from 'react';
import { X, Plus, Calendar, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ReviewStatus } from '../types';
import { addManualReview, formatDateTime } from '../utils/adminReviewStore';

interface AddManualReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewAdded: () => void;
}

export const AddManualReviewModal: React.FC<AddManualReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewAdded,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reviewText, setReviewText] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('Pending');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setError('Please enter the review text.');
      return;
    }

    const formattedDate = date ? `${date} ${new Date().toTimeString().slice(0, 5)}` : formatDateTime();

    addManualReview(reviewText.trim(), status, formattedDate, notes);
    setReviewText('');
    setNotes('');
    setError('');
    onReviewAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Manual / Other Review</h3>
              <p className="text-xs text-slate-500">Track reviews submitted outside this app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source indicator (Read-only as per specification) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Source
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Manual / Other</span>
              <span className="text-[10px] font-normal text-slate-400 ml-auto">(Non-AI tracking)</span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              placeholder="Paste or enter the customer review text here..."
              className="w-full text-xs text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Posted')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'Posted'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Posted</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Spam / Removed')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'Spam / Removed'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Spam/Removed</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Pending')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'Pending'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Note: "Spam / Removed" status is manually recorded and does not query Google.
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Admin Notes</span>
              <span className="text-[11px] font-normal text-slate-400">Optional</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Google review screenshot, showroom register, SMS"
              className="w-full text-xs text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Tracked Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
