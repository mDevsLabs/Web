import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import {
  formatMediaLimit,
  STORY_MEDIA_MAX_BYTES,
} from "@/lib/vibe/services/tierLimits";
import type { StorySticker } from "@/lib/vibe/types/vibe";

/**
 * COMPOSITEUR DE STORY (StoryComposer.tsx)
 *
 * Conçu dans une fenêtre contextuelle élégante (modale) ne recouvrant pas toute la page.
 * Prend en charge:
 * - Médias (photos / vidéos ≤ 50 Mo) avec retouches (filtres photo CSS, cadrage, miroir)
 * - Nouveaux arrière-plans & palettes de couleurs (dégradés vibrants, teintes unies)
 * - Typographie et mise en page du texte avancées (polices, couleurs, styles de fond, alignement, position)
 * - Nouveaux stickers organisés en catégories (Émotions, Vibes, Badges graphiques, Heure/Date dynamiques)
 * - Sondages interactifs (2 à 4 options)
 * - Choix de visibilité (Abonnés, Tout le monde, Privé)
 */

export const STORY_MAX_ITEMS = 10;
export const STORY_MAX_STICKERS = 6;
export const SONDAGE_MAX_OPTIONS = 4;

// ── Arrière-plans prédéfinis ─────────────────────────────────────────────────
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

// ── Filtres de retouche média ────────────────────────────────────────────────
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

// ── Polices et styles de texte ───────────────────────────────────────────────
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

// ── Catégories de stickers ───────────────────────────────────────────────────
export const STICKER_CATEGORIES = {
  badges: {
    label: "Badges Vibe",
    // Badges graphiques courts (≤ 8 car. pour respect strict du schéma backend)
    stickers: ["VIBE", "NEW", "LIVE", "TOP", "MOOD", "LOVE", "CHILL", "HOT"],
  },
  emotions: {
    label: "Émotions",
    stickers: ["", "", "", "", "", "", "", "", "", "", "", ""],
  },
  infos: {
    label: "Infos & Heure",
    stickers: [" ICI", " 10/10", "HEURE_LOCALE", "DATE_JOUR"],
  },
  vibes: {
    label: "Vibes & Fêtes",
    stickers: ["", "", "", "", "", "", "", "", "", "", "", ""],
  },
} as const;

export type TabId =
  | "media"
  | "colors"
  | "text"
  | "stickers"
  | "filters"
  | "poll";

type Choix = { fichier: File; objetUrl: string; type: "image" | "video" };

export interface StoryComposerProps {
  onClose: () => void;
  onPublished: () => void;
  open: boolean;
}

export const StoryComposer: React.FC<StoryComposerProps> = ({
  onClose,
  onPublished,
  open,
}) => {
  // Navigation par onglets dans la fenêtre contextuelle
  const [activeTab, setActiveTab] = useState<TabId>("media");

  // Médias
  const [choix, setChoix] = useState<Choix[]>([]);
  const choixRef = useRef(choix);
  choixRef.current = choix;
  const [indexMediaActif, setIndexMediaActif] = useState(0);
  const [mediaContain, setMediaContain] = useState(false);
  const [mediaMirror, setMediaMirror] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string>("none");

  // Fond & Couleurs
  const [backgroundId, setBackgroundId] = useState<string>("dark-vibe");

  // Texte & Typographie
  const [legende, setLegende] = useState("");
  const [textFont, setTextFont] = useState<string>("sans");
  const [textStyle, setTextStyle] = useState<
    "clean" | "translucent" | "solid" | "neon"
  >("clean");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "center"
  );
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">(
    "bottom"
  );

  // Stickers & Catégories
  const [stickerCategory, setStickerCategory] =
    useState<keyof typeof STICKER_CATEGORIES>("emotions");
  const [stickers, setStickers] = useState<StorySticker[]>([]);

  // Sondage & Visibilité
  const [visibilite, setVisibilite] = useState<
    "followers" | "public" | "private"
  >("followers");
  const [sondage, setSondage] = useState<{
    actif: boolean;
    options: string[];
    question: string;
  }>({ actif: false, options: ["", ""], question: "" });

  // États de publication
  const [publication, setPublication] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canevasRef = useRef<HTMLDivElement | null>(null);
  const glissementRef = useRef<number | null>(null);

  // Nettoyage des URLs d'aperçu à la fermeture
  useEffect(() => {
    if (!open) return;
    return () => {
      setChoix((actuels) => {
        for (const c of actuels) URL.revokeObjectURL(c.objetUrl);
        return [];
      });
      setLegende("");
      setErreur("");
      setPublication(false);
      setSondage({ actif: false, options: ["", ""], question: "" });
      setStickers([]);
      setActiveTab("media");
      setActiveFilterId("none");
      setMediaContain(false);
      setMediaMirror(false);
      setBackgroundId("dark-vibe");
      setTextFont("sans");
      setTextStyle("clean");
      setTextColor("#ffffff");
      setTextAlign("center");
      setTextPosition("bottom");
      setIndexMediaActif(0);
    };
  }, [open]);

  // Fermeture par touche Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Gestion des médias
  const selectionner = useCallback(
    (liste: FileList | null) => {
      if (!liste) return;
      const refus: string[] = [];
      const retenus: Choix[] = [];

      for (const fichier of Array.from(liste)) {
        if (choix.length + retenus.length >= STORY_MAX_ITEMS) {
          refus.push(`Une story accepte au plus ${STORY_MAX_ITEMS} médias.`);
          break;
        }
        const estImage = fichier.type.startsWith("image/");
        const estVideo = fichier.type.startsWith("video/");
        if (!estImage && !estVideo) {
          refus.push(`${fichier.name}: photo ou vidéo attendue.`);
          continue;
        }
        if (fichier.size > STORY_MEDIA_MAX_BYTES) {
          refus.push(
            `${fichier.name} dépasse ${formatMediaLimit(STORY_MEDIA_MAX_BYTES)}.`
          );
          continue;
        }
        retenus.push({
          fichier,
          objetUrl: URL.createObjectURL(fichier),
          type: estVideo ? "video" : "image",
        });
      }

      if (retenus.length > 0) {
        haptics.light();
        setChoix((actuels) => [...actuels, ...retenus]);
      }
      setErreur([...new Set(refus)].join(" "));
    },
    [choix.length]
  );

  const retirer = useCallback((objetUrl: string) => {
    URL.revokeObjectURL(objetUrl);
    const actuels = choixRef.current;
    const index = actuels.findIndex((c) => c.objetUrl === objetUrl);
    const restants = actuels.filter((c) => c.objetUrl !== objetUrl);
    setChoix(restants);
    setIndexMediaActif((courant) => {
      if (restants.length === 0) return 0;
      if (index >= 0 && index < courant) return courant - 1;
      return Math.min(courant, restants.length - 1);
    });
  }, []);

  // ── Stickers ──────────────────────────────────────────────────────────────
  const isBadge = useCallback((emoji: string) => /[a-zA-Z0-9]/.test(emoji), []);

  const ajouterSticker = useCallback((valeur: string) => {
    setStickers((liste) => {
      if (liste.length >= STORY_MAX_STICKERS) return liste;
      let finalVal = valeur;

      if (valeur === "HEURE_LOCALE") {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        finalVal = `${hh}:${mm}`;
      } else if (valeur === "DATE_JOUR") {
        const d = new Date();
        const jour = d.getDate();
        const mois = d
          .toLocaleDateString("fr-FR", { month: "short" })
          .toUpperCase()
          .replace(".", "");
        finalVal = `${jour} ${mois}`.slice(0, 8);
      }

      const decalage = liste.length * 0.08;
      return [
        ...liste,
        {
          emoji: finalVal,
          x: 0.5 + (liste.length % 2 === 0 ? -decalage : decalage),
          y: 0.35 + decalage,
        },
      ];
    });
    haptics.light();
  }, []);

  const retirerSticker = useCallback((index: number) => {
    setStickers((liste) => liste.filter((_, i) => i !== index));
    haptics.light();
  }, []);

  const demarrerGlissement = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      glissementRef.current = index;
    },
    []
  );

  const deplacerSticker = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const index = glissementRef.current;
      const rect = canevasRef.current?.getBoundingClientRect();
      if (index === null || !rect) return;
      const x = Math.min(
        0.95,
        Math.max(0.05, (e.clientX - rect.left) / rect.width)
      );
      const y = Math.min(
        0.95,
        Math.max(0.05, (e.clientY - rect.top) / rect.height)
      );
      setStickers((liste) =>
        liste.map((sticker, i) =>
          i === index ? { ...sticker, x, y } : sticker
        )
      );
    },
    []
  );

  const terminerGlissement = useCallback(() => {
    glissementRef.current = null;
  }, []);

  // ── Sondage ───────────────────────────────────────────────────────────────
  const majOption = useCallback((index: number, valeur: string) => {
    setSondage((actuel) => ({
      ...actuel,
      options: actuel.options.map((option, i) =>
        i === index ? valeur : option
      ),
    }));
  }, []);

  const ajouterOption = useCallback(() => {
    setSondage((actuel) =>
      actuel.options.length >= SONDAGE_MAX_OPTIONS
        ? actuel
        : { ...actuel, options: [...actuel.options, ""] }
    );
  }, []);

  const retirerOption = useCallback((index: number) => {
    setSondage((actuel) =>
      actuel.options.length <= 2
        ? actuel
        : {
            ...actuel,
            options: actuel.options.filter((_, i) => i !== index),
          }
    );
  }, []);

  // ── Validation et publication ─────────────────────────────────────────────
  const optionsSondage = useMemo(
    () => sondage.options.map((option) => option.trim()).filter(Boolean),
    [sondage.options]
  );
  const sondagePret =
    !sondage.actif ||
    (sondage.question.trim() !== "" && optionsSondage.length >= 2);
  const peutPublier =
    !publication &&
    (choix.length > 0 ||
      legende.trim() !== "" ||
      (sondage.actif && sondagePret));

  const publier = useCallback(async () => {
    if (!peutPublier) return;
    if (sondage.actif && !sondagePret) {
      setErreur(
        "Sondage incomplet: une question et au moins deux options requises."
      );
      return;
    }
    setPublication(true);
    setErreur("");
    try {
      const items: Parameters<typeof ApiService.createStory>[0]["items"] = [];
      for (const c of choix) {
        const res = await ApiService.uploadFile(c.fichier);
        items.push({
          media_type: c.type,
          pathname: res.pathname,
          url: res.url,
        });
      }
      await ApiService.createStory({
        caption: legende.trim(),
        items,
        poll:
          sondage.actif && sondagePret
            ? { options: optionsSondage, question: sondage.question.trim() }
            : null,
        stickers,
        visibility: visibilite,
      });
      haptics.success();
      onPublished();
    } catch (err: any) {
      setErreur(err?.message || "Publication impossible. Veuillez réessayer.");
      haptics.error();
    } finally {
      setPublication(false);
    }
  }, [
    choix,
    legende,
    onPublished,
    optionsSondage,
    peutPublier,
    publication,
    sondage.actif,
    sondage.question,
    sondagePret,
    stickers,
    visibilite,
  ]);

  if (!open) return null;

  // Calcul des styles d'affichage
  const presetFondActif =
    BACKGROUND_PRESETS.find((p) => p.id === backgroundId) ||
    BACKGROUND_PRESETS[0];
  const filtreActif =
    MEDIA_FILTERS.find((f) => f.id === activeFilterId) || MEDIA_FILTERS[0];
  const policeTexte =
    TEXT_FONTS.find((f) => f.id === textFont) || TEXT_FONTS[0];

  const mediaSelectionne = choix[indexMediaActif] || choix[0];

  // Calcul du style de boîte de texte
  const getTextStyleClasses = () => {
    let alignClass = "text-center";
    if (textAlign === "left") alignClass = "text-left";
    else if (textAlign === "right") alignClass = "text-right";

    let posClass = "bottom-4";
    if (textPosition === "top") posClass = "top-4";
    else if (textPosition === "center") posClass = "top-1/2 -translate-y-1/2";

    let bgBoxClass = "";
    let textColorStyle: React.CSSProperties = { color: textColor };

    if (textStyle === "translucent") {
      bgBoxClass =
        "bg-black/70 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg";
    } else if (textStyle === "solid") {
      bgBoxClass = "bg-white px-4 py-2.5 rounded-2xl shadow-xl";
      if (textColor === "#ffffff") {
        textColorStyle = { color: "#09090b" };
      }
    } else if (textStyle === "neon") {
      bgBoxClass =
        "border border-white/30 backdrop-blur-sm px-3.5 py-2 rounded-2xl";
      textColorStyle = {
        color: textColor,
        textShadow: `0 0 10px ${textColor}, 0 0 20px ${textColor}`,
      };
    } else {
      textColorStyle = {
        color: textColor,
        textShadow: "0 2px 8px rgba(0,0,0,0.85)",
      };
    }

    return {
      alignClass,
      bgBoxClass,
      fontClass: policeTexte.className,
      posClass,
      textColorStyle,
    };
  };

  const textConfig = getTextStyleClasses();

  return createPortal(
    <div
      className="vibe-story-composer-backdrop fixed inset-0 z-[85] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="vibe-story-composer-modal relative flex flex-col w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête contextuel ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-zinc-950/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-rose-500/20" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Nouvelle Story
              </h2>
              <p className="text-[11px] text-white/50">
                Visible 24 heures par vos abonnés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Fermer"
              className="size-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Corps: 2 colonnes sur tablette/desktop, empilé sur mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* ── Colonne Gauche: Canevas interactif (5 col / 12) ─────────── */}
          <div className="md:col-span-5 bg-zinc-900/60 p-4 sm:p-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 overflow-hidden relative">
            <div
              className={`relative aspect-[9/16] w-full max-w-[240px] sm:max-w-[270px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 touch-none select-none transition-colors duration-300 ${
                choix.length === 0 ? presetFondActif.className : "bg-black"
              }`}
              ref={canevasRef}
            >
              {/* Rendu média */}
              {mediaSelectionne ? (
                mediaSelectionne.type === "video" ? (
                  <video
                    className={`h-full w-full pointer-events-none transition-all ${
                      mediaContain ? "object-contain" : "object-cover"
                    } ${mediaMirror ? "-scale-x-100" : ""}`}
                    muted
                    playsInline
                    src={mediaSelectionne.objetUrl}
                    style={{ filter: filtreActif.filter }}
                  />
                ) : (
                  <img
                    alt="Aperçu"
                    className={`h-full w-full pointer-events-none transition-all ${
                      mediaContain ? "object-contain" : "object-cover"
                    } ${mediaMirror ? "-scale-x-100" : ""}`}
                    src={mediaSelectionne.objetUrl}
                    style={{ filter: filtreActif.filter }}
                  />
                )
              ) : null}

              {/* Texte / Légende stylisée */}
              {legende.trim() ? (
                <div
                  className={`absolute inset-x-3.5 ${textConfig.posClass} pointer-events-none`}
                >
                  <div
                    className={`${textConfig.bgBoxClass} ${textConfig.alignClass}`}
                  >
                    <p
                      className={`${textConfig.fontClass} text-balance text-sm sm:text-base leading-snug line-clamp-6`}
                      style={textConfig.textColorStyle}
                    >
                      {legende}
                    </p>
                  </div>
                </div>
              ) : choix.length === 0 ? (
                <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-xs text-white/40 pointer-events-none">
                  Votre texte ou média apparaîtra ici
                </p>
              ) : null}

              {/* Stickers glissables */}
              {stickers.map((sticker, index) => {
                const estBadge = isBadge(sticker.emoji);
                return (
                  <div
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none active:cursor-grabbing group"
                    key={`${sticker.emoji}-${index}`}
                    onPointerCancel={terminerGlissement}
                    onPointerDown={demarrerGlissement(index)}
                    onPointerMove={deplacerSticker}
                    onPointerUp={terminerGlissement}
                    style={{
                      left: `${sticker.x * 100}%`,
                      top: `${sticker.y * 100}%`,
                    }}
                  >
                    {estBadge ? (
                      <span className="vibe-story-badge shadow-xl">
                        {sticker.emoji}
                      </span>
                    ) : (
                      <span className="text-3xl sm:text-4xl drop-shadow-lg leading-none block">
                        {sticker.emoji}
                      </span>
                    )}
                    <button
                      aria-label="Supprimer sticker"
                      className="absolute -right-2 -top-2 size-5 rounded-full bg-white text-zinc-950 text-[10px] font-bold flex items-center justify-center shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        retirerSticker(index);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* Aperçu du sondage sur le canevas */}
              {sondage.actif && sondage.question.trim() ? (
                <div className="absolute inset-x-3 bottom-14 rounded-xl bg-zinc-950/85 p-2.5 backdrop-blur-md border border-white/10 pointer-events-none">
                  <p className="text-[11px] font-semibold text-white truncate">
                    {sondage.question}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {sondage.options.map((opt, i) => (
                      <div
                        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[10px] text-white/80 truncate"
                        key={i}
                      >
                        {opt || `Option ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Barre de contrôles rapides sous le canevas */}
            {choix.length > 0 ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                    mediaContain
                      ? "border-white bg-white text-black font-medium"
                      : "border-white/20 text-white/70 hover:border-white/40"
                  }`}
                  onClick={() => setMediaContain((v) => !v)}
                  title="Ajuster ou couvrir"
                  type="button"
                >
                  {mediaContain ? "Ajusté" : "Remplir"}
                </button>
                <button
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                    mediaMirror
                      ? "border-white bg-white text-black font-medium"
                      : "border-white/20 text-white/70 hover:border-white/40"
                  }`}
                  onClick={() => setMediaMirror((v) => !v)}
                  title="Effet miroir"
                  type="button"
                >
                  Miroir
                </button>
                {activeFilterId === "none" ? null : (
                  <button
                    className="px-2.5 py-1 rounded-full text-[11px] border border-white/20 text-white/70 hover:border-white/40 transition"
                    onClick={() => setActiveFilterId("none")}
                    type="button"
                  >
                    Filtre: {filtreActif.name} ✕
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-white/40 text-center">
                Glissez les stickers sur l'aperçu pour les placer
              </p>
            )}
          </div>

          {/* ── Colonne Droite: Panneau d'outils (7 col / 12) ───────────── */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-zinc-950">
            {/* Barre d'onglets ergonomique */}
            <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar shrink-0 bg-zinc-900/30">
              {(
                [
                  ["media", " Média"],
                  ["colors", " Couleurs"],
                  ["text", " Texte"],
                  ["stickers", " Stickers"],
                  ["filters", " Filtres"],
                  ["poll", " Sondage"],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                    activeTab === tabKey
                      ? "border-rose-500 text-white bg-white/5"
                      : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  key={tabKey}
                  onClick={() => {
                    setActiveTab(tabKey);
                    haptics.light();
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* ── Onglet 1: Média ─────────────────────────────────────── */}
              {activeTab === "media" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        Médias de la story
                      </h3>
                      <p className="text-[11px] text-white/50">
                        Photos ou vidéos jusqu'à{" "}
                        {formatMediaLimit(STORY_MEDIA_MAX_BYTES)}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/40">
                      {choix.length}/{STORY_MAX_ITEMS}
                    </span>
                  </div>

                  <input
                    accept="image/*,video/*"
                    className="hidden"
                    multiple
                    onChange={(e) => selectionner(e.target.files)}
                    ref={inputRef}
                    type="file"
                  />

                  {choix.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {choix.map((c, i) => (
                        <div
                          className={`relative aspect-[9/16] overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                            indexMediaActif === i
                              ? "border-rose-500 ring-2 ring-rose-500/20"
                              : "border-white/10 hover:border-white/30"
                          }`}
                          key={c.objetUrl}
                          onClick={() => setIndexMediaActif(i)}
                        >
                          {c.type === "video" ? (
                            <video
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              src={c.objetUrl}
                            />
                          ) : (
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src={c.objetUrl}
                            />
                          )}
                          <button
                            aria-label="Supprimer ce média"
                            className="absolute right-1 top-1 size-5 rounded-full bg-black/70 hover:bg-black text-white text-[10px] flex items-center justify-center transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              retirer(c.objetUrl);
                            }}
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {choix.length < STORY_MAX_ITEMS ? (
                        <button
                          className="flex aspect-[9/16] flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white transition"
                          onClick={() => inputRef.current?.click()}
                          type="button"
                        >
                          <span className="text-xl">＋</span>
                          <span className="text-[10px] mt-1">Ajouter</span>
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 hover:border-rose-500/50 hover:bg-white/10 transition text-white/70"
                      onClick={() => inputRef.current?.click()}
                      type="button"
                    >
                      <span className="text-3xl leading-none" />
                      <span className="text-xs font-semibold text-white">
                        Choisir une photo ou une vidéo
                      </span>
                      <span className="text-[11px] text-white/40">
                        ≤ 50 Mo · Ou composez une story de texte
                      </span>
                    </button>
                  )}
                </div>
              ) : null}

              {/* ── Onglet 2: Fonds & Couleurs ──────────────────────────── */}
              {activeTab === "colors" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Arrière-plan de la story
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Appliqué aux stories de texte ou en mode ajusté
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const isSelected = backgroundId === preset.id;
                      return (
                        <button
                          className={`relative h-14 rounded-xl p-2 flex flex-col justify-end text-left border transition overflow-hidden group ${
                            isSelected
                              ? "border-rose-500 ring-2 ring-rose-500/30 scale-[1.02]"
                              : "border-white/10 hover:border-white/30"
                          }`}
                          key={preset.id}
                          onClick={() => {
                            setBackgroundId(preset.id);
                            haptics.light();
                          }}
                          style={{ background: preset.preview }}
                          type="button"
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                            {preset.name}
                          </span>
                          {isSelected ? (
                            <span className="absolute top-1 right-1 size-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                              ✓
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* ── Onglet 3: Texte & Typographie ───────────────────────── */}
              {activeTab === "text" ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white">
                        Texte & Légende
                      </h3>
                      <span className="text-[11px] text-white/40">
                        {legende.length}/500
                      </span>
                    </div>
                    <textarea
                      className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-500 focus:outline-none transition"
                      maxLength={500}
                      onChange={(e) => setLegende(e.target.value)}
                      placeholder="Écrivez votre message ou légende ici..."
                      rows={3}
                      value={legende}
                    />
                  </div>

                  {/* Polices */}
                  <div>
                    <p className="text-[11px] font-medium text-white/70 mb-1.5">
                      Style de police
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_FONTS.map((f) => (
                        <button
                          className={`px-3 py-1.5 rounded-xl text-xs border transition ${
                            textFont === f.id
                              ? "border-rose-500 bg-rose-500/20 text-white font-semibold"
                              : "border-white/15 text-white/70 hover:border-white/30"
                          } ${f.className}`}
                          key={f.id}
                          onClick={() => setTextFont(f.id)}
                          type="button"
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Habillage du texte */}
                  <div>
                    <p className="text-[11px] font-medium text-white/70 mb-1.5">
                      Habillage du texte
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TEXT_STYLES.map((st) => (
                        <button
                          className={`px-2 py-1.5 rounded-xl text-xs border transition text-center ${
                            textStyle === st.id
                              ? "border-rose-500 bg-rose-500/20 text-white font-medium"
                              : "border-white/15 text-white/70 hover:border-white/30"
                          }`}
                          key={st.id}
                          onClick={() => setTextStyle(st.id)}
                          type="button"
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Couleurs de texte */}
                  <div>
                    <p className="text-[11px] font-medium text-white/70 mb-1.5">
                      Couleur du texte
                    </p>
                    <div className="flex items-center gap-2">
                      {TEXT_COLORS.map((c) => (
                        <button
                          aria-label={c.name}
                          className={`size-6 rounded-full border-2 transition ${
                            textColor === c.value
                              ? "border-white scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          key={c.value}
                          onClick={() => setTextColor(c.value)}
                          style={{ backgroundColor: c.value }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Alignement et position */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[11px] font-medium text-white/70 mb-1.5">
                        Alignement
                      </p>
                      <div className="flex rounded-xl border border-white/15 overflow-hidden p-0.5 bg-white/5">
                        {(
                          [
                            ["left", "Gauche"],
                            ["center", "Centre"],
                            ["right", "Droite"],
                          ] as const
                        ).map(([val, lib]) => (
                          <button
                            className={`flex-1 py-1 text-[11px] rounded-lg transition ${
                              textAlign === val
                                ? "bg-white/20 text-white font-medium"
                                : "text-white/60 hover:text-white"
                            }`}
                            key={val}
                            onClick={() => setTextAlign(val)}
                            type="button"
                          >
                            {lib}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-white/70 mb-1.5">
                        Position
                      </p>
                      <div className="flex rounded-xl border border-white/15 overflow-hidden p-0.5 bg-white/5">
                        {(
                          [
                            ["top", "Haut"],
                            ["center", "Centre"],
                            ["bottom", "Bas"],
                          ] as const
                        ).map(([val, lib]) => (
                          <button
                            className={`flex-1 py-1 text-[11px] rounded-lg transition ${
                              textPosition === val
                                ? "bg-white/20 text-white font-medium"
                                : "text-white/60 hover:text-white"
                            }`}
                            key={val}
                            onClick={() => setTextPosition(val)}
                            type="button"
                          >
                            {lib}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Onglet 4: Stickers ──────────────────────────────────── */}
              {activeTab === "stickers" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        Ajouter des stickers
                      </h3>
                      <p className="text-[11px] text-white/50">
                        Touchez pour ajouter, glissez sur l'aperçu pour
                        positionner
                      </p>
                    </div>
                    <span className="text-[11px] text-white/40">
                      {stickers.length}/{STORY_MAX_STICKERS}
                    </span>
                  </div>

                  {/* Sous-onglets de catégories */}
                  <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                    {(
                      Object.keys(STICKER_CATEGORIES) as Array<
                        keyof typeof STICKER_CATEGORIES
                      >
                    ).map((cat) => (
                      <button
                        className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition ${
                          stickerCategory === cat
                            ? "bg-rose-500 text-white shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                        key={cat}
                        onClick={() => setStickerCategory(cat)}
                        type="button"
                      >
                        {STICKER_CATEGORIES[cat].label}
                      </button>
                    ))}
                  </div>

                  {/* Palette de stickers de la catégorie */}
                  <div className="flex flex-wrap gap-2 p-1">
                    {STICKER_CATEGORIES[stickerCategory].stickers.map((st) => {
                      const estBadge = isBadge(st);
                      const label =
                        st === "HEURE_LOCALE"
                          ? " Heure"
                          : st === "DATE_JOUR"
                            ? " Date"
                            : st;
                      return (
                        <button
                          className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/15 active:scale-110 disabled:opacity-30 ${
                            estBadge ? "vibe-story-badge" : "text-2xl"
                          }`}
                          disabled={stickers.length >= STORY_MAX_STICKERS}
                          key={st}
                          onClick={() => ajouterSticker(st)}
                          type="button"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Liste des stickers actifs */}
                  {stickers.length > 0 ? (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-[11px] font-medium text-white/70 mb-2">
                        Stickers sur la story
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {stickers.map((st, i) => (
                          <div
                            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white"
                            key={i}
                          >
                            <span>{st.emoji}</span>
                            <button
                              aria-label="Retirer"
                              className="text-white/50 hover:text-white text-[10px]"
                              onClick={() => retirerSticker(i)}
                              type="button"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ── Onglet 5: Retouches & Filtres ───────────────────────── */}
              {activeTab === "filters" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Filtres photo
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Sublimez l'ambiance visuelle de votre média
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MEDIA_FILTERS.map((f) => {
                      const isSelected = activeFilterId === f.id;
                      return (
                        <button
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                            isSelected
                              ? "border-rose-500 bg-rose-500/15"
                              : "border-white/10 bg-white/5 hover:border-white/30"
                          }`}
                          key={f.id}
                          onClick={() => {
                            setActiveFilterId(f.id);
                            haptics.light();
                          }}
                          type="button"
                        >
                          <div
                            className="size-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10"
                            style={{ filter: f.filter }}
                          >
                            <span className="text-xl" />
                          </div>
                          <span
                            className={`text-[11px] ${
                              isSelected
                                ? "text-white font-bold"
                                : "text-white/70"
                            }`}
                          >
                            {f.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* ── Onglet 6: Sondage ───────────────────────────────────── */}
              {activeTab === "poll" ? (
                <div className="space-y-4">
                  <label className="flex items-center justify-between text-xs font-medium text-white/90 p-3 rounded-xl border border-white/15 bg-white/5 cursor-pointer">
                    <div>
                      <span>Activer un sondage interactif</span>
                      <p className="text-[11px] text-white/40">
                        Vos spectateurs pourront voter directement
                      </p>
                    </div>
                    <input
                      checked={sondage.actif}
                      className="size-4 accent-rose-500"
                      onChange={(e) =>
                        setSondage((actuel) => ({
                          ...actuel,
                          actif: e.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                  </label>

                  {sondage.actif ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-medium text-white/70">
                          Question du sondage
                        </label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-500 focus:outline-none"
                          maxLength={120}
                          onChange={(e) =>
                            setSondage((actuel) => ({
                              ...actuel,
                              question: e.target.value,
                            }))
                          }
                          placeholder="Ex: Vous préférez quoi?"
                          value={sondage.question}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-white/70">
                          Options de réponse (2 à 4)
                        </label>
                        {sondage.options.map((option, index) => (
                          <div className="flex items-center gap-2" key={index}>
                            <input
                              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-500 focus:outline-none"
                              maxLength={60}
                              onChange={(e) => majOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              value={option}
                            />
                            {sondage.options.length > 2 ? (
                              <button
                                aria-label="Supprimer cette option"
                                className="size-8 rounded-full border border-white/15 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs shrink-0"
                                onClick={() => retirerOption(index)}
                                type="button"
                              >
                                ✕
                              </button>
                            ) : null}
                          </div>
                        ))}

                        {sondage.options.length < SONDAGE_MAX_OPTIONS ? (
                          <button
                            className="mt-1 rounded-xl border border-dashed border-white/20 px-3 py-1.5 text-xs text-white/70 hover:border-white/40 hover:text-white transition w-full"
                            onClick={ajouterOption}
                            type="button"
                          >
                            ＋ Ajouter une option
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* ── Pied de panneau: Visibilité & Publication ─────────────── */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-zinc-950 shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/50">Visibilité:</span>
                  {(
                    [
                      ["followers", "Abonnés"],
                      ["public", "Public"],
                      ["private", "Moi seul"],
                    ] as const
                  ).map(([val, lib]) => (
                    <button
                      className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                        visibilite === val
                          ? "border-rose-500 bg-rose-500/20 text-white font-medium"
                          : "border-white/15 text-white/60 hover:text-white"
                      }`}
                      key={val}
                      onClick={() => setVisibilite(val)}
                      type="button"
                    >
                      {lib}
                    </button>
                  ))}
                </div>

                <button
                  className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:brightness-110 active:scale-95 disabled:opacity-40 transition shrink-0"
                  disabled={!peutPublier}
                  onClick={publier}
                  type="button"
                >
                  {publication ? "Publication…" : "Publier la Story"}
                </button>
              </div>

              {erreur ? (
                <p className="text-xs text-rose-400 font-medium">{erreur}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.querySelector(".vibe-root") || document.body
  );
};
