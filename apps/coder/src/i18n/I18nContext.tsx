import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { createTranslate, normalizeLocale } from "./createTranslate";
import type { AppLocale, TFunction } from "./types";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: TFunction;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = "fr",
}: {
  children?: ReactNode;
  initialLocale?: AppLocale;
}) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);
  const t = useMemo(() => createTranslate(locale), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** Utilisable hors Provider (tests, etc.) */
export function useI18nOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}

export { normalizeLocale };
