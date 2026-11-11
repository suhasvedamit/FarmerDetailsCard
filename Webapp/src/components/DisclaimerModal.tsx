import React from 'react';
import { ShieldAlert, AlertTriangle, FileWarning, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n';
import { LanguageSelector } from './LanguageSelector';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onBackHome?: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onBackHome,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 text-slate-800 overflow-hidden animate-fadeIn">
        {/* Header with Warning Icon + Language Switcher */}
        <div className="px-4 pt-3.5 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3 border-b border-slate-100 flex items-start justify-between gap-2 shrink-0">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg sm:rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-0.5">
                {t.disclaimerModal.badge}
              </span>
              <h2
                id="disclaimer-modal-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug"
              >
                {t.disclaimerModal.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                {t.disclaimerModal.subtitle}
              </p>
            </div>
          </div>

          <LanguageSelector variant="light" className="shrink-0" />
        </div>

        {/* Scrollable Body */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3.5 overflow-y-auto min-h-0 space-y-2.5">
          {/* Informative Notice Points */}
          <div className="space-y-2 text-xs text-slate-600 leading-snug sm:leading-relaxed bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-start space-x-2">
              <div className="mt-0.5 text-amber-600 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800 font-semibold">{t.disclaimerModal.point1Title}</strong>{' '}
                {t.disclaimerModal.point1Before}{' '}
                <span className="text-amber-800 font-medium">{t.disclaimerModal.point1Highlight}</span>
                {t.disclaimerModal.point1After.startsWith('.') ? t.disclaimerModal.point1After : ` ${t.disclaimerModal.point1After}`}
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <div className="mt-0.5 text-amber-600 shrink-0">
                <FileWarning className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800 font-semibold">{t.disclaimerModal.point2Title}</strong>{' '}
                {t.disclaimerModal.point2Before}{' '}
                <span className="text-slate-900 font-medium">{t.disclaimerModal.point2Highlight}</span>
                {t.disclaimerModal.point2After}
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <div className="mt-0.5 text-red-600 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800 font-semibold">{t.disclaimerModal.point3Title}</strong>{' '}
                {t.disclaimerModal.point3Before}{' '}
                <span className="text-red-700 font-medium">{t.disclaimerModal.point3Highlight}</span>
                {t.disclaimerModal.point3After}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-snug px-1">
            {t.disclaimerModal.acknowledgeBefore ? `${t.disclaimerModal.acknowledgeBefore} ` : ''}
            <strong className="text-slate-700 font-semibold">{t.disclaimerModal.acknowledgeButtonName}</strong>
            {t.disclaimerModal.acknowledgeAfter}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-3.5 pt-2.5 sm:px-5 sm:pb-4 sm:pt-3 border-t border-slate-100 bg-white space-y-1.5 shrink-0">
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t.disclaimerModal.acceptButton}</span>
          </button>

          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="w-full py-1.5 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>{t.disclaimerModal.backHomeButton}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
