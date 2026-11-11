import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Printer,
  Layers,
  RefreshCw,
  CreditCard,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { FarmerRecord } from '../types';
import logoImg from '../assets/logo.png';
import { BackgroundSelector } from './BackgroundSelector';
import { getCardTemplate, useCardTemplates } from '../lib/cardTemplates';
import {
  downloadCardAsPng,
  downloadCardAsPdf,
  downloadCardPrintSheetPdf,
  printCardForPvc,
  PvcPrintSides,
  generateFrontCardCanvas,
  generateBackCardCanvas,
  generateBothCardsCanvas,
  combineCardCanvases,
} from '../lib/cardGenerator';
import { useLanguage } from '../i18n';

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
  const { language, t } = useLanguage();

  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [frontUrl, setFrontUrl] = useState<string>(initialFrontUrl || '');
  const [backUrl, setBackUrl] = useState<string>(initialBackUrl || '');
  const [bothUrl, setBothUrl] = useState<string>(initialBothUrl || '');
  const [isLoadingPreviews, setIsLoadingPreviews] = useState<boolean>(false);
  const [pvcMenuOpen, setPvcMenuOpen] = useState<boolean>(false);
  const [isPvcBusy, setIsPvcBusy] = useState<boolean>(false);
  const pvcMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPvcMenuOpen(false);
      return;
    }
    if (!pvcMenuOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (pvcMenuRef.current && !pvcMenuRef.current.contains(event.target as Node)) {
        setPvcMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPvcMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, pvcMenuOpen]);

  useCardTemplates();
  const activeTemplate = getCardTemplate(selectedTemplateId);

  // Generate missing previews whenever modal opens, record changes, or selected background/language changes
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
        const renderOptions = { language };
        const [fCanvas, bCanvas] = await Promise.all([
          initialFrontUrl
            ? Promise.resolve(null)
            : generateFrontCardCanvas(record, selectedTemplateId, renderOptions),
          initialBackUrl
            ? Promise.resolve(null)
            : generateBackCardCanvas(record, selectedTemplateId, renderOptions),
        ]);

        const bothCanvas = initialBothUrl
          ? null
          : fCanvas && bCanvas
            ? combineCardCanvases(fCanvas, bCanvas)
            : await generateBothCardsCanvas(record, selectedTemplateId, renderOptions);

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
  }, [
    isOpen,
    record,
    initialFrontUrl,
    initialBackUrl,
    initialBothUrl,
    selectedTemplateId,
    language,
    activeTemplate?.updatedAt,
    activeTemplate?.frontUrl,
    activeTemplate?.backUrl,
  ]);

  if (!isOpen) return null;

  const currentPreview =
    activeSide === 'both' ? bothUrl || frontUrl : activeSide === 'back' ? backUrl : frontUrl;

  const downloadImageTitle =
    activeSide === 'both'
      ? t.cardModal.downloadImageTitleBoth
      : activeSide === 'back'
        ? t.cardModal.downloadImageTitleBack
        : t.cardModal.downloadImageTitleFront;

  const buildCr80Options = (sides: PvcPrintSides) => ({
    language,
    sides,
    preRendered: !isLoadingPreviews
      ? {
          frontDataUrl: frontUrl || undefined,
          backDataUrl: backUrl || undefined,
        }
      : undefined,
  });

  const handlePvcPrint = async (sides: PvcPrintSides = 'both') => {
    if (isPvcBusy || isLoadingPreviews) return;
    setPvcMenuOpen(false);
    setIsPvcBusy(true);
    try {
      await printCardForPvc(record, selectedTemplateId, buildCr80Options(sides));
    } catch (err) {
      console.error('PVC print failed:', err);
      alert(t.cardModal.pvcPrintFailed);
    } finally {
      setIsPvcBusy(false);
    }
  };

  const handlePvcSavePdf = async (sides: PvcPrintSides = 'both') => {
    if (isPvcBusy || isLoadingPreviews) return;
    setPvcMenuOpen(false);
    setIsPvcBusy(true);
    try {
      await downloadCardAsPdf(record, undefined, selectedTemplateId, buildCr80Options(sides));
    } catch (err) {
      console.error('PVC PDF download failed:', err);
    } finally {
      setIsPvcBusy(false);
    }
  };

  const pvcPrintActions: Array<{ sides: PvcPrintSides; label: string }> = [
    { sides: 'both', label: t.cardModal.pvcPrintBoth },
    { sides: 'front', label: t.cardModal.pvcPrintFront },
    { sides: 'back', label: t.cardModal.pvcPrintBack },
  ];

  const pvcPdfActions: Array<{ sides: PvcPrintSides; label: string }> = [
    { sides: 'both', label: t.cardModal.pvcSavePdfBoth },
    { sides: 'front', label: t.cardModal.pvcSavePdfFront },
    { sides: 'back', label: t.cardModal.pvcSavePdfBack },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-1">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-lg sm:text-xl leading-tight truncate">
                {t.cardModal.title}
              </h3>
              <p className="text-sm text-slate-500 truncate">
                {t.cardModal.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs & Background Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5 w-full md:w-auto">
            <button
              onClick={() => setActiveSide('front')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'front'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <span>🪪 {t.common.frontSide}</span>
            </button>

            <button
              onClick={() => setActiveSide('back')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'back'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.common.backSide}</span>
            </button>

            <button
              onClick={() => setActiveSide('both')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center space-x-1.5 ${activeSide === 'both'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.common.bothSides}</span>
            </button>
          </div>

          <div className="w-full md:w-80">
            <BackgroundSelector
              selectedTemplateId={selectedTemplateId}
              onChange={onSelectTemplate}
              previewRecord={record}
            />
          </div>
        </div>

        {/* Card Live Preview Container */}
        <div className="relative flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl min-h-[300px] border border-slate-200 overflow-hidden">
          {currentPreview ? (
            <div className="w-full flex justify-center relative">
              <img
                src={currentPreview}
                alt={`${t.cardModal.title} - ${activeSide}`}
                className={`max-h-[60vh] max-w-full rounded-xl shadow-xl border border-slate-300 object-contain transition-opacity duration-150 ${
                  isLoadingPreviews ? 'opacity-50' : 'opacity-100'
                }`}
              />
              {isLoadingPreviews && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-md border border-slate-200 flex items-center space-x-2 text-slate-700">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-semibold">{t.cardModal.updatingPreview}</span>
                  </div>
                </div>
              )}
            </div>
          ) : isLoadingPreviews ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">{t.cardModal.generatingPreview}</span>
            </div>
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-sm text-slate-400">
              {t.cardModal.previewLoading}
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-500 text-center lg:text-left">
            {t.cardModal.personalUseNote}
          </p>

          <div className="relative flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center sm:justify-end">
            {/* Single Image Download Button */}
            <button
              onClick={() =>
                downloadCardAsPng(record, activeSide, undefined, selectedTemplateId, {
                  language,
                })
              }
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title={downloadImageTitle}
            >
              <ImageIcon className="w-4 h-4 text-white" />
              <span>{t.cardModal.downloadImageBtn}</span>
            </button>

            {/* Download A4 Print Sheet */}
            <button
              onClick={() =>
                downloadCardPrintSheetPdf(record, undefined, selectedTemplateId, {
                  language,
                })
              }
              className="px-4 py-2.5 bg-sky-700 hover:bg-sky-600 active:scale-95 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title={t.cardModal.a4PrintSheetTitle}
            >
              <Printer className="w-4 h-4" />
              <span>{t.cardModal.a4PrintSheetBtn}</span>
            </button>

            {/* Download 2-Page CR80 PDF */}
            <button
              onClick={() =>
                downloadCardAsPdf(record, undefined, selectedTemplateId, buildCr80Options('both'))
              }
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
              title={t.cardModal.downloadPdfTitle}
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>{t.cardModal.downloadPdfBtn}</span>
            </button>

            {/* Direct CR80 PVC Print Split Button + Options Menu */}
            <div ref={pvcMenuRef} className="sm:relative inline-flex rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => handlePvcPrint('both')}
                disabled={isPvcBusy || isLoadingPreviews}
                title={t.cardModal.pvcPrintTitle}
                className="px-3.5 py-2.5 bg-indigo-700 hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-l-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                {isPvcBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 text-indigo-100" />
                )}
                <span>{t.cardModal.pvcPrintBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setPvcMenuOpen((prev) => !prev)}
                disabled={isPvcBusy || isLoadingPreviews}
                aria-label={t.cardModal.pvcOptionsAria}
                aria-haspopup="menu"
                aria-expanded={pvcMenuOpen}
                className="px-2 py-2.5 bg-indigo-800 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-100 hover:text-white rounded-r-lg border-l border-indigo-500/40 transition flex items-center justify-center cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${
                    pvcMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {pvcMenuOpen && (
                <div
                  role="menu"
                  aria-label={t.cardModal.pvcOptionsAria}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mb-2 w-full max-w-sm sm:w-96 sm:max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 pt-1.5 z-30 text-left"
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.cardModal.pvcMenuPrintSection}
                  </div>
                  {pvcPrintActions.map((item) => (
                    <button
                      key={`print-${item.sides}`}
                      type="button"
                      role="menuitem"
                      onClick={() => handlePvcPrint(item.sides)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="sm:whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}

                  <div className="my-1.5 border-t border-slate-100" />

                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.cardModal.pvcMenuPdfSection}
                  </div>
                  {pvcPdfActions.map((item) => (
                    <button
                      key={`pdf-${item.sides}`}
                      type="button"
                      role="menuitem"
                      onClick={() => handlePvcSavePdf(item.sides)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="sm:whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}

                  <div className="mt-1.5 px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-snug rounded-b-xl">
                    {t.cardModal.pvcPrintHint}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
