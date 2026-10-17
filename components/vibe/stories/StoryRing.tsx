import type React from "react";
import { useCallback } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";

/**
 * ANNEAU DE STORY (StoryRing.tsx)
 *
 * Coque externe posée autour de `ProfileAvatar` : le composant d'avatar reste
 * intact, car il a trois rendus (squelette, initiales, image) et vingt-huit lieux
 * d'utilisation. Ajouter une prop d'anneau aurait forcé à éditer chaque appelant —
 * et la copie mobile, divergente.
 *
 * Le dégradé conique est une signature visuelle de l'interface : il vit dans la
 * feuille de style (`apps/vibe/src/index.css`, classe `.vibe-story-ring`), pas en
 * classes utilitaires, pour rester ajustable en un seul endroit.
 *
 * États rendus par attributs `data-*`, jamais par des classes conditionnelles :
 *   data-live="false"  aucune story  → pas d'anneau, avatar nu
 *   data-seen="false"  une story inédite → anneau dégradé
 *   data-seen="true"   toutes vues   → anneau gris
 */

export type StoryRingSize = "lg" | "md" | "sm" | "xl";

/** Tailles intérieures, alignées sur `SIZE_CLASSES` de ProfileAvatar. */
const AVATAR_SIZE: Record<StoryRingSize, string> = {
  lg: "w-16 h-16",
  md: "w-12 h-12",
  sm: "w-8 h-8",
  xl: "w-24 h-24 sm:w-28 sm:h-28",
};

export interface StoryRingProps {
  /** Avatar de l'auteur. */
  avatarUrl?: string | null;
  /** Nom utilisé pour l'anneau de repli (initiales) et l'infobulle. */
  displayName?: string;
  /** Faux ⇒ aucun anneau : l'avatar reste tel quel, sans interactivité. */
  hasStory?: boolean;
  onClick?: () => void;
  /** true si le spectateur a déjà vu toutes les stories de cet auteur. */
  seen?: boolean;
  size?: StoryRingSize;
}

/**
 * Anneau en SUPERPOSITION, pour les avatars qui ne peuvent pas être enveloppés :
 * la photo d'en-tête d'un profil porte déjà un overlay « Changer » calé sur son
 * conteneur, et l'empiler dans une coque agrandirait sa zone de survol. Ici
 * l'anneau est un cercle en `pointer-events: none` posé autour de l'existant.
 */
export const StoryRingHalo: React.FC<{ seen?: boolean }> = ({
  seen = false,
}) => (
  <span
    aria-hidden
    className="vibe-story-ring-halo"
    data-seen={seen ? "true" : "false"}
  />
);

export const StoryRing: React.FC<StoryRingProps> = ({
  avatarUrl,
  displayName,
  hasStory = false,
  onClick,
  size = "md",
  seen = false,
}) => {
  const interactive = hasStory && Boolean(onClick);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!interactive || !onClick) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onClick();
    },
    [interactive, onClick]
  );

  return (
    <div
      aria-label={
        interactive
          ? `Voir les stories de ${displayName || "ce compte"}`
          : undefined
      }
      className="vibe-story-ring shrink-0"
      data-live={hasStory ? "true" : "false"}
      data-seen={seen ? "true" : "false"}
      data-size={size}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={displayName ? `@${displayName}` : "Story"}
    >
      <ProfileAvatar
        alt={displayName || "Avatar"}
        className={`${AVATAR_SIZE[size]} border-2 border-black bg-zinc-900`}
        fallbackName={displayName}
        size="custom"
        src={avatarUrl}
      />
    </div>
  );
};
