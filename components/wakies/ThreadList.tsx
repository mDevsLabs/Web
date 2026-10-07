"use client";

/**
 * Liste des conversations d'un Wakie.
 *
 * `useThreads` de CopilotKit listait les threads d'Intelligence, avec
 * pagination et resynchronisation. Les conversations sont désormais des lignes
 * de `WakiesConversation`, déjà rafraîchies par le shell : le composant n'a
 * plus rien à demander au serveur, et une pagination sans borneici serait
 * fausse — le compte a au plus quelques centaines de conversations (quota par
 * forfait), pas un flux infini.
 */

import { MessageCircle, Plus } from "lucide-react";
import type { Conversation, Wakie } from "@/lib/wakies/shared/types";

export function ThreadList({
  wakies,
  wakieId,
  local,
  selected,
  onSelect,
  onNew,
}: {
  wakies: Wakie[];
  wakieId: string;
  local: Conversation[];
  selected?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <section className="thread-list">
      <div className="nav-label">
        CONVERSATIONS RÉCENTES
        <button
          aria-label="Nouvelle conversation"
          className="icon-button"
          onClick={onNew}
        >
          <Plus size={14} />
        </button>
      </div>
      {local.map((thread) => (
        <button
          className={`nav-item ${selected === thread.id ? "active" : ""}`}
          key={thread.id}
          onClick={() => onSelect(thread.id)}
        >
          <MessageCircle size={15} />
          <span className="thread-summary">
            <span>{thread.title}</span>
            <small>
              {wakies.find((wakie) => wakie.id === thread.wakieId)?.name ??
                (thread.wakieId === wakieId ? "Wakie" : "")}
            </small>
          </span>
        </button>
      ))}
      {!local.length && (
        <p className="sidebar-empty">
          Votre première conversation apparaîtra ici.
        </p>
      )}
    </section>
  );
}
