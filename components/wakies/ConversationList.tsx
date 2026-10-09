"use client";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";

/**
 * Liste des conversations d'un Wakie.
 *
 * RENOMMAGE
 *
 * Le composant s'appelait `ThreadList` et venait du vocabulaire de
 * `useThreads` de CopilotKit. Le vocabulaire hôte est « conversation »
 * (`conversationId`), et `lib/wakies/shared/types.ts` expose déjà `Conversation` :
 * garder « thread » dans l'interface et « conversation » dans le contrat
 * obligerait à traduire à chaque frontière.
 *
 * PAGINATION
 *
 * Les conversations sont des lignes de `WakiesConversation`, déjà rafraîchies
 * par la coquille : le composant n'a rien à redemander au serveur. Une
 * pagination ici serait FAUSSE — le compte a au plus quelques centaines de
 * conversations (quota par forfait), pas un flux infini.
 */

import { MessageCircleIcon } from "@mdevs/icons/communication/message-circle";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { EllipsisVerticalIcon } from "@mdevs/icons/interface/ellipsis-vertical";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { useState } from "react";
import { api } from "@/components/wakies/api";
import type { Conversation, Wakie } from "@/lib/wakies/shared/types";

export function ConversationList({
  wakies,
  wakieId,
  local,
  selected,
  onSelect,
  onNew,
  onChanged,
}: {
  wakies: Wakie[];
  wakieId: string;
  local: Conversation[];
  selected?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="thread-list">
      <div className="nav-label">
        CONVERSATIONS RÉCENTES
        <Button
          aria-label="Nouvelle conversation"
          className="icon-button"
          onClick={onNew}
          variant="ghost"
        >
          <PlusIcon size={14} />
        </Button>
      </div>
      <Input
        aria-label="Rechercher une conversation"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher…"
        value={search}
      />
      {error && (
        <p className="sidebar-error" role="alert">
          {error}
        </p>
      )}
      {local
        .filter((conversation) =>
          conversation.title
            .toLocaleLowerCase("fr")
            .includes(search.toLocaleLowerCase("fr"))
        )
        .map((conversation) => (
          <div className="muse-conversation-row" key={conversation.id}>
            <Button
              className={`nav-item ${selected === conversation.id ? "active" : ""}`}
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              variant="outline"
            >
              <MessageCircleIcon size={15} />
              <span className="thread-summary">
                <span>{conversation.title}</span>
                <small>
                  {wakies.find((wakie) => wakie.id === conversation.wakieId)
                    ?.name ?? (conversation.wakieId === wakieId ? "Wakie" : "")}
                </small>
              </span>
            </Button>
            <Button
              aria-label={`Renommer ${conversation.title}`}
              className="icon-button"
              disabled={busy}
              onClick={async () => {
                const title = window.prompt(
                  "Nouveau titre",
                  conversation.title
                );
                if (!title?.trim()) return;
                setBusy(true);
                setError("");
                try {
                  await api(`/conversations/${conversation.id}`, "PATCH", {
                    title: title.trim().slice(0, 120),
                  });
                  await onChanged();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Renommage impossible."
                  );
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
              variant="ghost"
            >
              <EllipsisVerticalIcon size={14} />
            </Button>
            <Button
              aria-label={`Supprimer ${conversation.title}`}
              className="icon-button"
              disabled={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Supprimer cette conversation et ses messages ?"
                  )
                )
                  return;
                setBusy(true);
                setError("");
                try {
                  await api(`/conversations/${conversation.id}`, "DELETE");
                  await onChanged();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Suppression impossible."
                  );
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
              variant="ghost"
            >
              <Trash2Icon size={13} />
            </Button>
          </div>
        ))}
      {local.length ? null : (
        <p className="sidebar-empty">
          Votre première conversation apparaîtra ici.
        </p>
      )}
    </section>
  );
}
