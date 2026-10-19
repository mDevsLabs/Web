import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StoryComposer } from "./StoryComposer";
import { StoryRing } from "./StoryRing";
import { StoryViewer } from "./StoryViewer";
import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/api";
import type { StoryAuthor } from "../../types/vibe";

/**
 * RAIL DE STORIES (StoriesTray.tsx)
 *
 * Barre horizontale posée au-dessus du fil.
 */

export const StoriesTray: React.FC = () => {
  const { profile, user } = useAuth();
  const [auteurs, setAuteurs] = useState<StoryAuthor[]>([]);
  const [indexOuvert, setIndexOuvert] = useState<number | null>(null);
  const [compositeurOuvert, setCompositeurOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await ApiService.getStoriesTray();
      setAuteurs(Array.isArray(res?.stories) ? res.stories : []);
    } catch {
      setAuteurs([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    const onRefresh = () => charger();
    window.addEventListener("vibe:stories_refresh", onRefresh);
    return () => window.removeEventListener("vibe:stories_refresh", onRefresh);
  }, [charger]);

  const mesStories = useMemo(() => auteurs.find((a) => a.isMine), [auteurs]);

  const monAvatar =
    mesStories?.avatarUrl || profile?.avatarUrl || user?.avatar_url || null;
  const monNom = mesStories?.username || user?.username;

  const ouvert = indexOuvert === null ? null : auteurs[indexOuvert];

  if (chargement) {
    return (
      <div aria-label="Chargement des stories" className="vibe-stories-tray">
        <div className="h-[76px] w-full rounded-2xl bg-zinc-900/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="vibe-stories-tray">
      <div className="flex gap-3 overflow-x-auto px-4 py-3 no-scrollbar">
        <button
          className="flex shrink-0 flex-col items-center gap-1"
          onClick={() => setCompositeurOuvert(true)}
          type="button"
        >
          <span className="relative">
            <StoryRing
              avatarUrl={monAvatar}
              displayName={monNom}
              hasStory={false}
              size="md"
            />
            <span className="vibe-stories-add">+</span>
          </span>
          <span className="max-w-[68px] truncate text-[11px] text-zinc-400">
            {mesStories ? "Ma story" : "Ajouter"}
          </span>
        </button>

        {auteurs.map((auteur, index) => (
          <button
            className="flex shrink-0 flex-col items-center gap-1"
            key={auteur.authorId}
            onClick={() => setIndexOuvert(index)}
            type="button"
          >
            <StoryRing
              avatarUrl={auteur.avatarUrl}
              displayName={auteur.displayName}
              hasStory
              seen={auteur.seen}
              size="md"
            />
            <span className="max-w-[68px] truncate text-[11px] text-zinc-400">
              @{auteur.username}
            </span>
          </button>
        ))}
      </div>

      {ouvert ? (
        <StoryViewer
          authors={auteurs}
          initialAuthorIndex={indexOuvert ?? 0}
          onClose={() => {
            setIndexOuvert(null);
            ApiService.invalidateCache(ApiService.storiesTrayEndpoint?.() || "/v1/stories/tray");
            charger();
          }}
        />
      ) : null}

      <StoryComposer
        onClose={() => setCompositeurOuvert(false)}
        onPublished={() => {
          setCompositeurOuvert(false);
          ApiService.invalidateCache?.("/v1/stories");
          charger();
        }}
        open={compositeurOuvert}
      />
    </div>
  );
};
