import { afterEach, beforeEach, vi } from "vitest";

/**
 * Garde globale des tests unitaires : le réseau réel est INTERDIT.
 *
 * Un test qui exécute accidentellement `fetch` vers le backend (par exemple un
 * mock `mockResolvedValueOnce` épuisé) doit échouer immédiatement, pas attendre
 * un délai de 5 secondes ni dépendre d'Internet. Les tests qui simulent un
 * transport remplacent cette fonction par `vi.stubGlobal("fetch", ...)` ou
 * `vi.spyOn(globalThis, "fetch")`.
 */
beforeEach(() => {
  if (!vi.isMockFunction(globalThis.fetch)) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        throw new Error(
          `[tests] Appel réseau réel interdit : ${String(input).slice(0, 200)}`
        );
      })
    );
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});
