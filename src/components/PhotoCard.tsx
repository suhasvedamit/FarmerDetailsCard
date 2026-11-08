import React from 'react';
import { UserCheck, Image as ImageIcon } from 'lucide-react';

interface PhotoCardProps {
  photoUrl?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photoUrl }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center">
          <UserCheck className="w-4 h-4 text-emerald-600 mr-2" />
          Extracted Photo (Field 10)
        </h2>
        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
          Auto-Cropped
        </span>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-40 h-48 bg-slate-100 rounded-lg overflow-hidden border-2 border-emerald-600/30 shadow-inner flex items-center justify-center relative">
          {photoUrl ? (
            <img src={photoUrl} alt="Farmer Portrait" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span>No Photo</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 text-center">
          Cropped dynamically from the registration form photograph box
        </p>
      </div>
    </div>
  );
};

