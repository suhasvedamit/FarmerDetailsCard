import React, { useState, useEffect } from 'react';
import { CreditCard, Home, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { Header } from '../Header';
import { DropZone } from '../DropZone';
import { ProgressBar } from '../ProgressBar';
import { PhotoCard } from '../PhotoCard';
import { FarmerForm } from '../FarmerForm';
import { CardModal } from '../CardModal';
import { DisclaimerModal } from '../DisclaimerModal';
import { PhotoEditorModal } from '../PhotoEditorModal';
import { BackgroundSelector } from '../BackgroundSelector';
import { Footer } from '../Footer';
import { AppPage, getPageUrl } from '../../lib/navigation';
import { FarmerRecord } from '../../types';
import {
  CardDraftState,
  createSessionId,
  hasFarmerRecordContent,
} from '../../lib/cardDraftStorage';
import { extractFarmerDataFromPdf } from '../../lib/pdfExtractor';
import {
  generateFrontCardCanvas,
  generateBackCardCanvas,
  combineCardCanvases,
  createWatermarkedPreviewCanvas,
} from '../../lib/cardGenerator';
import { saveExtractedRecord, saveGeneratedRecord } from '../../lib/supabase';
import { useLanguage } from '../../i18n';

interface CreateCardPageProps {
  hasAcceptedDisclaimer: boolean;
  onAcceptDisclaimer: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onNavigate: (page: AppPage) => void;
  draft: CardDraftState;
  onUpdateDraft: (updater: (prev: CardDraftState) => CardDraftState) => void;
  onResetDraft: () => void;
  autoOpenPreview?: boolean;
  onConsumedAutoOpenPreview?: () => void;
}

export const CreateCardPage: React.FC<CreateCardPageProps> = ({
  hasAcceptedDisclaimer,
  onAcceptDisclaimer,
  selectedTemplateId,
  onSelectTemplate,
  onNavigate,
  draft,
  onUpdateDraft,
  onResetDraft,
  autoOpenPreview = false,
  onConsumedAutoOpenPreview,
}) => {
  const { language, t, format } = useLanguage();

  const { data, sessionId, originalExtractedData, dataSource, uploadedFileName } = draft;
  const setData = (updated: FarmerRecord) => {
    onUpdateDraft((prev) => ({ ...prev, data: updated }));
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState('');
  const [backPreviewUrl, setBackPreviewUrl] = useState('');
  const [bothPreviewUrl, setBothPreviewUrl] = useState('');
  const [cleanFrontUrl, setCleanFrontUrl] = useState('');
  const [cleanBackUrl, setCleanBackUrl] = useState('');
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  // Re-open Card Preview modal when returning from PVC Makers page
  useEffect(() => {
    if (autoOpenPreview && hasAcceptedDisclaimer) {
      setCardModalOpen(true);
      onConsumedAutoOpenPreview?.();
    }
  }, [autoOpenPreview, hasAcceptedDisclaimer, onConsumedAutoOpenPreview]);

  // Reset cached card previews whenever user changes the app language
  useEffect(() => {
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
    setCleanFrontUrl('');
    setCleanBackUrl('');
  }, [language]);

  const handleTemplateChange = (templateId: string) => {
    onSelectTemplate(templateId);
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
    setCleanFrontUrl('');
    setCleanBackUrl('');
  };

  // Upload custom PDF file
  const handleFileSelected = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(t.createCard.fileSizeExceeded);
      return;
    }

    setIsProcessing(true);
    setProgressMsg(format(t.createCard.readingFile, { fileName: file.name }));
    setProgressPct(10);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractFarmerDataFromPdf(
        buffer,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        },
        language
      );

      const newSessionId = createSessionId();

      onUpdateDraft(() => ({
        sessionId: newSessionId,
        originalExtractedData: extracted,
        data: extracted,
        dataSource: 'pdf',
        uploadedFileName: file.name,
      }));
      setFrontPreviewUrl('');
      setBackPreviewUrl('');
      setBothPreviewUrl('');
      setCleanFrontUrl('');
      setCleanBackUrl('');

      // Non-blocking background sync (never interrupts user experience if offline/blocked)
      try {
        saveExtractedRecord(extracted, newSessionId, file.name).catch(() => {});
      } catch (logErr) {
        console.warn('[Supabase] Non-fatal background sync error:', logErr);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      alert(format(t.createCard.extractionFailed, { error: err?.message || String(err) }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form back to blank manual entry
  const handleResetForm = () => {
    if (isProcessing) return;
    onResetDraft();
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
    setCleanFrontUrl('');
    setCleanBackUrl('');
  };

  // Generate ID Card (Front & Back)
  const handleGenerateCard = async () => {
    if (isProcessing) return;
    try {
      const renderOptions = { language };
      const [frontCanvas, backCanvas] = await Promise.all([
        generateFrontCardCanvas(data, selectedTemplateId, renderOptions),
        generateBackCardCanvas(data, selectedTemplateId, renderOptions),
      ]);
      const wmFrontCanvas = createWatermarkedPreviewCanvas(frontCanvas);
      const wmBackCanvas = createWatermarkedPreviewCanvas(backCanvas);
      const wmBothCanvas = combineCardCanvases(wmFrontCanvas, wmBackCanvas);
      setCleanFrontUrl(frontCanvas.toDataURL('image/png'));
      setCleanBackUrl(backCanvas.toDataURL('image/png'));
      setFrontPreviewUrl(wmFrontCanvas.toDataURL('image/png'));
      setBackPreviewUrl(wmBackCanvas.toDataURL('image/png'));
      setBothPreviewUrl(wmBothCanvas.toDataURL('image/png'));
      setCardModalOpen(true);

      // Non-blocking background sync (never interrupts user experience if offline/blocked)
      if (sessionId) {
        try {
          saveGeneratedRecord(data, sessionId, originalExtractedData).catch(() => {});
        } catch (logErr) {
          console.warn('[Supabase] Non-fatal background sync error:', logErr);
        }
      }
    } catch (err) {
      console.error('Failed to generate card:', err);
      alert(t.createCard.cardGenFailed);
    }
  };

  const generateButtonLabel =
    dataSource === 'pdf'
      ? t.createCard.btnReviewAndGenerate
      : t.createCard.btnPreviewAndGenerate;
  const canResetForm = hasFarmerRecordContent(data);

  const renderGenerateActionCard = (wrapperClassName = '') => (
    <div
      className={`bg-emerald-50/90 rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-sm ${wrapperClassName}`}
    >
      <div className="bg-white rounded-xl border border-emerald-100 p-2.5">
        <BackgroundSelector
          selectedTemplateId={selectedTemplateId}
          onChange={handleTemplateChange}
          previewRecord={data}
          showQuickCustomButton={true}
          disabled={isProcessing}
        />
      </div>

      <button
        type="button"
        onClick={handleGenerateCard}
        disabled={isProcessing}
        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold rounded-xl shadow-md shadow-emerald-700/15 transition flex items-center justify-center space-x-2 cursor-pointer"
      >
        <CreditCard className="w-5 h-5" />
        <span>{generateButtonLabel}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mandatory Disclaimer Modal before using Card Maker Studio */}
      <DisclaimerModal
        isOpen={!hasAcceptedDisclaimer}
        onAccept={onAcceptDisclaimer}
        onBackHome={() => onNavigate('home')}
      />

      <div
        className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-opacity duration-300 ${
          !hasAcceptedDisclaimer
            ? 'invisible pointer-events-none select-none max-h-screen overflow-hidden'
            : 'opacity-100'
        }`}
        aria-hidden={!hasAcceptedDisclaimer}
      >
        <Header currentPage="create-card" onNavigate={onNavigate} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Workspace Intro Strip & Breadcrumb */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <nav
                className="flex items-center space-x-1.5 text-sm text-slate-500"
                aria-label={t.pageLayout.breadcrumbAria}
              >
                <a
                  href={getPageUrl('home')}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                    e.preventDefault();
                    onNavigate('home');
                  }}
                  className="hover:text-emerald-700 transition flex items-center space-x-1 font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span>{t.common.home}</span>
                </a>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-emerald-800 font-bold">
                  {t.createCard.breadcrumbStudio}
                </span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t.createCard.pageTitle}
              </h1>
            </div>
          </div>

          {/* Upload Zone */}
          <section>
            <DropZone
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
              uploadedFileName={uploadedFileName}
            />
            {isProcessing && <ProgressBar message={progressMsg} percent={progressPct} />}
          </section>

          {/* Divider between PDF auto-extract upload and manual/editable form */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span
              className={`relative px-3.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider whitespace-nowrap ${
                isProcessing
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5'
                  : dataSource === 'pdf'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.createCard.dividerExtracting}</span>
                </>
              ) : dataSource === 'pdf' ? (
                t.createCard.dividerAutoExtracted
              ) : (
                t.createCard.dividerManual
              )}
            </span>
          </div>

          {/* Form & Photo Workspace */}
          <div className="relative animate-fadeIn">
            <fieldset
              disabled={isProcessing}
              aria-busy={isProcessing}
              className="min-w-0 w-full border-0 p-0 m-0"
            >
              <section
                className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-200 ${
                  isProcessing ? 'opacity-60 pointer-events-none select-none' : ''
                }`}
              >
                {/* Left Column: Photo, Template Picker & Actions */}
                <div className="lg:col-span-4 space-y-4">
                  <PhotoCard
                    photoUrl={data.photo_url}
                    rawPhotoUrl={data.raw_photo_url}
                    photoTransform={data.photo_transform}
                    disabled={isProcessing}
                    onOpenEditor={() => {
                      if (!isProcessing) setIsPhotoEditorOpen(true);
                    }}
                    onPhotoUploaded={(rawUrl) => {
                      if (isProcessing) return;
                      setData({
                        ...data,
                        photo_url: rawUrl,
                        raw_photo_url: rawUrl,
                        photo_transform: undefined,
                      });
                      setIsPhotoEditorOpen(true);
                    }}
                    onResetToOriginal={() => {
                      if (isProcessing) return;
                      setData({
                        ...data,
                        photo_url: data.raw_photo_url,
                        photo_transform: undefined,
                      });
                    }}
                  />

                  {/* Desktop Action Card */}
                  {renderGenerateActionCard('hidden lg:block')}
                </div>

                {/* Right Column: Form Fields */}
                <div className="lg:col-span-8 space-y-4">
                  <FarmerForm
                    data={data}
                    onChange={(updated) => {
                      if (!isProcessing) setData(updated);
                    }}
                    disabled={isProcessing}
                    showExtractedBadges={dataSource === 'pdf'}
                    onReset={handleResetForm}
                    canReset={canResetForm}
                  />

                  {/* Mobile Action Card */}
                  {renderGenerateActionCard('lg:hidden')}
                </div>
              </section>
            </fieldset>

            {isProcessing && (
              <div
                className="absolute inset-0 z-20 cursor-not-allowed flex items-start justify-center pt-10 sm:pt-16 px-4"
                aria-live="polite"
              >
                <div className="sticky top-24 bg-white/95 backdrop-blur-sm border border-emerald-200 shadow-lg rounded-2xl px-5 py-3.5 max-w-md w-full text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    <span>{t.createCard.overlayTitle}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {progressMsg || t.createCard.overlayFallbackMsg}{' '}
                    <span className="font-mono font-semibold text-emerald-700">
                      ({progressPct}%)
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Card Generation Modal (Front & Back) */}
        <CardModal
          isOpen={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          record={data}
          frontPreviewUrl={frontPreviewUrl}
          backPreviewUrl={backPreviewUrl}
          bothPreviewUrl={bothPreviewUrl}
          cleanFrontUrl={cleanFrontUrl}
          cleanBackUrl={cleanBackUrl}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleTemplateChange}
          onOrderPvc={() => onNavigate('pvc-makers')}
        />

        {/* Photo Editor & Cropper Modal */}
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          imageUrl={data.photo_url}
          originalImageUrl={data.raw_photo_url || data.photo_url}
          pdfPageImageUrl={data.pdf_page_image_url}
          photoBBox={data.photo_bbox}
          initialTransform={data.photo_transform}
          farmerName={data.farmer_name}
          farmerId={data.farmer_id}
          onSave={(croppedUrl, rawUrl, transform) => {
            setData({
              ...data,
              photo_url: croppedUrl,
              raw_photo_url: rawUrl,
              photo_transform: transform,
            });
          }}
          onResetOriginal={() => {
            setData({
              ...data,
              photo_url: data.raw_photo_url,
              photo_transform: undefined,
            });
          }}
        />

        <Footer onNavigate={onNavigate} openInSameTab={true} />
      </div>
    </>
  );
};
