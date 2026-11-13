import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  ChevronRight,
  Search,
  X,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Download,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Store,
  Lock,
} from 'lucide-react';
import { FarmerRecord } from '../../types';
import { AppPage, getPageUrl } from '../../lib/navigation';
import { hasFarmerRecordContent } from '../../lib/cardDraftStorage';
import { createCardPdf, downloadCardAsPdf, getCardPdfFilename } from '../../lib/cardGenerator';
import { getCardTemplate, useCardTemplates } from '../../lib/cardTemplates';
import {
  isCardPaid,
  openRazorpayCheckout,
  getCardDownloadPriceInr,
} from '../../lib/payment';
import {
  PVC_MAKERS,
  PvcMakerAgent,
  buildPvcOrderWhatsAppUrl,
  filterPvcMakersByLocation,
  getAgentAddress,
  getAgentLocationLabel,
  getAgentMapsUrl,
  getAgentName,
  getAgentPriceNote,
  getAgentServices,
  getAgentShopName,
  getAgentTelHref,
  getAgentTimings,
  getUniqueDistricts,
} from '../../data/pvcMakers';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { useLanguage } from '../../i18n';

interface PvcMakersPageProps {
  activeRecord: FarmerRecord;
  selectedTemplateId: string;
  onNavigate: (page: AppPage) => void;
  onBackToPreview: () => void;
}

interface OrderNoticeState {
  agentId: string;
  shopName: string;
  waUrl: string;
  fileName: string;
}

function triggerBlobDownload(blobUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const PvcMakersPage: React.FC<PvcMakersPageProps> = ({
  activeRecord,
  selectedTemplateId,
  onNavigate,
  onBackToPreview,
}) => {
  const { language, t, format } = useLanguage();
  useCardTemplates();

  const hasCardData = useMemo(() => hasFarmerRecordContent(activeRecord), [activeRecord]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [preparedPdfUrl, setPreparedPdfUrl] = useState<string>('');
  const [orderNotice, setOrderNotice] = useState<OrderNoticeState | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(() => isCardPaid(activeRecord));
  const priceInr = getCardDownloadPriceInr();

  const hasAutoDownloadedRef = useRef<boolean>(false);

  useEffect(() => {
    setIsPaid(isCardPaid(activeRecord));
  }, [activeRecord]);

  const activeTemplate = getCardTemplate(selectedTemplateId);
  const pdfFilename = useMemo(
    () => getCardPdfFilename(activeRecord, 'both'),
    [activeRecord]
  );

  // Pre-generate the CR80 2-sided PDF blob in the background when card data exists
  // so clicking "Send PDF on WhatsApp" can trigger both PDF download & WhatsApp synchronously
  useEffect(() => {
    hasAutoDownloadedRef.current = false;
    setOrderNotice(null);

    if (!hasCardData) {
      setPreparedPdfUrl('');
      return;
    }

    let cancelled = false;
    let objectUrl = '';
    setPreparedPdfUrl('');

    createCardPdf(activeRecord, selectedTemplateId, { language, sides: 'both' })
      .then((pdf) => {
        if (cancelled) return;
        const blob = pdf.output('blob');
        objectUrl = URL.createObjectURL(blob);
        setPreparedPdfUrl(objectUrl);
      })
      .catch((err) => {
        console.warn('[PvcMakers] Background PDF pre-generation skipped:', err);
        if (!cancelled) {
          setPreparedPdfUrl('');
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasCardData, activeRecord, selectedTemplateId, language]);

  const districts = useMemo(() => getUniqueDistricts(PVC_MAKERS, language), [language]);

  const filteredMakers = useMemo(
    () => filterPvcMakersByLocation(PVC_MAKERS, searchQuery, selectedDistrict),
    [searchQuery, selectedDistrict]
  );

  const hasActiveFilter = Boolean(searchQuery.trim() || selectedDistrict);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
  };

  const executeDownload = async () => {
    if (preparedPdfUrl) {
      triggerBlobDownload(preparedPdfUrl, pdfFilename);
      hasAutoDownloadedRef.current = true;
      return;
    }

    setIsDownloadingPdf(true);
    try {
      await downloadCardAsPdf(activeRecord, pdfFilename, selectedTemplateId, {
        language,
        sides: 'both',
      });
      hasAutoDownloadedRef.current = true;
    } catch (err) {
      console.error('Failed to download card PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!hasCardData || isDownloadingPdf) return;

    if (!isPaid) {
      openRazorpayCheckout({
        record: activeRecord,
        amountInr: priceInr,
        onSuccess: () => {
          setIsPaid(true);
          void executeDownload();
        },
      });
      return;
    }

    await executeDownload();
  };

  const handleOrderOnWhatsApp = (agent: PvcMakerAgent) => {
    const waUrl = buildPvcOrderWhatsAppUrl(agent, {
      record: activeRecord,
      hasCardData,
      templateName: activeTemplate?.name,
      language,
      searchQuery: searchQuery.trim() || undefined,
    });
    if (!waUrl) return;

    if (hasCardData && !isPaid) {
      openRazorpayCheckout({
        record: activeRecord,
        amountInr: priceInr,
        onSuccess: () => {
          setIsPaid(true);
          window.open(waUrl, '_blank', 'noopener,noreferrer');
          void executeDownload();
          setOrderNotice({
            agentId: agent.id,
            shopName: getAgentShopName(agent, language),
            waUrl,
            fileName: pdfFilename,
          });
        },
      });
      return;
    }

    // Open WhatsApp synchronously in click handler to avoid browser popup blockers
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (hasCardData) {
      if (!hasAutoDownloadedRef.current) {
        void executeDownload();
      }
      setOrderNotice({
        agentId: agent.id,
        shopName: getAgentShopName(agent, language),
        waUrl,
        fileName: pdfFilename,
      });
    }
  };

  const handleHomeNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    onNavigate('home');
  };

  const resultsLabel =
    filteredMakers.length === 1
      ? t.pvcMakersPage.resultsCountSingle
      : format(t.pvcMakersPage.resultsCountPlural, { count: filteredMakers.length });

  const renderAgentCard = (agent: PvcMakerAgent) => {
    const shopName = getAgentShopName(agent, language);
    const agentName = getAgentName(agent, language);
    const locationLabel = getAgentLocationLabel(agent, language);
    const address = getAgentAddress(agent, language);
    const services = getAgentServices(agent, language);
    const timings = getAgentTimings(agent, language);
    const priceNote = getAgentPriceNote(agent, language);
    const mapsUrl = getAgentMapsUrl(agent);
    const telHref = getAgentTelHref(agent.phone);
    const showNotice = orderNotice?.agentId === agent.id;

    return (
      <article
        key={agent.id}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition p-5 sm:p-6 space-y-4"
      >
        {/* Agent Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {shopName}
                </h3>
                {agent.isVerified && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{t.pvcMakersPage.verifiedBadge}</span>
                  </span>
                )}
              </div>

              {agentName && (
                <p className="text-xs sm:text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">
                    {t.pvcMakersPage.agentNameLabel}
                  </span>{' '}
                  {agentName}
                </p>
              )}

              <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-emerald-800 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{locationLabel}</span>
              </div>
            </div>
          </div>

          {priceNote && (
            <span className="self-start inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shrink-0">
              {priceNote}
            </span>
          )}
        </div>

        {/* Address, Timings & Services */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 space-y-2.5 text-xs sm:text-sm text-slate-600">
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-800">{t.pvcMakersPage.addressLabel}</span>{' '}
            {address}
          </p>

          {timings && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-700">{t.pvcMakersPage.timingsLabel}</strong>{' '}
                {timings}
              </span>
            </div>
          )}

          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {services.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {Boolean((agent.whatsapp || '').replace(/\D/g, '')) && (
            <button
              type="button"
              onClick={() => handleOrderOnWhatsApp(agent)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {hasCardData && !isPaid ? (
                <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              ) : (
                <MessageCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{t.pvcMakersPage.shareOrderWhatsAppBtn}</span>
            </button>
          )}

          {telHref && agent.phone && (
            <a
              href={telHref}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-emerald-300 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {t.pvcMakersPage.callBtn} ({agent.phone})
              </span>
            </a>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{t.pvcMakersPage.viewMapBtn}</span>
          </a>
        </div>

        {/* WhatsApp + PDF Confirmation Notice */}
        {showNotice && orderNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-start space-x-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{t.pvcMakersPage.pdfSentNoticeTitle}</p>
                <p className="text-emerald-800 leading-relaxed">
                  {format(t.pvcMakersPage.pdfSentNoticeDesc, {
                    fileName: orderNotice.fileName,
                    shopName: orderNotice.shopName,
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-6">
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={isDownloadingPdf}
                className="inline-flex items-center space-x-1 text-emerald-800 hover:text-emerald-950 font-bold underline underline-offset-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.pvcMakersPage.downloadAgainLink}</span>
              </button>
              <a
                href={orderNotice.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-emerald-800 hover:text-emerald-950 font-bold underline underline-offset-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.pvcMakersPage.openWhatsAppAgainLink}</span>
              </a>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Header currentPage="pvc-makers" onNavigate={onNavigate} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Breadcrumb & Back Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
          <div className="space-y-1 min-w-0">
            <nav
              className="flex items-center space-x-1.5 text-xs sm:text-sm text-slate-500"
              aria-label={t.pageLayout.breadcrumbAria}
            >
              <a
                href={getPageUrl('home')}
                onClick={handleHomeNavClick}
                className="hover:text-emerald-700 transition flex items-center space-x-1 font-medium"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.common.home}</span>
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-emerald-800 font-bold truncate">
                {t.pvcMakersPage.breadcrumbTitle}
              </span>
            </nav>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.pvcMakersPage.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              {t.pvcMakersPage.subtitle}
            </p>
          </div>

          {hasCardData && (
            <button
              type="button"
              onClick={onBackToPreview}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-emerald-300 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700" />
              <span>{t.pvcMakersPage.backToPreviewBtn}</span>
            </button>
          )}
        </div>

        {/* Location Search & Filter Controls */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t.pvcMakersPage.searchPlaceholder}
                aria-label={t.pvcMakersPage.searchAria}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  title={t.pvcMakersPage.clearSearchTitle}
                  aria-label={t.pvcMakersPage.clearSearchTitle}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {districts.length > 0 && (
              <div className="w-full md:w-56 shrink-0">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  aria-label={t.pvcMakersPage.districtFilterAria}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-sm text-slate-800 outline-none transition cursor-pointer"
                >
                  <option value="">{t.pvcMakersPage.allDistrictsOption}</option>
                  {districts.map((dist) => (
                    <option key={dist.value} value={dist.value}>
                      {dist.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-700">{resultsLabel}</span>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 cursor-pointer"
              >
                {t.pvcMakersPage.allLocationsChip}
              </button>
            )}
          </div>
        </section>

        {/* PVC Makers Results List */}
        {filteredMakers.length > 0 ? (
          <section className="space-y-4">
            {filteredMakers.map(renderAgentCard)}
          </section>
        ) : (
          <section className="space-y-5">
            <div className="bg-white rounded-2xl border border-amber-200 p-6 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {format(t.pvcMakersPage.noMatchesTitle, {
                    query: searchQuery.trim() || selectedDistrict,
                  })}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                  {t.pvcMakersPage.noMatchesDesc}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  {format(t.pvcMakersPage.showAllMakersBtn, { count: PVC_MAKERS.length })}
                </button>
              </div>
            </div>

            {PVC_MAKERS.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
                  {t.pvcMakersPage.otherLocationsHeading}
                </h3>
                <div className="space-y-4">{PVC_MAKERS.map(renderAgentCard)}</div>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer onNavigate={onNavigate} openInSameTab={true} />
    </div>
  );
};
