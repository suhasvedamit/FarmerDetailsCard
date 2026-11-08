import React, { useState } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProgressBar } from './components/ProgressBar';
import { PhotoCard } from './components/PhotoCard';
import { FarmerForm } from './components/FarmerForm';
import { CardModal } from './components/CardModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { FarmerRecord } from './types';
import { extractFarmerDataFromPdf } from './lib/pdfExtractor';
import { generateCardCanvas } from './lib/cardGenerator';
import { CreditCard, Copy, Download, Check } from 'lucide-react';

export const App: React.FC = () => {
  // Disclaimer state: resets on every page load/refresh
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  const [data, setData] = useState<FarmerRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardPreviewUrl, setCardPreviewUrl] = useState('');
  const [copied, setCopied] = useState(false);

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
      setData(extracted);
    } catch (err: any) {
      console.error('Extraction error:', err);
      alert(`Extraction failed: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate ID Card
  const handleGenerateCard = async () => {
    if (!data) return;
    try {
      const canvas = await generateCardCanvas(data);
      setCardPreviewUrl(canvas.toDataURL('image/png'));
      setCardModalOpen(true);
    } catch (err) {
      console.error('Failed to generate card:', err);
      alert('Card generation failed');
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON file
  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmer_${data.farmer_id || 'record'}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                <PhotoCard photoUrl={data.photo_url} />

                {/* Action Buttons */}
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 space-y-2">
                  <button
                    onClick={handleGenerateCard}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Generate Farmer Details Card</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCopyJson}
                      className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: The 10 Form Fields */}
              <div className="lg:col-span-8">
                <FarmerForm data={data} onChange={setData} />
              </div>
            </section>
          )}
        </main>

        {/* Card Generation Modal */}
        {data && (
          <CardModal
            isOpen={cardModalOpen}
            onClose={() => setCardModalOpen(false)}
            record={data}
            cardPreviewUrl={cardPreviewUrl}
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
