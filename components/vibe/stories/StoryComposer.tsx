import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import {
  formatMediaLimit,
  STORY_MEDIA_MAX_BYTES,
} from "@/lib/vibe/services/tierLimits";

/**
 * COMPOSITEUR DE STORY (StoryComposer.tsx)
 *
 * Photo ou vidéo ≤ 50 Mo, légende, visibilité. Le média est téléversé par
 * `uploadFile` PUIS revendiqué auprès de `POST /v1/stories` : le serveur recontrôle
 * l'origine, le namespace et la taille de l'objet, donc ce que filtre ici n'est
 * qu'un confort — jamais la garantie.
 *
 * Le calibre de la story (50 Mo) est volontairement plus strict que le plafond
 * d'upload du forfait (1 Go pour les payants) : une story de 900 Mo doit rester
 * refusée, y compris par un compte Max.
 */

const STORY_MAX_ITEMS = 10;

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
  const [publication, setPublication] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const publier = useCallback(async () => {
    if (choix.length === 0 || publication) return;
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
  }, [choix, legende, onPublished, publication, visibilite]);

  if (!open) return null;

  return createPortal(
    <div className="vibe-story-composer fixed inset-0 z-[85] flex flex-col bg-black/95">
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
          disabled={choix.length === 0 || publication}
          onClick={publier}
          type="button"
        >
          {publication ? "Publication…" : "Publier"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {choix.length === 0 ? (
          <button
            className="mt-8 flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 text-white/60 hover:border-white/40"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <span className="text-3xl leading-none">＋</span>
            <span className="text-sm">Photo ou vidéo</span>
            <span className="text-[11px] text-white/40">
              {formatMediaLimit(STORY_MEDIA_MAX_BYTES)} maximum
            </span>
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
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
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
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
        )}

        <input
          accept="image/*,video/*"
          className="hidden"
          multiple
          onChange={(e) => selectionner(e.target.files)}
          ref={inputRef}
          type="file"
        />

        <textarea
          className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          maxLength={500}
          onChange={(e) => setLegende(e.target.value)}
          placeholder="Ajouter une légende"
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

        {erreur ? <p className="mt-3 text-xs text-red-300">{erreur}</p> : null}
      </div>
    </div>,
    document.querySelector(".vibe-root") || document.body
  );
};
