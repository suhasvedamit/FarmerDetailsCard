import React, { useState } from 'react';
import { CreditCard, Home, ChevronRight, Lock, Loader2, Sparkles } from 'lucide-react';
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
import { FarmerRecord, createEmptyFarmerRecord } from '../../types';
import { extractFarmerDataFromPdf } from '../../lib/pdfExtractor';
import {
  generateFrontCardCanvas,
  generateBackCardCanvas,
  combineCardCanvases,
} from '../../lib/cardGenerator';
import { saveExtractedRecord, saveGeneratedRecord } from '../../lib/supabase';

function createSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function hasFarmerRecordContent(record: FarmerRecord): boolean {
  if (
    record.farmer_id ||
    record.enrollment_no ||
    record.farmer_name ||
    record.identifier_name ||
    record.dob ||
    record.age ||
    record.gender ||
    record.caste_category ||
    record.mobile_number ||
    record.aadhaar_number ||
    record.pan_card ||
    record.address ||
    record.photo_url ||
    record.raw_photo_url
  ) {
    return true;
  }

  if (
    record.bank_detail?.bank_name_branch ||
    record.bank_detail?.bank_name ||
    record.bank_detail?.account_no ||
    record.bank_detail?.ifsc_code
  ) {
    return true;
  }

  if (record.land_records && record.land_records.length > 1) {
    return true;
  }

  if (
    record.land_records?.some(
      (row) => row.survey_no || row.village || row.owner_type || row.area
    )
  ) {
    return true;
  }

  return Boolean(
    record.land_detail?.khata_no ||
    record.land_detail?.total_area_hectare ||
    record.land_detail?.survey_gat_no ||
    record.land_detail?.village ||
    record.land_detail?.sub_district ||
    record.land_detail?.district ||
    record.land_detail?.state ||
    record.land_detail?.summary
  );
}

interface CreateCardPageProps {
  hasAcceptedDisclaimer: boolean;
  onAcceptDisclaimer: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onNavigate: (page: AppPage) => void;
}

export const CreateCardPage: React.FC<CreateCardPageProps> = ({
  hasAcceptedDisclaimer,
  onAcceptDisclaimer,
  selectedTemplateId,
  onSelectTemplate,
  onNavigate,
}) => {
  const [data, setData] = useState<FarmerRecord>(() => createEmptyFarmerRecord());
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [originalExtractedData, setOriginalExtractedData] = useState<FarmerRecord | null>(null);
  const [dataSource, setDataSource] = useState<'manual' | 'pdf'>('manual');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState('');
  const [backPreviewUrl, setBackPreviewUrl] = useState('');
  const [bothPreviewUrl, setBothPreviewUrl] = useState('');
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    onSelectTemplate(templateId);
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
  };

  // Upload custom PDF file
  const handleFileSelected = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5 MB limit. Please upload a PDF under 5 MB.');
      return;
    }

    setIsProcessing(true);
    setProgressMsg(`Reading ${file.name}...`);
    setProgressPct(10);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractFarmerDataFromPdf(buffer, (msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });

      const newSessionId = createSessionId();

      setSessionId(newSessionId);
      setOriginalExtractedData(extracted);
      setData(extracted);
      setDataSource('pdf');
      setUploadedFileName(file.name);
      setFrontPreviewUrl('');
      setBackPreviewUrl('');
      setBothPreviewUrl('');

      // Non-blocking background sync (never interrupts user experience if offline/blocked)
      try {
        saveExtractedRecord(extracted, newSessionId, file.name).catch(() => { });
      } catch (logErr) {
        console.warn('[Supabase] Non-fatal background sync error:', logErr);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      alert(`Extraction failed: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form back to blank manual entry
  const handleResetForm = () => {
    if (isProcessing) return;
    setSessionId(createSessionId());
    setOriginalExtractedData(null);
    setData(createEmptyFarmerRecord());
    setDataSource('manual');
    setUploadedFileName('');
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
  };

  // Generate ID Card (Front & Back)
  const handleGenerateCard = async () => {
    if (isProcessing) return;
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        generateFrontCardCanvas(data, selectedTemplateId),
        generateBackCardCanvas(data, selectedTemplateId),
      ]);
      const bothCanvas = combineCardCanvases(frontCanvas, backCanvas);
      setFrontPreviewUrl(frontCanvas.toDataURL('image/png'));
      setBackPreviewUrl(backCanvas.toDataURL('image/png'));
      setBothPreviewUrl(bothCanvas.toDataURL('image/png'));
      setCardModalOpen(true);

      // Non-blocking background sync (never interrupts user experience if offline/blocked)
      if (sessionId) {
        try {
          saveGeneratedRecord(data, sessionId, originalExtractedData).catch(() => { });
        } catch (logErr) {
          console.warn('[Supabase] Non-fatal background sync error:', logErr);
        }
      }
    } catch (err) {
      console.error('Failed to generate card:', err);
      alert('Card generation failed');
    }
  };

  const generateButtonLabel =
    dataSource === 'pdf' ? 'Review Changes and Generate Card' : 'Preview & Generate ID Card';
  const canResetForm = hasFarmerRecordContent(data);

  const renderGenerateActionCard = (wrapperClassName = '') => (
    <div className={`bg-emerald-50/90 rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-sm ${wrapperClassName}`}>
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
        className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-opacity duration-300 ${!hasAcceptedDisclaimer
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
              <nav className="flex items-center space-x-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
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
                  <span>Home</span>
                </a>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-emerald-800 font-bold">Card Maker Studio</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Your Farmer Summary Card
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
                  <span>Extracting File — Form Locked</span>
                </>
              ) : dataSource === 'pdf' ? (
                'Auto-Extracted Below — Review & Edit Any Field'
              ) : (
                'Or Skip Upload & Fill Details Manually'
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
                    <span>Form disabled while extracting file...</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {progressMsg || 'Reading uploaded document...'}{' '}
                    <span className="font-mono font-semibold text-emerald-700">({progressPct}%)</span>
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
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleTemplateChange}
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

