import React from 'react';
import { MapPin } from 'lucide-react';
import { LandDetail } from '../types';

interface LandCardProps {
  land?: LandDetail;
}

export const LandCard: React.FC<LandCardProps> = ({ land }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center">
          <MapPin className="w-4 h-4 text-emerald-600 mr-2" />
          Land Breakdown (Field 8)
        </h2>
        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
          AgriStack Record
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Total Area:</span>
          <span className="font-semibold text-slate-800">
            {land?.total_area_hectare ? `${land.total_area_hectare} Hectare` : '--'}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Number of Lands:</span>
          <span className="font-semibold text-slate-800">{land?.number_of_lands || '--'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Gat / Survey No:</span>
          <span className="font-semibold text-slate-800">{land?.survey_gat_no || '--'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Village:</span>
          <span className="font-semibold text-slate-800">{land?.village || '--'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Sub-District / Taluka:</span>
          <span className="font-semibold text-slate-800">{land?.sub_district || '--'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">District:</span>
          <span className="font-semibold text-slate-800">{land?.district || '--'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">State:</span>
          <span className="font-semibold text-slate-800">{land?.state || '--'}</span>
        </div>
      </div>
    </div>
  );
};

