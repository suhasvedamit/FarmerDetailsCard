import React from 'react';
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoadSample, isProcessing }) => {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-xl font-bold shadow-inner">
            🌾
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">AgriStack Farmer Registry Extractor</h1>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-600/40">
                100% Client-Side WASM
              </span>
            </div>
            <p className="text-xs text-emerald-200">Farmer ID Card AI-OCR & Photo Cropping Engine (GitHub Pages Ready)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onLoadSample}
            disabled={isProcessing}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold rounded-lg shadow transition flex items-center space-x-1.5 border border-emerald-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Try Sample Form</span>
          </button>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-200 border border-emerald-700">
            <span className="w-2 h-2 mr-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Zero Server Cost
          </span>
        </div>
      </div>
    </header>
  );
};

