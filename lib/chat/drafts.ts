// Brouillon de saisie du chat : stockage LOCAL au navigateur uniquement
// (localStorage, aucune synchronisation multi-appareil, aucune table SQL).
//
// Contrat :
// - une clé namespacée par conversation (`mai.draft:v1:<chatId>`) ; le contexte
//   de création d'une nouvelle conversation utilise la clé dédiée
//   `mai.draft:v1:new` — un brouillon d'un chat n'est jamais restauré dans un
//   autre, et un brouillon « nouvelle conversation » ne fuit pas dans un chat
//   existant ;
// - payload minimal typé `{ text, savedAt }` avec TTL de 30 jours ;
// - tout échec de stockage (quota, navigation privée…) est journalisé et non
//   bloquant : le chat fonctionne toujours sans brouillon.

import { generateUUID } from "@/lib/utils";

const DRAFT_KEY_PREFIX = "mai.draft:v1:";
export const NEW_CHAT_DRAFT_KEY = `${DRAFT_KEY_PREFIX}new`;

// Aligné sur l'ancienne durée du brouillon global (cookie 30 jours).
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Garde-fou de taille : au-delà, on n'insiste pas (texte aberrant ou quota
// proche) — la persistance du brouillon ne doit jamais être une évidence.
const DRAFT_MAX_TEXT_LENGTH = 100_000;

export type ChatDraft = {
  savedAt: number;
  text: string;
};

export function draftKeyForChatId(chatId: string): string {
  const trimmed = chatId.trim();
  // Un identifiant vide ne doit jamais produire une clé ambiguë partagée.
  return trimmed ? `${DRAFT_KEY_PREFIX}${trimmed}` : NEW_CHAT_DRAFT_KEY;
}

export function isDraftExpired(draft: ChatDraft, now: number): boolean {
  return (
    typeof draft.savedAt !== "number" ||
    !Number.isFinite(draft.savedAt) ||
    now - draft.savedAt > DRAFT_TTL_MS
  );
}

export function saveDraft(
  key: string,
  text: string,
  options: { now?: number; storage?: Storage | null } = {}
): void {
  const storage = options.storage ?? getStorage();
  if (!storage) {
    return;
  }
  const trimmedText = typeof text === "string" ? text : "";
  try {
    if (!trimmedText) {
      storage.removeItem(key);
      return;
    }
    if (trimmedText.length > DRAFT_MAX_TEXT_LENGTH) {
      storage.removeItem(key);
      return;
    }
    const draft: ChatDraft = {
      savedAt: options.now ?? Date.now(),
      text: trimmedText,
    };
    storage.setItem(key, JSON.stringify(draft));
  } catch (error) {
    console.warn(
      `[chat-draft] Sauvegarde impossible pour ${key} :`,
      error instanceof Error ? error.message : error
    );
  }
}

export function loadDraft(
  key: string,
  options: { now?: number; storage?: Storage | null } = {}
): string {
  const storage = options.storage ?? getStorage();
  if (!storage) {
    return "";
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return "";
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("text" in parsed)) {
      // Payload illisible : on nettoie plutôt que de restaurer n'importe quoi.
      storage.removeItem(key);
      return "";
    }
    const draft = parsed as ChatDraft;
    if (typeof draft.text !== "string") {
      storage.removeItem(key);
      return "";
    }
    if (isDraftExpired(draft, options.now ?? Date.now())) {
      storage.removeItem(key);
      return "";
    }
    return draft.text;
  } catch {
    // JSON invalide : la valeur ne doit plus jamais remonter.
    try {
      storage.removeItem(key);
    } catch (cleanupError) {
      console.warn(
        `[chat-draft] Nettoyage impossible pour ${key} :`,
        cleanupError instanceof Error ? cleanupError.message : cleanupError
      );
    }
    return "";
  }
}

export function clearDraft(
  key: string,
  options: { storage?: Storage | null } = {}
): void {
  const storage = options.storage ?? getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn(
      `[chat-draft] Suppression impossible pour ${key} :`,
      error instanceof Error ? error.message : error
    );
  }
}

// Identifiant de conversation en cours pour le contexte « nouvelle discussion ».
// La clé dédiée évite qu'un brouillon d'accueil soit restauré dans un chat
// existant, et inversement.
export function resolveNewChatDraftKey(): string {
  return NEW_CHAT_DRAFT_KEY;
}

/** Clé stable utilisée par les tests (aucune opération réseau ni horloge). */
export function makeTestChatId(): string {
  return generateUUID();
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn(
      "[chat-draft] localStorage indisponible :",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
