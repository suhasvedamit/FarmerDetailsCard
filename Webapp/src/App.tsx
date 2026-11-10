import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProgressBar } from './components/ProgressBar';
import { PhotoCard } from './components/PhotoCard';
import { FarmerForm } from './components/FarmerForm';
import { CardModal } from './components/CardModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { FarmerVerificationPage } from './components/FarmerVerificationPage';
import { Footer } from './components/Footer';
import { TermsPage } from './components/pages/TermsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { ContactPage } from './components/pages/ContactPage';
import { DisclaimerPage } from './components/pages/DisclaimerPage';
import { AppPage, getPageFromUrl, navigateToPage } from './lib/navigation';
import { FarmerRecord } from './types';
import { extractFarmerDataFromPdf } from './lib/pdfExtractor';
import {
  generateFrontCardCanvas,
  generateBackCardCanvas,
  combineCardCanvases,
} from './lib/cardGenerator';
import { DEFAULT_CARD_TEMPLATE_ID } from './lib/cardTemplates';
import { saveExtractedRecord, saveGeneratedRecord } from './lib/supabase';
import {
  isVerificationMode,
  extractVerificationDataFromUrl,
  FarmerVerificationData,
} from './lib/verificationUrl';
import {
  DEMO_FARMER_RECORD,
  cloneFarmerRecord,
  createEmptyFarmerRecord,
} from './lib/sampleData';
import { CreditCard } from 'lucide-react';

function createSessionId(prefix = 'session'): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

export const App: React.FC = () => {
  // Navigation & Page routing state
  const [currentPage, setCurrentPage] = useState<AppPage>(() => getPageFromUrl());

  // Check if page opened via QR code scan (or verification URL parameter)
  const [isVerifying, setIsVerifying] = useState<boolean>(() => isVerificationMode() || getPageFromUrl() === 'verify');
  const [verificationData, setVerificationData] = useState<FarmerVerificationData | null>(() =>
    (isVerificationMode() || getPageFromUrl() === 'verify') ? extractVerificationDataFromUrl() : null
  );

  useEffect(() => {
    const handleLocationChange = () => {
      const page = getPageFromUrl();
      setCurrentPage(page);
      const verifying = isVerificationMode() || page === 'verify';
      setIsVerifying(verifying);
      if (verifying) {
        setVerificationData(extractVerificationDataFromUrl());
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (page: AppPage) => {
    navigateToPage(page, false);
    setCurrentPage(page);
    if (page === 'verify') {
      setIsVerifying(true);
      setVerificationData(extractVerificationDataFromUrl());
    } else {
      setIsVerifying(false);
    }
  };

  const handleNavigateHome = () => {
    handleNavigate('home');
  };

  // Disclaimer state: resets on every page load/refresh
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  const [data, setData] = useState<FarmerRecord>(() => createEmptyFarmerRecord());
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [originalExtractedData, setOriginalExtractedData] = useState<FarmerRecord | null>(null);
  const [dataSource, setDataSource] = useState<'manual' | 'pdf' | 'demo'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState('');
  const [backPreviewUrl, setBackPreviewUrl] = useState('');
  const [bothPreviewUrl, setBothPreviewUrl] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_CARD_TEMPLATE_ID);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
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
      setFrontPreviewUrl('');
      setBackPreviewUrl('');
      setBothPreviewUrl('');

      // Non-blocking background sync (never interrupts user experience if offline/blocked)
      try {
        saveExtractedRecord(extracted, newSessionId, file.name).catch(() => {});
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

  // Instant Demo Data Loader (triggered only from Header)
  const handleLoadDemo = () => {
    const newSessionId = createSessionId('demo');

    setSessionId(newSessionId);
    setOriginalExtractedData(DEMO_FARMER_RECORD);
    setData(cloneFarmerRecord(DEMO_FARMER_RECORD));
    setDataSource('demo');
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
  };

  // Reset form back to blank manual entry
  const handleResetForm = () => {
    setSessionId(createSessionId());
    setOriginalExtractedData(null);
    setData(createEmptyFarmerRecord());
    setDataSource('manual');
    setFrontPreviewUrl('');
    setBackPreviewUrl('');
    setBothPreviewUrl('');
  };

  // Generate ID Card (Front & Back)
  const handleGenerateCard = async () => {
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
          saveGeneratedRecord(data, sessionId, originalExtractedData).catch(() => {});
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
    <div className={`bg-emerald-50 rounded-xl border border-emerald-200 p-4 space-y-2 ${wrapperClassName}`}>
      <button
        type="button"
        onClick={handleGenerateCard}
        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-2 cursor-pointer"
      >
        <CreditCard className="w-4 h-4" />
        <span>{generateButtonLabel}</span>
      </button>
    </div>
  );

  // Dedicated Informational & Policy Pages
  if (currentPage === 'terms') {
    return <TermsPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'privacy') {
    return <PrivacyPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'contact') {
    return <ContactPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'disclaimer') {
    return <DisclaimerPage onNavigate={handleNavigate} />;
  }

  // If opened via QR code scan (or verification URL), show the verification page directly
  if (isVerifying || currentPage === 'verify') {
    return (
      <FarmerVerificationPage
        data={verificationData}
        onNavigateHome={handleNavigateHome}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <>
      {/* Mandatory Disclaimer Modal on every page load */}
      <DisclaimerModal
        isOpen={!hasAcceptedDisclaimer}
        onAccept={() => setHasAcceptedDisclaimer(true)}
      />

      {/* Main page content is completely hidden until user accepts and proceeds */}
      <div
        className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-opacity duration-300 ${
          !hasAcceptedDisclaimer
            ? 'invisible pointer-events-none select-none max-h-screen overflow-hidden'
            : 'opacity-100'
        }`}
        aria-hidden={!hasAcceptedDisclaimer}
      >
        <Header onLoadDemo={handleLoadDemo} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Upload Zone */}
          <section>
            <DropZone onFileSelected={handleFileSelected} isProcessing={isProcessing} />
            {isProcessing && <ProgressBar message={progressMsg} percent={progressPct} />}
          </section>

          {/* Divider between optional PDF upload and manual/editable form */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="relative bg-slate-50 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Or Fill / Edit Details Manually
            </span>
          </div>

          {/* Form & Photo Workspace (always visible for manual entry or PDF review) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Left Column: Photo, Actions */}
            <div className="lg:col-span-4 space-y-4">
              <PhotoCard
                photoUrl={data.photo_url}
                rawPhotoUrl={data.raw_photo_url}
                photoTransform={data.photo_transform}
                onOpenEditor={() => setIsPhotoEditorOpen(true)}
                onPhotoUploaded={(rawUrl) => {
                  setData({
                    ...data,
                    photo_url: rawUrl,
                    raw_photo_url: rawUrl,
                    photo_transform: undefined,
                  });
                  setIsPhotoEditorOpen(true);
                }}
                onResetToOriginal={() => {
                  setData({
                    ...data,
                    photo_url: data.raw_photo_url,
                    photo_transform: undefined,
                  });
                }}
              />

              {/* Desktop Action Button */}
              {renderGenerateActionCard('hidden lg:block')}
            </div>

            {/* Right Column: The Form Fields */}
            <div className="lg:col-span-8 space-y-4">
              <FarmerForm
                data={data}
                onChange={setData}
                showExtractedBadges={dataSource !== 'manual'}
                onReset={handleResetForm}
                canReset={canResetForm}
              />

              {/* Mobile Action Button */}
              {renderGenerateActionCard('lg:hidden')}
            </div>
          </section>
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

        {/* Global Rich Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>
    </>
  );
};

export default App;
