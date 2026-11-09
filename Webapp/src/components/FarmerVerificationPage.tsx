import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  User,
  CreditCard,
  Phone,
  MapPin,
  Landmark,
  Calendar,
  Share2,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  FileCheck,
  Layers,
  Award
} from 'lucide-react';
import { FarmerVerificationData } from '../lib/verificationUrl';
import { AppPage } from '../lib/navigation';
import { Footer } from './Footer';
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const verificationTime = new Date().toLocaleDateString('mr-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert('Link copied: ' + window.location.href);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: `शेतकरी माहिती: ${data.farmer_name || 'शेतकरी'}`,
          text: `शेतकरी ओळख क्रमांक: ${data.farmer_id}\nPM किसान: ${data.enrollment_no}\nगाव: ${data.village || '--'}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // If no data is available in the URL
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <FileCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              कोणतीही माहिती आढळली नाही
            </h2>
            <p className="text-xs text-slate-500">
              No record found in QR parameters.
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            कृपया ओळखपत्रावरील QR कोड पुन्हा स्कॅन करा किंवा मुख्य पृष्ठावर जाऊन नवीन कार्ड तयार करा.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>कार्ड जनरेटरवर जा</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans print:bg-white print:p-0">
      {/* Top Government-Style Tricolor Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 print:hidden" />

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1.5 shadow-sm">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  माझे किसान कार्ड
                </span>
                {/* <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                  प्रमाणीकरण
                </span> */}
              </div>
              {/* <p className="text-[11px] text-slate-500 font-medium">
                Farmer Identity Verification Portal
              </p> */}
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">कार्ड जनरेटरवर जा</span>
            <span className="sm:hidden">होम</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4 print:p-0 print:space-y-3">
        {/* Verification Success Banner */}


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
                        : 'श'}
                    </span>
                  )}
                </div>

                <div>
                  {/* <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 inline text-emerald-600" />
                    <span>नोंदणीकृत शेतकरी प्रोफाइल</span>
                  </div> */}
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {data.farmer_name || '--'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                    {data.gender && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                        {data.gender}
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
                        जि. {data.district}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Farmer ID Chips */}
              <div className="w-full sm:w-auto flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    शेतकरी ओळख क्रमांक (Farmer ID)
                  </span>
                  <div className="flex items-center justify-between sm:justify-start space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {data.farmer_id || '--'}
                    </span>
                    {data.farmer_id && (
                      <button
                        onClick={() => handleCopyText(data.farmer_id, 'farmer_id')}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition"
                        title="Copy Farmer ID"
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
                    PM किसान नंबर (Enrollment No)
                  </span>
                  <div className="flex items-center justify-between sm:justify-start space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {data.enrollment_no || '--'}
                    </span>
                    {data.enrollment_no && (
                      <button
                        onClick={() => handleCopyText(data.enrollment_no, 'enrollment_no')}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition"
                        title="Copy PM Kisan No"
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
            {/* 1. वैयक्तिक माहिती (Personal Details) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-emerald-600" />
                <span>वैयक्तिक माहिती (Personal Details)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">शेतकऱ्याचे नाव:</span>
                  <span className="font-bold text-slate-900 text-right">{data.farmer_name || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">जन्मतारीख:</span>
                  <span className="font-semibold text-slate-800">{data.dob || '--'}</span>
                </div>

                {data.age && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">वय:</span>
                    <span className="font-semibold text-slate-800">{data.age} वर्षे</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">लिंग:</span>
                  <span className="font-semibold text-slate-800">{data.gender || '--'}</span>
                </div>

                {data.caste_category && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">जात प्रवर्ग:</span>
                    <span className="font-semibold text-slate-800">{data.caste_category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. ओळख व संपर्क तपशील (Identity & Contact) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>ओळख व संपर्क (Identity & Contact)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">मोबाईल क्रमांक:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-slate-900">{data.mobile_number || '--'}</span>
                    {data.mobile_number && data.mobile_number !== '--' && (
                      <a
                        href={`tel:${data.mobile_number}`}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 border border-emerald-200"
                        title="Call Mobile"
                      >
                        <Phone className="w-3 h-3" />
                        <span>कॉल</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">आधार क्रमांक:</span>
                  <span className="font-mono font-bold text-slate-900">{data.aadhaar_number || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">पॅन कार्ड:</span>
                  <span className="font-mono font-bold text-slate-900">{data.pan_card || '--'}</span>
                </div>

                {/* <div className="flex justify-between py-1">
                  <span className="text-slate-500">ओळखपत्र स्थिती:</span>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>सक्रिय व वैध (Active)</span>
                  </span>
                </div> */}
              </div>
            </div>

            {/* 3. जमिनीचा तपशील (Land Records) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>जमिनीचा तपशील (Land Records)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">गट / सर्व्हे नंबर:</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm">
                    {data.survey_no || '--'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">गाव (Village):</span>
                  <span className="font-semibold text-slate-800">{data.village || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">तालुका (Sub-district):</span>
                  <span className="font-semibold text-slate-800">{data.sub_district || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">जिल्हा (District):</span>
                  <span className="font-semibold text-slate-800">{data.district || '--'}</span>
                </div>

                {data.total_area && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">एकूण क्षेत्र (Total Area):</span>
                    <span className="font-bold text-slate-900">{data.total_area} हेक्टर</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. बँक तपशील (Bank Details - if present) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>बँक तपशील (Bank Details)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">बँक नाव व शाखा:</span>
                  <span className="font-semibold text-slate-800 text-right">{data.bank_name || '--'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">बचत खाते क्रमांक:</span>
                  <span className="font-mono font-bold text-slate-900">{data.account_no || '--'}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">IFSC कोड:</span>
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
                  संपूर्ण पत्ता (Full Address)
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
            माझे किसान कार्ड • This is strictly for personal reference & informational reference.
          </p>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium transition flex items-center space-x-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>लिंक कॉपी झाली</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>लिंक कॉपी करा</span>
                </>
              )}
            </button>

            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>कार्ड मेकर उघडा</span>
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

