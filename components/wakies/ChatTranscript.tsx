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
 *
 * LA BANDE « ÉPINGLÉS » ET LES RÉACTIONS
 *
 * La bande en haut du fil liste les messages épinglés par le compte (bouton
 * de bulle, `pinned=1` serveur) et sauter au message d'un clic. Les réactions
 * — émojis d'une palette FIXE — se posent depuis la barre sous chaque bulle :
 * celles des Wakies portent l'avatar de leur auteur, celles du compte restent
 * anonymes. Aucun rendu n'invente une émoji hors palette.
 *
 * LES ACTIONS DE MESSAGERIE
 *
 * Chaque bulle porte, au survol : répondre (citation en tête du message),
 * transférer (copie dans une autre conversation, marquée « Transféré de … »)
 * et enregistrer en page (épingle + page Markdown). Un message TRANSFÉRÉ
 * montre sa provenance depuis la part `data-wakies-forward` : c'est une
 * donnée du message, jamais un texte qu'un modèle aurait pu écrire.
 *
 * Les séparateurs de date viennent des horodatages RÉELS (`seq`/`createdAt`
 * du serveur), fournis par l'appelant : le fil ne devine pas la date d'un
 * message d'après son ordre d'affichage.
 */

import { CopyIcon, PencilIcon } from "@mdevs/icons";
import { PhoneOffIcon } from "@mdevs/icons/communication/phone-off";
import { FileTextIcon } from "@mdevs/icons/files/file-text";
import { PinIcon } from "@mdevs/icons/maps/pin";
import { BookmarkPlusIcon } from "@mdevs/icons/misc/bookmark-plus";
import { ForwardIcon } from "@mdevs/icons/misc/forward";
import { ReplyIcon } from "@mdevs/icons/misc/reply";
import type { UIMessage } from "ai";
import { Fragment, useEffect, useState } from "react";
import { formaterTaille } from "@/components/wakies/attachments";
import { Markdown } from "@/components/wakies/markdown";
import { ToolResultCard } from "@/components/wakies/ToolResultCard";
import { safeAttachmentLink } from "@/lib/wakies/shared/messages";
import { PALETTE_REACTIONS } from "@/lib/wakies/shared/reactions";
import {
  type CitationFil,
  citationDe,
  elementsDeJour,
  metaDe,
  provenanceTransfert,
} from "@/lib/wakies/shared/transcript";
import type { CallReceipt, MessageReaction } from "@/lib/wakies/shared/types";
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
 * Provenance d'un message transféré : « Transféré de … » est un FAIT du
 * message (part `data-wakies-forward` écrite par le serveur), pas une phrase
 * qu'un modèle aurait pu produire.
 */
function Provenance({ titre }: { titre: string }) {
  return (
    <p className="chat-forwarded">
      <ForwardIcon size={12} />
      Transféré de {titre || "une autre conversation"}
    </p>
  );
}

/**
 * Citation d'une réponse : l'extrait du message visé, cliquable pour y sauter.
 * Un bouton, pas un lien : la cible est dans la même page.
 */
function Citation({ citation }: { citation: CitationFil }) {
  return (
    <button
      className="chat-citation"
      onClick={() => {
        document
          .querySelector(`[data-message-id="${citation.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      type="button"
    >
      <span className="chat-citation-auteur">{citation.auteur}</span>
      <span className="chat-citation-texte">{citation.extrait}</span>
    </button>
  );
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

/** Réactions groupées par émoji (compte : count 1; Wakies : liste d'avatar). */
function ReactionBar({
  reactions,
  onPoser,
}: {
  reactions: MessageReaction[];
  onPoser?: (emoji: string) => void;
}) {
  if (reactions.length === 0 && !onPoser) return null;
  const parEmoji = new Map<string, MessageReaction[]>();
  for (const reaction of reactions) {
    const groupe = parEmoji.get(reaction.emoji) ?? [];
    groupe.push(reaction);
    parEmoji.set(reaction.emoji, groupe);
  }
  return (
    <div
      className="chat-reactions"
      onClick={(e) => {
        // La barre est DANS la bulle : ne pas déclencher l'action de bulle.
        e.stopPropagation();
      }}
    >
      {[...parEmoji.entries()].map(([emoji, groupe]) => (
        <span className="chat-reaction" key={emoji} title={emoji}>
          <span aria-hidden>{emoji}</span>
          {groupe.length > 1 ? <small>{groupe.length}</small> : null}
        </span>
      ))}
      {onPoser ? (
        <span className="chat-reaction-ajout">
          {PALETTE_REACTIONS.map((emoji) => (
            <button
              aria-label={`Réagir ${emoji}`}
              key={emoji}
              onClick={() => onPoser(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </span>
      ) : null}
    </div>
  );
}

/** Action d'une bulle : icône + libellé accessible, rien de plus. */
function BoutonAction({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="chat-action"
      onClick={(e) => {
        // L'action est DANS la bulle : ne pas déclencher l'action de bulle.
        e.stopPropagation();
        onClick();
      }}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

/** Actions d'une bulle : épingler/retirer. L'épingle est un geste du compte. */
function BoutonEpingle({
  estEpingle,
  onEpingle,
}: {
  estEpingle: boolean;
  onEpingle: (epingle: boolean) => void;
}) {
  return (
    <button
      aria-label={estEpingle ? "Retirer l'épingle" : "Épingler ce message"}
      aria-pressed={estEpingle}
      className="chat-pin-toggle"
      onClick={(e) => {
        e.stopPropagation();
        onEpingle(!estEpingle);
      }}
      title={estEpingle ? "Retirer l'épingle" : "Épingler le message"}
      type="button"
    >
      <PinIcon size={13} />
    </button>
  );
}

export function ChatTranscript({
  messages,
  calls,
  reactionsParMessage,
  epingles,
  cibleId,
  nomsWakies,
  onEnregistrer,
  onEpingle,
  onPoserReaction,
  onRepondre,
  onTransferer,
  onCopier,
  onModifier,
  enCours = false,
}: {
  messages: UIMessage[];
  calls: CallReceipt[];
  /** Réactions par identifiant de message (serveur = seul truteur). */
  reactionsParMessage?: Map<string, MessageReaction[]>;
  /** Bande « Épinglés » : messages épinglés par le compte. */
  epingles?: UIMessage[];
  /**
   * Message à METTRE EN ÉVIDENCE (résultat de recherche). L'effet scrolle une
   * fois : re-cliquer le même résultat ne relance pas un défilement, et le
   * halo retombe tout seul.
   */
  cibleId?: string | null;
  /** Noms des Wakies du fil, pour nommer l'auteur d'un message cité. */
  nomsWakies?: Map<string, string>;
  /** Enregistrer ce message en page (POST /messages/:id/page). */
  onEnregistrer?: (messageId: string) => void;
  /** Poser/retirer une épingle (POST /api/wakies/pins). */
  onEpingle?: (messageId: string, epingle: boolean) => void;
  /** Poser une réaction (POST /api/wakies/messages/:id/reactions). */
  onPoserReaction?: (messageId: string, emoji: string) => void;
  /** Répondre à ce message : la citation part en tête du composer. */
  onRepondre?: (message: UIMessage) => void;
  /** Transférer ce message vers une autre conversation. */
  onTransferer?: (messageId: string) => void;
  /** Copier le texte du message dans le presse-papiers. */
  onCopier?: (message: UIMessage) => void;
  /** Modifier un message du compte (jamais une réponse de Wakie). */
  onModifier?: (message: UIMessage) => void;
  /** Un tour est encore en cours : une réponse vide n'est pas encore un échec. */
  enCours?: boolean;
}) {
  const [halo, setHalo] = useState<string | null>(null);
  useEffect(() => {
    if (!cibleId) return;
    setHalo(cibleId);
    document
      .querySelector(`[data-message-id="${cibleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    const minuteur = window.setTimeout(() => setHalo(null), 2600);
    return () => window.clearTimeout(minuteur);
  }, [cibleId]);
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
  const epinglesVisibles = (epingles ?? []).filter((message) =>
    visibles.some((v) => v.id === message.id)
  );
  return (
    <>
      {epinglesVisibles.length > 0 ? (
        <div className="chat-pinned-strip">
          <span className="chat-pinned-label">Épinglés</span>
          {epinglesVisibles.map((message) => (
            <button
              aria-label="Sauter au message épinglé"
              className="chat-pinned-item"
              data-role={message.role}
              key={`pin-${message.id}`}
              onClick={() => {
                const element = document.querySelector(
                  `[data-message-id="${message.id}"]`
                );
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              {texte(message).slice(0, 60) || "Pièce jointe"}
            </button>
          ))}
        </div>
      ) : null}
      {calls
        .filter(
          (call) => !call.anchorMessageId || !ids.has(call.anchorMessageId)
        )
        .map((call) => (
          <Receipt call={call} key={call.id} />
        ))}
      {elementsDeJour(visibles).map((element) =>
        element.type === "jour" ? (
          // Le séparateur porte une clé qui inclut le message qui l'ouvre :
          // deux sections ne peuvent pas fusionner parce qu'elles portent le
          // même libellé.
          <div className="chat-day" key={element.cle}>
            <span>{element.label}</span>
          </div>
        ) : (
          <Fragment key={element.message.id}>
            {/* `data-message-id` : la bande « Épinglés » et la recherche
                scrollent au message par ce crochet, jamais par un index. */}
            <div
              className={`chat-bubble ${element.message.role}${halo === element.message.id ? " is-cible" : ""}`}
              data-message-id={element.message.id}
            >
              {(() => {
                const provenance = provenanceTransfert(element.message);
                return provenance ? (
                  <Provenance titre={provenance.titre} />
                ) : null;
              })()}
              {(() => {
                const citation = citationDe(
                  messages,
                  metaDe(element.message).replyToId,
                  nomsWakies
                );
                return citation ? <Citation citation={citation} /> : null;
              })()}
              {pieces(element.message).map((piece, index) => (
                // La clé est composite : le serveur ne renvoie pas
                // d'identifiant de pièce, mais l'identifiant du message la rend
                // stable entre deux rendus — deux pièces peuvent porter le même
                // nom sans collision.
                <Piece
                  key={`${element.message.id}-piece-${index}`}
                  {...piece}
                />
              ))}
              {/* 1. Réflexion (affichée en premier au-dessus du message texte).
                  La carte lit l'état de la part : « en cours » tant que
                  `reasoning-end` n'est pas arrivé, et non tant qu'il n'y a pas
                  de texte — sinon un tour terminé sans texte mentait. */}
              {element.message.parts
                .filter((part) => part.type === "reasoning")
                .map((part, index) => (
                  <ToolResultCard
                    key={`${element.message.id}-reasoning-${index}`}
                    part={part}
                  />
                ))}
              {/* 2. Texte de la réponse */}
              {texte(element.message) ? (
                <Markdown>{texte(element.message)}</Markdown>
              ) : null}
              {/* 3. Outils et autres cartes de résultat */}
              {element.message.parts
                .filter(
                  (part) =>
                    part.type !== "reasoning" &&
                    part.type !== "text" &&
                    part.type !== "file" &&
                    !part.type.startsWith("data-")
                )
                .map((part, index) => (
                  <ToolResultCard
                    key={`${element.message.id}-part-${index}`}
                    part={part}
                  />
                ))}
              {/*
                Un tour TERMINÉ qui ne porte ni texte ni carte d'outil ne doit
                pas rester un blanc silencieux : l'utilisateur croit que le
                Wakie l'ignore. Un tour encore en cours n'est pas signalé (le
                texte peut être en train d'arriver).
              */}
              {!enCours &&
              element.message.role === "assistant" &&
              !texte(element.message).trim() &&
              !element.message.parts.some(
                (part) =>
                  part.type.startsWith("tool-") || part.type === "dynamic-tool"
              ) ? (
                <p className="chat-empty-turn" role="status">
                  Ce tour n'a produit aucune réponse texte. Renvoyez votre
                  message pour réessayer.
                </p>
              ) : null}
              {(() => {
                // Les actions du COMPTE et celles de l'IA ne se mélangent pas :
                // on ne répond pas à soi-même, on ne réagit pas à son propre
                // message, et on ne modifie jamais une réponse de Wakie.
                const estWakie = element.message.role === "assistant";
                return (
                  <>
                    <div className="chat-bubble-actions">
                      {estWakie && onRepondre ? (
                        <BoutonAction
                          label="Répondre à ce message"
                          onClick={() => onRepondre(element.message)}
                        >
                          <ReplyIcon size={13} />
                        </BoutonAction>
                      ) : null}
                      {onCopier ? (
                        <BoutonAction
                          label="Copier le message"
                          onClick={() => onCopier(element.message)}
                        >
                          <CopyIcon size={13} />
                        </BoutonAction>
                      ) : null}
                      {!estWakie && onModifier ? (
                        <BoutonAction
                          label="Modifier ce message"
                          onClick={() => onModifier(element.message)}
                        >
                          <PencilIcon size={13} />
                        </BoutonAction>
                      ) : null}
                      {onTransferer ? (
                        <BoutonAction
                          label="Transférer ce message"
                          onClick={() => onTransferer(element.message.id)}
                        >
                          <ForwardIcon size={13} />
                        </BoutonAction>
                      ) : null}
                      {estWakie && onEnregistrer ? (
                        <BoutonAction
                          label="Enregistrer en page"
                          onClick={() => onEnregistrer(element.message.id)}
                        >
                          <BookmarkPlusIcon size={13} />
                        </BoutonAction>
                      ) : null}
                      {estWakie && onEpingle ? (
                        <BoutonEpingle
                          estEpingle={Boolean(
                            epinglesVisibles.some(
                              (p) => p.id === element.message.id
                            )
                          )}
                          onEpingle={(epingle) =>
                            onEpingle(element.message.id, epingle)
                          }
                        />
                      ) : null}
                    </div>
                    {/*
                      Les réactions s'affichent sur TOUTES les bulles : un
                      Wakie réagit au message de l'utilisateur (l'outil
                      `reactToMessage` vise ce message-là), et cette réaction
                      était invisible — un tour répondu par une réaction seule
                      ressemblait à un silence. Le sélecteur, lui, reste
                      réservé aux réponses de Wakie : le compte ne réagit pas à
                      son propre message (le serveur le refuse).
                    */}
                    <ReactionBar
                      onPoser={
                        estWakie && onPoserReaction
                          ? (emoji) =>
                              onPoserReaction(element.message.id, emoji)
                          : undefined
                      }
                      reactions={
                        reactionsParMessage?.get(element.message.id) ?? []
                      }
                    />
                  </>
                );
              })()}
            </div>
            {calls
              .filter((call) => call.anchorMessageId === element.message.id)
              .map((call) => (
                <Receipt call={call} key={call.id} />
              ))}
          </Fragment>
        )
      )}
    </>
  );
}
