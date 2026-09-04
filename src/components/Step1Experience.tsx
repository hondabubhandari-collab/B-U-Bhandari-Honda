import React from 'react';
import { ExperienceType } from '../types';
import { Motorbike, Wrench, Award, ChevronRight } from 'lucide-react';

interface Step1ExperienceProps {
  selectedExperience: ExperienceType | null;
  onSelect: (type: ExperienceType) => void;
  onNext: () => void;
}

export const Step1Experience: React.FC<Step1ExperienceProps> = ({
  selectedExperience,
  onSelect,
  onNext,
}) => {
  const options: {
    type: ExperienceType;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    id: string;
  }[] = [
    {
      type: 'New Vehicle Purchase',
      subtitle: 'Buying a new Honda car or Honda 2-wheeler',
      icon: Motorbike,
      id: 'opt-new-vehicle',
    },
    {
      type: 'Vehicle Service',
      subtitle: 'Honda vehicle service and maintenance experience',
      icon: Wrench,
      id: 'opt-vehicle-service',
    },
    {
      type: 'Vehicle Delivery',
      subtitle: 'Honda vehicle delivery experience',
      icon: Award,
      id: 'opt-vehicle-delivery',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What was your visit regarding?
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Select your experience type at B.U. Bhandari Honda.
        </p>
      </div>

      <div className="space-y-3.5">
        {options.map((opt) => {
          const isSelected = selectedExperience === opt.type;
          const Icon = opt.icon;

          return (
            <button
              key={opt.type}
              id={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt.type);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                isSelected
                  ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-red-50 group-hover:text-red-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-base font-semibold ${
                        isSelected ? 'text-red-950' : 'text-slate-900'
                      }`}
                    >
                      {opt.type}
                    </h3>
                    {opt.type === 'New Vehicle Purchase' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100/75 border border-red-200 px-2 py-0.5 rounded-full">
                        <Motorbike className="w-3.5 h-3.5" />
                        2-Wheeler / Car
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    {opt.subtitle}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                  isSelected
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <button
          id="btn-continue-step1"
          type="button"
          disabled={!selectedExperience}
          onClick={onNext}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            selectedExperience
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
