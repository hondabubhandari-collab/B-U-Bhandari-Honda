import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Dealership Branding */}
        <div className="flex items-center space-x-3">
          {/* Honda Red Accent Badge */}
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs font-black tracking-tight text-lg select-none">
            H
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              B.U. Bhandari Honda
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Customer Review Assistant
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

