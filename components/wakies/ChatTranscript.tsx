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

import { PhoneOffIcon } from "@mdevs/icons/communication/phone-off";
import { FileTextIcon } from "@mdevs/icons/files/file-text";
import type { UIMessage } from "ai";
import { Fragment } from "react";
import { formaterTaille } from "@/components/wakies/attachments";
import { Markdown } from "@/components/wakies/markdown";
import { ToolResultCard } from "@/components/wakies/ToolResultCard";
import { safeAttachmentLink } from "@/lib/wakies/shared/messages";
import type { CallReceipt } from "@/lib/wakies/shared/types";
import { voiceReceiptMessagePrefix } from "@/lib/wakies/shared/voice-receipt";

/** Les messages techniques ne s'affichent pas : ils portent un préfixe réservé. */
export function isInternalVoiceReceipt(message: UIMessage): boolean {
  return message.id.startsWith(voiceReceiptMessagePrefix);
}

function Receipt({ call }: { call: CallReceipt }) {
  return (
    <div className="call-receipt">
      <PhoneOffIcon size={13} />
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

/** Pièces jointes d'un message, telles que le serveur les a rendues. */
function pieces(message: UIMessage): {
  fileName?: string;
  mediaType?: string;
  size?: number;
  url?: string;
}[] {
  return ((message.parts ?? []) as { type: string }[]).filter(
    (partie) => partie.type === "file"
  ) as {
    fileName?: string;
    filename?: string;
    mediaType?: string;
    size?: number;
    url?: string;
  }[];
}

/**
 * Carte d'une pièce jointe.
 *
 * L'URL arrives de la route qui relit l'historique, et elle est RE-SIGNÉE à la
 * lecture : elle expire en dix minutes, donc un ancien message affiche «
 * fichier indisponible » si le blob a disparu. On ne montre alors ni contenu
 * ni lien de remplacement — inventer un contenu serait pire que l'absence.
 */
function Piece({
  fileName,
  filename,
  size,
  url,
}: {
  fileName?: string;
  filename?: string;
  size?: number;
  url?: string;
}) {
  const link = safeAttachmentLink(url);
  return (
    <div className="chat-piece">
      <FileTextIcon size={16} />
      <span className="chat-piece-name">
        {filename ?? fileName ?? "Fichier"}
      </span>
      {size ? (
        <small className="chat-piece-size">{formaterTaille(size)}</small>
      ) : null}
      {link ? (
        <a
          className="chat-piece-open"
          href={link}
          rel="noopener"
          target="_blank"
        >
          Ouvrir
        </a>
      ) : (
        <small className="chat-piece-missing">Fichier indisponible</small>
      )}
    </div>
  );
}

export function ChatTranscript({
  messages,
  calls,
}: {
  messages: UIMessage[];
  calls: CallReceipt[];
}) {
  const ids = new Set(messages.map((message) => message.id));
  // Un message ne contenant QUE des pièces jointes (pas de texte) doit rester
  // visible : c'est le cas quand l'utilisateur n'a joint qu'un document.
  const visibles = messages.filter(
    (message) =>
      !isInternalVoiceReceipt(message) &&
      (message.role === "user" || message.role === "assistant") &&
      (texte(message).trim().length > 0 ||
        pieces(message).length > 0 ||
        message.parts.some(
          (part) =>
            part.type.startsWith("tool-") ||
            part.type === "dynamic-tool" ||
            part.type === "source-url" ||
            part.type === "reasoning"
        ))
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
            {pieces(message).map((piece, index) => (
              // La clé est composite : le serveur ne renvoie pas
              // d'identifiant de pièce, mais l'identifiant du message la rend
              // stable entre deux rendus — deux pièces peuvent porter le même
              // nom sans collision.
              <Piece key={`${message.id}-piece-${index}`} {...piece} />
            ))}
            {texte(message) ? <Markdown>{texte(message)}</Markdown> : null}
            {message.parts.map((part, index) => (
              <ToolResultCard key={`${message.id}-part-${index}`} part={part} />
            ))}
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
