import React from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  ShieldCheck,
  Lock,
  Cpu,
  EyeOff,
  Database,
  Trash2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../i18n';

interface PrivacyPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <PageLayout
      currentPage="privacy"
      title={t.privacyPage.title}
      subtitle={t.privacyPage.subtitle}
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Highlight Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <h2 className="text-base font-bold">{t.privacyPage.bannerTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950">
            <strong>{t.privacyPage.bannerHighlight}</strong> {t.privacyPage.bannerBody}
          </p>
        </div>

        {/* 1. Secure Processing & Card Rendering */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Cpu className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s1Title}</h3>
          </div>
          <p>{t.privacyPage.s1Intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{t.privacyPage.s1Card1Title}</span>
              </span>
              <p className="text-slate-600">{t.privacyPage.s1Card1Desc}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{t.privacyPage.s1Card2Title}</span>
              </span>
              <p className="text-slate-600">{t.privacyPage.s1Card2Desc}</p>
            </div>
          </div>
        </section>

        {/* 2. Information Handled */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <EyeOff className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s2Title}</h3>
          </div>
          <p>{t.privacyPage.s2Intro}</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 list-disc pl-5">
              {t.privacyPage.s2Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500 italic">{t.privacyPage.s2Note}</p>
        </section>

        {/* 3. QR Code & Verification Data */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s3Title}</h3>
          </div>
          <p>{t.privacyPage.s3Intro}</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            {t.privacyPage.s3Items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* 4. No Third-Party Data Sharing */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Lock className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s4Title}</h3>
          </div>
          <p>{t.privacyPage.s4Intro}</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            {t.privacyPage.s4Items.map((item, idx) => (
              <li key={idx}>
                <strong>{item.label}</strong> {item.desc}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. User Rights & Data Deletion */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Trash2 className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s5Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.privacyPage.s5Intro}</p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs sm:text-sm">
            <p>{t.privacyPage.s5Body}</p>
          </div>
        </section>

        {/* 6. Security Standards */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3>{t.privacyPage.s6Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.privacyPage.s6Body}</p>
        </section>

        {/* Contact Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {t.privacyPage.footerQuestion}{' '}
            <span className="font-semibold text-slate-700">sairajservice7@gmail.com</span>.
          </p>
          <button
            onClick={() => (onNavigate ? onNavigate('contact') : undefined)}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
          >
            <span>{t.privacyPage.footerLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
