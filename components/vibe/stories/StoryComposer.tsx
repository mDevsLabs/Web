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
 * Trois contenus, au moins l'un : média (photo ou vidéo ≤ 50 Mo), texte (la
 * légende seule, rendue sur un canevas) ou sondage. Les stickers n'ajoutent pas
 * de contenu — ils habillent le canevas, média ou texte.
 *
 * Le média est téléversé par `uploadFile` PUIS revendiqué auprès de
 * `POST /v1/stories` : le serveur recontrôle l'origine, le namespace et la
 * taille de l'objet, donc ce que filtre ici n'est qu'un confort — jamais la
 * garantie. Le back revalide aussi le sondage et les stickers : ici on borne
 * pour guider, pas pour faire foi.
 *
 * Le calibre de la story (50 Mo) est volontairement plus strict que le plafond
 * d'upload du forfait (1 Go pour les payants) : une story de 900 Mo doit rester
 * refusée, y compris par un compte Max.
 */

const STORY_MAX_ITEMS = 10;
const STORY_MAX_STICKERS = 6;
const SONDAGE_MAX_OPTIONS = 4;
/** Palette fixe : le serveur stocke l'emoji tel quel, la taille vient d'ici. */
const STICKERS = [
  "❤️",
  "🔥",
  "😮",
  "😂",
  "😍",
  "🎉",
  "✨",
  "💯",
  "👏",
  "🥳",
  "😎",
  "🌈",
] as const;

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
  const [choix, setChoix] = useState<Choix[]>([]);
  const [legende, setLegende] = useState("");
  const [visibilite, setVisibilite] = useState<
    "followers" | "public" | "private"
  >("followers");
  const [sondage, setSondage] = useState<{
    actif: boolean;
    options: string[];
    question: string;
  }>({ actif: false, options: ["", ""], question: "" });
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [publication, setPublication] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canevasRef = useRef<HTMLDivElement | null>(null);
  /** Index du sticker en cours de glissement, ou null. */
  const glissementRef = useRef<number | null>(null);

  // Les URLs d'objet créées pour l'aperçu sont libérées à la fermeture : sans ce
  // nettoyage, chaque ouverture retient la mémoire des vidéos sélectionnées.
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
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
          refus.push(`${fichier.name} : photo ou vidéo attendue.`);
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
    setChoix((actuels) => actuels.filter((c) => c.objetUrl !== objetUrl));
  }, []);

  // ── Sondage : deux à quatre options, question obligatoire ───────────────
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

  // ── Stickers : tap pour poser, glisser pour placer, ✕ pour retirer ──────
  const ajouterSticker = useCallback((emoji: string) => {
    setStickers((liste) => {
      if (liste.length >= STORY_MAX_STICKERS) return liste;
      const decalage = liste.length * 0.07;
      return [
        ...liste,
        {
          emoji,
          x: 0.5 + (liste.length % 2 === 0 ? -decalage : decalage),
          y: 0.35 + decalage,
        },
      ];
    });
    haptics.light();
  }, []);

  const retirerSticker = useCallback((index: number) => {
    setStickers((liste) => liste.filter((_, i) => i !== index));
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
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
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
      setErreur("Sondage incomplet : une question et au moins deux options.");
      return;
    }
    setPublication(true);
    setErreur("");
    try {
      // Téléversement séquentiel : le pool S3 bascule déjà lui-même en cas de
      // bucket saturé, et aligner les requêtes évite de noyer l'isolate.
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
      // Le serveur porte le message utile (quota du jour, média refusé) : on le
      // montre tel quel plutôt que d'inventer un libellé générique.
      setErreur(err?.message || "Publication impossible. Réessayez.");
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

  return createPortal(
    <div className="vibe-story-composer vibe-msg-text-adaptive fixed inset-0 z-[85] flex flex-col bg-zinc-950/95">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          aria-label="Fermer"
          className="rounded-full p-2 text-white/80 hover:bg-white/10"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
        <h2 className="text-sm font-semibold text-white">Nouvelle story</h2>
        <button
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-40"
          disabled={!peutPublier}
          onClick={publier}
          type="button"
        >
          {publication ? "Publication…" : "Publier"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Canevas : média si présent, sinon fond de texte. Les stickers s'y posent. */}
        <div
          className="relative mx-auto mt-2 aspect-9/16 w-full max-w-[260px] touch-none overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800"
          ref={canevasRef}
        >
          {choix.length > 0 ? (
            choix[0].type === "video" ? (
              <video
                className="pointer-events-none h-full w-full object-cover"
                muted
                playsInline
                src={choix[0].objetUrl}
              />
            ) : (
              <img
                alt=""
                className="pointer-events-none h-full w-full object-cover"
                src={choix[0].objetUrl}
              />
            )
          ) : null}

          {legende.trim() ? (
            <p
              className={`absolute inset-x-4 ${
                choix.length > 0
                  ? "bottom-4 rounded-xl bg-zinc-950/70 px-3 py-2 text-sm"
                  : "top-1/2 -translate-y-1/2 text-center text-xl font-semibold"
              } line-clamp-6 text-balance text-white`}
            >
              {legende}
            </p>
          ) : choix.length === 0 ? (
            <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-white/50">
              Votre texte apparaîtra ici
            </p>
          ) : null}

          {stickers.map((sticker, index) => (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
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
              <span className="text-3xl drop-shadow">{sticker.emoji}</span>
              <button
                aria-label="Retirer le sticker"
                className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border border-black/10 bg-white text-[10px] text-black"
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
          ))}
        </div>

        {/* Stickers : la palette arme directement le canevas. */}
        <div className="mt-4 rounded-2xl border border-white/15 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/80">Stickers</p>
            <p className="text-[11px] text-white/40">
              {stickers.length}/{STORY_MAX_STICKERS}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {STICKERS.map((emoji) => (
              <button
                aria-label={`Poser ${emoji}`}
                className="rounded-full px-2 py-1 text-lg leading-none transition hover:bg-white/10 active:scale-110 disabled:opacity-30"
                disabled={stickers.length >= STORY_MAX_STICKERS}
                key={emoji}
                onClick={() => ajouterSticker(emoji)}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            Touchez pour poser, glissez sur l'aperçu pour placer.
          </p>
        </div>

        {/* Sondage : la question et les options vivent dans la story. */}
        <div className="mt-3 rounded-2xl border border-white/15 p-3">
          <label className="flex items-center justify-between text-xs font-medium text-white/80">
            <span>Sondage</span>
            <input
              checked={sondage.actif}
              className="size-4 accent-current"
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
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                maxLength={120}
                onChange={(e) =>
                  setSondage((actuel) => ({
                    ...actuel,
                    question: e.target.value,
                  }))
                }
                placeholder="Votre question"
                value={sondage.question}
              />
              {sondage.options.map((option, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    maxLength={60}
                    onChange={(e) => majOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                  />
                  {sondage.options.length > 2 ? (
                    <button
                      aria-label="Retirer cette option"
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/10"
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
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:border-white/40"
                  onClick={ajouterOption}
                  type="button"
                >
                  + Ajouter une option
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Médias : liste et ajout, séparés du canevas. */}
        <input
          accept="image/*,video/*"
          className="hidden"
          multiple
          onChange={(e) => selectionner(e.target.files)}
          ref={inputRef}
          type="file"
        />

        {choix.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {choix.map((c) => (
              <div
                className="relative aspect-9/16 overflow-hidden rounded-xl bg-zinc-900"
                key={c.objetUrl}
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
                  aria-label="Retirer ce média"
                  className="absolute right-1 top-1 rounded-full bg-white px-2 py-0.5 text-xs text-black"
                  onClick={() => retirer(c.objetUrl)}
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="flex aspect-9/16 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/50 hover:border-white/40"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              ＋
            </button>
          </div>
        ) : (
          <button
            className="mt-3 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 text-white/60 hover:border-white/40"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <span className="text-2xl leading-none">＋</span>
            <span className="text-sm">Photo ou vidéo</span>
            <span className="text-[11px] text-white/40">
              {formatMediaLimit(STORY_MEDIA_MAX_BYTES)} maximum · ou restez en
              texte
            </span>
          </button>
        )}

        <textarea
          className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          maxLength={500}
          onChange={(e) => setLegende(e.target.value)}
          placeholder="Ajouter une légende — ou écrivez votre story"
          rows={2}
          value={legende}
        />

        <div className="mt-3 flex gap-2">
          {(
            [
              ["followers", "Abonnés"],
              ["public", "Tout le monde"],
              ["private", "Moi seul"],
            ] as const
          ).map(([valeur, libelle]) => (
            <button
              className={`rounded-full border px-3 py-1 text-xs transition ${
                visibilite === valeur
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/70 hover:border-white/40"
              }`}
              key={valeur}
              onClick={() => setVisibilite(valeur)}
              type="button"
            >
              {libelle}
            </button>
          ))}
        </div>

        {erreur ? (
          <p className="mt-3 text-xs text-red-500 vibe-dark:text-red-300">
            {erreur}
          </p>
        ) : null}
      </div>
    </div>,
    document.querySelector(".vibe-root") || document.body
  );
};
