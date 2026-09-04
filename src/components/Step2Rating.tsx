import React from 'react';
import { RatingType } from '../types';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';

interface Step2RatingProps {
  selectedRating: RatingType | null;
  onSelect: (rating: RatingType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Rating: React.FC<Step2RatingProps> = ({
  selectedRating,
  onSelect,
  onNext,
  onBack,
}) => {
  const ratingOptions: {
    rating: RatingType;
    stars: number;
    title: string;
    description: string;
    id: string;
  }[] = [
    {
      rating: '5 Stars (Excellent)',
      stars: 5,
      title: '5 Stars — Excellent',
      description: 'Outstanding service and complete satisfaction',
      id: 'rating-5-stars',
    },
    {
      rating: '4 Stars (Very Good)',
      stars: 4,
      title: '4 Stars — Very Good',
      description: 'Great experience with pleasant and polite handling',
      id: 'rating-4-stars',
    },
    {
      rating: '3 Stars (Good)',
      stars: 3,
      title: '3 Stars — Good',
      description: 'Met overall expectations adequately',
      id: 'rating-3-stars',
    },
    {
      rating: '2 Stars (Average)',
      stars: 2,
      title: '2 Stars — Average',
      description: 'Acceptable but has areas for enhancement',
      id: 'rating-2-stars',
    },
    {
      rating: '1 Star (Needs Improvement)',
      stars: 1,
      title: '1 Star — Needs Improvement',
      description: 'Did not meet expectations; constructive feedback',
      id: 'rating-1-star',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          How would you rate your experience?
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Select a star rating from 1 to 5 stars.
        </p>
      </div>

      <div className="space-y-3">
        {ratingOptions.map((opt) => {
          const isSelected = selectedRating === opt.rating;

          return (
            <button
              key={opt.rating}
              id={opt.id}
              type="button"
              onClick={() => onSelect(opt.rating)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                isSelected
                  ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="pt-0.5 sm:pt-0">
                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < opt.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3
                    className={`text-sm sm:text-base font-semibold ${
                      isSelected ? 'text-red-950' : 'text-slate-900'
                    }`}
                  >
                    {opt.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                  isSelected
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          id="btn-back-step2"
          type="button"
          onClick={onBack}
          className="w-1/3 py-3.5 px-4 rounded-xl font-semibold text-sm border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          id="btn-continue-step2"
          type="button"
          disabled={!selectedRating}
          onClick={onNext}
          className={`w-2/3 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            selectedRating
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
