import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { StoryViewer } from "@/components/vibe/stories/StoryViewer";
import { ApiService } from "@/lib/vibe/services/api";
import type { StoryAuthor } from "@/lib/vibe/types/vibe";

/**
 * ANNEAU DE PROFIL (ProfileStoryRing.tsx)
 *
 * Se superpose à l'avatar d'un profil pour signaler qu'une story est publiée, et
 * ouvre le lecteur. Il n'enveloppe pas l'avatar : sur le profil d'un compte, la
 * photo porte déjà un overlay « Changer » calé sur son conteneur, et l'empiler
 * dans une coque aurait élargi la zone de survol de ce bouton.
 *
 * La cible cliquable est le bandeau de l'anneau lui-même, posé DERRIÈRE l'avatar
 * (`z-0`) : l'avatar reste cliquable pour ce qu'il fait déjà, et l'anneau reste
 * le seul endroit où le clic ouvre les stories. Un anneau de 8 px est une cible
 * étroite, mais c'est le prix d'une superposition sans restructuration ; l'accès
 * principal aux stories de soi reste le rail du fil.
 */

export interface ProfileStoryRingProps {
  /** Anneau mince, pour les avatars de 32 px des navigations. */
  compact?: boolean;
  /** Pseudo du profil affiché — sert à retrouver l'auteur dans le rail. */
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
        (a) => String(a.username || "").toLowerCase() === propre
      );
      setAuteur(trouve ?? null);
    } catch {
      // Aucune story ne doit jamais casser un profil : l'anneau s'efface.
      setAuteur(null);
    }
  }, [username]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Publication vue depuis le profil elle-même (archive, suppression) : le rail
  // est invalidé, on le relit.
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
          // Dans une carte de fil, l'avatar est lui-même un lien vers le profil :
          // sans arrêt de propagation, ouvrir les stories naviguerait aussi.
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
            ApiService.invalidateCache(ApiService.storiesTrayEndpoint());
            charger();
          }}
        />
      ) : null}
    </>
  );
};
