import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StoryRing } from "./StoryRing";
import { ApiService } from "../../services/api";
import { haptics } from "../../services/haptics";
import type {
  Story,
  StoryAuthor,
  StoryMedia,
  StoryViewer as StoryViewerType,
} from "../../types/vibe";

/**
 * LECTEUR DE STORIES (StoryViewer.tsx)
 *
 * Reprend la grammaire de `feed/MediaLightbox.tsx` (barres, swipe, clavier,
 * haptique).
 */

const IMAGE_DURATION_MS = 6000;
const TICK_MS = 50;
const SWIPE_THRESHOLD_PX = 60;

const REACTIONS = ["❤️", "🔥", "😮"] as const;

type Item = { media: StoryMedia | null; story: Story };

function aplatir(auteur?: StoryAuthor): Item[] {
  if (!auteur) return [];
  return auteur.stories.flatMap<Item>((story) =>
    story.media.length > 0
      ? story.media.map((media) => ({ media, story }))
      : [{ media: null, story }]
  );
}

export interface StoryViewerProps {
  authors: StoryAuthor[];
  initialAuthorIndex?: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  authors,
  initialAuthorIndex = 0,
  onClose,
}) => {
  const [authorIndex, setAuthorIndex] = useState(initialAuthorIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [maReaction, setMaReaction] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [envoi, setEnvoi] = useState<"erreur" | "envoye" | "envoi">("envoye");
  const [vues, setVues] = useState<StoryViewerType[] | null>(null);
  const [compteurVues, setCompteurVues] = useState(0);
  const [votes, setVotes] = useState<
    Record<string, { counts: number[]; myVote: number; total: number }>
  >({});

  const auteur = authors[authorIndex];
  const items = useMemo(() => aplatir(auteur), [auteur]);
  const courant = items[itemIndex];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const vuesEnregistrees = useRef<Set<string>>(new Set());

  const passerAuteur = useCallback(
    (delta: number) => {
      setAuthorIndex((index) => {
        const suivant = index + delta;
        if (suivant < 0 || suivant >= authors.length) return index;
        return suivant;
      });
      setItemIndex(0);
      setProgress(0);
      setMaReaction(null);
      setVues(null);
    },
    [authors.length]
  );

  const avancer = useCallback(() => {
    haptics.selection();
    if (itemIndex + 1 < items.length) {
      setItemIndex((i) => i + 1);
      return;
    }
    if (authorIndex + 1 < authors.length) {
      passerAuteur(1);
      return;
    }
    onClose();
  }, [
    authorIndex,
    authors.length,
    itemIndex,
    items.length,
    onClose,
    passerAuteur,
  ]);

  const reculer = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
      return;
    }
    if (authorIndex > 0) {
      passerAuteur(-1);
      setItemIndex(Math.max(0, aplatir(authors[authorIndex - 1]).length - 1));
      return;
    }
    setProgress(0);
  }, [authorIndex, itemIndex, authors, passerAuteur]);

  const identiteCourante = courant
    ? `${courant.story.id}:${courant.media?.id ?? "texte"}`
    : "";
  useEffect(() => {
    setProgress(0);
    setMaReaction(null);
    setVues(null);
    setBrouillon("");
    setEnvoi("envoye");
    if (!courant) return;

    const story = courant.story;
    setCompteurVues(0);
    if (!vuesEnregistrees.current.has(story.id)) {
      vuesEnregistrees.current.add(story.id);
      ApiService.viewStory(story.id).catch(() => {});
    }
  }, [identiteCourante, courant]);

  const estPhoto =
    Boolean(courant) &&
    (!courant?.media || courant.media.mediaType === "image");
  useEffect(() => {
    if (!estPhoto || paused || !courant) return;
    const step = (TICK_MS / IMAGE_DURATION_MS) * 100;
    const timer = setInterval(() => {
      setProgress((p) => Math.min(100, p + step));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [estPhoto, paused, courant]);

  useEffect(() => {
    if (progress >= 100 && estPhoto) avancer();
  }, [progress, estPhoto, avancer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") avancer();
      else if (e.key === "ArrowLeft") reculer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [avancer, reculer, onClose]);

  const reagir = useCallback(
    async (emoji: string) => {
      if (!courant) return;
      setMaReaction(emoji);
      haptics.light();
      try {
        await ApiService.reactStory(courant.story.id, emoji);
      } catch {}
    },
    [courant]
  );

  const voter = useCallback(
    async (index: number) => {
      const story = courant?.story;
      if (!story?.poll) return;
      haptics.light();
      try {
        const res = await ApiService.voteStory(story.id, index);
        setVotes((actuel) => ({
          ...actuel,
          [story.id]: {
            counts: Array.isArray(res.counts) ? res.counts : [],
            myVote: Number.isInteger(res.myVote) ? res.myVote : index,
            total: Number(res.total || 0),
          },
        }));
      } catch {}
    },
    [courant]
  );

  const repondre = useCallback(async () => {
    const texte = brouillon.trim();
    if (!texte || !auteur || envoi === "envoi") return;
    setEnvoi("envoi");
    try {
      await ApiService.sendMessage(auteur.authorId, texte);
      setBrouillon("");
      setEnvoi("envoye");
    } catch {
      setEnvoi("erreur");
    }
  }, [auteur, brouillon, envoi]);

  const afficherVues = useCallback(async () => {
    if (!courant || !auteur?.isMine) return;
    try {
      const res = await ApiService.getStoryViews(courant.story.id);
      setVues(res.viewers || []);
      setCompteurVues(res.count || 0);
    } catch {
      setVues([]);
    }
  }, [auteur?.isMine, courant]);

  const supprimer = useCallback(async () => {
    if (!courant) return;
    try {
      await ApiService.deleteStory(courant.story.id);
      haptics.medium();
    } catch {}
    avancer();
  }, [avancer, courant]);

  if (!courant) {
    return null;
  }

  const estVideo = courant.media?.mediaType === "video";
  const sondage = courant.story.poll;
  const etatSondage = sondage
    ? (votes[courant.story.id] ?? {
        counts: sondage.counts,
        myVote: sondage.myVote,
        total: sondage.total,
      })
    : null;
  const sondageVerrouille =
    Boolean(auteur?.isMine) || (etatSondage?.myVote ?? null) !== null;
  const montrerResultats = sondageVerrouille;

  return createPortal(
    <div
      className="vibe-story-viewer fixed inset-0 z-[90] flex flex-col bg-zinc-950"
      onPointerCancel={() => setPaused(false)}
      onPointerDown={(e) => {
        pointerRef.current = { x: e.clientX, y: e.clientY };
        setPaused(true);
      }}
      onPointerUp={(e) => {
        const depart = pointerRef.current;
        pointerRef.current = null;
        setPaused(false);
        if (!depart) return;
        const dx = e.clientX - depart.x;
        const dy = e.clientY - depart.y;
        if (Math.abs(dy) > SWIPE_THRESHOLD_PX && Math.abs(dy) > Math.abs(dx)) {
          passerAuteur(dy < 0 ? 1 : -1);
          return;
        }
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
          if (dx < 0) avancer();
          else reculer();
          return;
        }
        const moitieDroite = e.clientX > window.innerWidth / 2;
        if (moitieDroite) avancer();
        else reculer();
      }}
    >
      {/* Barres de progression */}
      <div className="flex gap-1 px-3 pt-3 shrink-0">
        {items.map((item, index) => (
          <div
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-500/30"
            key={item.media?.id ?? item.story.id}
          >
            <div
              className="h-full bg-zinc-500 transition-[width] duration-75 ease-linear vibe-dark:bg-white"
              style={{
                width:
                  index < itemIndex
                    ? "100%"
                    : index === itemIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* En-tête */}
      <div className="flex items-center gap-3 px-3 py-3 shrink-0">
        <StoryRing
          avatarUrl={auteur?.avatarUrl}
          displayName={auteur?.displayName}
          hasStory
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {auteur?.displayName}
          </p>
          <p className="truncate text-[11px] text-white/60">
            @{auteur?.username} ·{" "}
            {new Date(courant.story.expiresAt).getTime() > Date.now()
              ? "il expire à minuit"
              : "archivée"}
          </p>
        </div>
        {auteur?.isMine ? (
          <button
            className="rounded-full px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
            onClick={afficherVues}
            type="button"
          >
            Vues
          </button>
        ) : null}
        <button
          aria-label="Fermer"
          className="rounded-full p-2 text-white/80 hover:bg-white/10"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Média / Canevas */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-100 vibe-dark:bg-black">
        {estVideo ? (
          <video
            autoPlay
            className="h-full w-full object-contain"
            key={identiteCourante}
            muted
            onEnded={avancer}
            playsInline
            ref={videoRef}
            src={courant.media?.url}
          />
        ) : courant.media ? (
          <img
            alt={courant.media.altText || "Story"}
            className="h-full w-full object-contain"
            key={identiteCourante}
            src={courant.media.url}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-8">
            <p className="max-h-full overflow-hidden text-balance text-center text-2xl font-semibold leading-snug text-white">
              {courant.story.caption}
            </p>
          </div>
        )}

        {/* Stickers avec support badges */}
        {courant.story.stickers.map((sticker, index) => {
          const estBadge =
            /[a-zA-Z0-9]/.test(sticker.emoji) ||
            sticker.emoji.startsWith("📍") ||
            sticker.emoji.startsWith("⭐");
          return (
            <span
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${
                estBadge
                  ? "vibe-story-badge shadow-xl"
                  : "text-4xl drop-shadow"
              }`}
              key={`${sticker.emoji}-${index}`}
              style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%` }}
            >
              {sticker.emoji}
            </span>
          );
        })}

        {/* Légende et sondage */}
        {(courant.media && courant.story.caption) ||
        (sondage && etatSondage) ? (
          <div className="absolute inset-x-4 bottom-4 space-y-2">
            {courant.media && courant.story.caption ? (
              <p className="rounded-xl bg-zinc-950/70 px-3 py-2 text-center text-sm text-white backdrop-blur-sm">
                {courant.story.caption}
              </p>
            ) : null}
            {sondage && etatSondage ? (
              <div className="rounded-2xl bg-zinc-950/85 p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold text-white">
                  {sondage.question}
                </p>
                <div className="mt-2 space-y-1.5">
                  {sondage.options.map((option, index) => {
                    const choisi = etatSondage.myVote === index;
                    const compteur = Number(etatSondage.counts[index] || 0);
                    const part =
                      etatSondage.total > 0
                        ? Math.round((compteur / etatSondage.total) * 100)
                        : 0;
                    return (
                      <button
                        className={`relative block w-full overflow-hidden rounded-xl border px-3 py-1.5 text-left text-xs transition ${
                          choisi
                            ? "border-white/60 text-white"
                            : "border-white/20 text-white/80 hover:border-white/40"
                        }`}
                        key={`${option}-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!sondageVerrouille) voter(index);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        type="button"
                      >
                        {montrerResultats ? (
                          <span
                            className="absolute inset-y-0 left-0 bg-zinc-500/30"
                            style={{ width: `${part}%` }}
                          />
                        ) : null}
                        <span className="relative flex items-center justify-between gap-2">
                          <span className="truncate">{option}</span>
                          {montrerResultats ? (
                            <span className="shrink-0 text-white/60">
                              {part}%
                            </span>
                          ) : null}
                          {choisi ? <span className="shrink-0">✓</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-white/50">
                  {etatSondage.total} vote
                  {etatSondage.total > 1 ? "s" : ""}
                  {auteur?.isMine
                    ? " · sondage de votre story"
                    : etatSondage.myVote === null
                      ? " · touchez une option"
                      : ""}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Vues */}
      {vues ? (
        <div className="max-h-40 shrink-0 overflow-y-auto border-t border-white/10 bg-zinc-950 px-4 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-white/50">
            {compteurVues} vue{compteurVues > 1 ? "s" : ""}
          </p>
          {vues.length === 0 ? (
            <p className="text-xs text-white/50">
              Personne ne l'a encore regardée.
            </p>
          ) : (
            <ul className="space-y-1">
              {vues.map((v) => (
                <li
                  className="flex items-center gap-2 text-xs text-white/80"
                  key={v.username}
                >
                  <StoryRing
                    avatarUrl={v.avatarUrl}
                    displayName={v.displayName}
                    size="sm"
                  />
                  <span className="truncate">{v.displayName}</span>
                  <span className="ml-auto text-white/40">@{v.username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="shrink-0 space-y-2 border-t border-white/10 bg-zinc-950 px-3 py-3">
        <div className="flex items-center gap-1">
          {REACTIONS.map((emoji) => (
            <button
              aria-label={`Réagir ${emoji}`}
              className={`rounded-full px-3 py-1.5 text-base transition ${
                maReaction === emoji
                  ? "bg-white/20 scale-110"
                  : "hover:bg-white/10"
              }`}
              key={emoji}
              onClick={() => reagir(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
          {auteur?.isMine ? (
            <button
              className="ml-auto rounded-full px-3 py-1.5 text-[11px] text-red-600 hover:bg-white/10 vibe-dark:text-red-300"
              onClick={supprimer}
              type="button"
            >
              Supprimer
            </button>
          ) : null}
        </div>

        {auteur?.isMine ? null : (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              onChange={(e) => setBrouillon(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder={`Répondre à @${auteur?.username}…`}
              value={brouillon}
            />
            <button
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
              disabled={!brouillon.trim() || envoi === "envoi"}
              onClick={(e) => {
                e.stopPropagation();
                repondre();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              type="button"
            >
              {envoi === "envoi" ? "…" : "Envoyer"}
            </button>
          </div>
        )}
        {envoi === "erreur" ? (
          <p className="text-[11px] text-red-600 vibe-dark:text-red-300">
            Réponse non envoyée. Vérifiez votre connexion et réessayez.
          </p>
        ) : null}
      </div>
    </div>,
    document.querySelector(".vibe-root") || document.body
  );
};
