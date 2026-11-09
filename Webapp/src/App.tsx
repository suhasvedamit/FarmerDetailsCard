import React, { useState } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProgressBar } from './components/ProgressBar';
import { PhotoCard } from './components/PhotoCard';
import { FarmerForm } from './components/FarmerForm';
import { CardModal } from './components/CardModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { FarmerRecord } from './types';
import { extractFarmerDataFromPdf } from './lib/pdfExtractor';
import { generateFrontCardCanvas, generateBackCardCanvas } from './lib/cardGenerator';
import { saveExtractedRecord, saveGeneratedRecord } from './lib/supabase';
import { CreditCard } from 'lucide-react';

export const App: React.FC = () => {
  // Disclaimer state: resets on every page load/refresh
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  const [data, setData] = useState<FarmerRecord | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [originalExtractedData, setOriginalExtractedData] = useState<FarmerRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState('');
  const [backPreviewUrl, setBackPreviewUrl] = useState('');
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

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

      const newSessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      setSessionId(newSessionId);
      setOriginalExtractedData(extracted);
      setData(extracted);

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

  // Generate ID Card (Front & Back)
  const handleGenerateCard = async () => {
    if (!data) return;
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        generateFrontCardCanvas(data),
        generateBackCardCanvas(data),
      ]);
      setFrontPreviewUrl(frontCanvas.toDataURL('image/png'));
      setBackPreviewUrl(backCanvas.toDataURL('image/png'));
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

  return (
    <>
      {/* Mandatory Disclaimer Modal on every page load */}
      <DisclaimerModal
        isOpen={!hasAcceptedDisclaimer}
        onAccept={() => setHasAcceptedDisclaimer(true)}
      />

      {/* Main page content is completely hidden until user accepts and proceeds */}
      <div
        className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-opacity duration-300 ${!hasAcceptedDisclaimer
          ? 'invisible pointer-events-none select-none max-h-screen overflow-hidden'
          : 'opacity-100'
          }`}
        aria-hidden={!hasAcceptedDisclaimer}
      >
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Upload Zone */}
          <section>
            <DropZone onFileSelected={handleFileSelected} isProcessing={isProcessing} />
            {isProcessing && <ProgressBar message={progressMsg} percent={progressPct} />}
          </section>

          {/* Results Workspace */}
          {data && (
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

                {/* Action Buttons */}
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                  <button
                    onClick={handleGenerateCard}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Review Changes and Generate Card</span>
                  </button>
                </div>
              </div>

              {/* Right Column: The 10 Form Fields */}
              <div className="lg:col-span-8">
                <FarmerForm data={data} onChange={setData} />
              </div>
            </section>
          )}
        </main>

        {/* Card Generation Modal (Front & Back) */}
        {data && (
          <CardModal
            isOpen={cardModalOpen}
            onClose={() => setCardModalOpen(false)}
            record={data}
            frontPreviewUrl={frontPreviewUrl}
            backPreviewUrl={backPreviewUrl}
          />
        )}

        {/* Photo Editor & Cropper Modal */}
        {data && (
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
        )}

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-4 text-xs text-center border-t border-slate-800">
          <p>Farmer ID Details Summary Card</p>
        </footer>
      </div>
    </>
  );
};

export default App;
