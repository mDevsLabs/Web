/**
 * Résolution de la destination d'un Wakie.
 *
 * Un Espace supprimé détache les Wakies qui le prenaient pour destination
 * (`spaceId = null`, `spaceIds = []`). L'enregistrement suivant — même s'il ne
 * porte que des outils — doit réparer cet état au lieu d'échouer sur une
 * validation. La règle est pure pour être testée sans base :
 *
 * 1. la destination explicite du patch ;
 * 2. sinon la destination actuelle ;
 * 3. sinon le premier accès existant ;
 * 4. sinon le premier Espace disponible du compte ;
 * 5. sinon aucune destination (le compte n'a aucun Espace).
 *
 * Dans tous les cas, la destination fait partie des accès rendus.
 */

export type WakieDestinationInput = {
  /** Espaces du compte, dans l'ordre d'affichage (épinglés puis création). */
  availableSpaceIds: string[];
  currentSpaceId: string | null;
  currentSpaceIds: string[];
  patchSpaceId?: string | null;
  patchSpaceIds?: string[] | null;
};

export type WakieDestination = {
  spaceId: string;
  spaceIds: string[];
};

export function resolveWakieDestination(
  input: WakieDestinationInput
): WakieDestination | null {
  const patchSpaceId = input.patchSpaceId?.trim() || null;
  // Un tableau vide est l'écho d'un Wakie détaché, pas une décision de retirer
  // tous les accès : il ne doit pas effacer ce que la ligne sait déjà.
  const accesses =
    input.patchSpaceIds && input.patchSpaceIds.length > 0
      ? input.patchSpaceIds
      : input.currentSpaceIds;
  const spaceId =
    patchSpaceId ??
    input.currentSpaceId ??
    accesses[0] ??
    input.availableSpaceIds[0] ??
    null;
  if (!spaceId) {
    return null;
  }
  return {
    spaceId,
    spaceIds: [...new Set([...accesses, spaceId])].sort(),
  };
}
