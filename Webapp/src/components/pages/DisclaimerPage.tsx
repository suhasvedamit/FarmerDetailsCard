import React from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  ShieldAlert,
  FileWarning,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../i18n';

interface DisclaimerPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const DisclaimerPage: React.FC<DisclaimerPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <PageLayout
      currentPage="disclaimer"
      title={t.disclaimerPage.title}
      subtitle={t.disclaimerPage.subtitle}
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Urgent Prominent Box */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-7 space-y-3">
          <div className="flex items-center space-x-3 text-amber-900 font-extrabold text-base sm:text-lg">
            <ShieldAlert className="w-7 h-7 text-amber-700 shrink-0" />
            <h2>{t.disclaimerPage.bannerTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            {t.disclaimerPage.bannerBody}
          </p>
        </div>

        {/* 1. Independent Third-Party Status */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            <h3>{t.disclaimerPage.s1Title}</h3>
          </div>
          <p>{t.disclaimerPage.s1Body1}</p>
          <p className="text-xs sm:text-sm text-slate-600">{t.disclaimerPage.s1Body2}</p>
        </section>

        {/* 2. No Legal or Statutory Validity */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900">{t.disclaimerPage.s2Title}</h3>
          </div>
          <p>{t.disclaimerPage.s2Intro}</p>
          <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-red-950">
            {t.disclaimerPage.s2Items.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>{item.strong}</strong> {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Purpose: Personal Convenience Only */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <h3>{t.disclaimerPage.s3Title}</h3>
          </div>
          <p>{t.disclaimerPage.s3Intro}</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            {t.disclaimerPage.s3Items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* 4. Verification QR Code Disclaimer */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <HelpCircle className="w-5 h-5 text-emerald-700" />
            <h3>{t.disclaimerPage.s4Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.disclaimerPage.s4Body}</p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700">
            <strong>{t.disclaimerPage.s4ImportantLabel}</strong>{' '}
            {t.disclaimerPage.s4ImportantText}
          </div>
        </section>

        {/* 5. OCR Accuracy & User Verification */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <FileWarning className="w-5 h-5 text-amber-600" />
            <h3>{t.disclaimerPage.s5Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.disclaimerPage.s5Body1}</p>
          <p className="text-xs sm:text-sm text-slate-600">{t.disclaimerPage.s5Body2}</p>
        </section>

        {/* 6. Nominative Fair Use of Trademarks */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            <h3>{t.disclaimerPage.s6Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.disclaimerPage.s6Body}</p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {t.disclaimerPage.footerQuestion}{' '}
            <span className="font-semibold text-slate-700">sairajservice7@gmail.com</span>.
          </p>
          <button
            onClick={() => (onNavigate ? onNavigate('terms') : undefined)}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
          >
            <span>{t.disclaimerPage.footerLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
