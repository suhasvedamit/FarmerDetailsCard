import React from 'react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { FarmerRecord } from '../types';
import { downloadCardAsPng, downloadCardAsPdf } from '../lib/cardGenerator';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmerRecord;
  cardPreviewUrl: string;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  record,
  cardPreviewUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🪪</span>
            <h3 className="font-bold text-slate-800 text-base">
              Generated Kisan Pehchan Patra (Farmer ID Card)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex flex-col items-center justify-center py-2">
          {cardPreviewUrl ? (
            <img
              src={cardPreviewUrl}
              alt="Farmer Card Preview"
              className="max-w-full rounded-xl shadow-lg border border-slate-200"
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              Generating Card Preview...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => downloadCardAsPng(record)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
          <button
            onClick={() => downloadCardAsPdf(record)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Download CR80 Print PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
