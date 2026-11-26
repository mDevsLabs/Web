import type React from "react";
import type { Story, StoryStyle } from "@/lib/vibe/types/vibe";

/**
 * STYLES ET PALETTES PARTAGÉS DES STORIES VIBE
 *
 * Centralise les préréglages d'arrière-plan, de filtres photo, de typographie,
 * de stickers et la résolution visuelle de `StoryStyle` pour que le compositeur
 * (`StoryComposer`), le lecteur plein écran (`StoryViewer`) et l'archive
 * (`StoriesArchive`) produisent un rendu strictement identique, indépendamment
 * du remappage clair/sombre de `.vibe-root`.
 */

export interface BackgroundPreset {
  className: string;
  id: string;
  name: string;
  preview: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    className: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800",
    id: "dark-vibe",
    name: "Sombre",
    preview: "linear-gradient(135deg, #09090b, #18181b, #27272a)",
  },
  {
    className: "bg-gradient-to-br from-amber-500 via-rose-500 to-purple-700",
    id: "sunset",
    name: "Coucher de soleil",
    preview: "linear-gradient(135deg, #f59e0b, #f43f5e, #7e22ce)",
  },
  {
    className: "bg-gradient-to-br from-fuchsia-600 via-violet-600 to-cyan-500",
    id: "neon-cyber",
    name: "Cyber Néon",
    preview: "linear-gradient(135deg, #c026d3, #7c3aed, #06b6d4)",
  },
  {
    className: "bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-900",
    id: "aurora",
    name: "Aurore",
    preview: "linear-gradient(135deg, #10b981, #0d9488, #312e81)",
  },
  {
    className: "bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950",
    id: "ocean-deep",
    name: "Océan",
    preview: "linear-gradient(135deg, #2563eb, #4338ca, #0f172a)",
  },
  {
    className: "bg-gradient-to-br from-pink-500 via-rose-600 to-rose-950",
    id: "cherry",
    name: "Cerise",
    preview: "linear-gradient(135deg, #ec4899, #e11d48, #4c0519)",
  },
  {
    className: "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-700",
    id: "golden-hour",
    name: "Golden Hour",
    preview: "linear-gradient(135deg, #facc15, #f97316, #b91c1c)",
  },
  {
    className: "bg-gradient-to-br from-emerald-600 via-teal-800 to-zinc-950",
    id: "emerald-luxe",
    name: "Émeraude",
    preview: "linear-gradient(135deg, #059669, #0f766e, #09090b)",
  },
  {
    className: "bg-zinc-950",
    id: "solid-black",
    name: "Noir mat",
    preview: "#09090b",
  },
  {
    className: "bg-purple-600",
    id: "solid-purple",
    name: "Violet Vibe",
    preview: "#8b5cf6",
  },
  {
    className: "bg-sky-600",
    id: "solid-blue",
    name: "Bleu roi",
    preview: "#0284c7",
  },
  {
    className: "bg-pink-600",
    id: "solid-rose",
    name: "Rose Pop",
    preview: "#db2777",
  },
];

export interface MediaFilter {
  filter: string;
  id: string;
  name: string;
}

export const MEDIA_FILTERS: MediaFilter[] = [
  { filter: "none", id: "none", name: "Normal" },
  { filter: "contrast(1.15) saturate(1.4)", id: "vibrant", name: "Vibrant" },
  { filter: "grayscale(1) contrast(1.2)", id: "bw", name: "N&B" },
  {
    filter: "sepia(0.35) contrast(0.95) saturate(1.2)",
    id: "vintage",
    name: "Vintage",
  },
  {
    filter: "contrast(1.3) brightness(0.95)",
    id: "dramatic",
    name: "Dramatique",
  },
  {
    filter: "sepia(0.2) saturate(1.25) brightness(1.05)",
    id: "warm",
    name: "Chaud",
  },
  { filter: "hue-rotate(170deg) saturate(0.9)", id: "cold", name: "Froid" },
  {
    filter: "hue-rotate(280deg) saturate(1.5) contrast(1.1)",
    id: "cyber",
    name: "Cyber",
  },
];

export interface TextFont {
  className: string;
  id: string;
  name: string;
}

export const TEXT_FONTS: TextFont[] = [
  { className: "font-sans font-bold", id: "sans", name: "Moderne" },
  { className: "font-serif italic font-bold", id: "serif", name: "Élégant" },
  {
    className: "font-mono font-medium tracking-tight",
    id: "mono",
    name: "Machine",
  },
  {
    className: "font-black uppercase tracking-wider",
    id: "impact",
    name: "Impact",
  },
  { className: "italic font-semibold", id: "cursive", name: "Fantaisie" },
];

export interface TextStyleOption {
  id: "clean" | "translucent" | "solid" | "neon";
  name: string;
}

export const TEXT_STYLES: TextStyleOption[] = [
  { id: "clean", name: "Épuré" },
  { id: "translucent", name: "Bandeau" },
  { id: "solid", name: "Encadré" },
  { id: "neon", name: "Néon" },
];

export const TEXT_COLORS = [
  { name: "Blanc", value: "#ffffff" },
  { name: "Noir", value: "#09090b" },
  { name: "Jaune", value: "#fde047" },
  { name: "Rose", value: "#f472b6" },
  { name: "Cyan", value: "#38bdf8" },
  { name: "Vert", value: "#4ade80" },
  { name: "Orange", value: "#fb923c" },
  { name: "Violet", value: "#c084fc" },
];

export const STICKER_CATEGORIES = {
  badges: {
    label: "Badges Vibe",
    stickers: ["VIBE", "NEW", "LIVE", "TOP", "MOOD", "LOVE", "CHILL", "HOT"],
  },
  emotions: {
    label: "Émotions",
    stickers: [
      "❤️",
      "🔥",
      "😍",
      "😂",
      "🥳",
      "😎",
      "🤩",
      "🥺",
      "🤯",
      "💀",
      "😴",
      "👏",
    ],
  },
  infos: {
    label: "Infos & Heure",
    stickers: ["📍 ICI", "⭐ 10/10", "HEURE_LOCALE", "DATE_JOUR"],
  },
  vibes: {
    label: "Vibes & Fêtes",
    stickers: [
      "🎉",
      "✨",
      "💯",
      "🌈",
      "🚀",
      "⚡",
      "🌟",
      "🍕",
      "☕",
      "🎵",
      "🎈",
      "🍹",
    ],
  },
} as const;

export function isBadgeSticker(emoji: string): boolean {
  return (
    /[a-zA-Z0-9]/.test(emoji) ||
    emoji.startsWith("📍") ||
    emoji.startsWith("⭐")
  );
}

export function resolveStoryBackground(
  backgroundId?: string | null
): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((preset) => preset.id === backgroundId) ||
    BACKGROUND_PRESETS[0]
  );
}

export function resolveStoryFilter(filterId?: string | null): MediaFilter {
  return (
    MEDIA_FILTERS.find((filter) => filter.id === filterId) || MEDIA_FILTERS[0]
  );
}

export function resolveStoryTextConfig(style?: StoryStyle | null): {
  alignClass: string;
  bgBoxClass: string;
  bgBoxStyle: React.CSSProperties;
  fontClass: string;
  posClass: string;
  textColorStyle: React.CSSProperties;
} {
  const textAlign = style?.textAlign ?? "center";
  const textPosition = style?.textPosition ?? "bottom";
  const textStyle = style?.textStyle ?? "clean";
  const textColor = style?.textColor || "#ffffff";
  const font =
    TEXT_FONTS.find((candidate) => candidate.id === style?.textFont) ||
    TEXT_FONTS[0];

  let alignClass = "text-center";
  if (textAlign === "left") alignClass = "text-left";
  else if (textAlign === "right") alignClass = "text-right";

  let posClass = "bottom-4";
  if (textPosition === "top") posClass = "top-4";
  else if (textPosition === "center") posClass = "top-1/2 -translate-y-1/2";

  let bgBoxClass = "";
  let bgBoxStyle: React.CSSProperties = {};
  let textColorStyle: React.CSSProperties = { color: textColor };

  if (textStyle === "translucent") {
    bgBoxClass = "backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg";
    bgBoxStyle = { backgroundColor: "rgba(9, 9, 11, 0.72)" };
  } else if (textStyle === "solid") {
    bgBoxClass = "px-4 py-2.5 rounded-2xl shadow-xl";
    bgBoxStyle = { backgroundColor: "#ffffff" };
    if (textColor.toLowerCase() === "#ffffff") {
      textColorStyle = { color: "#09090b" };
    }
  } else if (textStyle === "neon") {
    bgBoxClass = "backdrop-blur-sm px-3.5 py-2 rounded-2xl";
    bgBoxStyle = {
      backgroundColor: "rgba(9, 9, 11, 0.35)",
      border: "1px solid rgba(255, 255, 255, 0.35)",
    };
    textColorStyle = {
      color: textColor,
      textShadow: `0 0 10px ${textColor}, 0 0 20px ${textColor}`,
    };
  } else {
    textColorStyle = {
      color: textColor,
      textShadow: "0 2px 8px rgba(0, 0, 0, 0.85)",
    };
  }

  return {
    alignClass,
    bgBoxClass,
    bgBoxStyle,
    fontClass: font.className,
    posClass,
    textColorStyle,
  };
}

const LOCAL_STYLE_STORAGE_KEY = "vibe:story_styles:v1";

export function saveLocalStoryStyle(storyId: string, style: StoryStyle): void {
  if (!storyId || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_STYLE_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, StoryStyle>) : {};
    const entries = Object.entries(map).slice(-80);
    const next = Object.fromEntries([...entries, [storyId, style]]);
    window.localStorage.setItem(LOCAL_STYLE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Stockage local indisponible : le serveur reste l'autorité principale.
  }
}

export function getLocalStoryStyle(storyId: string): StoryStyle | null {
  if (!storyId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STYLE_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, StoryStyle>;
    return map?.[storyId] ?? null;
  } catch {
    return null;
  }
}

export function resolveEffectiveStoryStyle(
  story?: Pick<Story, "id" | "style"> | null
): StoryStyle | null {
  if (!story) return null;
  if (story.style && typeof story.style === "object") {
    return story.style;
  }
  return getLocalStoryStyle(story.id);
}
