import { messagesFr } from "./messages.fr";
import type { AppLocale, TFunction, TParams } from "./types";

export function interpolate(template: string, params?: TParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function createTranslate(_locale: AppLocale): TFunction {
  return (key: string, params?: TParams): string => {
    const raw = messagesFr[key] ?? key;
    return interpolate(raw, params);
  };
}

/** Fallback sans Context : Français par défaut */
export const defaultT = createTranslate("fr");

export function normalizeLocale(_raw: unknown): AppLocale {
  return "fr";
}
