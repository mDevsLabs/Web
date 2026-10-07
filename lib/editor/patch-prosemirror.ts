// Protection globale contre l'erreur ProseMirror / TipTap :
// "RangeError: Duplicate use of selection JSON ID gapcursor" (ou "cell").
// Cette erreur survient lorsque plusieurs modules, bundles ou rechargements HMR
// tentent d'enregistrer le même type de sélection auprès de prosemirror-state.

import { Selection } from "prosemirror-state";

const PATCHED_KEY = Symbol.for("__prosemirror_selection_jsonid_patched__");

interface PatchedSelection {
  jsonID?: (id: string, selectionClass: unknown) => unknown;
  [PATCHED_KEY]?: boolean;
}

const TargetSelection = Selection as unknown as PatchedSelection;

if (
  TargetSelection &&
  typeof TargetSelection.jsonID === "function" &&
  !TargetSelection[PATCHED_KEY]
) {
  TargetSelection[PATCHED_KEY] = true;
  const originalJsonID = TargetSelection.jsonID;

  TargetSelection.jsonID = function patchedJsonID(
    id: string,
    selectionClass: unknown
  ) {
    try {
      return originalJsonID.call(this, id, selectionClass);
    } catch (error) {
      if (
        error instanceof RangeError &&
        typeof error.message === "string" &&
        error.message.includes("Duplicate use of selection JSON ID")
      ) {
        // L'identifiant est déjà enregistré dans classesById de prosemirror-state.
        // On attache la propriété jsonID sur le prototype sans relancer l'erreur.
        if (
          selectionClass &&
          typeof selectionClass === "function" &&
          selectionClass.prototype &&
          typeof selectionClass.prototype === "object"
        ) {
          (selectionClass.prototype as { jsonID?: string }).jsonID = id;
        }
        return selectionClass;
      }
      throw error;
    }
  };
}
