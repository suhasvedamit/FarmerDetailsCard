import React from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  ShieldAlert,
  Ban,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../i18n';

interface TermsPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <PageLayout
      currentPage="terms"
      title={t.termsPage.title}
      subtitle={t.termsPage.subtitle}
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Important Warning Callout */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-800 font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold">{t.termsPage.warningTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 leading-normal">
            {t.termsPage.warningBodyStart}{' '}
            <strong>{t.termsPage.warningBodyHighlight1}</strong>
            {t.termsPage.warningBodyMid1}{' '}
            <strong>{t.termsPage.warningBodyHighlight2}</strong>
            {t.termsPage.warningBodyMid2}{' '}
            <strong>{t.termsPage.warningBodyHighlight3}</strong>
            {t.termsPage.warningBodyEnd}
          </p>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
            <h3>{t.termsPage.s1Title}</h3>
          </div>
          <p>{t.termsPage.s1Body}</p>
        </section>

        {/* 2. Nature and Scope of Service */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</span>
            <h3>{t.termsPage.s2Title}</h3>
          </div>
          <p>{t.termsPage.s2Intro}</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            {t.termsPage.s2Items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* 3. Strict Non-Government Affiliation */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
            <h3>{t.termsPage.s3Title}</h3>
          </div>
          <p>{t.termsPage.s3Intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <strong className="text-slate-900 block mb-1">{t.termsPage.s3Card1Title}</strong>
              {t.termsPage.s3Card1Desc}
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <strong className="text-slate-900 block mb-1">{t.termsPage.s3Card2Title}</strong>
              {t.termsPage.s3Card2Desc}
            </div>
          </div>
        </section>

        {/* 4. Permitted and Authorized Use */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
            <h3>{t.termsPage.s4Title}</h3>
          </div>
          <p>{t.termsPage.s4Intro}</p>
          <div className="space-y-2">
            {t.termsPage.s4Items.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Strictly Prohibited Uses */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">5</span>
            <h3 className="text-red-900">{t.termsPage.s5Title}</h3>
          </div>
          <p>{t.termsPage.s5Intro}</p>
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-2.5 text-xs sm:text-sm text-red-950">
            {t.termsPage.s5Items.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. User Responsibility for Accuracy */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">6</span>
            <h3>{t.termsPage.s6Title}</h3>
          </div>
          <p>{t.termsPage.s6Body1}</p>
          <p className="text-xs sm:text-sm text-slate-600">{t.termsPage.s6Body2}</p>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">7</span>
            <h3>{t.termsPage.s7Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.termsPage.s7Body}</p>
        </section>

        {/* 8. Intellectual Property & Fair Use */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">8</span>
            <h3>{t.termsPage.s8Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.termsPage.s8Body}</p>
        </section>

        {/* 9. Governing Law */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">9</span>
            <h3>{t.termsPage.s9Title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">{t.termsPage.s9Body}</p>
        </section>

        {/* Contact Strip */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {t.termsPage.footerQuestion}{' '}
            <span className="font-semibold text-slate-700">sairajservice7@gmail.com</span>.
          </p>
          <button
            onClick={() => (onNavigate ? onNavigate('contact') : undefined)}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
          >
            <span>{t.termsPage.footerLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
