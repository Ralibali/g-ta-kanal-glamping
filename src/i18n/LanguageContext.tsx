import { createContext, useContext } from "react";

export type Lang = "sv" | "en" | "de";

const LanguageContext = createContext<Lang>("sv");

export const LanguageProvider = LanguageContext.Provider;

export const useLang = () => useContext(LanguageContext);

/**
 * Translation helper.
 * - sv: Swedish (default)
 * - en: English
 * - de: German (optional — falls back to English if not provided)
 */
export const t = (lang: Lang, sv: string, en: string, de?: string) => {
  if (lang === "en") return en;
  if (lang === "de") return de ?? en;
  return sv;
};
