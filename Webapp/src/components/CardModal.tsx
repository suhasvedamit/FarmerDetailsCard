import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Printer,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { FarmerRecord } from '../types';
import logoImg from '../assets/logo.png';
import { BackgroundSelector } from './BackgroundSelector';
import {
  downloadCardAsPng,
  downloadCardAsPdf,
  downloadCardPrintSheetPdf,
  generateFrontCardCanvas,
  generateBackCardCanvas,
  generateBothCardsCanvas,
  combineCardCanvases,
} from '../lib/cardGenerator';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmerRecord;
  frontPreviewUrl?: string;
  backPreviewUrl?: string;
  bothPreviewUrl?: string;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  record,
  frontPreviewUrl: initialFrontUrl,
  backPreviewUrl: initialBackUrl,
  bothPreviewUrl: initialBothUrl,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [frontUrl, setFrontUrl] = useState<string>(initialFrontUrl || '');
  const [backUrl, setBackUrl] = useState<string>(initialBackUrl || '');
  const [bothUrl, setBothUrl] = useState<string>(initialBothUrl || '');
  const [isLoadingPreviews, setIsLoadingPreviews] = useState<boolean>(false);

  // Generate missing previews whenever modal opens, record changes, or selected background changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialFrontUrl && initialBackUrl && initialBothUrl) {
      setFrontUrl(initialFrontUrl);
      setBackUrl(initialBackUrl);
      setBothUrl(initialBothUrl);
      setIsLoadingPreviews(false);
      return;
    }

    let isMounted = true;
    const generateAll = async () => {
      setIsLoadingPreviews(true);
      try {
        const [fCanvas, bCanvas] = await Promise.all([
          initialFrontUrl
            ? Promise.resolve(null)
            : generateFrontCardCanvas(record, selectedTemplateId),
          initialBackUrl
            ? Promise.resolve(null)
            : generateBackCardCanvas(record, selectedTemplateId),
        ]);

        const bothCanvas = initialBothUrl
          ? null
          : fCanvas && bCanvas
            ? combineCardCanvases(fCanvas, bCanvas)
            : await generateBothCardsCanvas(record, selectedTemplateId);

        if (!isMounted) return;

        if (fCanvas) setFrontUrl(fCanvas.toDataURL('image/png'));
        else if (initialFrontUrl) setFrontUrl(initialFrontUrl);

        if (bCanvas) setBackUrl(bCanvas.toDataURL('image/png'));
        else if (initialBackUrl) setBackUrl(initialBackUrl);

        if (bothCanvas) setBothUrl(bothCanvas.toDataURL('image/png'));
        else if (initialBothUrl) setBothUrl(initialBothUrl);
      } catch (err) {
        console.error('Failed to generate card previews:', err);
      } finally {
        if (isMounted) setIsLoadingPreviews(false);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, record, initialFrontUrl, initialBackUrl, initialBothUrl, selectedTemplateId]);

  if (!isOpen) return null;

  const currentPreview =
    activeSide === 'both' ? bothUrl || frontUrl : activeSide === 'back' ? backUrl : frontUrl;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shadow-sm">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Farmer Details Card
              </h3>
              <p className="text-xs text-slate-500">
                Front & Back Side Printable ID Card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs & Background Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5 w-full md:w-auto">
            <button
              onClick={() => setActiveSide('front')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'front'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <span>🪪 Front Side (समोरील)</span>
            </button>

            <button
              onClick={() => setActiveSide('back')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'back'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Back Side (मागील)</span>
            </button>

            <button
              onClick={() => setActiveSide('both')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'both'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both Sides (दोन्ही बाजू)</span>
            </button>
          </div>

          <div className="w-full md:w-72">
            <BackgroundSelector
              selectedTemplateId={selectedTemplateId}
              onChange={onSelectTemplate}
            />
          </div>
        </div>

        {/* Card Live Preview Container */}
        <div className="relative flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl min-h-[300px] border border-slate-200 overflow-hidden">
          {currentPreview ? (
            <div className="w-full flex justify-center relative">
              <img
                src={currentPreview}
                alt={`Farmer ID Card - ${activeSide} view`}
                className={`max-h-[60vh] max-w-full rounded-xl shadow-xl border border-slate-300 object-contain transition-opacity duration-150 ${
                  isLoadingPreviews ? 'opacity-50' : 'opacity-100'
                }`}
              />
              {isLoadingPreviews && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-lg shadow-md border border-slate-200 flex items-center space-x-2 text-slate-700">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Updating card preview...</span>
                  </div>
                </div>
              )}
            </div>
          ) : isLoadingPreviews ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Generating high-res card design...</span>
            </div>
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              Preview loading...
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            This card is strictly for personal reference & informational reference.
          </p>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Single Image Download Button (downloads current active view: Front, Back, or Both) */}
            <button
              onClick={() => downloadCardAsPng(record, activeSide, undefined, selectedTemplateId)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title={`Download ${activeSide === 'both' ? 'Both sides' : activeSide === 'back' ? 'Back side' : 'Front side'} image as PNG`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-white" />
              <span>
                Download Image
              </span>
            </button>

            {/* Download A4 Print Sheet */}
            <button
              onClick={() => downloadCardPrintSheetPdf(record, undefined, selectedTemplateId)}
              className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title="Printable A4 sheet with Front & Back side-by-side ready to cut"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 Print Sheet</span>
            </button>

            {/* Download 2-Page CR80 PDF */}
            <button
              onClick={() => downloadCardAsPdf(record, undefined, selectedTemplateId)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title="Standard CR80 2-page duplex PDF (Page 1 Front, Page 2 Back)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
