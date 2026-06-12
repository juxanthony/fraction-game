"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, Dictionary, Locale, LOCALES } from "./types";
import zh from "./locales/zh";
import en from "./locales/en";
import ms from "./locales/ms";

const DICTIONARIES: Record<Locale, Dictionary> = { zh, en, ms };
const STORAGE_KEY = "ftw:locale";

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
  speechLang: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) =>
    params[name] !== undefined ? String(params[name]) : m
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && DICTIONARIES[saved as Locale]) setLocaleState(saved as Locale);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* private mode */
    }
  }, []);

  const t = useCallback<TFunction>(
    (key, params) => {
      const dict = DICTIONARIES[locale];
      const template = dict[key] ?? DICTIONARIES.en[key] ?? key;
      return interpolate(template, params);
    },
    [locale]
  );

  const speechLang = LOCALES.find((l) => l.code === locale)?.speechLang ?? "en-GB";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, speechLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export { LOCALES };
export type { Locale };
