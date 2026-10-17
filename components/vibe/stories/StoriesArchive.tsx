import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { StoryViewer } from "@/components/vibe/stories/StoryViewer";
import { ApiService } from "@/lib/vibe/services/api";
import type { Story, StoryAuthor } from "@/lib/vibe/types/vibe";

/**
 * ARCHIVE DE STORIES (StoriesArchive.tsx)
 *
 * Les stories dont la fenêtre de 24 h est écoulée, ou que l'auteur a archivées
 * elles-mêmes, restent sur son profil. Rien n'est effacé : l'expiration est un
 * prédicat de lecture côté serveur (`vibe-stories.ts`), aucun cron n'y participe.
 *
 * Le lecteur est réutilisé en mode relecture : la liste des vues y reste
 * accessible à l'auteur, mais une story archivée ne peut plus être « revue » par
 * autrui — elle a quitté le rail.
 */

function auteurUnique(
  stories: Story[],
  avatarUrl: string | null | undefined,
  displayName: string,
  username: string
): StoryAuthor {
  return {
    authorId: -1,
    avatarUrl: avatarUrl ?? null,
    displayName,
    isMine: true,
    seen: true,
    stories,
    username,
  };
}

export interface StoriesArchiveProps {
  /** Absent tant que le profil n'est pas chargé : la vignette s'en passe. */
  avatarUrl?: string | null;
  displayName: string;
  username: string;
}

export const StoriesArchive: React.FC<StoriesArchiveProps> = ({
  avatarUrl,
  displayName,
  username,
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [indexOuvert, setIndexOuvert] = useState<number | null>(null);

  const charger = useCallback(async () => {
    try {
      const res = await ApiService.getStoriesArchive();
      setStories(Array.isArray(res?.stories) ? res.stories : []);
      setErreur("");
    } catch {
      setErreur("Archive indisponible pour le moment.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (chargement) {
    return (
      <div className="vibe-stories-archive">
        {[0, 1, 2].map((i) => (
          <div
            className="aspect-9/16 rounded-xl bg-zinc-900 animate-pulse"
            key={i}
          />
        ))}
      </div>
    );
  }

  if (erreur) {
    return <p className="py-8 text-center text-xs text-zinc-500">{erreur}</p>;
  }

  if (stories.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-400">Aucune story archivée.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Une story disparaît du rail après 24 h et se range ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="vibe-stories-archive">
        {stories.map((story, index) => {
          const premier = story.media[0];
          if (!premier) return null;
          const date = new Date(story.expiresAt);
          return (
            <button
              className="group relative aspect-9/16 overflow-hidden rounded-xl bg-zinc-900"
              key={story.id}
              onClick={() => setIndexOuvert(index)}
              type="button"
            >
              {premier.mediaType === "video" ? (
                <video
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  src={premier.url}
                />
              ) : (
                <img
                  alt={premier.altText || "Story archivée"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  src={premier.url}
                />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-left text-[10px] text-white/80">
                {date.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
                {story.media.length > 1 ? ` · ${story.media.length}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {indexOuvert === null ? null : (
        <StoryViewer
          // Une seule story dans le lecteur : celle qui a été cliquée. Le
          // lecteur n'a pas d'index d'item initial, lui passer tout l'archive
          // rouvrirait systématiquement la première vignette.
          authors={[
            auteurUnique(
              [stories[indexOuvert]].filter(Boolean),
              avatarUrl,
              displayName,
              username
            ),
          ]}
          initialAuthorIndex={0}
          onClose={() => setIndexOuvert(null)}
        />
      )}
    </>
  );
};
