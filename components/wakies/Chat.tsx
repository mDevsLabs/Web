"use client";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";

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
 *   - les outils et capacités sélectionnés sont revalidés dans les registres de l'hôte.
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
import { ArrowUpIcon } from "@mdevs/icons/arrows/arrow-up";
import { XIcon } from "@mdevs/icons/controls/x";
import { FilePlus2Icon } from "@mdevs/icons/files/file-plus-2";
import { SquareStopIcon } from "@mdevs/icons/interface/square-stop";
import { LinkIcon } from "@mdevs/icons/misc/link";
import { TimerIcon } from "@mdevs/icons/time/timer";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { demandesValidation } from "@/components/wakies/ApprovalCard";
import { api } from "@/components/wakies/api";
import {
  assainirNom,
  type EtatPiece,
  formaterTaille,
  partDePiece,
  pieceSelectionnee,
  televerser,
} from "@/components/wakies/attachments";
import { ChatTranscript } from "@/components/wakies/ChatTranscript";
import { useConversationDraft } from "@/components/wakies/DraftProvider";
import { FileLibrary } from "@/components/wakies/FileLibrary";
import { Mascot } from "@/components/wakies/Mascot";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import {
  contextualMessage,
  type PageContext,
} from "@/components/wakies/page-context";
import { resolveWakieModelId } from "@/lib/wakies/model";
import type { Page } from "@/lib/wakies/pages";
import { storedMessages } from "@/lib/wakies/shared/messages";
import type {
  CallReceipt,
  Conversation,
  Wakie,
} from "@/lib/wakies/shared/types";

/** Réponse de `GET /conversations/:id/messages`. */
type Historique = {
  messages: { id: string; parts: unknown; role: string }[];
  seqProchain: number | null;
};

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
  const [cursor, setCursor] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setHistorique(null);
    setErreur("");
    void api<Historique>(
      `/conversations/${props.thread.id}/messages?limite=50`,
      "GET",
      undefined,
      controller.signal
    )
      .then((response) => {
        if (!controller.signal.aborted) {
          setHistorique(storedMessages(response.messages));
          setCursor(response.seqProchain);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErreur("L’historique n’a pas pu être chargé. Réessayez.");
      });
    return () => controller.abort();
  }, [props.thread.id, tentative]);

  if (erreur) {
    return (
      <div className="live-chat">
        <div className="chat-error" role="alert">
          {erreur}
          <Button
            onClick={() => setTentative((valeur) => valeur + 1)}
            variant="outline"
          >
            Réessayer
          </Button>
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

  return (
    <WakieChat {...props} historique={historique} initialCursor={cursor} />
  );
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
  initialCursor,
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
  initialCursor: number | null;
}) {
  const [pageContext, setPageContext] = useState<
    PageContext | null | undefined
  >(undefined);
  // Modèle de CE fil : la conversation d'abord (choix du menu), sinon celui du
  // Wakie, sinon le défaut. C'est exactement l'ordre que le serveur applique.
  const [modelId, setModelId] = useState(() =>
    resolveWakieModelId(thread.model, wakie.model)
  );
  const [draft, setDraft, queue] = useConversationDraft(thread.id);
  const queued = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );
  const failure = useRef<Error | null>(null);
  const [cursor, setCursor] = useState(initialCursor);
  const [olderLoading, setOlderLoading] = useState(false);
  const [capabilityIssues, setCapabilityIssues] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [erreur, setErreur] = useState("");
  const [pieces, setPieces] = useState<EtatPiece[]>([]);
  const [depotActif, setDepotActif] = useState(false);
  /** Vrai pendant une composition IME : `Entrée` valide le candidat. */
  const composition = useRef(false);
  const envoye = useRef(false);
  const bas = useRef<HTMLDivElement>(null);
  const inputFichier = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    // Recalculer au retour sur un brouillon, qui ne déclenche aucun événement de saisie.
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 180)}px`;
  }, [draft]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/wakies/chat`,
        body: { conversationId: thread.id },
        prepareSendMessagesRequest: ({ messages: all }) => ({
          body: { conversationId: thread.id, messages: [all.at(-1)] },
        }),
      }),
    [thread.id]
  );

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: thread.id,
    // L'historique est fourni ICI, à la création du chat : `useChat` le lit une
    // fois, et le composant n'est monté qu'une fois l'historique chargé (le
    // parent le remonte par `key` à chaque changement de conversation). Sans
    // lui, l'historique s'affichait vide après un rechargement et le tour
    // suivant repartait sans contexte.
    messages: historique,
    onData: (part) => {
      if (part.type === "data-capability-issues" && Array.isArray(part.data))
        setCapabilityIssues(
          part.data.filter((item): item is string => typeof item === "string")
        );
    },
    onError: (erreur) => {
      failure.current = erreur;
      queue.pause();
      setErreur(
        erreur.message ||
          "Le tour n'a pas abouti. Votre conversation est conservée."
      );
    },
    onFinish: () => {
      // Rafraîchir les métadonnées sans effacer le prochain brouillon.
      onSaved();
    },
    transport,
  });

  /**
   * Changement de modèle.
   *
   * `null` n'est pas « ne rien changer » : c'est « revenir au modèle du
   * Wakie ». C'est une intention distincte, et elle doit être écrite
   * explicitement — sinon il n'existe aucun moyen de quitter un modèle choisi
   * conversation par conversation.
   */
  const changerModele = useCallback(
    async (choisi: string | null) => {
      const precedent = modelId;
      setErreur("");
      setModelId(choisi ?? resolveWakieModelId(null, wakie.model));
      try {
        await api(`/conversations/${thread.id}`, "PATCH", { model: choisi });
        onSaved();
      } catch (e) {
        setModelId(precedent);
        setErreur(
          e instanceof Error
            ? e.message
            : "Le modèle n'a pas pu être enregistré."
        );
      }
    },
    [modelId, onSaved, thread.id, wakie.model]
  );

  /**
   * Pièces jointes.
   *
   * Le retrait pose `retire: true` et la réponse de téléversement le vérifie
   * avant de se rendre visible : sans ce drapeau, un fichier retiré pendant
   * que sa requête était en vol réapparaîtrait dans le composer.
   */
  const ajouterPieces = useCallback(async (fichiers: File[]) => {
    const acceptes: EtatPiece[] = [];
    for (const fichier of fichiers) {
      acceptes.push(pieceSelectionnee(fichier));
    }
    setPieces((precedentes) => [...precedentes, ...acceptes]);

    for (const piece of acceptes) {
      if (!piece.fichier || piece.etat === "echec") {
        continue;
      }
      setPieces((precedentes) =>
        precedentes.map((p) =>
          p.idLocal === piece.idLocal
            ? { ...p, etat: "envoi", progression: 0.4 }
            : p
        )
      );
      try {
        const { pathname } = await televerser(piece.fichier);
        setPieces((precedentes) =>
          precedentes.map((p) =>
            // `retire` gagne toujours : une réponse tardive ne ressuscite pas
            // un fichier que l'utilisateur a retiré.
            p.idLocal !== piece.idLocal || p.retire
              ? p
              : { ...p, etat: "pret", pathname, progression: 1 }
          )
        );
      } catch (e) {
        setPieces((precedentes) =>
          precedentes.map((p) =>
            p.idLocal !== piece.idLocal || p.retire
              ? p
              : {
                  ...p,
                  erreur:
                    e instanceof Error
                      ? e.message
                      : "Ce fichier n'a pas pu être envoyé.",
                  etat: "echec",
                  progression: 0,
                }
          )
        );
      }
    }
  }, []);

  const retirerPiece = useCallback((idLocal: string) => {
    setPieces((precedentes) =>
      precedentes.filter((p) => p.idLocal !== idLocal)
    );
  }, []);

  /**
   * L'envoi ATTEND les téléversements. Une pièce encore en cours ne doit pas
   * partir sans son `pathname` : le modèle ne pourrait pas la lire, et
   * l'historique afficherait une pièce morte.
   */
  const envoiEnCours = pieces.some(
    (p) => p.etat === "envoi" || p.etat === "selectionne"
  );
  const pieceEnEchec = pieces.find((p) => p.etat === "echec");

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
  useEffect(() => {
    if (paused && enCours) {
      queue.pause();
      void stop();
    }
  }, [paused, enCours, queue, stop]);

  const envoyer = useCallback(
    async (texte: string, avecPieces = true, messageId?: string) => {
      if (!texte.trim() || paused || !contextePret) {
        return;
      }
      // On n'envoie pas tant qu'un téléversement n'a pas abouti : le modèle ne
      // pourrait pas lire une pièce dont il n'a que le nom.
      if (envoiEnCours) {
        setErreur("Patientez la fin de l'envoi des fichiers.");
        return;
      }
      // Une pièce en échec ne bloque pas l'envoi : elle a pu échouer seule, et
      // l'utilisateur a pu vouloir envoyer le texte quand même.
      const pretes = (avecPieces ? pieces : [])
        .filter((p) => p.etat === "pret" && p.pathname)
        .map(partDePiece);
      setErreur("");
      failure.current = null;
      const sourceEnvoyee = avecPieces ? source : "";
      if (avecPieces) setDraft((current) => (current === texte ? "" : current));
      setPieces((current) =>
        current.filter(
          (piece) => !pretes.some((part) => part.pathname === piece.pathname)
        )
      );
      if (avecPieces) {
        setSource("");
        setSourceOpen(false);
      }
      await sendMessage({
        ...(messageId ? { id: messageId } : {}),
        parts: [
          {
            text: contextualMessage(
              sourceEnvoyee ? `Depuis ${sourceEnvoyee}:\n\n${texte}` : texte,
              pageContext
            ),
            type: "text",
          },
          ...pretes.map((part) => ({
            filename: part.fileName,
            mediaType: part.mediaType ?? "application/octet-stream",
            type: "file" as const,
            url: `blob:${part.pathname}`,
          })),
        ],
        role: "user",
      });
      if (failure.current) {
        setDraft((current) => current || texte);
        setPieces((current) => [
          ...pieces.filter(
            (piece) => !current.some((item) => item.idLocal === piece.idLocal)
          ),
          ...current,
        ]);
        throw failure.current;
      }
    },
    [
      contextePret,
      envoiEnCours,
      enCours,
      pageContext,
      paused,
      pieces,
      sendMessage,
      source,
      setDraft,
    ]
  );

  useEffect(() => {
    if (enCours || status === "error") return;
    const controller = new AbortController();
    const refreshHistory = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void api<Historique>(
        `/conversations/${thread.id}/messages?limite=50`,
        "GET",
        undefined,
        controller.signal
      )
        .then((response) => {
          if (controller.signal.aborted) return;
          const fresh = storedMessages(response.messages);
          setMessages((current) => {
            const byId = new Map(
              current.map((message) => [message.id, message])
            );
            for (const message of fresh) byId.set(message.id, message);
            return [...byId.values()];
          });
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", refreshHistory);
    const timer = setInterval(refreshHistory, 30_000);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshHistory);
    };
  }, [enCours, setMessages, status, thread.id]);

  // Premier message : le shell l'a mis en attente en ouvrant la conversation.
  useEffect(() => {
    if (envoye.current || !initialPrompt || paused || !contextePret) {
      return;
    }
    envoye.current = true;
    onConsumed();
    void envoyer(initialPrompt).catch(() => {});
  }, [contextePret, envoyer, initialPrompt, onConsumed, paused]);

  useEffect(() => {
    if (
      !enCours &&
      contextePret &&
      !envoiEnCours &&
      queued.pending.length &&
      !queued.paused &&
      !paused
    )
      void queue
        .flush(async (item) => {
          await envoyer(item.text, false, item.id);
        })
        .catch(() => {});
  }, [
    enCours,
    contextePret,
    envoiEnCours,
    envoyer,
    paused,
    queue,
    queued.paused,
    queued.pending.length,
  ]);
  useEffect(
    () => () => {
      queue.pause();
    },
    [queue]
  );
  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [messages.at(-1)?.id, enCours]);

  return (
    <div className="live-chat">
      <header className="chat-persona">
        <Mascot
          avatar={wakie.avatar}
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
          {/* Le sélecteur affiche la valeur PERSISTÉE (`thread.model`), qui peut être
              vide : ce vide signifie « suit le Wakie » et non « aucun modèle ».
              `modelId` n'est plus qu'un tampon de retour arrière — le serveur
              fait autorité, donc on n'affiche jamais une valeur optimiste que
              l'enregistrement n'a pas confirmée. */}
          <span className="wakies-model-picker">
            <ModelPicker
              disabled={enCours}
              onChoisir={(choisi) => void changerModele(choisi)}
              outilsActifs={Boolean(
                thread.toolIds?.length ||
                  thread.pluginIds?.length ||
                  thread.mcpServerIds?.length
              )}
              valeur={thread.model ?? ""}
            />
          </span>
          <Button
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
            variant="ghost"
          >
            <FilePlus2Icon size={18} />
          </Button>
          <Button
            aria-label="Planifier une tâche dans cette conversation"
            className="icon-button"
            onClick={onSchedule}
            variant="ghost"
          >
            <TimerIcon size={18} />
          </Button>
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
        {cursor !== null && (
          <Button
            disabled={olderLoading || enCours}
            onClick={async () => {
              setOlderLoading(true);
              try {
                const older = await api<Historique>(
                  `/conversations/${thread.id}/messages?limite=50&avant=${cursor}`
                );
                setMessages((current) => [
                  ...storedMessages(older.messages).filter(
                    (message) => !current.some((item) => item.id === message.id)
                  ),
                  ...current,
                ]);
                setCursor(older.seqProchain);
              } catch {
                setErreur("Les messages précédents n’ont pas pu être chargés.");
              } finally {
                setOlderLoading(false);
              }
            }}
            type="button"
            variant="outline"
          >
            {olderLoading ? "Chargement…" : "Voir les messages précédents"}
          </Button>
        )}
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
        {/* Les demandes d'approbation sont rendues APRÈS le transcript : elles
            portent sur ce qui vient d'être proposé, donc juste en dessous. */}
        {messages.flatMap((message) =>
          demandesValidation(message).map((demande) => (
            <section className="surface-muted" key={demande.toolCallId}>
              <p>
                Cette ancienne demande d’approbation ne peut pas être reprise
                dans Wakies.
              </p>
              <a href="/agents">
                Ouvrir le mode Agent pour les actions sensibles
              </a>
            </section>
          ))
        )}
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

      {capabilityIssues.length > 0 && (
        <p className="notice" role="status">
          {capabilityIssues.join(" ")}
        </p>
      )}
      {erreur && (
        <div className="chat-error" role="alert">
          {erreur}
        </div>
      )}

      {queued.pending.length > 0 && (
        <section aria-label="Messages en attente" className="queue-list">
          <small>
            File temporaire sur cet appareil · aucun envoi en arrière-plan
          </small>
          <ul>
            {queued.pending.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>
                <Button
                  onClick={() => {
                    setDraft(item.text);
                    queue.remove(item.id);
                  }}
                  type="button"
                  variant="outline"
                >
                  Modifier
                </Button>
                <Button
                  onClick={() => queue.remove(item.id)}
                  type="button"
                  variant="outline"
                >
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
          {queued.paused && (
            <Button
              disabled={enCours || paused}
              onClick={() => queue.resume()}
              type="button"
              variant="outline"
            >
              Reprendre les envois
            </Button>
          )}
        </section>
      )}
      <form
        className="chat-composer"
        onDragLeave={() => setDepotActif(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDepotActif(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDepotActif(false);
          const fichiers = [...(event.dataTransfer?.files ?? [])];
          if (fichiers.length > 0) {
            void ajouterPieces(fichiers);
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (enCours) {
            if (!draft.trim()) return;
            if (pieces.length || source) {
              setErreur(
                "La file temporaire accepte du texte. Gardez les pièces jointes pour le prochain envoi."
              );
              return;
            }
            queue.enqueue({ id: crypto.randomUUID(), text: draft });
            setDraft("");
          } else void envoyer(draft).catch(() => {});
        }}
      >
        {/* Le survol de dépôt n'ANNULE pas le contenu : c'est une bordure, pas
            un voile. Un voile masquerait le brouillon qu'on s'apprête à
            compléter avec le fichier. */}
        {depotActif ? (
          <div className="composer-dropzone" role="presentation">
            Déposez vos fichiers ici
          </div>
        ) : null}

        {pieces.length > 0 ? (
          <ul className="composer-pieces">
            {pieces.map((piece) => (
              <li
                className={`composer-piece is-${piece.etat}`}
                key={piece.idLocal}
              >
                <span className="composer-piece-name">
                  {assainirNom(piece.nom)}
                </span>
                <span className="composer-piece-meta">
                  {formaterTaille(piece.taille)}
                  {piece.etat === "envoi"
                    ? " · envoi en cours…"
                    : piece.etat === "pret"
                      ? " · prêt"
                      : piece.etat === "echec"
                        ? ` · échec — ${piece.erreur ?? "raison inconnue"}`
                        : " · en attente"}
                </span>
                <Button
                  aria-label={`Retirer ${assainirNom(piece.nom)}`}
                  className="icon-button"
                  onClick={() => retirerPiece(piece.idLocal)}
                  type="button"
                  variant="ghost"
                >
                  <XIcon size={13} />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {sourceOpen && (
          <div className="source-input">
            <LinkIcon size={15} />
            <Input
              aria-label="Adresse de la page source"
              onChange={(event) => setSource(event.target.value)}
              placeholder="https://exemple.fr/page"
              type="url"
              value={source}
            />
            <Button
              aria-label="Retirer la source"
              className="icon-button"
              onClick={() => {
                setSourceOpen(false);
                setSource("");
              }}
              type="button"
              variant="ghost"
            >
              <XIcon size={14} />
            </Button>
          </div>
        )}
        <div className="chat-compose-row">
          <FileLibrary
            onSelect={(piece) =>
              setPieces((current) =>
                current.some(
                  (item) => item.pathname === piece.pathname && !item.retire
                )
                  ? current
                  : [...current, piece]
              )
            }
          />
          <input
            accept="image/*,application/pdf,text/plain,text/markdown,text/csv,application/json,.json,.md,.txt,.csv"
            className="visually-hidden-input"
            multiple
            onChange={(event) => {
              const fichiers = [...(event.target.files ?? [])];
              if (fichiers.length > 0) {
                void ajouterPieces(fichiers);
              }
              // On vide l'input pour pouvoir re-sélectionner le MÊME fichier
              // après l'avoir retiré : sinon le `change` ne se déclencherait pas.
              event.target.value = "";
            }}
            ref={inputFichier}
            type="file"
          />
          <Button
            aria-label="Joindre un fichier"
            className="icon-button"
            onClick={() => inputFichier.current?.click()}
            type="button"
            variant="ghost"
          >
            <FilePlus2Icon size={18} />
          </Button>
          <Button
            aria-label="Ajouter un lien source"
            className="icon-button"
            onClick={() => setSourceOpen(!sourceOpen)}
            type="button"
            variant="ghost"
          >
            <LinkIcon size={19} />
          </Button>
          <Textarea
            aria-label={`Message à ${wakie.name}`}
            maxLength={4000}
            onChange={(event) => {
              setDraft(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`;
            }}
            onCompositionEnd={() => {
              composition.current = false;
            }}
            onCompositionStart={() => {
              composition.current = true;
            }}
            onKeyDown={(event) => {
              // Pendant une composition IME, `Entrée` valide le CANDIDAT
              // affiché par le clavier du système. L'envoyer à ce moment
              // enverrait un demi-mot et viderait le brouillon.
              if (event.nativeEvent.isComposing || composition.current) {
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={`Message à ${wakie.name}…`}
            ref={textareaRef}
            rows={1}
            value={draft}
          />
          {enCours && draft.trim() && (
            <Button
              disabled={paused || envoiEnCours}
              type="submit"
              variant="outline"
            >
              Mettre en attente
            </Button>
          )}
          {enCours ? (
            <Button
              aria-label="Arrêter la réponse"
              className="send-button"
              onClick={() => {
                queue.pause();
                void stop();
              }}
              type="button"
              variant="solid"
            >
              <SquareStopIcon size={16} />
            </Button>
          ) : (
            <Button
              aria-label="Envoyer le message"
              className="send-button"
              disabled={
                !draft.trim() || !contextePret || paused || envoiEnCours
              }
              type="submit"
              variant="solid"
            >
              <ArrowUpIcon size={19} />
            </Button>
          )}
        </div>
        {/* Une pièce en échec n'empêche pas l'envoi du texte : elle est
            signalée, retirable, et le brouillon reste intact. */}
        {pieceEnEchec ? (
          <div className="chat-compose-note is-error">
            {pieceEnEchec.erreur ?? "Un fichier n'a pas pu être envoyé."} Le
            texte reste prêt à être envoyé.
          </div>
        ) : (
          <div className="chat-compose-note">
            {voiceReady
              ? "Texte et voix, une seule conversation."
              : "Le texte est prêt. La voix temps réel arrive dans une phase suivante."}
          </div>
        )}
      </form>
    </div>
  );
}
