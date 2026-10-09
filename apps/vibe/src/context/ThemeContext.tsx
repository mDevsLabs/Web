/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — THEME CONTEXT (src/context/ThemeContext.tsx)
 * Global Theme Manager: Light (Default), Dark & System + Personnalisation
 * (couleur d'accent, taille de texte) appliquée via variables CSS.
 * ============================================================================
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ApiService } from '../services/api';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentColor = 'white' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';
export type FontSize = 'small' | 'medium' | 'large';

export type MessageBubbleTheme =
  | 'monochrome'
  | 'gradient-vibe'
  | 'gradient-ocean'
  | 'gradient-sunset'
  | 'gradient-emerald'
  | 'gradient-fuchsia'
  | 'gradient-amber'
  | 'gradient-carbon'
  | 'gradient-noir'
  | 'solid-accent';

export type ChatBackgroundTheme =
  | 'default'
  | 'slate'
  | 'midnight'
  | 'sunset'
  | 'emerald'
  | 'ocean'
  | 'carbon'
  | 'minimal-dark'
  | 'minimal-light';

export type MessageBubbleShape = 'pill' | 'modern' | 'classic' | 'compact';

export interface BubbleThemeConfig {
  id: MessageBubbleTheme;
  label: string;
  gradient: string;
  textColor: 'light' | 'dark' | 'adaptive';
  border?: string;
}

export interface ChatBgConfig {
  id: ChatBackgroundTheme;
  label: string;
  style: string;
  previewBg: string;
}

export const MESSAGE_BUBBLE_THEMES: Record<MessageBubbleTheme, BubbleThemeConfig> = {
  monochrome: {
    id: 'monochrome',
    label: 'Noir & Blanc Vibe',
    gradient: 'var(--vibe-sent-bubble-bg)',
    border: 'var(--vibe-sent-bubble-border)',
    textColor: 'adaptive',
  },
  'gradient-sunset': {
    id: 'gradient-sunset',
    label: 'Dégradé Sunset',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    textColor: 'light',
  },
  'gradient-vibe': {
    id: 'gradient-vibe',
    label: 'Dégradé Cosmos',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    textColor: 'light',
  },
  'gradient-ocean': {
    id: 'gradient-ocean',
    label: 'Dégradé Océan',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
    textColor: 'light',
  },
  'gradient-emerald': {
    id: 'gradient-emerald',
    label: 'Dégradé Émeraude',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    textColor: 'light',
  },
  'gradient-fuchsia': {
    id: 'gradient-fuchsia',
    label: 'Dégradé Fuchsia Neon',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #f43f5e 100%)',
    textColor: 'light',
  },
  'gradient-amber': {
    id: 'gradient-amber',
    label: 'Dégradé Ambre & Or',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    textColor: 'light',
  },
  'gradient-carbon': {
    id: 'gradient-carbon',
    label: 'Dégradé Carbone Titanium',
    gradient: 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)',
    textColor: 'light',
  },
  'gradient-noir': {
    id: 'gradient-noir',
    label: 'Noir Luxueux',
    gradient: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
    border: '1px solid rgba(255,255,255,0.18)',
    textColor: 'light',
  },
  'solid-accent': {
    id: 'solid-accent',
    label: 'Couleur d’accent',
    gradient: 'var(--vibe-accent, #ffffff)',
    textColor: 'dark',
  },
};

export const CHAT_BACKGROUND_THEMES: Record<ChatBackgroundTheme, ChatBgConfig> = {
  default: {
    id: 'default',
    label: 'Adaptatif (Thème Vibe)',
    style: '',
    previewBg: 'bg-zinc-100 dark:bg-zinc-900',
  },
  slate: {
    id: 'slate',
    label: 'Nuit Ardoise',
    style: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    previewBg: 'bg-slate-950',
  },
  midnight: {
    id: 'midnight',
    label: 'Minuit Indigo',
    style: 'linear-gradient(180deg, #1e1b4b 0%, #030712 100%)',
    previewBg: 'bg-indigo-950',
  },
  sunset: {
    id: 'sunset',
    label: 'Crépuscule Améthyste',
    style: 'linear-gradient(180deg, #3b0764 0%, #09090b 100%)',
    previewBg: 'bg-purple-950',
  },
  emerald: {
    id: 'emerald',
    label: 'Profondeur Émeraude',
    style: 'linear-gradient(180deg, #064e3b 0%, #020617 100%)',
    previewBg: 'bg-emerald-950',
  },
  ocean: {
    id: 'ocean',
    label: 'Abysses Marines',
    style: 'linear-gradient(180deg, #0c4a6e 0%, #020617 100%)',
    previewBg: 'bg-sky-950',
  },
  carbon: {
    id: 'carbon',
    label: 'Carbone Furtif',
    style: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)',
    previewBg: 'bg-zinc-900',
  },
  'minimal-dark': {
    id: 'minimal-dark',
    label: 'Noir Profond (OLED)',
    style: '#000000',
    previewBg: 'bg-black',
  },
  'minimal-light': {
    id: 'minimal-light',
    label: 'Blanc Pur Épuré',
    style: '#f8fafc',
    previewBg: 'bg-zinc-100',
  },
};

export const MESSAGE_BUBBLE_SHAPES: Record<MessageBubbleShape, { label: string; meRadius: string; partnerRadius: string }> = {
  pill: {
    label: 'Très arrondi (Pilule)',
    meRadius: 'rounded-3xl',
    partnerRadius: 'rounded-3xl',
  },
  modern: {
    label: 'Moderne (Doux)',
    meRadius: 'rounded-2xl',
    partnerRadius: 'rounded-2xl',
  },
  classic: {
    label: 'Classique (Bulle à angle)',
    meRadius: 'rounded-2xl rounded-tr-sm',
    partnerRadius: 'rounded-2xl rounded-tl-sm',
  },
  compact: {
    label: 'Compact ergonomique',
    meRadius: 'rounded-xl',
    partnerRadius: 'rounded-xl',
  },
};

/** Plage horaire de bascule automatique du thème (format "HH:MM"). */
export interface ScheduledTheme {
  enabled: boolean;
  darkStart: string;
  darkEnd: string;
}

export const DEFAULT_SCHEDULED_THEME: ScheduledTheme = {
  enabled: false,
  darkStart: '22:00',
  darkEnd: '07:00',
};

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  messageBubbleTheme: MessageBubbleTheme;
  setMessageBubbleTheme: (t: MessageBubbleTheme) => void;
  chatBackgroundTheme: ChatBackgroundTheme;
  setChatBackgroundTheme: (bg: ChatBackgroundTheme) => void;
  messageBubbleShape: MessageBubbleShape;
  setMessageBubbleShape: (s: MessageBubbleShape) => void;
  scheduledTheme: ScheduledTheme;
  setScheduledTheme: (s: ScheduledTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'vibe_theme_preference';
const ACCENT_KEY = 'vibe_accent_color';
const FONT_KEY = 'vibe_font_size';
const MSG_BUBBLE_KEY = 'vibe_message_bubble_theme';
const CHAT_BG_KEY = 'vibe_chat_bg_theme';
const MSG_SHAPE_KEY = 'vibe_message_bubble_shape';
const SCHED_KEY = 'vibe_scheduled_theme';

const parseScheduledTheme = (raw: string | null): ScheduledTheme => {
  if (!raw) return { ...DEFAULT_SCHEDULED_THEME };
  try {
    const parsed = JSON.parse(raw);
    const hhmm = (v: unknown, fallback: string) =>
      typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : fallback;
    return {
      enabled: Boolean(parsed.enabled),
      darkStart: hhmm(parsed.darkStart, DEFAULT_SCHEDULED_THEME.darkStart),
      darkEnd: hhmm(parsed.darkEnd, DEFAULT_SCHEDULED_THEME.darkEnd),
    };
  } catch {
    return { ...DEFAULT_SCHEDULED_THEME };
  }
};

/** true si l'heure courante (HH:MM) tombe dans la plage sombre (gère le chevauchement minuit). */
export const isDarkScheduledNow = (sched: ScheduledTheme, now = new Date()): boolean => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const cur = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (sched.darkStart <= sched.darkEnd) {
    return cur >= sched.darkStart && cur < sched.darkEnd;
  }
  return cur >= sched.darkStart || cur < sched.darkEnd;
};

/** Couleurs d'accent disponibles (hex clairs, lisibles avec du texte noir). */
export const ACCENT_COLORS: Record<AccentColor, { label: string; hex: string }> = {
  white: { label: 'Blanc', hex: '#ffffff' },
  blue: { label: 'Bleu', hex: '#7cc4ff' },
  violet: { label: 'Violet', hex: '#c4b5fd' },
  emerald: { label: 'Émeraude', hex: '#6ee7b7' },
  rose: { label: 'Rose', hex: '#fda4af' },
  amber: { label: 'Ambre', hex: '#fcd34d' },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

function loadStored<T extends string>(key: string, allowed: T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key) as T | null;
  return saved && allowed.includes(saved) ? saved : fallback;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global default is 'light' as explicitly requested
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && ['light', 'dark', 'system'].includes(s)) return s as ThemeMode;
    }
    return 'light';
  });
  const [accentColor, setAccentState] = useState<AccentColor>(() => loadStored<AccentColor>(ACCENT_KEY, ['white', 'blue', 'violet', 'emerald', 'rose', 'amber'], 'white'));
  const [fontSize, setFontState] = useState<FontSize>(() => loadStored<FontSize>(FONT_KEY, ['small', 'medium', 'large'], 'medium'));
  const [messageBubbleTheme, setMessageBubbleThemeState] = useState<MessageBubbleTheme>(() =>
    loadStored<MessageBubbleTheme>(
      MSG_BUBBLE_KEY,
      ['monochrome', 'gradient-vibe', 'gradient-ocean', 'gradient-sunset', 'gradient-emerald', 'gradient-carbon', 'gradient-noir', 'solid-accent'],
      'monochrome'
    )
  );
  const [chatBackgroundTheme, setChatBackgroundThemeState] = useState<ChatBackgroundTheme>(() =>
    loadStored<ChatBackgroundTheme>(
      CHAT_BG_KEY,
      ['default', 'slate', 'midnight', 'sunset', 'emerald', 'minimal-dark', 'minimal-light'],
      'default'
    )
  );
  const [messageBubbleShape, setMessageBubbleShapeState] = useState<MessageBubbleShape>(() =>
    loadStored<MessageBubbleShape>(MSG_SHAPE_KEY, ['pill', 'modern', 'classic'], 'pill')
  );

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [scheduledTheme, setScheduledThemeState] = useState<ScheduledTheme>(() => {
    if (typeof window !== 'undefined') {
      return parseScheduledTheme(localStorage.getItem(SCHED_KEY));
    }
    return { ...DEFAULT_SCHEDULED_THEME };
  });

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  // Apply theme attributes to document and update mobile theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--vibe-sent-bubble-bg', '#18181b');
      root.style.setProperty('--vibe-sent-bubble-color', '#ffffff');
      root.style.setProperty('--vibe-sent-bubble-border', '1px solid #3f3f46');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--vibe-sent-bubble-bg', '#ffffff');
      root.style.setProperty('--vibe-sent-bubble-color', '#000000');
      root.style.setProperty('--vibe-sent-bubble-border', '1.5px solid #000000');
    }

    // Update mobile status bar theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#000000' : '#ffffff');
    }
  }, [resolvedTheme]);

  // Personnalisation : couleur d'accent (variable CSS) + taille de texte racine
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--vibe-accent', ACCENT_COLORS[accentColor].hex);
    root.style.fontSize = FONT_SIZES[fontSize];
  }, [accentColor, fontSize]);

  // Synchronisation avec les réglages de la base de données
  useEffect(() => {
    ApiService.getSettings()
      .then((res) => {
        const s = res?.settings;
        if (!s) return;
        if (s.message_bubble_theme && s.message_bubble_theme in MESSAGE_BUBBLE_THEMES) {
          setMessageBubbleThemeState(s.message_bubble_theme as MessageBubbleTheme);
          localStorage.setItem(MSG_BUBBLE_KEY, s.message_bubble_theme);
        }
        if (s.chat_background_theme && s.chat_background_theme in CHAT_BACKGROUND_THEMES) {
          setChatBackgroundThemeState(s.chat_background_theme as ChatBackgroundTheme);
          localStorage.setItem(CHAT_BG_KEY, s.chat_background_theme);
        }
        if (s.message_bubble_shape && s.message_bubble_shape in MESSAGE_BUBBLE_SHAPES) {
          setMessageBubbleShapeState(s.message_bubble_shape as MessageBubbleShape);
          localStorage.setItem(MSG_SHAPE_KEY, s.message_bubble_shape);
        }
        if (s.accent_color && s.accent_color in ACCENT_COLORS) {
          setAccentState(s.accent_color as AccentColor);
          localStorage.setItem(ACCENT_KEY, s.accent_color);
        }
        if (s.font_size && ['small', 'medium', 'large'].includes(s.font_size)) {
          setFontState(s.font_size as FontSize);
          localStorage.setItem(FONT_KEY, s.font_size);
        }
        if (s.scheduled_theme) {
          const parsed = parseScheduledTheme(typeof s.scheduled_theme === 'string' ? s.scheduled_theme : JSON.stringify(s.scheduled_theme));
          setScheduledThemeState(parsed);
          if (typeof window !== 'undefined') localStorage.setItem(SCHED_KEY, JSON.stringify(parsed));
        }
        if (s.theme_preference && ['light', 'dark', 'system'].includes(s.theme_preference)) {
          const local = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
          if (local && ['light', 'dark', 'system'].includes(local)) {
            // Si l'utilisateur a changé localement, propager à la base de données
            if (local !== s.theme_preference) {
              ApiService.updateSettings({ theme_preference: local }).catch(() => {});
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
    ApiService.updateSettings({ theme_preference: newTheme }).catch(() => {});
  };

  const setScheduledTheme = (sched: ScheduledTheme) => {
    setScheduledThemeState(sched);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    }
    ApiService.updateSettings({ scheduled_theme: JSON.stringify(sched) } as any).catch(() => {});
  };

  // Bascule automatique (toutes les 60 s) : seulement si programmé ET theme fixé
  // manuellement — le mode 'system' garde la priorité OS (spec stricte).
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme ]);
  const schedRef = useRef(scheduledTheme);
  useEffect(() => {
    schedRef.current = scheduledTheme;
  }, [scheduledTheme]);
  useEffect(() => {
    const tick = () => {
      const sched = schedRef.current;
      if (!sched.enabled || themeRef.current === 'system') return;
      const wantDark = isDarkScheduledNow(sched);
      const current = themeRef.current;
      if (wantDark && current !== 'dark') {
        setThemeState('dark');
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'dark');
        ApiService.updateSettings({ theme_preference: 'dark' }).catch(() => {});
      } else if (!wantDark && current !== 'light') {
        setThemeState('light');
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'light');
        ApiService.updateSettings({ theme_preference: 'light' }).catch(() => {});
      }
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  const setAccentColor = (c: AccentColor) => {
    setAccentState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCENT_KEY, c);
    }
    ApiService.updateSettings({ accent_color: c }).catch(() => {});
  };

  const setFontSize = (s: FontSize) => {
    setFontState(s);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FONT_KEY, s);
    }
    ApiService.updateSettings({ font_size: s }).catch(() => {});
  };

  const setMessageBubbleTheme = (t: MessageBubbleTheme) => {
    setMessageBubbleThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MSG_BUBBLE_KEY, t);
    }
    ApiService.updateSettings({ message_bubble_theme: t }).catch(() => {});
  };

  const setChatBackgroundTheme = (bg: ChatBackgroundTheme) => {
    setChatBackgroundThemeState(bg);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_BG_KEY, bg);
    }
    ApiService.updateSettings({ chat_background_theme: bg }).catch(() => {});
  };

  const setMessageBubbleShape = (s: MessageBubbleShape) => {
    setMessageBubbleShapeState(s);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MSG_SHAPE_KEY, s);
    }
    ApiService.updateSettings({ message_bubble_shape: s }).catch(() => {});
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        accentColor,
        setAccentColor,
        fontSize,
        setFontSize,
        messageBubbleTheme,
        setMessageBubbleTheme,
        chatBackgroundTheme,
        setChatBackgroundTheme,
        messageBubbleShape,
        setMessageBubbleShape,
        scheduledTheme,
        setScheduledTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
