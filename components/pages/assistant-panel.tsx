"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { MessageReasoning } from "@/components/chat/message-reasoning";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import type {
  PageIntent,
  PageMessageView,
  PageProposalView,
  PageUpdatedEvent,
} from "@/lib/pages/types";
import { fetcher } from "@/lib/utils";

type AssistantPanelProps = {
  messages: PageMessageView[];
  modelId: string | null;
  onModelChange: (modelId: string) => void;
  onProposal: (proposal: PageProposalView) => void;
  onPromptSaved: (prompt: string) => void;
  onUpdated: (event: PageUpdatedEvent) => void;
  pageId: string;
  pendingProposals: PageProposalView[];
  prompt: string;
  revision: number;
  selection: string;
};

const ACTIONS: Array<{ intent: PageIntent; label: string; text: string }> = [
  {
    intent: "edit",
    label: "Réécrire",
    text: "Réécris la sélection pour qu'elle soit plus claire, sans changer le sens. S'il n'y a pas de sélection, réécris le passage le plus confus de la page.",
  },
  {
    intent: "edit",
    label: "Continuer",
    text: "Continue le texte juste après la sélection, dans le même ton. S'il n'y a pas de sélection, poursuis la fin de la page.",
  },
  {
    intent: "edit",
    label: "Corriger",
    text: "Corrige l'orthographe et la grammaire de la sélection. S'il n'y a pas de sélection, corrige la page.",
  },
  {
    intent: "edit",
    label: "Résumer",
    text: "Remplace la sélection par un résumé concis. S'il n'y a pas de sélection, ajoute un résumé en tête de page.",
  },
  {
    intent: "edit",
    label: "Structurer",
    text: "Structure le texte avec des titres et des listes, sans retirer d'information.",
  },
  {
    intent: "edit",
    label: "Traduire",
    text: "Traduis la sélection en français si elle est dans une autre langue, sinon en anglais. Conserve le Markdown.",
  },
];

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text" && "text" in part)
    .map((part) => ("text" in part ? part.text : ""))
    .join("\n\n");
}

function reasoningOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "reasoning" && "text" in part)
    .map((part) => ("text" in part ? part.text : ""))
    .filter((text) => text.trim().length > 0)
    .join("\n\n");
}

function toUiMessages(messages: PageMessageView[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    parts: message.parts as UIMessage["parts"],
    role: message.role,
  }));
}

export function AssistantPanel({
  messages,
  modelId,
  onModelChange,
  onProposal,
  onPromptSaved,
  onUpdated,
  pageId,
  pendingProposals,
  prompt,
  revision,
  selection,
}: AssistantPanelProps) {
  const [draft, setDraft] = useState("");
  const [pagePrompt, setPagePrompt] = useState(prompt);
  const [proposals, setProposals] = useState(pendingProposals);
  const intentRef = useRef<PageIntent>("propose");
  const modelRef = useRef(modelId ?? "");
  const selectionRef = useRef(selection);
  modelRef.current = modelId ?? "";
  selectionRef.current = selection;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPagePrompt(prompt);
  }, [prompt]);
  useEffect(() => {
    setProposals(pendingProposals);
  }, [pendingProposals]);

  const { data: systemPrompt } = useSWR<{ prompt: string }>(
    `/api/pages/${pageId}/prompt`,
    fetcher
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/pages/${pageId}/assistant`,
        prepareSendMessagesRequest: ({ messages: all }) => ({
          body: {
            intent: intentRef.current,
            messages: all,
            modelId: modelRef.current || undefined,
            selection: selectionRef.current || undefined,
          },
        }),
      }),
    [pageId]
  );

  const {
    messages: thread,
    sendMessage,
    status,
    stop,
  } = useChat({
    id: pageId,
    messages: toUiMessages(messages),
    onData: (part) => {
      if (part.type === "data-page-updated") {
        const data = part.data as PageUpdatedEvent;
        if (
          typeof data?.content === "string" &&
          typeof data.revision === "number"
        ) {
          onUpdated(data);
        }
      }
      if (part.type === "data-page-proposal") {
        const data = part.data as PageProposalView;
        if (data?.id) {
          setProposals((current) =>
            current.some((item) => item.id === data.id)
              ? current
              : [data, ...current]
          );
          onProposal(data);
        }
      }
    },
    transport,
  });

  useEffect(() => {
    if (thread.length > 0 || status === "streaming") {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [status, thread.length]);

  async function submit(text: string, intent: PageIntent) {
    const trimmed = text.trim();
    if (!trimmed || status === "streaming" || status === "submitted") {
      return;
    }
    intentRef.current = intent;
    setDraft("");
    await sendMessage({
      parts: [{ text: trimmed, type: "text" }],
      role: "user",
    });
    intentRef.current = "propose";
  }

  async function resolveProposal(
    proposal: PageProposalView,
    action: "accept" | "reject"
  ) {
    const response = await fetch(
      `/api/pages/${pageId}/proposals/${proposal.id}`,
      {
        body: JSON.stringify({ action, revision }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }
    );
    if (!response.ok) {
      return;
    }
    const body = await response.json();
    setProposals((current) =>
      current.filter((item) => item.id !== proposal.id)
    );
    if (action === "accept" && body.page) {
      onUpdated(body.page);
    }
  }

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <ModelSelectorCompact
          allowEmpty={!modelId}
          emptyLabel="Modèle du compte"
          fallbackToFirst={false}
          onModelChange={onModelChange}
          selectedModelId={modelId ?? ""}
          source="chat"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <details className="surface-muted text-xs">
          <summary className="cursor-pointer font-medium">
            Prompt système
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-muted-foreground">
            {systemPrompt?.prompt ?? "Chargement…"}
          </pre>
        </details>
        <label className="block text-xs">
          <span className="font-medium">Prompt de cette page</span>
          <textarea
            className="field-input mt-1 min-h-16 w-full px-2 py-1.5 text-xs"
            onBlur={() => onPromptSaved(pagePrompt)}
            onChange={(event) => setPagePrompt(event.target.value)}
            placeholder="Consignes propres à cette page"
            value={pagePrompt}
          />
        </label>
        {proposals.length > 0 ? (
          <ul className="space-y-2">
            {proposals.map((proposal) => (
              <li className="surface-muted text-xs" key={proposal.id}>
                <p>{proposal.description || "Modification proposée"}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="chip"
                    data-active="true"
                    onClick={() => resolveProposal(proposal, "accept")}
                    type="button"
                  >
                    Accepter
                  </button>
                  <button
                    className="chip"
                    onClick={() => resolveProposal(proposal, "reject")}
                    type="button"
                  >
                    Refuser
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {thread.map((message) => {
          const reasoning = reasoningOf(message);
          const text = textOf(message);
          return (
            <article className="space-y-1 text-sm" key={message.id}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {message.role === "user" ? "Vous" : "mAI"}
              </p>
              {reasoning ? (
                <MessageReasoning
                  isLoading={
                    busy &&
                    message.id === thread.at(-1)?.id &&
                    message.role !== "user"
                  }
                  reasoning={reasoning}
                />
              ) : null}
              {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="space-y-2 border-t border-border/60 p-3">
        {selection ? (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            Sélection : {selection}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1">
          {ACTIONS.map((action) => (
            <button
              className="chip"
              disabled={busy}
              key={action.label}
              onClick={() => submit(action.text, action.intent)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(draft, "propose");
          }}
        >
          <textarea
            aria-label="Message à mAI"
            className="field-input min-h-16 flex-1 px-2 py-1.5 text-sm"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Demander une modification…"
            value={draft}
          />
          {busy ? (
            <button
              className="chip self-end"
              onClick={() => stop()}
              type="button"
            >
              Stop
            </button>
          ) : (
            <button className="chip self-end" data-active="true" type="submit">
              Envoyer
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
