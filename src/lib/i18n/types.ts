export type Locale = "zh" | "en" | "ms";

export const LOCALES: { code: Locale; label: string; speechLang: string }[] = [
  { code: "zh", label: "中文", speechLang: "zh-CN" },
  { code: "en", label: "English", speechLang: "en-GB" },
  { code: "ms", label: "B. Melayu", speechLang: "ms-MY" },
];

export const DEFAULT_LOCALE: Locale = "zh";

export type Dictionary = Record<string, string>;
