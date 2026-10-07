"use client";

/**
 * ============================================================================
 * Conversation avec un Wakie
 * ============================================================================
 *
 * CE QUE CE COMPOSANT REMPLACE
 *
 * Le gabarit s'appuyait entièrement sur CopilotKit : `useAgent` pour le tour de
 * conversation, `useCopilotKit().runAgent()` pour l'exécution, `useThreads`
 * pour l'historique, `useHumanInTheLoop` pour les cartes d'approbation et
 * `useRenderTool` pour les rendu d'outils. Chaque brique était adossée au runtime
 * CopilotKit Intelligence, donc à un service externe qui stockait les messages
 * et exécutait les tours.
 *
 * Le port remplace la pile entière par `useChat` (AI SDK, déjà celui du chat
 * mAI) pointé sur `/api/wakies/chat`. Ce qui change réellement :
 *
 *   - l'historique vient de NOTRE base (`WakiesMessage`), pas d'un thread
 *     distant ; il se recharge conversation par conversation ;
 *   - le modèle, les quotas et le comptage d'usage sont ceux du compte ;
 *   - les outils sont ceux de l'hôte (aujourd'hui : la recherche Web).
 *
 * L'HISTORIQUE EST CHARGÉ AVANT DE MONTER LE CHAT
 *
 * `useChat` lit `messages` à la création : lui passer un tableau vide puis le
 * remplir ensuite écraserait l'historique à chaque rendu. Le composant se décompose
 * donc en deux — celui-ci charge l'historique, `WakieChat` ne monte qu'une fois
 * la conversation connue, et le parent le remonte par `key` à chaque changement
 * de conversation.
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Clock3, FilePlus, Link2, Square, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/wakies/api";
import { ChatTranscript } from "@/components/wakies/ChatTranscript";
import { Mascot } from "@/components/wakies/Mascot";
import {
  contextualMessage,
  type PageContext,
} from "@/components/wakies/page-context";
import type { Page } from "@/lib/wakies/pages";
import type {
  CallReceipt,
  Conversation,
  Wakie,
} from "@/lib/wakies/shared/types";

export function Chat(props: {
  thread: Conversation;
  wakie: Wakie;
  initialPrompt?: string;
  onConsumed: () => void;
  voiceReady: boolean;
  calls: CallReceipt[];
  paused: boolean;
  onSaved: () => void;
  onSchedule: () => void;
  onComputer?: () => void;
}) {
  const [historique, setHistorique] = useState<UIMessage[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [tentative, setTentative] = useState(0);

  const charger = useCallback(async () => {
    setHistorique(null);
    setErreur("");
    try {
      const messages = await api<
        {
          id: string;
          role: string;
          parts: unknown;
        }[]
      >(`/conversations/${props.thread.id}/messages`);
      setHistorique(
        messages.map((message) => ({
          id: message.id,
          parts: message.parts as UIMessage["parts"],
          role: message.role as UIMessage["role"],
        }))
      );
    } catch {
      setErreur(
        "L'historique de la conversation n'a pas pu être chargé. Réessayez."
      );
    }
  }, [props.thread.id]);

  useEffect(() => {
    void charger();
  }, [charger, tentative]);

  if (erreur) {
    return (
      <div className="live-chat">
        <div className="chat-error" role="alert">
          {erreur}
          <button onClick={() => setTentative((valeur) => valeur + 1)}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!historique) {
    return (
      <div className="live-chat">
        <div className="thinking">
          <span />
          <span />
          <span />
          <span>Ouverture de la conversation…</span>
        </div>
      </div>
    );
  }

  return <WakieChat {...props} historique={historique} />;
}

function WakieChat({
  thread,
  wakie,
  initialPrompt,
  onConsumed,
  voiceReady,
  calls,
  paused,
  onSaved,
  onSchedule,
  historique,
}: {
  thread: Conversation;
  wakie: Wakie;
  initialPrompt?: string;
  onConsumed: () => void;
  voiceReady: boolean;
  calls: CallReceipt[];
  paused: boolean;
  onSaved: () => void;
  onSchedule: () => void;
  historique: UIMessage[];
}) {
  const [pageContext, setPageContext] = useState<
    PageContext | null | undefined
  >(undefined);
  const [draft, setDraft] = useState("");
  const [source, setSource] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [erreur, setErreur] = useState("");
  const envoye = useRef(false);
  const bas = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/wakies/chat`,
        body: { conversationId: thread.id },
      }),
    [thread.id]
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: thread.id,
    onError: (erreur) =>
      setErreur(
        erreur.message ||
          "Le tour n'a pas abouti. Votre conversation est conservée."
      ),
    onFinish: onSaved,
    transport,
  });

  // Contexte de page : la conversation sait-elle quelle page elle édite ?
  useEffect(() => {
    let actif = true;
    setPageContext(undefined);
    void api<PageContext | null>(`/conversations/${thread.id}/page-context`)
      .then((page) => {
        if (actif) setPageContext(page);
      })
      .catch(() => {
        if (actif) {
          setErreur(
            "Le contexte de la page n'a pas pu être chargé. Réessayez avant d'envoyer."
          );
        }
      });
    return () => {
      actif = false;
    };
  }, [thread.id]);

  const enCours = status === "streaming" || status === "submitted";
  const contextePret = pageContext !== undefined;

  const envoyer = useCallback(
    async (texte: string) => {
      if (!texte.trim() || enCours || paused || !contextePret) {
        return;
      }
      setErreur("");
      await sendMessage({
        text: contextualMessage(
          `${source ? `Depuis ${source} :\n\n` : ""}${texte}`,
          pageContext
        ),
      });
      setDraft("");
      setSource("");
      setSourceOpen(false);
    },
    [contextePret, enCours, pageContext, paused, sendMessage, source]
  );

  // Premier message : le shell l'a mis en attente en ouvrant la conversation.
  useEffect(() => {
    if (envoye.current || !initialPrompt || paused || !contextePret) {
      return;
    }
    envoye.current = true;
    onConsumed();
    void envoyer(initialPrompt);
  }, [contextePret, envoyer, initialPrompt, onConsumed, paused]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [messages.length, enCours]);

  return (
    <div className="live-chat">
      <header className="chat-persona">
        <Mascot
          identity={wakie.id}
          name={wakie.name}
          small
          state={enCours ? "working" : paused ? "paused" : "idle"}
        />
        <div>
          <strong>{wakie.name}</strong>
          <span>
            {paused
              ? "En pause"
              : enCours
                ? "Réfléchit…"
                : contextePret
                  ? "À votre écoute"
                  : "Connexion à la conversation…"}
          </span>
        </div>
        <div className="chat-persona-actions">
          <button
            aria-label="Enregistrer la conversation en page"
            className="icon-button"
            disabled={enCours}
            onClick={async () => {
              const titre = window.prompt("Titre de la page", thread.title);
              if (!titre) return;
              try {
                const page = await api<Page>(
                  `/conversations/${thread.id}/page`,
                  "POST",
                  { title: titre }
                );
                window.location.hash = `/spaces/${page.spaceId}/pages/${page.id}`;
              } catch (e) {
                setErreur(
                  e instanceof Error ? e.message : "Enregistrement impossible."
                );
              }
            }}
          >
            <FilePlus size={18} />
          </button>
          <button
            aria-label="Planifier une tâche dans cette conversation"
            className="icon-button"
            onClick={onSchedule}
          >
            <Clock3 size={18} />
          </button>
        </div>
      </header>

      {pageContext && (
        <div className="page-chat-context">
          Travaille sur{" "}
          <a href={`#/spaces/${pageContext.spaceId}/pages/${pageContext.id}`}>
            {pageContext.title}
          </a>
        </div>
      )}

      <div className="chat-transcript">
        {!messages.length && (
          <div className="chat-welcome">
            <span className="eyebrow">UN PEU D'ESPACE POUR RÉFLÉCHIR</span>
            <h1>Qu'avez-vous en tête ?</h1>
            <p>{wakie.instructions}</p>
            <p className="muted">
              Votre conversation reste avec ce Wakie, d'un tour à l'autre.
            </p>
          </div>
        )}
        <ChatTranscript calls={calls} messages={messages} />
        {enCours && (
          <div className="thinking">
            <span />
            <span />
            <span />
            <span>{wakie.name} réfléchit</span>
          </div>
        )}
        <div ref={bas} />
      </div>

      {erreur && (
        <div className="chat-error" role="alert">
          {erreur}
        </div>
      )}

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void envoyer(draft);
        }}
      >
        {sourceOpen && (
          <div className="source-input">
            <Link2 size={15} />
            <input
              aria-label="Adresse de la page source"
              onChange={(event) => setSource(event.target.value)}
              placeholder="https://exemple.fr/page"
              type="url"
              value={source}
            />
            <button
              aria-label="Retirer la source"
              className="icon-button"
              onClick={() => {
                setSourceOpen(false);
                setSource("");
              }}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="chat-compose-row">
          <button
            aria-label="Ajouter un lien source"
            className="icon-button"
            onClick={() => setSourceOpen(!sourceOpen)}
            type="button"
          >
            <Link2 size={19} />
          </button>
          <textarea
            aria-label={`Message à ${wakie.name}`}
            maxLength={4000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={`Message à ${wakie.name}…`}
            rows={1}
            value={draft}
          />
          {enCours ? (
            <button
              aria-label="Arrêter la réponse"
              className="send-button"
              onClick={() => void stop()}
              type="button"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              aria-label="Envoyer le message"
              className="send-button"
              disabled={!draft.trim() || !contextePret || paused}
            >
              <ArrowUp size={19} />
            </button>
          )}
        </div>
        <div className="chat-compose-note">
          {voiceReady
            ? "Texte et voix, une seule conversation."
            : "Le texte est prêt. La voix temps réel arrive dans une phase suivante."}
        </div>
      </form>
    </div>
  );
}
