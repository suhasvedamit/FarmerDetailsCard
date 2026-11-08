import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { FarmerRecord } from '../types';
import { downloadCardAsPng, downloadCardAsPdf, shareCardPdfViaWhatsApp } from '../lib/cardGenerator';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmerRecord;
  cardPreviewUrl: string;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  record,
  cardPreviewUrl,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShareWhatsApp = async () => {
    try {
      setIsSharing(true);
      setShareNotice(null);
      const result = await shareCardPdfViaWhatsApp(record);
      if (!result.sharedDirectly) {
        setShareNotice('PDF downloaded! WhatsApp opened in a new tab — attach the downloaded PDF to your chat.');
        setTimeout(() => setShareNotice(null), 8000);
      }
    } catch (err) {
      console.error('Failed to share via WhatsApp:', err);
      alert('Failed to share on WhatsApp');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🪪</span>
            <h3 className="font-bold text-slate-800 text-base">
              Generated Farmer Details Card
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
              alt="Farmer Details Card Preview"
              className="max-w-full rounded-xl shadow-lg border border-slate-200"
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              Generating Card Preview...
            </div>
          )}
        </div>

        {/* Share Notice Banner */}
        {shareNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow-sm animate-fadeIn">
            <span>{shareNotice}</span>
            <button
              onClick={() => setShareNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 ml-2 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            This card is for personal reference & informational use.
          </p>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>{isSharing ? 'Preparing...' : 'Share on WhatsApp'}</span>
            </button>
            <button
              onClick={() => downloadCardAsPng(record)}
              className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={() => downloadCardAsPdf(record)}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
            >
              <FileText className="w-4 h-4 text-red-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

