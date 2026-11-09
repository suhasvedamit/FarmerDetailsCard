import React from 'react';
import logoImg from '../assets/logo.png';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  onLoadDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoadDemo }) => {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center p-1 shadow-sm border border-emerald-600/30 bg-emerald-900/40">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Farmer Details Card
              </h1>
            </div>
            <p className="text-[11px] text-emerald-200/80 hidden md:block">
              Summary & card formatting tool for farmer details
            </p>
          </div>
        </div>

        {/* Right: Only Try Demo Button */}
        {onLoadDemo && (
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs font-bold shadow-sm shadow-amber-950/20 transition flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
            title="Load instant demo farmer record"
            aria-label="Try Demo"
          >
            <Sparkles className="w-4 h-4 text-amber-900 fill-amber-500" />
            <span>Try Demo</span>
          </button>
        )}
      </div>
    </header>
  );
};
