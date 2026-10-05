/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — THEME CONTEXT (src/context/ThemeContext.tsx)
 * Global Theme Manager: Light (Default), Dark & System + Personnalisation
 * (couleur d'accent, taille de texte) appliquée via variables CSS.
 * ============================================================================
 */

import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ApiService } from "@/lib/vibe/services/api";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type AccentColor =
  | "white"
  | "blue"
  | "violet"
  | "emerald"
  | "rose"
  | "amber";
export type FontSize = "small" | "medium" | "large";

export type MessageBubbleTheme =
  | "monochrome"
  | "gradient-vibe"
  | "gradient-ocean"
  | "gradient-sunset"
  | "gradient-emerald"
  | "gradient-fuchsia"
  | "gradient-amber"
  | "gradient-carbon"
  | "gradient-noir"
  | "solid-accent";

export type ChatBackgroundTheme =
  | "default"
  | "slate"
  | "midnight"
  | "sunset"
  | "emerald"
  | "ocean"
  | "carbon"
  | "minimal-dark"
  | "minimal-light";

export type MessageBubbleShape = "pill" | "modern" | "classic" | "compact";

export interface BubbleThemeConfig {
  border?: string;
  gradient: string;
  id: MessageBubbleTheme;
  label: string;
  textColor: "light" | "dark" | "adaptive";
}

export interface ChatBgConfig {
  id: ChatBackgroundTheme;
  label: string;
  previewBg: string;
  style: string;
}

export const MESSAGE_BUBBLE_THEMES: Record<
  MessageBubbleTheme,
  BubbleThemeConfig
> = {
  monochrome: {
    border: "var(--vibe-sent-bubble-border)",
    gradient: "var(--vibe-sent-bubble-bg)",
    id: "monochrome",
    label: "Noir & Blanc Vibe",
    textColor: "adaptive",
  },
  "gradient-sunset": {
    gradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
    id: "gradient-sunset",
    label: "Dégradé Sunset",
    textColor: "light",
  },
  "gradient-vibe": {
    gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    id: "gradient-vibe",
    label: "Dégradé Cosmos",
    textColor: "light",
  },
  "gradient-ocean": {
    gradient: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)",
    id: "gradient-ocean",
    label: "Dégradé Océan",
    textColor: "light",
  },
  "gradient-emerald": {
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    id: "gradient-emerald",
    label: "Dégradé Émeraude",
    textColor: "light",
  },
  "gradient-fuchsia": {
    gradient: "linear-gradient(135deg, #d946ef 0%, #f43f5e 100%)",
    id: "gradient-fuchsia",
    label: "Dégradé Fuchsia Neon",
    textColor: "light",
  },
  "gradient-amber": {
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    id: "gradient-amber",
    label: "Dégradé Ambre & Or",
    textColor: "light",
  },
  "gradient-carbon": {
    gradient: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)",
    id: "gradient-carbon",
    label: "Dégradé Carbone Titanium",
    textColor: "light",
  },
  "gradient-noir": {
    border: "1px solid rgba(255,255,255,0.18)",
    gradient: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
    id: "gradient-noir",
    label: "Noir Luxueux",
    textColor: "light",
  },
  "solid-accent": {
    gradient: "var(--vibe-accent, #ffffff)",
    id: "solid-accent",
    label: "Couleur d’accent",
    textColor: "dark",
  },
};
export const CHAT_BACKGROUND_THEMES: Record<ChatBackgroundTheme, ChatBgConfig> =
  {
    default: {
      id: "default",
      label: "Adaptatif (Thème Vibe)",
      previewBg: "bg-zinc-100 vibe-dark:bg-zinc-900",
      style: "",
    },
    slate: {
      id: "slate",
      label: "Nuit Ardoise",
      previewBg: "bg-slate-950",
      style: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    },
    midnight: {
      id: "midnight",
      label: "Minuit Indigo",
      previewBg: "bg-indigo-950",
      style: "linear-gradient(180deg, #1e1b4b 0%, #030712 100%)",
    },
    sunset: {
      id: "sunset",
      label: "Crépuscule Améthyste",
      previewBg: "bg-purple-950",
      style: "linear-gradient(180deg, #3b0764 0%, #09090b 100%)",
    },
    emerald: {
      id: "emerald",
      label: "Profondeur Émeraude",
      previewBg: "bg-emerald-950",
      style: "linear-gradient(180deg, #064e3b 0%, #020617 100%)",
    },
    ocean: {
      id: "ocean",
      label: "Abysses Marines",
      previewBg: "bg-sky-950",
      style: "linear-gradient(180deg, #0c4a6e 0%, #020617 100%)",
    },
    carbon: {
      id: "carbon",
      label: "Carbone Furtif",
      previewBg: "bg-zinc-900",
      style: "linear-gradient(180deg, #27272a 0%, #09090b 100%)",
    },
    "minimal-dark": {
      id: "minimal-dark",
      label: "Noir Profond (OLED)",
      previewBg: "bg-black",
      style: "#000000",
    },
    "minimal-light": {
      id: "minimal-light",
      label: "Blanc Pur Épuré",
      previewBg: "bg-zinc-100",
      style: "#f8fafc",
    },
  };

export const MESSAGE_BUBBLE_SHAPES: Record<
  MessageBubbleShape,
  { label: string; meRadius: string; partnerRadius: string }
> = {
  pill: {
    label: "Très arrondi (Pilule)",
    meRadius: "rounded-3xl",
    partnerRadius: "rounded-3xl",
  },
  modern: {
    label: "Moderne (Doux)",
    meRadius: "rounded-2xl",
    partnerRadius: "rounded-2xl",
  },
  classic: {
    label: "Classique (Bulle à angle)",
    meRadius: "rounded-2xl rounded-tr-sm",
    partnerRadius: "rounded-2xl rounded-tl-sm",
  },
  compact: {
    label: "Compact ergonomique",
    meRadius: "rounded-xl",
    partnerRadius: "rounded-xl",
  },
};

/** Plage horaire de bascule automatique du thème (format "HH:MM"). */
export interface ScheduledTheme {
  darkEnd: string;
  darkStart: string;
  enabled: boolean;
}

export const DEFAULT_SCHEDULED_THEME: ScheduledTheme = {
  darkEnd: "07:00",
  darkStart: "22:00",
  enabled: false,
};

interface ThemeContextType {
  accentColor: AccentColor;
  chatBackgroundTheme: ChatBackgroundTheme;
  fontSize: FontSize;
  messageBubbleShape: MessageBubbleShape;
  messageBubbleTheme: MessageBubbleTheme;
  resolvedTheme: ResolvedTheme;
  scheduledTheme: ScheduledTheme;
  setAccentColor: (c: AccentColor) => void;
  setChatBackgroundTheme: (bg: ChatBackgroundTheme) => void;
  setFontSize: (s: FontSize) => void;
  setMessageBubbleShape: (s: MessageBubbleShape) => void;
  setMessageBubbleTheme: (t: MessageBubbleTheme) => void;
  setScheduledTheme: (s: ScheduledTheme) => void;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "vibe_theme_preference";
const ACCENT_KEY = "vibe_accent_color";
const FONT_KEY = "vibe_font_size";
const MSG_BUBBLE_KEY = "vibe_message_bubble_theme";
const CHAT_BG_KEY = "vibe_chat_bg_theme";
const MSG_SHAPE_KEY = "vibe_message_bubble_shape";
const SCHED_KEY = "vibe_scheduled_theme";

const parseScheduledTheme = (raw: string | null): ScheduledTheme => {
  if (!raw) return { ...DEFAULT_SCHEDULED_THEME };
  try {
    const parsed = JSON.parse(raw);
    const hhmm = (v: unknown, fallback: string) =>
      typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : fallback;
    return {
      darkEnd: hhmm(parsed.darkEnd, DEFAULT_SCHEDULED_THEME.darkEnd),
      darkStart: hhmm(parsed.darkStart, DEFAULT_SCHEDULED_THEME.darkStart),
      enabled: Boolean(parsed.enabled),
    };
  } catch {
    return { ...DEFAULT_SCHEDULED_THEME };
  }
};

/** true si l'heure courante (HH:MM) tombe dans la plage sombre (gère le chevauchement minuit). */
export const isDarkScheduledNow = (
  sched: ScheduledTheme,
  now = new Date()
): boolean => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const cur = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (sched.darkStart <= sched.darkEnd) {
    return cur >= sched.darkStart && cur < sched.darkEnd;
  }
  return cur >= sched.darkStart || cur < sched.darkEnd;
};

/** Couleurs d'accent disponibles (hex clairs, lisibles avec du texte noir). */
export const ACCENT_COLORS: Record<
  AccentColor,
  { label: string; hex: string }
> = {
  white: { hex: "#ffffff", label: "Blanc" },
  blue: { hex: "#7cc4ff", label: "Bleu" },
  violet: { hex: "#c4b5fd", label: "Violet" },
  emerald: { hex: "#6ee7b7", label: "Émeraude" },
  rose: { hex: "#fda4af", label: "Rose" },
  amber: { hex: "#fcd34d", label: "Ambre" },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function loadStored<T extends string>(
  key: string,
  allowed: T[],
  fallback: T
): T {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key) as T | null;
  return saved && allowed.includes(saved) ? saved : fallback;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Racine Vibe : porte les classes de thème et les variables de
  // personnalisation. Tout ce que Vibe modifie au niveau du thème s'arrête ici
  // (voir le commentaire sur le premier effet de thème).
  const rootRef = useRef<HTMLDivElement>(null);

  // Global default is 'light' as explicitly requested
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && ["light", "dark", "system"].includes(s)) return s as ThemeMode;
    }
    return "light";
  });
  const [accentColor, setAccentState] = useState<AccentColor>(() =>
    loadStored<AccentColor>(
      ACCENT_KEY,
      ["white", "blue", "violet", "emerald", "rose", "amber"],
      "white"
    )
  );
  const [fontSize, setFontState] = useState<FontSize>(() =>
    loadStored<FontSize>(FONT_KEY, ["small", "medium", "large"], "medium")
  );
  const [messageBubbleTheme, setMessageBubbleThemeState] =
    useState<MessageBubbleTheme>(() =>
      loadStored<MessageBubbleTheme>(
        MSG_BUBBLE_KEY,
        [
          "monochrome",
          "gradient-vibe",
          "gradient-ocean",
          "gradient-sunset",
          "gradient-emerald",
          "gradient-carbon",
          "gradient-noir",
          "solid-accent",
        ],
        "monochrome"
      )
    );
  const [chatBackgroundTheme, setChatBackgroundThemeState] =
    useState<ChatBackgroundTheme>(() =>
      loadStored<ChatBackgroundTheme>(
        CHAT_BG_KEY,
        [
          "default",
          "slate",
          "midnight",
          "sunset",
          "emerald",
          "minimal-dark",
          "minimal-light",
        ],
        "default"
      )
    );
  const [messageBubbleShape, setMessageBubbleShapeState] =
    useState<MessageBubbleShape>(() =>
      loadStored<MessageBubbleShape>(
        MSG_SHAPE_KEY,
        ["pill", "modern", "classic"],
        "pill"
      )
    );

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [scheduledTheme, setScheduledThemeState] = useState<ScheduledTheme>(
    () => {
      if (typeof window !== "undefined") {
        return parseScheduledTheme(localStorage.getItem(SCHED_KEY));
      }
      return { ...DEFAULT_SCHEDULED_THEME };
    }
  );

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  // Applique le thème sur la RACINE VIBE, pas sur le document.
  //
  // La version Vite posait `.dark`/`.light` sur `document.documentElement` et
  // `body`. Intégré, cela ferait basculer le thème de TOUTE l'application mAI
  // depuis la page Vibe. Les classes sont donc portées par l'élément `.vibe-root`
  // posé par <VibeApp>, et les tokens correspondants sont définis sous ce même
  // scope dans components/vibe/vibe.css.
  //
  // Le `theme-color` reste sur `<meta>` : c'est une propriété du document, pas
  // une question de portée, et la barre d'état mobile doit refléter la page
  // affichée.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.setProperty("--vibe-sent-bubble-bg", "#18181b");
      root.style.setProperty("--vibe-sent-bubble-color", "#ffffff");
      root.style.setProperty("--vibe-sent-bubble-border", "1px solid #3f3f46");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.setProperty("--vibe-sent-bubble-bg", "#ffffff");
      root.style.setProperty("--vibe-sent-bubble-color", "#000000");
      root.style.setProperty(
        "--vibe-sent-bubble-border",
        "1.5px solid #000000"
      );
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#000000" : "#ffffff"
      );
    }
  }, [resolvedTheme]);

  // Personnalisation : couleur d'accent + taille de texte, Bornées à la racine
  // Vibe. `font-size` sur `documentElement` REDIMENSIONNERAIT toute l'application
  // mAI — la sidebar, le chat, tout le chrome — depuis la page Vibe.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--vibe-accent", ACCENT_COLORS[accentColor].hex);
    root.style.fontSize = FONT_SIZES[fontSize];
  }, [accentColor, fontSize]);

  // Synchronisation avec les réglages de la base de données
  useEffect(() => {
    ApiService.getSettings()
      .then((res) => {
        const s = res?.settings;
        if (!s) return;
        if (
          s.message_bubble_theme &&
          s.message_bubble_theme in MESSAGE_BUBBLE_THEMES
        ) {
          setMessageBubbleThemeState(
            s.message_bubble_theme as MessageBubbleTheme
          );
          localStorage.setItem(MSG_BUBBLE_KEY, s.message_bubble_theme);
        }
        if (
          s.chat_background_theme &&
          s.chat_background_theme in CHAT_BACKGROUND_THEMES
        ) {
          setChatBackgroundThemeState(
            s.chat_background_theme as ChatBackgroundTheme
          );
          localStorage.setItem(CHAT_BG_KEY, s.chat_background_theme);
        }
        if (
          s.message_bubble_shape &&
          s.message_bubble_shape in MESSAGE_BUBBLE_SHAPES
        ) {
          setMessageBubbleShapeState(
            s.message_bubble_shape as MessageBubbleShape
          );
          localStorage.setItem(MSG_SHAPE_KEY, s.message_bubble_shape);
        }
        if (s.accent_color && s.accent_color in ACCENT_COLORS) {
          setAccentState(s.accent_color as AccentColor);
          localStorage.setItem(ACCENT_KEY, s.accent_color);
        }
        if (s.font_size && ["small", "medium", "large"].includes(s.font_size)) {
          setFontState(s.font_size as FontSize);
          localStorage.setItem(FONT_KEY, s.font_size);
        }
        if (s.scheduled_theme) {
          const parsed = parseScheduledTheme(
            typeof s.scheduled_theme === "string"
              ? s.scheduled_theme
              : JSON.stringify(s.scheduled_theme)
          );
          setScheduledThemeState(parsed);
          if (typeof window !== "undefined")
            localStorage.setItem(SCHED_KEY, JSON.stringify(parsed));
        }
        if (
          s.theme_preference &&
          ["light", "dark", "system"].includes(s.theme_preference)
        ) {
          const local =
            typeof window === "undefined"
              ? null
              : localStorage.getItem(STORAGE_KEY);
          if (local && ["light", "dark", "system"].includes(local)) {
            // Si l'utilisateur a changé localement, propager à la base de données
            if (local !== s.theme_preference) {
              ApiService.updateSettings({ theme_preference: local }).catch(
                () => {}
              );
            }
          } else {
            setThemeState(s.theme_preference as ThemeMode);
            localStorage.setItem(STORAGE_KEY, s.theme_preference);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
    ApiService.updateSettings({ theme_preference: newTheme }).catch(() => {});
  };

  const setScheduledTheme = (sched: ScheduledTheme) => {
    setScheduledThemeState(sched);
    if (typeof window !== "undefined") {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    }
    ApiService.updateSettings({
      scheduled_theme: JSON.stringify(sched),
    } as any).catch(() => {});
  };

  // Bascule automatique (toutes les 60 s) : seulement si programmé ET theme fixé
  // manuellement — le mode 'system' garde la priorité OS (spec stricte).
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  const schedRef = useRef(scheduledTheme);
  useEffect(() => {
    schedRef.current = scheduledTheme;
  }, [scheduledTheme]);
  useEffect(() => {
    const tick = () => {
      const sched = schedRef.current;
      if (!sched.enabled || themeRef.current === "system") return;
      const wantDark = isDarkScheduledNow(sched);
      const current = themeRef.current;
      if (wantDark && current !== "dark") {
        setThemeState("dark");
        if (typeof window !== "undefined")
          localStorage.setItem(STORAGE_KEY, "dark");
        ApiService.updateSettings({ theme_preference: "dark" }).catch(() => {});
      } else if (!wantDark && current !== "light") {
        setThemeState("light");
        if (typeof window !== "undefined")
          localStorage.setItem(STORAGE_KEY, "light");
        ApiService.updateSettings({ theme_preference: "light" }).catch(
          () => {}
        );
      }
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  const setAccentColor = (c: AccentColor) => {
    setAccentState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCENT_KEY, c);
    }
    ApiService.updateSettings({ accent_color: c }).catch(() => {});
  };

  const setFontSize = (s: FontSize) => {
    setFontState(s);
    if (typeof window !== "undefined") {
      localStorage.setItem(FONT_KEY, s);
    }
    ApiService.updateSettings({ font_size: s }).catch(() => {});
  };

  const setMessageBubbleTheme = (t: MessageBubbleTheme) => {
    setMessageBubbleThemeState(t);
    if (typeof window !== "undefined") {
      localStorage.setItem(MSG_BUBBLE_KEY, t);
    }
    ApiService.updateSettings({ message_bubble_theme: t }).catch(() => {});
  };

  const setChatBackgroundTheme = (bg: ChatBackgroundTheme) => {
    setChatBackgroundThemeState(bg);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_BG_KEY, bg);
    }
    ApiService.updateSettings({ chat_background_theme: bg }).catch(() => {});
  };

  const setMessageBubbleShape = (s: MessageBubbleShape) => {
    setMessageBubbleShapeState(s);
    if (typeof window !== "undefined") {
      localStorage.setItem(MSG_SHAPE_KEY, s);
    }
    ApiService.updateSettings({ message_bubble_shape: s }).catch(() => {});
  };

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        chatBackgroundTheme,
        fontSize,
        messageBubbleShape,
        messageBubbleTheme,
        resolvedTheme,
        scheduledTheme,
        setAccentColor,
        setChatBackgroundTheme,
        setFontSize,
        setMessageBubbleShape,
        setMessageBubbleTheme,
        setScheduledTheme,
        setTheme,
        theme,
      }}
    >
      <div className="vibe-root" data-vibe-root="" ref={rootRef}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
