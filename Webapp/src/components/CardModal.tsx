import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Printer,
  Layers,
  RefreshCw,
  CreditCard,
  ChevronDown,
  Loader2,
  ShoppingBag,
  Lock,
  ShieldCheck,
  CheckCircle2,
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
  generateFrontCardCanvas,
  generateBackCardCanvas,
  combineCardCanvases,
  createWatermarkedPreviewCanvas,
} from '../lib/cardGenerator';
import { useLanguage, formatMessage } from '../i18n';
import {
  isCardPaid,
  openRazorpayCheckout,
  getCardDownloadPriceInr,
} from '../lib/payment';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmerRecord;
  frontPreviewUrl?: string;
  backPreviewUrl?: string;
  bothPreviewUrl?: string;
  cleanFrontUrl?: string;
  cleanBackUrl?: string;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onOrderPvc?: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  record,
  frontPreviewUrl: initialFrontUrl,
  backPreviewUrl: initialBackUrl,
  bothPreviewUrl: initialBothUrl,
  cleanFrontUrl: initialCleanFrontUrl,
  cleanBackUrl: initialCleanBackUrl,
  selectedTemplateId,
  onSelectTemplate,
  onOrderPvc,
}) => {
  const { language, t } = useLanguage();

  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('both');
  const [frontUrl, setFrontUrl] = useState<string>(initialFrontUrl || '');
  const [backUrl, setBackUrl] = useState<string>(initialBackUrl || '');
  const [bothUrl, setBothUrl] = useState<string>(initialBothUrl || '');
  const [exportFrontUrl, setExportFrontUrl] = useState<string>(initialCleanFrontUrl || '');
  const [exportBackUrl, setExportBackUrl] = useState<string>(initialCleanBackUrl || '');
  const [isLoadingPreviews, setIsLoadingPreviews] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<'download' | 'print' | null>(null);
  const [busyAction, setBusyAction] = useState<'download' | 'print' | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(() => isCardPaid(record));
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);

  const priceInr = getCardDownloadPriceInr();

  useEffect(() => {
    if (isOpen) {
      setIsPaid(isCardPaid(record));
    }
  }, [isOpen, record]);

  useEffect(() => {
    if (!isOpen) {
      setOpenMenu(null);
      setActiveSide('both');
      return;
    }
    if (!openMenu) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDownload = downloadMenuRef.current?.contains(target);
      const inPrint = printMenuRef.current?.contains(target);
      if (!inDownload && !inPrint) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, openMenu]);

  useCardTemplates();
  const activeTemplate = getCardTemplate(selectedTemplateId);

  // Generate missing previews whenever modal opens, record changes, or selected background/language changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialFrontUrl && initialBackUrl && initialBothUrl) {
      setFrontUrl(initialFrontUrl);
      setBackUrl(initialBackUrl);
      setBothUrl(initialBothUrl);
      setExportFrontUrl(initialCleanFrontUrl || '');
      setExportBackUrl(initialCleanBackUrl || '');
      setIsLoadingPreviews(false);
      return;
    }

    let isMounted = true;
    const generateAll = async () => {
      setIsLoadingPreviews(true);
      try {
        const renderOptions = { language };
        const needsFront = !initialFrontUrl || !initialBothUrl;
        const needsBack = !initialBackUrl || !initialBothUrl;

        const [fCanvas, bCanvas] = await Promise.all([
          needsFront ? generateFrontCardCanvas(record, selectedTemplateId, renderOptions) : Promise.resolve(null),
          needsBack ? generateBackCardCanvas(record, selectedTemplateId, renderOptions) : Promise.resolve(null),
        ]);

        const wmFrontCanvas = fCanvas ? createWatermarkedPreviewCanvas(fCanvas) : null;
        const wmBackCanvas = bCanvas ? createWatermarkedPreviewCanvas(bCanvas) : null;
        const wmBothCanvas =
          !initialBothUrl && wmFrontCanvas && wmBackCanvas
            ? combineCardCanvases(wmFrontCanvas, wmBackCanvas)
            : null;

        if (!isMounted) return;

        if (fCanvas && wmFrontCanvas) {
          setExportFrontUrl(fCanvas.toDataURL('image/png'));
          setFrontUrl(initialFrontUrl || wmFrontCanvas.toDataURL('image/png'));
        } else if (initialFrontUrl) {
          setExportFrontUrl(initialCleanFrontUrl || '');
          setFrontUrl(initialFrontUrl);
        }

        if (bCanvas && wmBackCanvas) {
          setExportBackUrl(bCanvas.toDataURL('image/png'));
          setBackUrl(initialBackUrl || wmBackCanvas.toDataURL('image/png'));
        } else if (initialBackUrl) {
          setExportBackUrl(initialCleanBackUrl || '');
          setBackUrl(initialBackUrl);
        }

        if (wmBothCanvas) {
          setBothUrl(wmBothCanvas.toDataURL('image/png'));
        } else if (initialBothUrl) {
          setBothUrl(initialBothUrl);
        }
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
    initialCleanFrontUrl,
    initialCleanBackUrl,
    selectedTemplateId,
    language,
    activeTemplate?.updatedAt,
    activeTemplate?.frontUrl,
    activeTemplate?.backUrl,
  ]);

  if (!isOpen) return null;

  const currentPreview =
    activeSide === 'both' ? bothUrl || frontUrl : activeSide === 'back' ? backUrl : frontUrl;

  const byActiveSide = <T,>(front: T, back: T, both: T): T =>
    ({ front, back, both })[activeSide];

  const preRenderedCards =
    !isLoadingPreviews && (exportFrontUrl || exportBackUrl)
      ? {
        frontDataUrl: exportFrontUrl || undefined,
        backDataUrl: exportBackUrl || undefined,
      }
      : undefined;

  const sideExportOptions = {
    language,
    sides: activeSide,
    preRendered: preRenderedCards,
  };

  const isBusy = busyAction !== null;

  const handlePayToUnlock = (pendingAction?: () => Promise<void> | void) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    openRazorpayCheckout({
      record,
      amountInr: priceInr,
      onSuccess: () => {
        setIsPaid(true);
        setIsProcessingPayment(false);
        setPaymentSuccessToast(
          formatMessage(t.cardModal.paymentSuccessToast, {
            name: record.farmer_name || 'Farmer',
          })
        );
        setTimeout(() => setPaymentSuccessToast(null), 7000);
        if (pendingAction) {
          void pendingAction();
        }
      },
      onFailure: (err) => {
        setIsProcessingPayment(false);
        console.warn('[Payment] Checkout not completed:', err);
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
      },
    });
  };

  const runExportAction = async (
    kind: 'download' | 'print',
    action: () => Promise<void>,
    onErrorMsg?: string
  ) => {
    if (isBusy || isLoadingPreviews || isProcessingPayment) return;
    setOpenMenu(null);
    setBusyAction(kind);
    try {
      await action();
    } catch (err) {
      console.error('Export action failed:', err);
      if (onErrorMsg) alert(onErrorMsg);
    } finally {
      setBusyAction(null);
    }
  };

  const downloadMenuItems = [
    {
      key: 'image',
      label: byActiveSide(
        t.cardModal.downloadImageFront,
        t.cardModal.downloadImageBack,
        t.cardModal.downloadImageBoth
      ),
      sub: t.cardModal.downloadImageSub,
      hoverClass: 'hover:bg-emerald-50 hover:text-emerald-800',
      icon: !isPaid ? (
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      ) : (
        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ),
      onClick: () => {
        const action = () =>
          downloadCardAsPng(record, activeSide, undefined, selectedTemplateId, { language });
        if (!isPaid) {
          handlePayToUnlock(() => runExportAction('download', action));
        } else {
          runExportAction('download', action);
        }
      },
    },
    {
      key: 'pdf',
      label: byActiveSide(
        t.cardModal.downloadPdfFront,
        t.cardModal.downloadPdfBack,
        t.cardModal.downloadPdfBoth
      ),
      sub: t.cardModal.downloadPdfSub,
      hoverClass: 'hover:bg-teal-50 hover:text-teal-800',
      icon: !isPaid ? (
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      ) : (
        <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
      ),
      onClick: () => {
        const action = () =>
          downloadCardAsPdf(record, undefined, selectedTemplateId, sideExportOptions);
        if (!isPaid) {
          handlePayToUnlock(() => runExportAction('download', action));
        } else {
          runExportAction('download', action);
        }
      },
    },
  ];

  const printMenuItems = [
    {
      key: 'pvc',
      label: byActiveSide(
        t.cardModal.pvcPrintFront,
        t.cardModal.pvcPrintBack,
        t.cardModal.pvcPrintBoth
      ),
      sub: t.cardModal.pvcPrintSub,
      hoverClass: 'hover:bg-indigo-50 hover:text-indigo-800',
      icon: !isPaid ? (
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      ) : (
        <CreditCard className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
      ),
      onClick: () => {
        const action = () => printCardForPvc(record, selectedTemplateId, sideExportOptions);
        if (!isPaid) {
          handlePayToUnlock(() => runExportAction('print', action, t.cardModal.pvcPrintFailed));
        } else {
          runExportAction('print', action, t.cardModal.pvcPrintFailed);
        }
      },
    },
    {
      key: 'a4',
      label: byActiveSide(
        t.cardModal.a4PrintFront,
        t.cardModal.a4PrintBack,
        t.cardModal.a4PrintBoth
      ),
      sub: t.cardModal.a4PrintSub,
      hoverClass: 'hover:bg-sky-50 hover:text-sky-800',
      icon: !isPaid ? (
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      ) : (
        <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
      ),
      onClick: () => {
        const action = () =>
          downloadCardPrintSheetPdf(record, undefined, selectedTemplateId, sideExportOptions);
        if (!isPaid) {
          handlePayToUnlock(() => runExportAction('print', action));
        } else {
          runExportAction('print', action);
        }
      },
    },
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
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="relative flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl min-h-[300px] border border-slate-200 overflow-hidden select-none"
        >
          {currentPreview ? (
            <>
              <div className="w-full flex justify-center relative">
                <img
                  src={currentPreview}
                  alt={`${t.cardModal.title} - ${activeSide}`}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                  className={`max-h-[60vh] max-w-full rounded-xl shadow-xl border border-slate-300 object-contain select-none transition-opacity duration-150 ${isLoadingPreviews ? 'opacity-50' : 'opacity-100'
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
              <p className="mt-2.5 text-[11px] text-slate-500 text-center">
                {t.cardModal.previewWatermarkNote}
              </p>
            </>
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

        {paymentSuccessToast && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{paymentSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Complete Payment Lock Bar (Shown on complete bar when unpaid) */}
        {!isPaid && (
          <div className="w-full bg-gradient-to-r from-amber-50 via-amber-100/60 to-emerald-50 border-2 border-amber-400 rounded-2xl p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center space-x-3 text-slate-800 w-full sm:w-auto min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>{t.cardModal.downloadLockedHeader}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-900/80 truncate sm:whitespace-normal">
                  {formatMessage(t.cardModal.downloadLockedSub, { amount: priceInr })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePayToUnlock()}
              disabled={isProcessingPayment}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer transition"
            >
              {isProcessingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 text-emerald-200" />
              )}
              <span>{formatMessage(t.cardModal.payToUnlockBtn, { amount: priceInr })}</span>
            </button>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-500 text-center lg:text-left">
            {t.cardModal.personalUseNote}
          </p>

          <div className="relative flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center sm:justify-end">
            {/* Unified Download Dropdown Button + Options Menu (Image + PDF) */}
            <div ref={downloadMenuRef} className="sm:relative inline-flex">
              <button
                type="button"
                onClick={() => {
                  if (!isPaid) {
                    handlePayToUnlock();
                    return;
                  }
                  setOpenMenu((prev) => (prev === 'download' ? null : 'download'));
                }}
                disabled={isBusy || isLoadingPreviews || isProcessingPayment}
                title={!isPaid ? t.cardModal.downloadLockedTitle : t.cardModal.downloadTitle}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'download'}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                {busyAction === 'download' || isProcessingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !isPaid ? (
                  <Lock className="w-4 h-4 text-amber-300" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-100" />
                )}
                <span>{t.cardModal.downloadBtn}</span>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-100 transition-transform duration-150 ${openMenu === 'download' ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {openMenu === 'download' && (
                <div
                  role="menu"
                  aria-label={t.cardModal.downloadOptionsAria}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mb-2 w-full max-w-sm sm:w-96 sm:max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left"
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.cardModal.downloadMenuSection}
                  </div>

                  {downloadMenuItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      onClick={item.onClick}
                      className={`w-full px-3.5 py-2.5 text-left text-slate-700 ${item.hoverClass} flex items-start space-x-2.5 transition cursor-pointer`}
                    >
                      {item.icon}
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold leading-tight flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {!isPaid && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{t.cardModal.lockedTag}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Print Dropdown Button + Options Menu (PVC + A4) */}
            <div ref={printMenuRef} className="sm:relative inline-flex">
              <button
                type="button"
                onClick={() => {
                  if (!isPaid) {
                    handlePayToUnlock();
                    return;
                  }
                  setOpenMenu((prev) => (prev === 'print' ? null : 'print'));
                }}
                disabled={isBusy || isLoadingPreviews || isProcessingPayment}
                title={!isPaid ? t.cardModal.printLockedHeader : t.cardModal.printTitle}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'print'}
                className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                {busyAction === 'print' || isProcessingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !isPaid ? (
                  <Lock className="w-4 h-4 text-amber-300" />
                ) : (
                  <Printer className="w-4 h-4 text-indigo-100" />
                )}
                <span>{t.cardModal.printBtn}</span>
                <ChevronDown
                  className={`w-4 h-4 text-indigo-100 transition-transform duration-150 ${openMenu === 'print' ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {openMenu === 'print' && (
                <div
                  role="menu"
                  aria-label={t.cardModal.printOptionsAria}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mb-2 w-full max-w-sm sm:w-96 sm:max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 pt-1.5 z-30 text-left"
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.cardModal.printMenuSection}
                  </div>

                  {printMenuItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      onClick={item.onClick}
                      className={`w-full px-3.5 py-2.5 text-left text-slate-700 ${item.hoverClass} flex items-start space-x-2.5 transition cursor-pointer`}
                    >
                      {item.icon}
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold leading-tight flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {!isPaid && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{t.cardModal.lockedTag}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  ))}

                  <div className="mt-1.5 px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-snug rounded-b-xl space-y-1">
                    <div>{t.cardModal.pvcPrintHint}</div>
                    {onOrderPvc && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null);
                          onClose();
                          onOrderPvc();
                        }}
                        className="text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 text-left cursor-pointer block"
                      >
                        {t.cardModal.orderPvcHint}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {onOrderPvc && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  onClose();
                  onOrderPvc();
                }}
                disabled={isBusy}
                title={t.cardModal.orderPvcTitle}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-100" />
                <span>{t.cardModal.orderPvcBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
