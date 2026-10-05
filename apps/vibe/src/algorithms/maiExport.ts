/**
 * ============================================================================
 * VIBE — EXPORT DES CONVERSATIONS mAI (src/algorithms/maiExport.ts)
 * Logique pure : nom de fichier sûr, rendu Markdown horodaté et export JSON
 * versionné (réimportable) des conversations mAI, outils inclus.
 * ============================================================================
 */

import type { MaiToolCall } from '../types/vibe';

export interface MAIExportMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  tool_calls?: MaiToolCall[];
}

export interface MAIExportConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

/** Nom de fichier sûr pour un titre de conversation. */
export function maiExportSlug(title?: string): string {
  return (
    (title || 'conversation-mai')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'conversation-mai'
  );
}

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/** Export Markdown : titre, métadonnées, messages horodatés, outils résumés. */
export function buildMAIConversationMarkdown(conv: MAIExportConversation, messages: MAIExportMessage[]): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title || 'Discussion mAI'}`);
  lines.push('');
  if (conv.created_at) lines.push(`- Créée le : ${formatDate(conv.created_at)}`);
  if (conv.updated_at) lines.push(`- Dernière activité : ${formatDate(conv.updated_at)}`);
  lines.push(`- Messages : ${messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const m of messages) {
    const who = m.role === 'assistant' ? 'mAI' : 'Moi';
    const when = formatDate(m.created_at);
    lines.push(`## ${who}${when ? ` — ${when}` : ''}`);
    lines.push('');
    lines.push(m.content || '');
    lines.push('');
    for (const call of m.tool_calls || []) {
      if (!call) continue;
      lines.push(`> 🔧 **Outil : ${call.name}** (${call.status})`);
      if (call.args && Object.keys(call.args).length > 0) {
        lines.push('>');
        lines.push('> ```json');
        lines.push(`> ${JSON.stringify(call.args)}`);
        lines.push('> ```');
      }
      if (call.error) {
        lines.push('>');
        lines.push(`> Erreur : ${call.error}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n').trim() + '\n';
}

/** Export JSON versionné (réimportable). */
export function buildMAIConversationJSON(conv: MAIExportConversation, messages: MAIExportMessage[]): string {
  return JSON.stringify(
    {
      format: 'vibe.mai.conversation',
      version: 1,
      exported_at: new Date().toISOString(),
      conversation: { ...conv },
      messages,
    },
    null,
    2
  );
}
