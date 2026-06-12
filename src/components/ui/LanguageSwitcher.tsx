"use client";

import { useI18n, LOCALES } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className="inline-flex rounded-full bg-white/80 border-2 border-slate-200 p-1 shadow"
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
            locale === l.code ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
