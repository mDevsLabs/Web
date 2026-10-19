import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { ApiService } from "../../services/api";
import type { StoryAuthor } from "../../types/vibe";

/**
 * ANNEAU DE PROFIL (ProfileStoryRing.tsx)
 *
 * Se superpose à l'avatar d'un profil pour signaler qu'une story est publiée.
 */

export interface ProfileStoryRingProps {
  compact?: boolean;
  username: string;
}

export const ProfileStoryRing: React.FC<ProfileStoryRingProps> = ({
  compact = false,
  username,
}) => {
  const [auteur, setAuteur] = useState<StoryAuthor | null>(null);
  const [ouvert, setOuvert] = useState(false);

  const charger = useCallback(async () => {
    const propre = username.trim().replace(/^@/, "").toLowerCase();
    if (!propre) return;
    try {
      const res = await ApiService.getStoriesTray();
      const trouve = (res?.stories || []).find(
        (a: StoryAuthor) => String(a.username || "").toLowerCase() === propre
      );
      setAuteur(trouve ?? null);
    } catch {
      setAuteur(null);
    }
  }, [username]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    const onRefresh = () => charger();
    window.addEventListener("vibe:stories_refresh", onRefresh);
    return () => window.removeEventListener("vibe:stories_refresh", onRefresh);
  }, [charger]);

  if (!auteur) return null;

  return (
    <>
      <button
        aria-label={`Voir les stories de @${auteur.username}`}
        className={`vibe-story-ring-hit${compact ? " vibe-story-ring-hit--compact" : ""}`}
        data-seen={auteur.seen ? "true" : "false"}
        onClick={(e) => {
          e.stopPropagation();
          setOuvert(true);
        }}
        title={`Stories de @${auteur.username}`}
        type="button"
      />
      {ouvert ? (
        <StoryViewer
          authors={[auteur]}
          onClose={() => {
            setOuvert(false);
            ApiService.invalidateCache(ApiService.storiesTrayEndpoint?.() || "/v1/stories/tray");
            charger();
          }}
        />
      ) : null}
    </>
  );
};
