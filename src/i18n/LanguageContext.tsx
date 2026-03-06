import { createContext, useContext } from "react";

export type Lang = "sv" | "en";

const LanguageContext = createContext<Lang>("sv");

export const LanguageProvider = LanguageContext.Provider;

export const useLang = () => useContext(LanguageContext);

export const t = (lang: Lang, sv: string, en: string) => (lang === "en" ? en : sv);
