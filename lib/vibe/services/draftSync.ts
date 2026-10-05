/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DRAFT SYNC (src/services/draftSync.ts)
 * Synchronisation serveur des brouillons de posts (multi-appareils).
 * Complète draftCookie.ts (secours local invités/hors-ligne) sans le remplacer.
 * ============================================================================
 */

import { ApiService } from "@/lib/vibe/services/api";
import type { VibeDraft } from "@/lib/vibe/services/draftCookie";
import type { ServerDraft } from "@/lib/vibe/types/vibe";

export interface ServerDraftInput {
  ai_generated?: boolean;
  html: string;
  id?: string;
  media_assets?: Array<{
    url: string;
    media_type?: string;
    size?: number;
    alt_text?: string;
  }>;
  scheduled_at?: string | null;
  text: string;
  visibility?: string;
}

/** Sauvegarde (upsert) un brouillon sur le serveur. */
export async function saveDraftToServer(
  draft: ServerDraftInput
): Promise<string | null> {
  try {
    const res = await ApiService.saveDraft({
      ai_generated: draft.ai_generated,
      html: draft.html,
      id: draft.id,
      media_assets: draft.media_assets,
      scheduled_at: draft.scheduled_at ?? null,
      text: draft.text,
      visibility: draft.visibility,
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
export function serverDraftToLocal(
  d: ServerDraft,
  username: string | null
): VibeDraft {
  return {
    ai: Boolean((d as any).ai_generated),
    html: d.html,
    scheduledAt: d.scheduled_at || "",
    text: d.text,
    ts: d.updated_at ? Date.parse(d.updated_at) : Date.now(),
    u: username || "",
    v: 1,
    visibility: d.visibility || "public",
  };
}
