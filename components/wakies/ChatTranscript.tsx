"use client";

/**
 * Fil d'une conversation Wakie.
 *
 * Le gabarit affichait des messages AG-UI (`Message` de `@ag-ui/core`) rendus
 * par CopilotKit, avec un composant de rendu par outil. Ici les messages sont
 * des `UIMessage` de l'AI SDK — le même format que le chat mAI — donc le fil se
 * recharge à l'identique depuis `WakiesMessage` et se rend avec le Markdown de
 * l'hôte.
 *
 * Les reçus d'appel vocal sont conservés : un appel est un événement de la
 * conversation, pas une ligne de log.
 */

import type { UIMessage } from "ai";
import { PhoneOff } from "lucide-react";
import { Fragment } from "react";
import { Markdown } from "@/components/wakies/markdown";
import type { CallReceipt } from "@/lib/wakies/shared/types";
import { voiceReceiptMessagePrefix } from "@/lib/wakies/shared/voice-receipt";

/** Les messages techniques ne s'affichent pas : ils portent un préfixe réservé. */
export function isInternalVoiceReceipt(message: UIMessage): boolean {
  return message.id.startsWith(voiceReceiptMessagePrefix);
}

function Receipt({ call }: { call: CallReceipt }) {
  return (
    <div className="call-receipt">
      <PhoneOff size={13} />
      <span>
        {call.status === "failed"
          ? "Appel échoué"
          : call.endedAt
            ? `${Math.round((call.endedAt - call.startedAt) / 1000)} s · Appel terminé`
            : "Appel en cours"}
      </span>
      {call.error && <small>{call.error}</small>}
    </div>
  );
}

function texte(message: UIMessage): string {
  return (message.parts ?? [])
    .filter(
      (partie): partie is { type: "text"; text: string } =>
        partie.type === "text"
    )
    .map((partie) => partie.text)
    .join("");
}

export function ChatTranscript({
  messages,
  calls,
}: {
  messages: UIMessage[];
  calls: CallReceipt[];
}) {
  const ids = new Set(messages.map((message) => message.id));
  const visibles = messages.filter(
    (message) =>
      !isInternalVoiceReceipt(message) &&
      (message.role === "user" || message.role === "assistant") &&
      texte(message).trim().length > 0
  );
  return (
    <>
      {calls
        .filter(
          (call) => !call.anchorMessageId || !ids.has(call.anchorMessageId)
        )
        .map((call) => (
          <Receipt call={call} key={call.id} />
        ))}
      {visibles.map((message) => (
        <Fragment key={message.id}>
          <div className={`chat-bubble ${message.role}`}>
            <Markdown>{texte(message)}</Markdown>
          </div>
          {calls
            .filter((call) => call.anchorMessageId === message.id)
            .map((call) => (
              <Receipt call={call} key={call.id} />
            ))}
        </Fragment>
      ))}
    </>
  );
}
