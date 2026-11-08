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
            <h1 className="text-base sm:text-lg font-bold tracking-tight">AgriStack Farmer Registry Extractor</h1>
          </div>
        </div>
      </div>
    </header>
  );
};
