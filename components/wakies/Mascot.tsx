"use client";

import {
  DEFAULT_WAKIE_AVATAR,
  isWakieAvatar,
  WAKIE_AVATARS,
} from "@/lib/wakies/shared/avatars";

/**
 * Mascottes de l'interface.
 *
 * Deux sources, dans cet ordre : l'avatar CHOISI (colonne `avatar` du Wakie,
 * écrit à la création) puis, s'il est absent, une identité stable dérivée de
 * l'identifiant. Cette seconde branche est ce qui garde les Wakies antérieurs
 * reconnaissables : ils n'ont pas de colonne renseignée et retrouvent
 * exactement la même mascotte qu'avant.
 */

/** Hash déterministe : même identifiant, même mascotte, après rechargement. */
function characterFor(identity?: string) {
  if (!identity) return DEFAULT_WAKIE_AVATAR;
  let hash = 0;
  for (const character of identity)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return WAKIE_AVATARS[hash % WAKIE_AVATARS.length];
}

export function Mascot({
  state = "idle",
  small = false,
  identity,
  avatar,
  name = "Wakie",
  decorative = false,
}: {
  state?: string;
  small?: boolean;
  identity?: string;
  /** Avatar choisi à la création ; absent/illisible = déduit de `identity`. */
  avatar?: string | null;
  name?: string;
  decorative?: boolean;
}) {
  const character = isWakieAvatar(avatar) ? avatar : characterFor(identity);
  return (
    <span className={`mascot ${state} ${small ? "small" : ""}`}>
      <img
        alt={decorative ? "" : `${name} is ${state}`}
        className="dot-body"
        draggable={false}
        height={512}
        src={`/wakies/${character}.png`}
        width={512}
      />
    </span>
  );
}
