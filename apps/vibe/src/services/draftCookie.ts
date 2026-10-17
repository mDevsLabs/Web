/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DRAFT COOKIE (src/services/draftCookie.ts)
 * « Petit outil pratique » : si l'utilisateur rédige une Vibe et ferme la page
 * sans le vouloir, son brouillon est conservé dans un cookie de 30 jours et
 * lui est proposé à la reprise. Les médias (images / vidéos) ne sont PAS
 * sauvegardés — seuls le texte (HTML de l'éditeur), l'audience, la
 * planification et le badge « créé avec l'IA » sont restaurés.
 * ============================================================================
 */

import { htmlToPlainText } from '../components/common/RichContent';

export const DRAFT_COOKIE_NAME = 'vibe_draft';
/** Durée de conservation du brouillon : 30 jours. */
export const DRAFT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Un navigateur limite un cookie à ~4096 octets : on garde une marge. */
const MAX_COOKIE_BYTES = 3800;
const DRAFT_EVENT = 'vibe:draft_changed';

export interface VibeDraft {
  /** Version du format de stockage. */
  v: number;
  /** HTML de l'éditeur au moment de la sauvegarde (vide si dégradé en texte). */
  html: string;
  /** Texte brut du brouillon. */
  text: string;
  /** Audience choisie (public / followers / circle). */
  visibility: string;
  /** Date de planification (valeur datetime-local) ou ''. */
  scheduledAt: string;
  /** Badge « créé avec l'IA ». */
  ai: boolean;
  /** @username propriétaire du brouillon (évite de restituer à un autre compte). */
  u: string;
  /** Date de sauvegarde (epoch ms). */
  ts: number;
  /** true si seul le texte brut a pu être conservé (brouillon trop long). */
  plainOnly?: boolean;
  /** true si le texte a dû être tronqué pour tenir dans le cookie. */
  truncated?: boolean;
}

export type DraftChangeEvent = 'save' | 'clear' | 'restore';

const notify = (type: DraftChangeEvent) => {
  try {
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: { type } }));
  } catch {
    /* environnement sans window : ignorer */
  }
};

/** Écrit le cookie du brouillon (30 jours) et prévient les composeurs ouverts. */
const writeCookie = (encoded: string) => {
  document.cookie = `${DRAFT_COOKIE_NAME}=${encoded}; max-age=${DRAFT_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
  notify('save');
};

/**
 * Sauvegarde le brouillon courant (sans les médias). Un texte vide supprime le
 * cookie. Le HTML riche est conservé en priorité ; si le brouillon dépasse la
 * taille maximale d'un cookie, on dégrade en texte brut puis on tronque.
 */
export function saveVibeDraft(input: {
  html: string;
  text: string;
  visibility?: string;
  scheduledAt?: string;
  ai?: boolean;
  username?: string | null;
}): void {
  if (typeof document === 'undefined') return;
  try {
    const text = (input.text || '').replace(/\s+$/g, '');
    if (!text.trim()) {
      clearVibeDraft();
      return;
    }

    const base = {
      v: 1 as const,
      visibility: input.visibility || 'public',
      scheduledAt: input.scheduledAt || '',
      ai: Boolean(input.ai),
      u: input.username || '',
      ts: Date.now(),
    };

    const html = (input.html || '').trim();
    const hasRichHtml = Boolean(html && htmlToPlainText(html).trim());

    // Tentative 1 : HTML riche. Tentative 2 : texte brut seul (plus compact).
    const candidates: Array<Partial<VibeDraft> & { text: string }> = [];
    if (hasRichHtml) candidates.push({ ...base, html, text });
    candidates.push({ ...base, html: '', text, plainOnly: true });

    for (let i = 0; i < candidates.length; i++) {
      const draft = { ...candidates[i], v: 1 };
      let encoded = encodeURIComponent(JSON.stringify(draft));
      if (encoded.length <= MAX_COOKIE_BYTES) {
        writeCookie(encoded);
        return;
      }
      if (i === candidates.length - 1) {
        // Dernier recours : tronquer progressivement le texte pour tenir.
        while (draft.text.length > 0) {
          draft.text = draft.text.slice(0, Math.floor(draft.text.length * 0.8));
          draft.truncated = true;
          encoded = encodeURIComponent(JSON.stringify(draft));
          if (encoded.length <= MAX_COOKIE_BYTES) {
            writeCookie(encoded);
            return;
          }
        }
        return; // même tronqué à vide le cookie ne passe pas : abandon silencieux
      }
    }
  } catch {
    /* quota / sérialisation : le brouillon est simplement perdu, comme avant */
  }
}

/**
 * Lit le brouillon sauvegardé, ou null. Si `username` est fourni, un brouillon
 * rédigé avec un autre compte sur la même machine est ignoré.
 */
export function readVibeDraft(username?: string | null): VibeDraft | null {
  if (typeof document === 'undefined') return null;
  try {
    const row = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${DRAFT_COOKIE_NAME}=`));
    if (!row) return null;
    const payload = JSON.parse(decodeURIComponent(row.slice(DRAFT_COOKIE_NAME.length + 1)));
    if (!payload || payload.v !== 1) return null;
    const text = String(payload.text || '').trim();
    if (!text) return null;
    if (payload.u && username && payload.u !== username) return null;
    return {
      v: 1,
      html: String(payload.html || ''),
      text,
      visibility: String(payload.visibility || 'public'),
      scheduledAt: String(payload.scheduledAt || ''),
      ai: Boolean(payload.ai),
      u: String(payload.u || ''),
      ts: Number(payload.ts) || 0,
      plainOnly: Boolean(payload.plainOnly),
      truncated: Boolean(payload.truncated),
    };
  } catch {
    return null;
  }
}

/** Supprime le cookie de brouillon (publication réussie ou abandon explicite). */
export function clearVibeDraft(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${DRAFT_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
  notify('clear');
}

/** Reconvertit un brouillon en HTML injectable dans l'éditeur. */
export function draftToHTML(draft: VibeDraft): string {
  if (!draft.plainOnly && draft.html) return draft.html;
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escapeHtml(draft.text).replace(/\r?\n/g, '<br>');
}

/** Signale aux autres composeurs ouverts qu'un brouillon vient d'être repris. */
export function notifyDraftRestored(): void {
  notify('restore');
}

/** S'abonne aux changements du brouillon ; renvoie la fonction de désabonnement. */
export function onDraftChanged(cb: (type: DraftChangeEvent) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail?.type || 'save');
  window.addEventListener(DRAFT_EVENT, handler);
  return () => window.removeEventListener(DRAFT_EVENT, handler);
}
