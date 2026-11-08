import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-xl font-bold shadow-inner">
            🌾
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Farmer Details Card
              </h1>
              {/* <span className="text-[10px] font-semibold bg-emerald-900/80 text-emerald-200 border border-emerald-600/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Unofficial Tool
              </span> */}
            </div>
            {/* <p className="text-[11px] text-emerald-200/80 hidden sm:block">
              Summary & card formatting tool for farmer details
            </p> */}
          </div>
        </div>
      </div>
    </header>
  );
};
