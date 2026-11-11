import React, { useState } from 'react';
import {
  User,
  CreditCard,
  Phone,
  MapPin,
  Landmark,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  FileCheck,
  Layers,
} from 'lucide-react';
import { FarmerVerificationData } from '../lib/verificationUrl';
import { AppPage } from '../lib/navigation';
import { Footer } from './Footer';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../i18n';
import logoImg from '../assets/logo.png';

interface FarmerVerificationPageProps {
  data: FarmerVerificationData | null;
  onNavigateHome: () => void;
  onNavigate?: (page: AppPage) => void;
}

export const FarmerVerificationPage: React.FC<FarmerVerificationPageProps> = ({
  data,
  onNavigateHome,
  onNavigate,
}) => {
  const { language, t, format } = useLanguage();

  const handleOpenCreateCard = () => {
    if (onNavigate) {
      onNavigate('create-card');
    } else {
      onNavigateHome();
    }
  };
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert(format(t.verificationPage.linkCopiedAlert, { url: window.location.href }));
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatLocalizedGender = (gender?: string) => {
    if (!gender) return '--';
    const g = gender.trim().toLowerCase();
    if (g === 'male' || g === 'm' || g === 'पुरुष') return t.cardCanvas.gender.male;
    if (g === 'female' || g === 'f' || g === 'स्त्री') return t.cardCanvas.gender.female;
    if (g === 'transgender' || g === 'other' || g === 'इतर' || g === 'तृतीयपंथी') {
      return t.cardCanvas.gender.transgender;
    }
    return gender;
  };

  // If no data is available in the URL
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center space-y-5 relative">
          <div className="flex justify-end">
            <LanguageSelector variant="light" />
          </div>

          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <FileCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              {t.verificationPage.noDataTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.verificationPage.noDataSubtitle}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {t.verificationPage.noDataDesc}
          </p>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleOpenCreateCard}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.verificationPage.goToGenerator}</span>
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.verificationPage.goToHome}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const monogramFallback = language === 'mr' ? 'श' : 'F';

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans print:bg-white print:p-0">
      {/* Top Government-Style Tricolor Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 print:hidden" />

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
                  {t.common.appName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <LanguageSelector variant="light" />
            <button
              onClick={onNavigateHome}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.verificationPage.homeShort}</span>
            </button>
            <button
              onClick={handleOpenCreateCard}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.verificationPage.makerFull}</span>
              <span className="sm:hidden">{t.verificationPage.makerShort}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4 print:p-0 print:space-y-3">
        {/* Digital Identity Overview Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Farmer Photo or Avatar Monogram */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-white flex-shrink-0 overflow-hidden">
                  {data.photo_url ? (
                    <img
                      src={data.photo_url}
                      alt={data.farmer_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {data.farmer_name
                        ? data.farmer_name.trim().charAt(0)
                        : monogramFallback}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {data.farmer_name || '--'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                    {data.gender && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                        {formatLocalizedGender(data.gender)}
                      </span>
                    )}
                    {data.village && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500 inline" />
                        <span>{data.village}</span>
                      </span>
                    )}
                    {data.district && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                        {t.verificationPage.districtPrefix} {data.district}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Farmer ID Chips */}
              <div className="w-full sm:w-auto flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {t.verificationPage.farmerIdLabel}
                  </span>
                  <div className="flex items-center justify-between sm:justify-start space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {data.farmer_id || '--'}
                    </span>
                    {data.farmer_id && (
                      <button
                        onClick={() => handleCopyText(data.farmer_id, 'farmer_id')}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition"
                        title={t.verificationPage.copyFarmerIdTitle}
                      >
                        {copiedField === 'farmer_id' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {t.verificationPage.pmKisanLabel}
                  </span>
                  <div className="flex items-center justify-between sm:justify-start space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {data.enrollment_no || '--'}
                    </span>
                    {data.enrollment_no && (
                      <button
                        onClick={() => handleCopyText(data.enrollment_no, 'enrollment_no')}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition"
                        title={t.verificationPage.copyPmKisanTitle}
                      >
                        {copiedField === 'enrollment_no' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Specifications Grid */}
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Personal Details */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{t.verificationPage.personalDetailsTitle}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.farmerNameLabel}</span>
                  <span className="font-bold text-slate-900 text-right">{data.farmer_name || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.dobLabel}</span>
                  <span className="font-semibold text-slate-800">{data.dob || '--'}</span>
                </div>

                {data.age && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">{t.verificationPage.ageLabel}</span>
                    <span className="font-semibold text-slate-800">
                      {format(t.verificationPage.ageYears, { age: data.age })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.genderLabel}</span>
                  <span className="font-semibold text-slate-800">{formatLocalizedGender(data.gender)}</span>
                </div>

                {data.caste_category && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t.verificationPage.casteLabel}</span>
                    <span className="font-semibold text-slate-800">{data.caste_category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Identity & Contact */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{t.verificationPage.identityContactTitle}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.mobileLabel}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-slate-900">{data.mobile_number || '--'}</span>
                    {data.mobile_number && data.mobile_number !== '--' && (
                      <a
                        href={`tel:${data.mobile_number}`}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 border border-emerald-200"
                        title={t.verificationPage.callTitle}
                      >
                        <Phone className="w-3 h-3" />
                        <span>{t.verificationPage.callBtn}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.aadhaarLabel}</span>
                  <span className="font-mono font-bold text-slate-900">{data.aadhaar_number || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.panLabel}</span>
                  <span className="font-mono font-bold text-slate-900">{data.pan_card || '--'}</span>
                </div>
              </div>
            </div>

            {/* 3. Land Records */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{t.verificationPage.landRecordsTitle}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.surveyNoLabel}</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm">
                    {data.survey_no || '--'}
                  </span>
                </div>

                {data.khata_no && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">{t.verificationPage.khataNoLabel}</span>
                    <span className="font-bold font-mono text-slate-900">
                      {data.khata_no}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.villageLabel}</span>
                  <span className="font-semibold text-slate-800">{data.village || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.talukaLabel}</span>
                  <span className="font-semibold text-slate-800">{data.sub_district || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.districtLabel}</span>
                  <span className="font-semibold text-slate-800">{data.district || '--'}</span>
                </div>

                {data.total_area && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t.verificationPage.totalAreaLabel}</span>
                    <span className="font-bold text-slate-900">
                      {format(t.verificationPage.hectareUnit, { area: data.total_area })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Bank Details */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>{t.verificationPage.bankDetailsTitle}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.bankNameBranchLabel}</span>
                  <span className="font-semibold text-slate-800 text-right">{data.bank_name || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{t.verificationPage.accountNoLabel}</span>
                  <span className="font-mono font-bold text-slate-900">{data.account_no || '--'}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{t.verificationPage.ifscLabel}</span>
                  <span className="font-mono font-bold text-slate-900">{data.ifsc_code || '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Address Bar */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/40">
            <div className="flex items-start space-x-3 text-xs">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  {t.verificationPage.fullAddressLabel}
                </span>
                <p className="text-slate-800 font-medium text-xs leading-relaxed">
                  {data.address || '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice & Link Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 print:text-[10px]">
          <p className="text-center sm:text-left">
            {t.verificationPage.footerNote}
          </p>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium transition flex items-center space-x-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.verificationPage.linkCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.verificationPage.copyLink}</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenCreateCard}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.verificationPage.openCardMaker}</span>
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} openInSameTab={true} />
    </div>
  );
};
