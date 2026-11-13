import React, { useEffect } from 'react';
import { AlertTriangle, Pencil, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';

interface EmptyFieldsAlertModalProps {
  isOpen: boolean;
  onProceedAnyway: () => void;
  onEditForm: () => void;
}

export const EmptyFieldsAlertModal: React.FC<EmptyFieldsAlertModalProps> = ({
  isOpen,
  onProceedAnyway,
  onEditForm,
}) => {
  const { t } = useLanguage();

  // Close on Escape key (treats as "Edit Form")
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEditForm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEditForm]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="empty-fields-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onEditForm();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-800 animate-fadeIn text-center space-y-4">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <h2
            id="empty-fields-modal-title"
            className="text-lg font-extrabold text-slate-900"
          >
            {t.createCard.emptyFieldsAlertTitle}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            {t.createCard.emptyFieldsAlertDesc}
          </p>
        </div>

        {/* Actions: Edit Form & Proceed Anyway */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEditForm}
            className="w-full sm:flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">{t.createCard.btnEditForm}</span>
          </button>

          <button
            type="button"
            onClick={onProceedAnyway}
            className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer"
          >
            <span className="whitespace-nowrap">{t.createCard.btnProceedAnyway}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
