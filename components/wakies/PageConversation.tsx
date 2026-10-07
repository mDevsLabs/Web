"use client";

import { ArrowUp, ChevronDown, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/components/wakies/api";
import { Chat } from "@/components/wakies/Chat";
import { PageChatRequests } from "@/components/wakies/page-chat-requests";
import type { Page } from "@/lib/wakies/pages";
import type { Conversation, WorkspaceState } from "@/lib/wakies/shared/types";
export function PageConversation({
  page,
  workspace,
  paused,
  beforeChat,
  onRefresh,
  onSchedule,
  onSettings,
  onCreateWakie,
  onOpenChange,
}: {
  page: Page;
  workspace: WorkspaceState;
  paused: boolean;
  beforeChat: () => Promise<boolean>;
  onRefresh: () => void;
  onSchedule: (id: string) => void;
  onSettings: () => void;
  onCreateWakie: () => void;
  onOpenChange: (value: boolean) => void;
}) {
  const wakies = workspace.wakies.filter((wakie) =>
    wakie.spaceIds.includes(page.spaceId)
  );
  const [wakieId, setWakieId] = useState("");
  const wakie = wakies.find((wakie) => wakie.id === wakieId) ?? wakies[0];
  const [thread, setThread] = useState<Conversation>();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requests = useRef(new PageChatRequests());
  const scope = `${page.id}:${wakie?.id ?? ""}`;
  requests.current.select(scope);
  useEffect(() => {
    setThread(undefined);
    setPending(undefined);
    setBusy(false);
    onOpenChange(false);
  }, [scope, onOpenChange]);
  useEffect(() => {
    const current = requests.current;
    return () => current.select("");
  }, []);
  const open = async () => {
    if (!wakie || busy) return;
    setBusy(true);
    setError("");
    const prompt = draft.trim();
    await requests.current.run(
      scope,
      async () => {
        if (!(await beforeChat()))
          throw new Error(
            "Enregistrez ou résolvez les modifications du document avant de démarrer la conversation de la page."
          );
        return api<Conversation>(
          `/spaces/${page.spaceId}/pages/${page.id}/conversation`,
          "POST",
          { wakieId: wakie.id }
        );
      },
      {
        failure: (e) =>
          setError(
            e instanceof Error
              ? e.message
              : "Impossible d’ouvrir la conversation de la page."
          ),
        settled: () => setBusy(false),
        success: (next) => {
          setThread(next);
          setPending(prompt || undefined);
          setDraft("");
          onOpenChange(true);
          onRefresh();
        },
      }
    );
  };
  if (thread && wakie && thread.wakieId === wakie.id)
    return (
      <aside
        aria-label="Conversation de la page"
        className="document-chat-panel"
      >
        <div className="document-chat-heading">
          <span>
            <MessageCircle size={16} /> Conversation de la page
          </span>
          <button
            aria-label="Fermer la conversation de la page"
            className="document-icon"
            onClick={() => {
              setThread(undefined);
              onOpenChange(false);
            }}
          >
            <X size={17} />
          </button>
        </div>
        <Chat
          calls={workspace.calls.filter(
            (call) => call.conversationId === thread.id
          )}
          initialPrompt={pending}
          key={thread.id}
          onConsumed={() => setPending(undefined)}
          onSaved={onRefresh}
          onSchedule={() => onSchedule(thread.id)}
          paused={paused}
          thread={thread}
          voiceReady={workspace.setup.voice}
          wakie={wakie}
        />
      </aside>
    );
  if (!wakie)
    return (
      <div className="document-chat-setup">
        <span>Ajoutez un spécialiste pour travailler dans cet Espace.</span>
        <button onClick={onCreateWakie}>Créer un spécialiste</button>
      </div>
    );
  if (workspace.setup.missing.length)
    return (
      <div className="document-chat-setup">
        <span>Connectez votre assistant pour discuter de cette page.</span>
        <button onClick={onSettings}>Configurer l’assistant</button>
      </div>
    );
  return (
    <div className="document-chat-dock">
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void open();
        }}
      >
        <label className="sr-only" htmlFor="page-prompt">
          Interroger cette page
        </label>
        <input
          disabled={paused || busy}
          id="page-prompt"
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Interroger cette page…"
          value={draft}
        />
        <div className="document-chat-dock-bottom">
          <label>
            <select
              aria-label="Spécialiste de la page"
              disabled={busy}
              onChange={(e) => setWakieId(e.target.value)}
              value={wakie.id}
            >
              {wakies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} />
          </label>
          <span>
            {paused ? "Assistant en pause" : "Utilise cette page enregistrée"}
          </span>
          <button
            aria-label="Envoyer à l’assistant de la page"
            disabled={busy || paused}
            type="submit"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
