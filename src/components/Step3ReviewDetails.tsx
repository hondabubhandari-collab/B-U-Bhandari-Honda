import React from 'react';
import { ReviewFormData } from '../types';
import {
  User,
  Users,
  Sparkles,
  MessageSquare,
  ChevronLeft,
  ArrowRight,
  Check,
} from 'lucide-react';

interface Step3ReviewDetailsProps {
  formData: ReviewFormData;
  onChange: (updates: Partial<ReviewFormData>) => void;
  onGenerateReview: () => void;
  onBack: () => void;
}

export const Step3ReviewDetails: React.FC<Step3ReviewDetailsProps> = ({
  formData,
  onChange,
  onGenerateReview,
  onBack,
}) => {
  const isService = formData.experienceType === 'Vehicle Service';
  const isDelivery = formData.experienceType === 'Vehicle Delivery';

  // Highlight suggestions based on experience type
  const highlightSuggestions = isService
    ? [
        'On-time delivery',
        'Thorough vehicle inspection',
        'Great washing & cleaning',
        'Smooth engine performance',
        'Accurate billing & estimate',
        'Polite service advisor',
        'Transparent advice',
        'Comfortable customer lounge',
      ]
    : isDelivery
    ? [
        'Memorable delivery ceremony',
        'Spotless vehicle condition',
        'Punctual key handover',
        'Detailed feature walkthrough',
        'Quick documentation',
        'Warm welcome from staff',
        'Special family photo moment',
        'Clear warranty explanation',
      ]
    : [
        'Polite & helpful staff',
        'Smooth test drive',
        'Transparent pricing',
        'Hassle-free finance & booking',
        'Clear vehicle features explanation',
        'Fast response to queries',
        'Pleasant showroom atmosphere',
        'Quick paperwork completion',
      ];

  // Team quick suggestions
  const teamSuggestions = isService
    ? ['Workshop Team', 'Service Advisors Team', 'Customer Care Team']
    : isDelivery
    ? ['Delivery & Handover Team', 'Customer Relationship Team', 'Showroom Team']
    : ['Sales Team', 'Customer Relationship Team', 'Showroom Team'];

  const toggleAspect = (aspect: string) => {
    const current = formData.selectedAspects || [];
    if (current.includes(aspect)) {
      onChange({ selectedAspects: current.filter((a) => a !== aspect) });
    } else {
      onChange({ selectedAspects: [...current, aspect] });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Review Details (Optional)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Select highlights or mention staff members from B.U. Bhandari Honda.
        </p>
      </div>

      <div className="space-y-4">
        {/* Customer Experience / Highlights */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>What did you like about the experience?</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">Select highlights</span>
          </label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {highlightSuggestions.map((item) => {
              const isSelected = formData.selectedAspects.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAspect(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sales Employee Name & Team Name */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-600" />
                <span>Sales / Service Employee Name</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Optional</span>
            </label>
            <input
              id="input-employee-name"
              type="text"
              value={formData.employeeName || ''}
              onChange={(e) => onChange({ employeeName: e.target.value })}
              placeholder={isService ? 'e.g. Rahul Patil (Service Advisor)' : 'e.g. Amit Sharma (Sales Advisor)'}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-600" />
                <span>Team Name</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Optional</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {teamSuggestions.map((team) => {
                const isSelected = formData.teamName === team;
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => onChange({ teamName: isSelected ? '' : team })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {team}
                  </button>
                );
              })}
            </div>
            <input
              id="input-team-name"
              type="text"
              value={formData.teamName || ''}
              onChange={(e) => onChange({ teamName: e.target.value })}
              placeholder="Or type custom team name..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Additional Comments (Optional) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-600" />
              <span>Any Additional Remarks?</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">Optional</span>
          </label>
          <textarea
            id="input-additional-comments"
            rows={2}
            value={formData.additionalComments || ''}
            onChange={(e) => onChange({ additionalComments: e.target.value })}
            placeholder="Any specific note or personal remark to add into your review..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center gap-3">
        <button
          id="btn-back-step3"
          type="button"
          onClick={onBack}
          className="w-1/3 py-3.5 px-4 rounded-xl font-semibold text-sm border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          id="btn-generate-review"
          type="button"
          onClick={onGenerateReview}
          className="w-2/3 py-3.5 px-6 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Generate Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
