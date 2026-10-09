/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DRAFT SYNC (src/services/draftSync.ts)
 * Synchronisation serveur des brouillons de posts (multi-appareils).
 * Complète draftCookie.ts (secours local invités/hors-ligne) sans le remplacer.
 * ============================================================================
 */

import { ApiService } from './api';
import type { VibeDraft } from './draftCookie';
import type { ServerDraft } from '../types/vibe';

export interface ServerDraftInput {
  id?: string;
  html: string;
  text: string;
  visibility?: string;
  scheduled_at?: string | null;
  ai_generated?: boolean;
  media_assets?: Array<{ url: string; media_type?: string; size?: number; alt_text?: string }>;
}

/** Sauvegarde (upsert) un brouillon sur le serveur. */
export async function saveDraftToServer(draft: ServerDraftInput): Promise<string | null> {
  try {
    const res = await ApiService.saveDraft({
      id: draft.id,
      html: draft.html,
      text: draft.text,
      visibility: draft.visibility,
      scheduled_at: draft.scheduled_at ?? null,
      ai_generated: draft.ai_generated,
      media_assets: draft.media_assets,
    });
    return res?.id || draft.id || null;
  } catch {
    return null;
  }
}

/** Charge les brouillons serveur (tri updated_at DESC). */
export async function loadDraftsFromServer(): Promise<ServerDraft[]> {
  try {
    const res = await ApiService.getDrafts();
    return res?.drafts || [];
  } catch {
    return [];
  }
}

/** Supprime un brouillon serveur. */
export async function deleteDraftFromServer(draftId: string): Promise<void> {
  if (!draftId) return;
  try {
    await ApiService.deleteDraft(draftId);
  } catch {}
}

/** Convertit un brouillon serveur au format local VibeDraft (fusion au plus récent). */
export function serverDraftToLocal(d: ServerDraft, username: string | null): VibeDraft {
  return {
    v: 1,
    html: d.html,
    text: d.text,
    visibility: d.visibility || 'public',
    scheduledAt: d.scheduled_at || '',
    ai: Boolean((d as any).ai_generated),
    u: username || '',
    ts: d.updated_at ? Date.parse(d.updated_at) : Date.now(),
  };
}
