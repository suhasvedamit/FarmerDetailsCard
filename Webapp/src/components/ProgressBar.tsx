import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  message: string;
  percent: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ message, percent }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm sm:text-base font-semibold text-emerald-800 flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-600" />
          {message}
        </span>
        <span className="text-sm font-mono font-medium text-slate-500">{percent}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

