import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'light';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeMeta = languages.find((item) => item.code === language) || languages[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const buttonClasses =
    variant === 'header'
      ? 'bg-emerald-950/50 hover:bg-emerald-700/70 text-emerald-50 border border-emerald-500/40'
      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200';

  const iconClasses = variant === 'header' ? 'text-emerald-200' : 'text-emerald-700';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t.common.selectLanguageAria}
        title={t.common.selectLanguageAria}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${buttonClasses}`}
      >
        <Languages className={`w-3.5 h-3.5 shrink-0 ${iconClasses}`} />
        <span className="hidden sm:inline">{activeMeta.nativeName}</span>
        <span className="sm:hidden">{activeMeta.shortLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-80 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t.common.selectLanguageAria}
          className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50 text-slate-800 animate-fadeIn"
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            {t.common.languageLabel}
          </div>
          {languages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex flex-col">
                  <span>{item.nativeName}</span>
                  {item.nativeName !== item.name && (
                    <span className="text-[10px] text-slate-400 font-normal">{item.name}</span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

