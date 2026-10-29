/**
 * Classification des routes Midjourney (`/mj/*`, `/v1/mj/*`).
 *
 * Une lecture de statut n'est JAMAIS une génération : elle ne consomme ni le
 * quota journalier d'images ni le crédit API d'une image. `describe` et
 * `shorten` consomment le fournisseur mais ne produisent aucune image.
 *
 * Module pur, testable sans réseau ni base.
 */

export type MidjourneyRoute =
  | { action: null; generates: false; kind: "task_fetch"; taskId: string }
  | {
      action: string;
      generates: boolean;
      kind: "submit";
      requiresTaskId: boolean;
    }
  | { kind: "unknown" };

const GENERATING_ACTIONS = new Set([
  "imagine",
  "action",
  "blend",
  "change",
  "modal",
  "swap-face",
]);

// Actions qui portent sur une tâche existante : l'identifiant fourni dans le
// corps doit appartenir au compte avant tout appel fournisseur.
const TASK_BOUND_ACTIONS = new Set(["action", "change", "modal", "swap-face"]);

export function classifyMidjourneyPath(subPath: string): MidjourneyRoute {
  const clean = String(subPath || "").replace(/^\/+/, "");
  const taskFetch = clean.match(/^task\/([^/]+)\/fetch$/);
  if (taskFetch) {
    let taskId = taskFetch[1];
    try {
      taskId = decodeURIComponent(taskId);
    } catch {
      // Identifiant mal encodé : il ne correspondra à aucune tâche.
    }
    return { action: null, generates: false, kind: "task_fetch", taskId };
  }
  const submit = clean.match(/^submit\/([a-z-]+)$/);
  if (submit) {
    const action = submit[1];
    return {
      action,
      generates: GENERATING_ACTIONS.has(action),
      kind: "submit",
      requiresTaskId: TASK_BOUND_ACTIONS.has(action),
    };
  }
  return { kind: "unknown" };
}
