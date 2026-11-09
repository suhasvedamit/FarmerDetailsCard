import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Printer,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowDown,
} from 'lucide-react';
import { FarmerRecord } from '../types';
import logoImg from '../assets/logo.png';
import {
  downloadCardAsPng,
  downloadCardAsPdf,
  downloadCardPrintSheetPdf,
  generateFrontCardCanvas,
  generateBackCardCanvas,
  generateBothCardsCanvas,
  addWatermarkToCanvas,
} from '../lib/cardGenerator';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmerRecord;
  frontPreviewUrl?: string;
  backPreviewUrl?: string;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  record,
  frontPreviewUrl: initialFrontUrl,
  backPreviewUrl: initialBackUrl,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [frontUrl, setFrontUrl] = useState<string>(initialFrontUrl || '');
  const [backUrl, setBackUrl] = useState<string>(initialBackUrl || '');
  const [bothUrl, setBothUrl] = useState<string>('');
  const [isLoadingPreviews, setIsLoadingPreviews] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [highlightButtons, setHighlightButtons] = useState<boolean>(false);

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyAttempt = (reason: 'right-click' | 'drag' | 'copy' | 'save' | 'click') => {
    let msg = '🔒 इमेज थेट कॉपी करता येणार नाही. अधिकृत कार्डसाठी खालील बटणांचा वापर करा.';
    if (reason === 'right-click') {
      msg = '🔒 राइट-क्लिक कॉपी करणे प्रतिबंधित आहे. कृपया अधिकृत कार्डसाठी खालील डाऊनलोड बटणांचा वापर करा.';
    } else if (reason === 'drag') {
      msg = '🔒 इमेज ड्रॅग करून सेव्ह करता येणार नाही. कृपया खालील डाऊनलोड बटणे वापरा.';
    } else if (reason === 'save' || reason === 'copy') {
      msg = '🔒 कॉपी/सेव्ह शॉर्टकट ब्लॉक आहेत. कृपया खालील डाऊनलोड बटणांचा वापर करा.';
    }

    setCopyNotice(msg);
    setHighlightButtons(true);

    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setCopyNotice(null);
      setHighlightButtons(false);
    }, 3800);
  };

  // Block Ctrl+C / Cmd+C / Ctrl+S / Cmd+S while modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        const activeTag = (document.activeElement?.tagName || '').toUpperCase();
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          e.preventDefault();
          handleCopyAttempt('copy');
        }
      }
      // Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleCopyAttempt('save');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, [isOpen]);

  // Generate missing watermarked previews whenever modal opens or record changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateAll = async () => {
      setIsLoadingPreviews(true);
      try {
        const [fCanvas, bCanvas, bothCanvas] = await Promise.all([
          initialFrontUrl ? Promise.resolve(null) : generateFrontCardCanvas(record),
          initialBackUrl ? Promise.resolve(null) : generateBackCardCanvas(record),
          generateBothCardsCanvas(record),
        ]);

        if (!isMounted) return;

        if (fCanvas) setFrontUrl(addWatermarkToCanvas(fCanvas).toDataURL('image/png'));
        else if (initialFrontUrl) setFrontUrl(initialFrontUrl);

        if (bCanvas) setBackUrl(addWatermarkToCanvas(bCanvas).toDataURL('image/png'));
        else if (initialBackUrl) setBackUrl(initialBackUrl);

        if (bothCanvas) setBothUrl(addWatermarkToCanvas(bothCanvas).toDataURL('image/png'));
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
  }, [isOpen, record, initialFrontUrl, initialBackUrl]);

  if (!isOpen) return null;

  const currentPreview =
    activeSide === 'both' ? bothUrl || frontUrl : activeSide === 'back' ? backUrl : frontUrl;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
      onCopy={(e) => {
        e.preventDefault();
        handleCopyAttempt('copy');
      }}
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        {/* Floating Copy Protection Warning Banner */}
        {copyNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/60 flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-md animate-bounce max-w-[92%] sm:max-w-xl text-center">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 text-left">
              <span>{copyNotice}</span>
              <span className="block text-[11px] text-amber-300 font-normal">
                (Right-click and direct copy are disabled. Please use the download buttons below.)
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shadow-sm">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                माझे किसान कार्ड
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

        {/* View Switcher Tabs (Front, Back, Both) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveSide('front')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'front'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <span>🪪 Front Side (समोरील)</span>
            </button>

            <button
              onClick={() => setActiveSide('back')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'back'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Back Side (मागील)</span>
            </button>

            <button
              onClick={() => setActiveSide('both')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'both'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both Sides (दोन्ही बाजू)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            {activeSide === 'front' && 'Photo, Name, DOB, Gender, PAN, Reg No, Aadhaar, Farmer ID, Address & QR'}
            {activeSide === 'back' && 'जमिनीचा तपशील (Khata, Survey, Area) & बँक तपशील (Bank, A/C, IFSC)'}
            {activeSide === 'both' && 'Complete 2-Sided Printable Overview'}
          </div>
        </div>

        {/* Card Live Preview Container */}
        <div
          className="relative flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl min-h-[300px] border border-slate-200 overflow-hidden select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            handleCopyAttempt('right-click');
          }}
          onDragStart={(e) => {
            e.preventDefault();
            handleCopyAttempt('drag');
          }}
        >
          {isLoadingPreviews ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Generating high-res card design...</span>
            </div>
          ) : currentPreview ? (
            <div className="w-full flex justify-center">
              {/* Preview Wrapper with Security Shield & Overlaid Watermark */}
              <div
                className="relative inline-block max-w-full rounded-xl overflow-hidden shadow-2xl border border-slate-300 select-none group"
                style={{
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
              >
                {/* The Canvas-Watermarked Image */}
                <img
                  src={currentPreview}
                  alt={`Farmer ID Card - ${activeSide} view`}
                  className="max-h-[58vh] max-w-full rounded-xl object-contain pointer-events-none select-none block"
                  draggable={false}
                  style={{
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                />

                {/* Protective Security Shield (blocks right-click, dragging, long-press) */}
                <div
                  className="absolute inset-0 z-10 select-none cursor-default"
                  style={{
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                  title="पूर्वावलोकन सुरक्षित आहे. कार्ड डाऊनलोड करण्यासाठी खालील बटणे वापरा."
                  onClick={() => handleCopyAttempt('click')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCopyAttempt('right-click');
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    handleCopyAttempt('drag');
                  }}
                >
                  {/* Top-Right Protected Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1.5 shadow-lg select-none pointer-events-none">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>वॉटरमार्क नमुना प्रत (Preview Only)</span>
                  </div>

                  {/* DOM-Level Repeating Diagonal Watermark Grid */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 select-none flex items-center justify-center">
                    <div
                      className="w-[170%] h-[170%] flex flex-col justify-around rotate-[-26deg] select-none text-slate-900 text-xs sm:text-sm font-black tracking-widest uppercase pointer-events-none"
                      style={{ textShadow: '0 0 2px rgba(255,255,255,0.9)' }}
                    >
                      <div className="flex justify-around whitespace-nowrap">
                        <span>PREVIEW ONLY • नमुना प्रत • DO NOT COPY</span>
                        <span>PREVIEW ONLY • नमुना प्रत • DO NOT COPY</span>
                      </div>
                      <div className="flex justify-around whitespace-nowrap">
                        <span>USE DOWNLOAD BUTTONS • अधिकृत डाऊनलोड</span>
                        <span>USE DOWNLOAD BUTTONS • अधिकृत डाऊनलोड</span>
                      </div>
                      <div className="flex justify-around whitespace-nowrap">
                        <span>PREVIEW ONLY • नमुना प्रत • DO NOT COPY</span>
                        <span>PREVIEW ONLY • नमुना प्रत • DO NOT COPY</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Security Notice Bar */}
                  <div className="absolute bottom-2 inset-x-3 bg-slate-900/80 backdrop-blur-md text-white border border-white/20 rounded-lg py-1 px-3 text-[11px] flex items-center justify-between shadow-lg pointer-events-none select-none">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-semibold truncate">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">पूर्वावलोकन सुरक्षित आहे • मूळ प्रत डाऊनलोड करण्यासाठी खालील बटणे वापरा</span>
                    </div>
                    <span className="text-[10px] text-slate-300 hidden md:inline ml-2">
                      (Use download buttons below for official card)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              Preview loading...
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar with Dynamic Highlight / Guidance */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 rounded-xl p-2.5 transition-all duration-300 ${highlightButtons
            ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-offset-2 shadow-lg animate-pulse'
            : ''
            }`}
        >
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 hidden sm:block" />
            <div>
              <p className="text-xs font-bold text-slate-800 leading-tight flex items-center justify-center sm:justify-start space-x-1">
                <span>अधिकृत वॉटरमार्क नसलेली प्रत डाउनलोड करा</span>
                {highlightButtons && <ArrowDown className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />}
              </p>
              <p className="text-[11px] text-slate-500">
                Buttons provide 100% clean, unwatermarked high-resolution card
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Single Image Download Button (downloads current active view: Front, Back, or Both) */}
            <button
              onClick={() => downloadCardAsPng(record, activeSide)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title={`Download clean ${activeSide === 'both' ? 'Both sides' : activeSide === 'back' ? 'Back side' : 'Front side'} image as PNG`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-white" />
              <span>
                Download Image
              </span>
            </button>

            {/* Download A4 Print Sheet */}
            <button
              onClick={() => downloadCardPrintSheetPdf(record)}
              className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title="Printable A4 sheet with Front & Back side-by-side ready to cut"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 Print Sheet</span>
            </button>

            {/* Download 2-Page CR80 PDF */}
            <button
              onClick={() => downloadCardAsPdf(record)}
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
