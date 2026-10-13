"use client";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { confirmInApp, promptInApp } from "@/lib/ui/app-dialog";

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
 *
 * CE QU'UNE LISTE DE MESSAGERIE DOIT MONTRER
 *
 * L'aperçu du dernier message, son heure et le compteur de non-lus viennent du
 * SERVEUR (`listConversations`) : le client ne recalcule ni un aperçu ni un
 * état de lecture.
 *
 * Le filtre local ne remplace pas la recherche serveur : il ne coupe que la
 * liste déjà chargée, et c'est dit ainsi dans l'interface (le champ renvoie
 * vers la recherche complète de la barre latérale).
 */

import { MessageCircleIcon } from "@mdevs/icons/communication/message-circle";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { useState } from "react";
import { api } from "@/components/wakies/api";
import { SpaceMenu } from "@/components/wakies/SpaceMenu";
import { trierConversations } from "@/lib/wakies/shared/messaging";
import type { Conversation, Wakie } from "@/lib/wakies/shared/types";

/**
 * Heure courte d'un aperçu : l'heure du jour, la date ensuite.
 *
 * Le calcul se fait dans le fuseau du navigateur — un message reçu à 23 h 50
 * doit s'afficher « 23:50 », pas « 21:50 » parce que le serveur est en UTC.
 */
function quand(horodatage: number): string {
  const date = new Date(horodatage);
  const maintenant = new Date();
  const memeJour =
    date.getFullYear() === maintenant.getFullYear() &&
    date.getMonth() === maintenant.getMonth() &&
    date.getDate() === maintenant.getDate();
  if (memeJour) {
    return date.toLocaleTimeString("fr", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("fr", { day: "numeric", month: "short" });
}

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
  /** Wakie du fil ouvert — sert de repli quand la liste ne nomme rien. */
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
  const parWakie = new Map(wakies.map((item) => [item.id, item]));
  /**
   * Nom affiché d'un fil : le Wakie qui le porte. Un fil n'a qu'un répondant
   * depuis la suppression des groupes de Wakies.
   */
  const nomFil = (conversation: Conversation): string =>
    parWakie.get(conversation.wakieId)?.name ?? "Conversation";
  const filtrees = trierConversations(local).filter((conversation) =>
    conversation.title
      .toLocaleLowerCase("fr")
      .includes(search.toLocaleLowerCase("fr"))
  );
  const preference = async (
    conversation: Conversation,
    champ: "favorite" | "muted"
  ) => {
    setBusy(true);
    setError("");
    try {
      await api(`/conversations/${conversation.id}`, "PATCH", {
        [champ]: !conversation[champ],
      });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Préférence non enregistrée.");
    } finally {
      setBusy(false);
    }
  };
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
      {filtrees.map((conversation) => (
        <div className="muse-conversation-row" key={conversation.id}>
          <Button
            aria-label={`Ouvrir ${conversation.title}`}
            className={`nav-item ${selected === conversation.id ? "active" : ""}`}
            onClick={() => onSelect(conversation.id)}
            variant="outline"
          >
            <MessageCircleIcon size={15} />
            <span className="thread-summary">
              <span className="thread-title">
                <span className="thread-title-text" title={conversation.title}>
                  {conversation.title}
                </span>
                {conversation.nonLus ? (
                  <small className="thread-unread">
                    {conversation.nonLus > 99 ? "99+" : conversation.nonLus}
                  </small>
                ) : null}
              </span>
              <small className="thread-meta">
                {nomFil(conversation)}
                {conversation.dernierMessageAt
                  ? ` · ${quand(conversation.dernierMessageAt)}`
                  : ""}
              </small>
              {conversation.apercuDernierMessage ? (
                <small className="thread-preview">
                  {conversation.apercuDernierMessage}
                </small>
              ) : null}
            </span>
          </Button>
          <SpaceMenu
            actions={[
              {
                checked: Boolean(conversation.favorite),
                id: "favori",
                kind: "action",
                label: conversation.favorite
                  ? "Retirer des favoris"
                  : "Ajouter aux favoris",
                onSelect: () => void preference(conversation, "favorite"),
              },
              {
                checked: Boolean(conversation.muted),
                id: "sourdine",
                kind: "action",
                label: conversation.muted
                  ? "Réactiver les notifications"
                  : "Mettre en sourdine",
                onSelect: () => void preference(conversation, "muted"),
              },
              {
                id: "renommer",
                kind: "action",
                label: "Renommer",
                onSelect: async () => {
                  const title = await promptInApp(
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
                },
              },
              {
                danger: true,
                id: "supprimer",
                kind: "action",
                label: "Supprimer",
                onSelect: async () => {
                  if (
                    !(await confirmInApp(
                      "Supprimer cette conversation et ses messages ?"
                    ))
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
                },
              },
            ]}
            disabled={busy}
            libelle={`Conversation ${conversation.title}`}
          />
        </div>
      ))}
      {filtrees.length ? null : (
        <p className="sidebar-empty">
          {local.length
            ? "Aucun titre ne correspond. La recherche de la barre latérale cherche aussi dans le texte des messages."
            : "Votre première conversation apparaîtra ici."}
        </p>
      )}
    </section>
  );
}
