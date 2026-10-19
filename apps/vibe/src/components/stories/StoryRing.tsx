import type React from "react";
import { useCallback } from "react";
import { ProfileAvatar } from "../common/ProfileAvatar";

/**
 * ANNEAU DE STORY (StoryRing.tsx)
 *
 * Coque externe posée autour de `ProfileAvatar`.
 * Les styles sont portés par `.vibe-story-ring` dans apps/vibe/src/index.css.
 */

export type StoryRingSize = "lg" | "md" | "sm" | "xl";

const AVATAR_SIZE: Record<StoryRingSize, string> = {
  lg: "w-16 h-16",
  md: "w-12 h-12",
  sm: "w-8 h-8",
  xl: "w-24 h-24 sm:w-28 sm:h-28",
};

export interface StoryRingProps {
  avatarUrl?: string | null;
  displayName?: string;
  hasStory?: boolean;
  onClick?: () => void;
  seen?: boolean;
  size?: StoryRingSize;
}

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
