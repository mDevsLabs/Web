/**
 * Palette des réactions Wakies — SOURCE UNIQUE.
 *
 * Elle existait en deux exemplaires : celle du serveur (`queries/social.ts`,
 * six émojis) et celle de l'interface (`PALETTE_REACTIONS_UI`, dix émojis).
 * Les deux ont divergé, donc quatre émojis proposés par la barre de réaction
 * étaient refusés côté serveur (« Émoji hors palette ») — le client offrait ce
 * que le serveur n'acceptait pas.
 *
 * Le module est CLIENT-SAFE (aucun import serveur) : la route, l'outil du
 * modèle et le transcript lisent la même liste. Ajouter une réaction se fait
 * ici, et nulle part ailleurs.
 */

/** Palette FIXE : le serveur la valide, jamais le client. */
export const PALETTE_REACTIONS = ["👍", "❤️", "💡", "🔥", "😂", "😮"] as const;

export type PaletteReaction = (typeof PALETTE_REACTIONS)[number];

/** Vrai si l'émoji appartient exactement à la palette (comparaison stricte). */
export function estReactionValide(emoji: unknown): emoji is PaletteReaction {
  return (
    typeof emoji === "string" &&
    (PALETTE_REACTIONS as readonly string[]).includes(emoji)
  );
}
