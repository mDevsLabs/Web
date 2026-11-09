/**
 * ============================================================================
 * VIBE — RÉPONSES RAPIDES (snippets de messagerie)
 * ============================================================================
 *
 * POURQUOI ICI, ET PAS DANS UN SERVICE PARTAGÉ
 *
 * Une réponse rapide est un raccourci de RÉDACTION : elle appartient à
 * l'appareil de celui qui écrit, comme le brouillon DM (`vibe_dm_draft_*`) ou
 * le thème de bulles. Elle ne se synchronise pas entre deux machines, et rien
 * côté serveur ne la lit. La stocker dans le compte obligerait à une migration,
 * une route et un contrat pour une chaîne de caractères.
 *
 * TROIS RÉPONSES PAR DÉFAUT, JAMAIS ÉCRITES D'ELLES-MÊMES
 *
 * La liste vide paraît cassée : on propose donc trois phrases d'amorce, mais
 * on ne les écrit PAS dans le `localStorage`. Tant que l'utilisateur n'a rien
 * enregistré, la lecture renvoie les défauts ; dès qu'il enregistre, ce sont
 * les siens qui comptent — un défaut réapparu après suppression serait un bug.
 */

export interface QuickReply {
  /** HTML de l'éditeur (gras, italique, liens conservés). */
  html: string;
  /** Identifiant stable, pour la suppression. */
  id: string;
  /** Libellé court affiché dans le menu. */
  label: string;
  /** Texte brut, pour l'aperçu et la déduplication. */
  text: string;
}

export const QUICK_REPLIES_STORAGE_KEY = "vibe_quick_replies";
/** Une barre de réponses rapides illisible coûte plus qu'elle ne rend. */
export const QUICK_REPLIES_MAX = 20;
const LABEL_MAX = 40;
const TEXT_MAX = 1000;

/** Amorces proposées tant que rien n'a été enregistré. */
export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    html: "Bien reçu, je m'en occupe.",
    id: "default-ack",
    label: "Bien reçu",
    text: "Bien reçu, je m'en occupe.",
  },
  {
    html: "Merci beaucoup !",
    id: "default-thanks",
    label: "Merci",
    text: "Merci beaucoup !",
  },
  {
    html: "Je regarde et je reviens vers toi.",
    id: "default-later",
    label: "Je reviens vers toi",
    text: "Je regarde et je reviens vers toi.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `qr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Décode la liste stockée. Une entrée illisible est écartée, les autres restent. */
export function parseQuickReplies(raw: string | null): QuickReply[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: QuickReply[] = [];
    for (const entry of parsed) {
      if (!isRecord(entry)) {
        continue;
      }
      const text =
        typeof entry.text === "string"
          ? entry.text.trim().slice(0, TEXT_MAX)
          : "";
      if (!text) {
        continue;
      }
      out.push({
        html:
          typeof entry.html === "string" && entry.html.trim()
            ? entry.html
            : text,
        id: typeof entry.id === "string" && entry.id ? entry.id : newId(),
        label:
          typeof entry.label === "string" && entry.label.trim()
            ? entry.label.trim().slice(0, LABEL_MAX)
            : text.slice(0, LABEL_MAX),
        text,
      });
    }
    return out.slice(0, QUICK_REPLIES_MAX);
  } catch {
    return [];
  }
}

/**
 * Lit les réponses rapides de l'appareil.
 *
 * `null` (jamais enregistré) → les amorces ; `[]` (tout supprimé) → liste vide.
 * La distinction est volontaire : un utilisateur qui a supprimé ses réponses ne
 * doit pas les voir revenir.
 */
export function readQuickReplies(): QuickReply[] {
  if (typeof window === "undefined") {
    return DEFAULT_QUICK_REPLIES;
  }
  try {
    const raw = window.localStorage.getItem(QUICK_REPLIES_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_QUICK_REPLIES;
    }
    return parseQuickReplies(raw);
  } catch {
    return DEFAULT_QUICK_REPLIES;
  }
}

export function writeQuickReplies(list: QuickReply[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      QUICK_REPLIES_STORAGE_KEY,
      JSON.stringify(list.slice(0, QUICK_REPLIES_MAX))
    );
  } catch {
    // Quota ou navigation privée : la réponse n'est pas conservée.
  }
}

/**
 * Ajoute (ou remplace) une réponse rapide.
 *
 * La déduplication se fait sur le TEXTE : enregistrer deux fois la même phrase
 * ne doit pas remplir le menu de doublons. Le libellé vient du texte saisi par
 * l'utilisateur, ou des 40 premiers caractères.
 */
export function addQuickReply(
  list: QuickReply[],
  input: { html?: string; text: string; label?: string }
): QuickReply[] {
  const text = input.text.trim().slice(0, TEXT_MAX);
  if (!text) {
    return list;
  }
  const label =
    (input.label || "").trim().slice(0, LABEL_MAX) || text.slice(0, LABEL_MAX);
  const entry: QuickReply = {
    // Le HTML est FACULTATIF : un appelant qui n'a que du texte brut (une
    // réponse dictée, par exemple) ne doit pas avoir à fabriquer une balise.
    html: (input.html || "").trim() || text,
    id: newId(),
    label,
    text,
  };
  const withoutDuplicate = list.filter((item) => item.text !== text);
  return [entry, ...withoutDuplicate].slice(0, QUICK_REPLIES_MAX);
}

export function removeQuickReply(list: QuickReply[], id: string): QuickReply[] {
  return list.filter((item) => item.id !== id);
}
