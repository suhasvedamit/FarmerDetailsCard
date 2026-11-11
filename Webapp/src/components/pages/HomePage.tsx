import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowRight,
  UploadCloud,
  Crop,
  QrCode,
  Printer,
  ShieldCheck,
  Sparkles,
  Layers,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Mail,
  Users,
  Lock,
  RefreshCw,
  Eye,
  Plus,
  Pencil,
  Upload,
} from 'lucide-react';
import { AppPage, getPageUrl } from '../../lib/navigation';
import {
  CardTemplate,
  DEFAULT_CARD_TEMPLATE_ID,
  getCardTemplate,
  useCardTemplates,
} from '../../lib/cardTemplates';
import { generateFrontCardCanvas, generateBackCardCanvas } from '../../lib/cardGenerator';
import { SAMPLE_FARMER_RECORD } from '../../lib/samplePreview';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { CustomDesignModal } from '../CustomDesignModal';

interface HomePageProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onLaunchCreateCard: (templateId?: string) => void;
  onNavigate: (page: AppPage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  onLaunchCreateCard,
  onNavigate,
}) => {
  const [previewTemplateId, setPreviewTemplateId] = useState<string>(
    selectedTemplateId || DEFAULT_CARD_TEMPLATE_ID
  );
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [frontCardUrl, setFrontCardUrl] = useState<string>('');
  const [backCardUrl, setBackCardUrl] = useState<string>('');
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);

  const { all: allTemplates } = useCardTemplates();
  const activeTemplate = getCardTemplate(previewTemplateId);

  useEffect(() => {
    if (selectedTemplateId) {
      setPreviewTemplateId(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    let mounted = true;

    const renderSampleCard = async () => {
      setIsRenderingPreview(true);
      try {
        const [frontCanvas, backCanvas] = await Promise.all([
          generateFrontCardCanvas(SAMPLE_FARMER_RECORD, previewTemplateId),
          generateBackCardCanvas(SAMPLE_FARMER_RECORD, previewTemplateId),
        ]);
        if (!mounted) return;
        setFrontCardUrl(frontCanvas.toDataURL('image/png'));
        setBackCardUrl(backCanvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Sample preview rendering warning:', err);
      } finally {
        if (mounted) setIsRenderingPreview(false);
      }
    };

    renderSampleCard();
    return () => {
      mounted = false;
    };
  }, [
    previewTemplateId,
    activeTemplate?.id,
    activeTemplate?.updatedAt,
    activeTemplate?.frontUrl,
    activeTemplate?.backUrl,
  ]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPage) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    onNavigate(page);
  };

  const handleUseTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    onLaunchCreateCard(templateId);
  };

  const displayedPreviewSrc =
    previewSide === 'front'
      ? frontCardUrl || activeTemplate?.frontUrl
      : backCardUrl || activeTemplate?.backUrl;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Header currentPage="home" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. HERO SECTION - PRODUCT BRANDING & LIVE CARD SHOWCASE   */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/90 via-white to-slate-50 border-b border-slate-200/80">
          {/* Decorative soft emerald orbs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-12 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Product Branding Copy & CTAs */}
              <div className="lg:col-span-6 min-w-0 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold max-w-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  <span className="truncate">Smart PDF Extraction &amp; Card Studio</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                    Turn Farmer Documents into{' '}
                    <span className="text-emerald-700">Print-Ready Summary Cards</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                    <strong className="text-slate-800">Farmer Details Card</strong> extracts farmer, land, and bank details directly from registration PDFs—or lets you enter them manually—and renders crisp, two-sided CR80 pocket cards ready for printing.
                  </p>
                </div>

                {/* Primary & Secondary CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onLaunchCreateCard(previewTemplateId)}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Launch Card Maker</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#designs"
                    className="px-5 py-3.5 bg-white hover:bg-emerald-50/70 text-slate-800 border border-slate-300 hover:border-emerald-300 text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Explore Card Designs</span>
                  </a>
                </div>

                {/* Quick Trust Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white/80 px-3 py-2 rounded-lg border border-slate-200/80">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Protected Data Handling</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white/80 px-3 py-2 rounded-lg border border-slate-200/80">
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Built-in Verification QR</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white/80 px-3 py-2 rounded-lg border border-slate-200/80">
                    <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Multiple Print Exports</span>
                  </div>
                </div>
              </div>

              {/* Right: Live Interactive Card Preview Studio */}
              <div className="lg:col-span-6 min-w-0">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 sm:p-5 space-y-4 overflow-hidden">
                  {/* Top Bar of Showcase */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Live Card Preview</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500 truncate">
                        {activeTemplate?.name || 'Template'}
                      </span>
                    </div>

                    {/* Front / Back Switcher */}
                    <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewSide('front')}
                        className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          previewSide === 'front'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Front Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSide('back')}
                        className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                          previewSide === 'back'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Back Side</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Card Preview Stage */}
                  <div className="relative bg-gradient-to-b from-slate-100 to-slate-200/80 rounded-xl p-2.5 sm:p-4 border border-slate-200 flex items-center justify-center">
                    {displayedPreviewSrc ? (
                      <img
                        src={displayedPreviewSrc}
                        alt={`Sample Farmer Card - ${previewSide} view`}
                        className={`w-full rounded-xl shadow-lg border border-slate-300/80 object-contain transition-opacity duration-200 ${
                          isRenderingPreview ? 'opacity-70' : 'opacity-100'
                        }`}
                        style={{ aspectRatio: '1050 / 660' }}
                      />
                    ) : (
                      <div
                        className="w-full rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500"
                        style={{ aspectRatio: '1050 / 660' }}
                      >
                        Rendering sample card...
                      </div>
                    )}
                    <span className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-medium backdrop-blur-sm">
                      Illustrative Sample Data
                    </span>
                  </div>

                  {/* Quick Template Selector Strip + Use Design CTA */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {allTemplates.map((tpl) => {
                        const isSelected = tpl.id === previewTemplateId;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              setPreviewTemplateId(tpl.id);
                              onSelectTemplate(tpl.id);
                            }}
                            title={`Preview ${tpl.name}`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span>{tpl.name}</span>
                            {tpl.isCustom && (
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
                                  isSelected
                                    ? 'bg-emerald-600 text-emerald-100'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                Custom
                              </span>
                            )}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(null);
                          setIsCustomModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-dashed border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 transition flex items-center gap-1 cursor-pointer"
                        title="Upload and preview your own custom card design"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Custom Design</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUseTemplate(previewTemplateId)}
                      className="w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Create Card With {activeTemplate?.name || 'Selected Design'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. PRODUCT METRICS / HIGHLIGHTS STRIP                     */}
        {/* ========================================================= */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-800">Fast PDF Extraction</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Smart OCR reads registration documents and extracts key fields in seconds
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-800">
                  Multiple Card Designs
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Matched Front &amp; Back agricultural layouts ready to customize
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-800">Up to 5 Land Rows</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Survey/Gat No, Village, Owner Type &amp; Area plus Bank details
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-800">Flexible Export Formats</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Download high-resolution card images and print-ready PDF sheets
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. HOW IT WORKS (3-STEP WORKFLOW)                         */}
        {/* ========================================================= */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Simple 3-Step Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From Registration PDF to Pocket Card in Under a Minute
            </h2>
            <p className="text-sm text-slate-600">
              Whether you have a farmer registration PDF or want to type details manually, the studio guides you smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Step 01
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Upload PDF or Enter Details
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Drop your farmer registration PDF (up to 5 MB) to auto-extract fields and portrait photo automatically—or start straight from the blank manual form.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Crop className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Step 02
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Review, Edit &amp; Crop Photo
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Verify personal details, add up to 5 land survey rows and bank info, and use the built-in Photo Cropper to zoom, rotate, and align your portrait cleanly.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Step 03
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Choose Design &amp; Print / Save
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Switch between multiple card templates, inspect Front &amp; Back with the generated QR code, and export in your preferred print-ready format.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. CORE CAPABILITIES GRID                                 */}
        {/* ========================================================= */}
        <section className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Built-In Capabilities
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Everything Needed for Clean Farmer Summary Cards
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onLaunchCreateCard(previewTemplateId)}
                className="self-start md:self-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer"
              >
                <span>Try the Card Maker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Smart PDF &amp; OCR Extraction</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically extracts Farmer Name, Farmer ID, PM-Kisan, Aadhaar, PAN, land holdings, and bank details from registration PDFs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Crop className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Precision Photo Crop Studio</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically locates the portrait box in uploaded PDFs and lets you zoom, pan, rotate, flip, or upload a new photo matched to exact 191:241 ID dimensions.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">2-Sided Front &amp; Back Layout</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Front displays personal credentials, photo &amp; address; Back neatly formats up to 5 land survey/gat rows alongside Bank Name, Account Number &amp; IFSC code.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Scannable QR Digital Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every generated card includes an encoded QR code on the front side that opens a clean, mobile-friendly verification summary page when scanned.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Print-Ready Card Exports</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Supports multiple output options—from crisp card images to CR80 PVC layouts and print-ready sheets suited for lamination.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Confidential Data Handling</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your farmer records and card details are handled strictly for formatting your summary card—with zero advertising trackers and zero third-party data sales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. CARD DESIGN TEMPLATES GALLERY                          */}
        {/* ========================================================= */}
        <section id="designs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Card Design Studio
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose From Multiple Front &amp; Back Card Designs
            </h2>
            <p className="text-sm text-slate-600">
              Pick any template below to preview it in the showcase or launch the Card Maker directly with that design pre-selected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Upload Custom Card Design Tile */}
            <div
              onClick={() => {
                setEditingTemplate(null);
                setIsCustomModalOpen(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingTemplate(null);
                  setIsCustomModalOpen(true);
                }
              }}
              className="bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 p-4 flex flex-col justify-between gap-4 transition shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex-1 bg-white/80 rounded-xl border border-emerald-200/80 p-5 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Use Your Own Custom Design
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload custom Front &amp; Back artwork (PNG, JPG, WebP, SVG) and preview live with farmer details.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-emerald-900">Custom Artwork</div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Includes safe-zone layout guide
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-700 group-hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm transition flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </span>
              </div>
            </div>

            {allTemplates.map((template) => {
              const isSelected = template.id === previewTemplateId;
              return (
                <div
                  key={template.id}
                  className={`bg-white rounded-2xl border p-4 space-y-4 transition shadow-sm hover:shadow-md ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                >
                  {/* Front & Back Thumbnails */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="space-y-1">
                      <img
                        src={template.frontUrl}
                        alt={`${template.name} Front`}
                        className="w-full rounded-lg border border-slate-200 shadow-sm object-cover bg-white"
                        style={{ aspectRatio: '1050 / 660' }}
                        loading="lazy"
                      />
                      <span className="block text-center text-[10px] font-semibold text-slate-500">
                        Front
                      </span>
                    </div>
                    <div className="space-y-1">
                      <img
                        src={template.backUrl}
                        alt={`${template.name} Back`}
                        className="w-full rounded-lg border border-slate-200 shadow-sm object-cover bg-white"
                        style={{ aspectRatio: '1050 / 660' }}
                        loading="lazy"
                      />
                      <span className="block text-center text-[10px] font-semibold text-slate-500">
                        Back
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{template.name}</h3>
                        {template.isCustom && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase flex-shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {template.hasSeparateBack ? 'Matched Front & Back' : 'Unified Design'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {template.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(template);
                            setIsCustomModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition cursor-pointer"
                          title="Edit or delete custom design"
                          aria-label={`Edit ${template.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTemplateId(template.id);
                          onSelectTemplate(template.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Preview this design in the Hero showcase"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUseTemplate(template.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Balanced Studio Callout Tile to complete the 3-col grid symmetrically */}
            <div
              className={`sm:col-span-2 ${
                (allTemplates.length + 1) % 3 === 0
                  ? 'lg:col-span-3'
                  : (allTemplates.length + 1) % 3 === 1
                    ? 'lg:col-span-2'
                    : 'lg:col-span-1'
              } bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 rounded-2xl border border-emerald-200 p-6 flex flex-col justify-between gap-4 shadow-sm`}
            >
              <div className="space-y-2">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>Switch Designs Anytime</span>
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Preview Every Design With Your Own Details Before Exporting
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  Enter or extract your farmer record once, then switch between all available Front &amp; Back layouts live inside the Card Maker Studio before exporting your card.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onLaunchCreateCard(previewTemplateId)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center space-x-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open Card Maker Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. WHO IT'S FOR & TRANSPARENCY / PAGES DIRECTORY          */}
        {/* ========================================================= */}
        <section className="bg-white border-t border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Who It's For */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Designed for Farmers, Families &amp; Local Centers
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Practical pocket reference instead of fragile folded A4 printouts
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Individual Farmers:</strong> Keep Farmer ID, Survey/Gat numbers, and bank details neatly organized on one pocket card.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Family Members:</strong> Assist elders by editing details cleanly and saving a print-ready A4 sheet.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>VLE / CSC &amp; Print Shops:</strong> Format customer-provided slips rapidly into exact CR80 duplex layouts in seconds.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Important Transparency Notice */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Independent Convenience Tool — Not Government Issued
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">
                      Clear transparency before you generate any card
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Farmer Details Card</strong> is an independent, unofficial formatting utility. It is <strong>not affiliated with, endorsed by, or connected to</strong> the Government of India, Ministry of Agriculture, PM-KISAN, or AgriStack. Generated cards carry no statutory or legal authority and are strictly for personal reference and convenience.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={getPageUrl('disclaimer')}
                    onClick={(e) => handleLinkClick(e, 'disclaimer')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold transition"
                  >
                    Read Legal Disclaimer
                  </a>
                  <a
                    href={getPageUrl('privacy')}
                    onClick={(e) => handleLinkClick(e, 'privacy')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition"
                  >
                    Read Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Rest Other Pages Quick Directory */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Documentation, Policies &amp; Support Pages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href={getPageUrl('terms')}
                  onClick={(e) => handleLinkClick(e, 'terms')}
                  className="group p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition flex items-start space-x-3"
                >
                  <FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center space-x-1">
                      <span>Terms &amp; Conditions</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Permitted uses, user verification responsibility &amp; service scope.
                    </p>
                  </div>
                </a>

                <a
                  href={getPageUrl('privacy')}
                  onClick={(e) => handleLinkClick(e, 'privacy')}
                  className="group p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition flex items-start space-x-3"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center space-x-1">
                      <span>Privacy Policy</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      How document handling, QR encoding, security &amp; data rights work.
                    </p>
                  </div>
                </a>

                <a
                  href={getPageUrl('disclaimer')}
                  onClick={(e) => handleLinkClick(e, 'disclaimer')}
                  className="group p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition flex items-start space-x-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center space-x-1">
                      <span>Legal Disclaimer</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Non-government notice, OCR accuracy &amp; non-statutory scope.
                    </p>
                  </div>
                </a>

                <a
                  href={getPageUrl('contact')}
                  onClick={(e) => handleLinkClick(e, 'contact')}
                  className="group p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition flex items-start space-x-3"
                >
                  <Mail className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center space-x-1">
                      <span>Contact &amp; Support</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Email support, bug reporting &amp; turnaround hours.
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FINAL BOTTOM CALL TO ACTION BANNER                     */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 rounded-2xl p-7 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Ready to Format Your Farmer Summary Card?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Open the Card Maker Studio to upload a registration PDF or fill details manually, crop your photo, and export print-ready cards in multiple formats right away.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onLaunchCreateCard(previewTemplateId)}
              className="shrink-0 px-6 py-3.5 bg-white hover:bg-emerald-50 text-emerald-900 text-sm font-bold rounded-xl shadow-md transition transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Open Card Maker Studio</span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} openInSameTab={true} />

      <CustomDesignModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        editingTemplate={editingTemplate}
        onSaveSuccess={(saved) => {
          setPreviewTemplateId(saved.id);
          onSelectTemplate(saved.id);
        }}
        onDeleted={(deletedId) => {
          if (previewTemplateId === deletedId) {
            setPreviewTemplateId(DEFAULT_CARD_TEMPLATE_ID);
          }
          if (selectedTemplateId === deletedId) {
            onSelectTemplate(DEFAULT_CARD_TEMPLATE_ID);
          }
        }}
      />
    </div>
  );
};

