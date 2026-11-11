import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, LanguageMeta, Translations } from './types';
import { en } from './locales/en';
import { mr } from './locales/mr';

export const LANGUAGE_STORAGE_KEY = 'farmer_card_language_v1';
export const DEFAULT_LANGUAGE: Language = 'en';

export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    shortLabel: 'मराठी',
  },
];

const TRANSLATIONS: Record<Language, Translations> = {
  en,
  mr,
};

export function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in TRANSLATIONS;
}

export function getTranslations(language: Language): Translations {
  return TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
}

export function formatMessage(
  template: string,
  variables?: Record<string, string | number>
): string {
  if (!variables) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang')?.toLowerCase().trim();
    if (isSupportedLanguage(urlLang)) {
      return urlLang;
    }
  } catch {
    // ignore URL read errors
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // ignore storage read errors
  }

  try {
    const navLang = window.navigator.language?.toLowerCase();
    if (navLang && navLang.startsWith('mr')) {
      return 'mr';
    }
  } catch {
    // ignore navigator access errors
  }

  return DEFAULT_LANGUAGE;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languages: readonly LanguageMeta[];
  format: (template: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => resolveInitialLanguage());

  const setLanguage = useCallback((nextLang: Language) => {
    if (!isSupportedLanguage(nextLang)) return;
    setLanguageState(nextLang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    } catch {
      // ignore storage write errors
    }
  }, []);

  const t = getTranslations(language);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
    document.title = t.meta.pageTitle;
  }, [language, t.meta.pageTitle]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      format: formatMessage,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

