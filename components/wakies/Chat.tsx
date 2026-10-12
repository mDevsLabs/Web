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
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { XIcon } from "@mdevs/icons/controls/x";
import { FilePlus2Icon } from "@mdevs/icons/files/file-plus-2";
import { SquareStopIcon } from "@mdevs/icons/interface/square-stop";
import { LinkIcon } from "@mdevs/icons/misc/link";
import { ReplyIcon } from "@mdevs/icons/misc/reply";
import { TimerIcon } from "@mdevs/icons/time/timer";
import { DropdownMenu } from "@mdevs/ui/primitives/dropdown-menu";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import useSWR from "swr";
import { demandesValidation } from "@/components/wakies/ApprovalCard";
import { api } from "@/components/wakies/api";
import {
  assainirNom,
  type EtatPiece,
  formaterTaille,
  importerDansBibliotheque,
  partDePiece,
  pieceSelectionnee,
  televerser,
} from "@/components/wakies/attachments";
import { ChatTranscript } from "@/components/wakies/ChatTranscript";
import { ComposerAides } from "@/components/wakies/ComposerAides";
import {
  ComposerMentions,
  type ComposerMentionsHandle,
} from "@/components/wakies/ComposerMentions";
import { useConversationDraft } from "@/components/wakies/DraftProvider";
import { FileLibrary } from "@/components/wakies/FileLibrary";
import { Mascot } from "@/components/wakies/Mascot";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import {
  contextualMessage,
  type PageContext,
} from "@/components/wakies/page-context";
import { ReglagesDuFil } from "@/components/wakies/ReglagesDuFil";
import { resolveWakieModelId } from "@/lib/wakies/model";
import type { Page } from "@/lib/wakies/pages";
import { storedMessages } from "@/lib/wakies/shared/messages";
import { fusionnerHistorique } from "@/lib/wakies/shared/messaging";
import {
  acceptePiece,
  type CapacitesPieces,
  formatsPieces,
} from "@/lib/wakies/shared/model-attachments";
import { dernierSeq, texteDe } from "@/lib/wakies/shared/transcript";
import type {
  CallReceipt,
  Conversation,
  MessageReaction,
  Space,
  Wakie,
} from "@/lib/wakies/shared/types";

/**
 * Réponse de `GET /conversations/:id/messages`.
 *
 * Les champs facultatifs (citation, horodatage, ordre d'écriture, auteur)
 * alimentent les MÉTADONNÉES des messages : c'est ce qui permet d'afficher une
 * citation, un séparateur de jour et de marquer la conversation lue sur le
 * `seq` réellement affiché.
 */
type Historique = {
  messages: {
    authorWakieId?: string | null;
    createdAt?: number;
    id: string;
    parts: unknown;
    replyToId?: string | null;
    role: string;
    seq?: number;
  }[];
  seqProchain: number | null;
  seqSuivant?: number | null;
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
  /** Message à mettre en évidence (résultat de recherche). */
  cibleMessageId?: string | null;
  /** Conversations du compte, pour le choix de destination d'un transfert. */
  conversations?: Conversation[];
  /** Espaces du compte : destination d'un « Enregistrer en page ». */
  espaces?: Space[];
  /** Wakies du compte : candidats à la mention `@`. */
  wakies?: Wakie[];
  /** La conversation a été marquée lue : la liste peut retomber à zéro. */
  onLu?: (conversationId: string) => void;
}) {
  const [historique, setHistorique] = useState<UIMessage[] | null>(null);
  // Épingles et réactions : charges en parallèle de l'historique, rechargées
  // après chaque tour (onSaved). Aucun état local d'autorité : le serveur
  // tranche (les routes pins/reactions portent le userId et la propriété).
  // Type definitions are local jamais sérialisés côté client.
  const [reactionsParMessage, setReactionsParMessage] = useState<
    Map<string, MessageReaction[]>
  >(() => new Map());
  const [epingles, setEpingles] = useState<UIMessage[]>([]);
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
  cibleMessageId,
  conversations,
  espaces,
  wakies,
  onLu,
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
  cibleMessageId?: string | null;
  conversations?: Conversation[];
  espaces?: Space[];
  wakies?: Wakie[];
  onLu?: (conversationId: string) => void;
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
  const [capacitesFichiers, setCapacitesFichiers] = useState<CapacitesPieces>({
    documents: false,
    images: false,
  });
  const accepteFichiers =
    capacitesFichiers.images || capacitesFichiers.documents;
  const [modeleEnCours, setModeleEnCours] = useState(false);
  const changementModele = useRef(false);
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false);
  const [erreur, setErreur] = useState("");
  const [epingles, setEpingles] = useState<UIMessage[]>([]);
  const [reactionsParMessage, setReactionsParMessage] = useState<
    Map<string, MessageReaction[]>
  >(new Map());
  const [pieces, setPieces] = useState<EtatPiece[]>([]);
  const [depotActif, setDepotActif] = useState(false);
  // Réponse CIBLÉE : la citation part en tête du composer et dans le corps de
  // la requête (`replyToId`) ; le serveur la résout et la stocke. Un identifiant
  // qui n'appartient pas au fil sera refusé — cet état ne fait pas autorité.
  const [reponseA, setReponseA] = useState<UIMessage | null>(null);
  const reponseRef = useRef<string | null>(null);
  // Transfert : quel message, vers quelle conversation. Le choix explicite
  // évite un transfert « quelque part » que personne ne pourrait vérifier.
  const [transfert, setTransfert] = useState<string | null>(null);
  const [transfertVers, setTransfertVers] = useState("");
  const [transfertEnCours, setTransfertEnCours] = useState(false);
  /** Vrai pendant une composition IME : `Entrée` valide le candidat. */
  const composition = useRef(false);
  const envoye = useRef(false);
  const bas = useRef<HTMLDivElement>(null);
  const [finVisible, setFinVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const inputFichier = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Pont vers le menu `@` : la priorité des touches se décide dans ce champ. */
  const mentionsRef = useRef<ComposerMentionsHandle | null>(null);

  /**
   * Une mention insérée remplace le mot en cours et REPORTE LE CURSEUR.
   *
   * Sans ce report, le champ contrôlé rend sa `value` et le caret retombe en
   * fin de brouillon : la mention suivante s'insérerait au mauvais endroit, et
   * l'utilisateur ne peut pas enchaîner deux `@` dans une phrase. Le report se
   * fait après le rendu (`requestAnimationFrame`), pas pendant.
   */
  const insererMention = useCallback(
    (texte: string, curseurApres: number) => {
      setDraft(texte);
      const zone = textareaRef.current;
      if (!zone) return;
      requestAnimationFrame(() => {
        zone.focus();
        zone.setSelectionRange(curseurApres, curseurApres);
        zone.style.height = "auto";
        zone.style.height = `${Math.min(zone.scrollHeight, 180)}px`;
      });
    },
    [setDraft]
  );

  useEffect(() => {
    const visibilite = () =>
      setPageVisible(document.visibilityState === "visible");
    visibilite();
    document.addEventListener("visibilitychange", visibilite);
    const observateur = new IntersectionObserver(([entree]) =>
      setFinVisible(Boolean(entree?.isIntersecting))
    );
    if (bas.current) observateur.observe(bas.current);
    return () => {
      observateur.disconnect();
      document.removeEventListener("visibilitychange", visibilite);
    };
  }, []);

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
          // `replyToId` est lu dans une REF : le transport est mémorisé par
          // conversation, et la citation change à chaque envoi.
          body: {
            conversationId: thread.id,
            messages: [all.at(-1)],
            ...(reponseRef.current ? { replyToId: reponseRef.current } : {}),
          },
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
      // Notes du serveur : il est l'autorité, l'interface reflète sans décider.
      if (part.type === "data-notes" && Array.isArray(part.data)) {
        const notes = part.data.filter(
          (item): item is string => typeof item === "string"
        );
        setCapabilityIssues((actuelles) => [...actuelles, ...notes]);
      }
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

  // Aucune relève ne remplace un message en streaming. Les pages anciennes
  // restent dans le fil, et une réponse reçue ailleurs rejoint son ordre seq.
  const etatChat = useRef(status);
  etatChat.current = status;
  const messagesActuels = useRef(messages);
  messagesActuels.current = messages;
  useSWR(
    status === "streaming" || status === "submitted"
      ? null
      : ["wakies-history", thread.id],
    async () => {
      let curseur = dernierSeq(messagesActuels.current) ?? 0;
      // Cinq pages au maximum par relève : les suivantes attendent le prochain
      // tick et ne bloquent pas une conversation très longue.
      for (let page = 0; page < 5; page += 1) {
        const nouvelle = await api<Historique>(
          `/conversations/${thread.id}/messages?apres=${curseur}&limite=100`
        );
        if (
          etatChat.current === "streaming" ||
          etatChat.current === "submitted"
        )
          return nouvelle;
        setMessages((actuels) =>
          fusionnerHistorique(actuels, storedMessages(nouvelle.messages))
        );
        if (nouvelle.seqSuivant === null || nouvelle.seqSuivant === undefined)
          break;
        curseur = nouvelle.seqSuivant;
        if (page === 4) return nouvelle;
      }
      // Renouveler aussi les signatures des pièces de la page récente.
      const response = await api<Historique>(
        `/conversations/${thread.id}/messages?limite=50`
      );
      if (
        etatChat.current !== "streaming" &&
        etatChat.current !== "submitted"
      ) {
        setMessages((actuels) =>
          fusionnerHistorique(actuels, storedMessages(response.messages))
        );
      }
      return response;
    },
    { refreshInterval: 5000, revalidateOnFocus: true, revalidateOnMount: true }
  );

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
      if (changementModele.current) return;
      changementModele.current = true;
      setModeleEnCours(true);
      const precedent = modelId;
      setErreur("");
      setModelId(choisi ?? resolveWakieModelId(null, wakie.model));
      try {
        await api(`/conversations/${thread.id}`, "PATCH", { model: choisi });
        await onSaved();
      } catch (e) {
        setModelId(precedent);
        setErreur(
          e instanceof Error
            ? e.message
            : "Le modèle n'a pas pu être enregistré."
        );
      } finally {
        changementModele.current = false;
        setModeleEnCours(false);
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
  const ajouterPieces = useCallback(
    async (fichiers: File[]) => {
      if (changementModele.current) {
        setErreur("Patientez pendant l’enregistrement du modèle.");
        return;
      }
      const acceptes: EtatPiece[] = [];
      for (const fichier of fichiers) {
        if (!acceptePiece(fichier.type, capacitesFichiers)) {
          setErreur(
            "Ce format n’est pas pris en charge par le modèle choisi. Sélectionnez un modèle compatible."
          );
          continue;
        }
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
          // Copie en bibliothèque cloud, SANS bloquer l'envoi : la pièce est déjà
          // prête pour le message. Le sort de l'import s'affiche sur la ligne, et
          // une bibliothèque pleine ne doit jamais faire échouer un tour.
          void importerDansBibliotheque(pathname).then((sort) => {
            setPieces((precedentes) =>
              precedentes.map((p) =>
                p.idLocal !== piece.idLocal || p.retire
                  ? p
                  : { ...p, biblio: sort }
              )
            );
          });
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
    },
    [capacitesFichiers]
  );

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

  // ─── Épingles et réactions ────────────────────────────────────────────────
  // Rechargées après chaque tour (onSaved) et à visibilité : le serveur est
  // l'autorité, ici on ne fait que refléter.
  const rechargerSocial = useCallback(async () => {
    try {
      const [pins, historique] = await Promise.all([
        api<{ messages: UIMessage[] }>(
          `/pins?conversationId=${thread.id}`,
          "GET"
        ),
        api<Historique>(
          `/conversations/${thread.id}/messages?limite=200`,
          "GET"
        ),
      ]);
      setEpingles(
        storedMessages(historique.messages).filter((message) =>
          (pins.messages as { id: string }[]).some((p) => p.id === message.id)
        )
      );
      const ids = historique.messages.map((message) => message.id);
      if (ids.length === 0) {
        setReactionsParMessage(new Map());
        return;
      }
      // Une seule requête : la route des réactions accepte jusqu'à 200 ids.
      const reactions = await api<{
        reactions: [string, MessageReaction[]][];
      }>(
        `/messages/${ids[0]}/reactions?id=${ids.map(encodeURIComponent).join("&id=")}`,
        "GET"
      );
      setReactionsParMessage(new Map(reactions.reactions));
    } catch {
      // Une panne des annexes ne doit jamais masquer l'historique : on garde
      // l'état précédent, la prochaine relecture tentera à nouveau.
    }
  }, [thread.id]);
  useEffect(() => {
    void rechargerSocial();
  }, [rechargerSocial, messages.length]);
  useSWR(["wakies-social", thread.id], rechargerSocial, {
    refreshInterval: 5000,
  });

  const basculerEpingle = useCallback(
    async (messageId: string, epingle: boolean) => {
      try {
        await api("/pins", "POST", { messageId, pinned: epingle });
        setEpingles((current) =>
          epingle
            ? [...current, { id: messageId } as UIMessage]
            : current.filter((m) => m.id !== messageId)
        );
        void rechargerSocial();
      } catch (e) {
        setErreur(
          e instanceof Error
            ? e.message
            : "L'épingle n'a pas pu être enregistrée."
        );
      }
    },
    [rechargerSocial]
  );

  const poserReactionBulle = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api(`/messages/${messageId}/reactions`, "POST", { emoji });
        void rechargerSocial();
      } catch (e) {
        setErreur(
          e instanceof Error ? e.message : "La réaction n'a pas pu être posée."
        );
      }
    },
    [rechargerSocial]
  );

  /**
   * Noms des Wakies du fil.
   *
   * Ils nomment l'auteur d'un message CITÉ : le transcript affiche le nom réel
   * quand il le connaît, sinon « Wakie » — jamais un nom inventé.
   */
  const nomsWakies = useMemo(() => {
    const noms = new Map<string, string>();
    noms.set(wakie.id, wakie.name);
    for (const item of wakies ?? []) noms.set(item.id, item.name);
    return noms;
  }, [wakies, wakie.id, wakie.name]);

  const enCours = status === "streaming" || status === "submitted";

  /**
   * MARQUER LA CONVERSATION LUE.
   *
   * Le curseur est le dernier `seq` RÉELLEMENT chargé : marquer « lu » sur
   * « maintenant » avalerait les messages reçus par le serveur que cette page
   * n'a pas affichés. Le serveur ne fait jamais reculer le curseur, donc un
   * second onglet qui rouvrirait une page ancienne ne ressuscite rien.
   *
   * L'envoi est DIFFÉRÉ : ouvrir puis fermer une conversation ne doit pas
   * produire deux écritures pour rien, et le `seq` maximum d'un fil qui coule
   * ne déclenche pas une requête par message.
   */
  const dernierVu = dernierSeq(messages);
  useEffect(() => {
    if (dernierVu === null || !finVisible || !pageVisible) return;
    const minuteur = window.setTimeout(() => {
      void api(`/conversations/${thread.id}/read`, "POST", { seq: dernierVu })
        .then(() => onLu?.(thread.id))
        .catch(() => {
          // Le marquage de lecture est un CONFORT : son échec ne s'affiche pas
          // comme une erreur de conversation, la prochaine ouverture réessaie.
        });
    }, 900);
    return () => window.clearTimeout(minuteur);
  }, [dernierVu, finVisible, pageVisible, onLu, thread.id]);

  /**
   * « Enregistrer en page » depuis un MESSAGE : épingle + page Markdown
   * (route serveur), dans l'espace de destination du Wakie.
   */
  const enregistrerMessage = useCallback(
    async (messageId: string) => {
      const espace = wakie.spaceId || espaces?.[0]?.id;
      if (!espace) {
        setErreur(
          "Aucun Espace de destination : créez-en un avant d'enregistrer un message en page."
        );
        return;
      }
      try {
        const page = await api<Page>(`/messages/${messageId}/page`, "POST", {
          spaceId: espace,
        });
        setErreur("");
        window.location.hash = `/spaces/${page.spaceId}/pages/${page.id}`;
      } catch (e) {
        setErreur(
          e instanceof Error ? e.message : "L'enregistrement en page a échoué."
        );
      }
    },
    [espaces, wakie.spaceId]
  );

  /**
   * TRANSFÉRER un message vers une autre conversation du compte.
   *
   * La réponse porte l'identifiant de la COPIE : on l'annonce, puis on laisse
   * la liste des conversations se rafraîchir — l'interface ne prétend pas
   * avoir navigué vers la destination à la place de l'utilisateur.
   */
  const transferer = useCallback(async () => {
    if (!transfert || !transfertVers) return;
    setTransfertEnCours(true);
    try {
      await api(`/messages/${transfert}/forward`, "POST", {
        conversationId: transfertVers,
      });
      setTransfert(null);
      setTransfertVers("");
      setErreur("");
      onSaved();
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Le transfert n'a pas abouti."
      );
    } finally {
      setTransfertEnCours(false);
    }
  }, [onSaved, transfert, transfertVers]);

  const contextePret = pageContext !== undefined;
  useEffect(() => {
    if (paused && enCours) {
      queue.pause();
      void stop();
    }
  }, [paused, enCours, queue, stop]);

  const envoyer = useCallback(
    async (texte: string, avecPieces = true, messageId?: string) => {
      // Une erreur garde le message dans la file si le modèle change pendant
      // son traitement : un retour silencieux le ferait disparaître.
      if (changementModele.current) {
        throw new Error("Patientez pendant l’enregistrement du modèle.");
      }
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
      if (
        avecPieces &&
        pieces.some(
          (piece) =>
            piece.etat === "pret" &&
            !acceptePiece(piece.type, capacitesFichiers)
        )
      ) {
        setErreur(
          "Une pièce jointe est incompatible avec le modèle choisi. Changez de modèle ou retirez-la."
        );
        return;
      }
      setErreur("");
      failure.current = null;
      // La citation part avec CE message : la ref est lue par le transport au
      // moment de l'envoi, donc elle décrit toujours le bon tour.
      reponseRef.current = avecPieces ? (reponseA?.id ?? null) : null;
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
        // La citation est CONSERVÉE en échec : le message n'est pas parti, et
        // l'utilisateur réessaie la même réponse.
        throw failure.current;
      }
      setReponseA(null);
      reponseRef.current = null;
    },
    [
      contextePret,
      capacitesFichiers,
      envoiEnCours,
      enCours,
      pageContext,
      paused,
      pieces,
      reponseA,
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
      !modeleEnCours &&
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
    modeleEnCours,
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
    <div
      className="live-chat"
      data-app-update-blocked={
        enCours || pieces.length > 0 || transfertEnCours || modeleEnCours
      }
    >
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
          {/* Ce que les `@@` du fil ont réglé, et où l'enlever. */}
          <ReglagesDuFil
            conversation={thread}
            espaces={espaces}
            onChange={onSaved}
            wakies={wakies}
          />
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
        <ChatTranscript
          calls={calls}
          cibleId={cibleMessageId}
          epingles={epingles}
          messages={messages}
          nomsWakies={nomsWakies}
          onEnregistrer={enregistrerMessage}
          onEpingle={basculerEpingle}
          onPoserReaction={poserReactionBulle}
          onRepondre={setReponseA}
          onTransferer={(messageId) => {
            setTransfert(messageId);
            // Destination proposée : la première AUTRE conversation du compte.
            // Aucune n'est présélectionnée si le compte n'en a qu'une — un
            // transfert vers soi-même n'a pas de sens.
            const autre = (conversations ?? []).find(
              (conversation) => conversation.id !== thread.id
            );
            setTransfertVers(autre?.id ?? "");
          }}
          reactionsParMessage={reactionsParMessage}
        />
        {/* Le choix de destination : une liste explicite plutôt qu'un
            « transférer » qui déciderait tout seul de la cible. */}
        {transfert ? (
          <section aria-label="Transférer le message" className="chat-forward">
            <strong>Transférer vers…</strong>
            <ul>
              {(conversations ?? [])
                .filter((conversation) => conversation.id !== thread.id)
                .map((conversation) => (
                  <li key={conversation.id}>
                    <label>
                      <input
                        checked={transfertVers === conversation.id}
                        name="transfert"
                        onChange={() => setTransfertVers(conversation.id)}
                        type="radio"
                        value={conversation.id}
                      />
                      <span>{conversation.title}</span>
                    </label>
                  </li>
                ))}
            </ul>
            {(conversations ?? []).length < 2 ? (
              <p className="muted">
                Aucune autre conversation : ouvrez-en une pour y transférer un
                message.
              </p>
            ) : null}
            <div className="chat-forward-actions">
              <Button
                disabled={!transfertVers || transfertEnCours}
                onClick={() => void transferer()}
                type="button"
                variant="solid"
              >
                Transférer
              </Button>
              <Button
                onClick={() => {
                  setTransfert(null);
                  setTransfertVers("");
                }}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </section>
        ) : null}
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
        {/* La citation de réponse est EN TÊTE du composer : elle décrit ce que
            le message en cours de rédaction vise, et se retire d'un clic. */}
        {reponseA ? (
          <div className="chat-reply-banner">
            <ReplyIcon size={13} />
            <span className="chat-reply-auteur">
              {reponseA.role === "user"
                ? "Vous"
                : (nomsWakies.get(
                    ((reponseA.metadata ?? {}) as { authorWakieId?: string })
                      .authorWakieId ?? ""
                  ) ?? "Wakie")}
            </span>
            <span className="chat-reply-extrait">
              {texteDe(reponseA).replace(/\s+/g, " ").trim().slice(0, 120) ||
                "Pièce jointe"}
            </span>
            <Button
              aria-label="Annuler la réponse"
              className="icon-button"
              onClick={() => {
                setReponseA(null);
                reponseRef.current = null;
              }}
              type="button"
              variant="ghost"
            >
              <XIcon size={13} />
            </Button>
          </div>
        ) : null}
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
                {/* Sort de la copie en bibliothèque cloud, distinct de l'envoi
                    au message : une bibliothèque pleine ne doit pas lire
                    « échec » sur une pièce pourtant prête. */}
                {piece.biblio ? (
                  <span className={`composer-piece-biblio is-${piece.biblio}`}>
                    {piece.biblio === "ok"
                      ? "copié dans votre bibliothèque"
                      : piece.biblio === "deja"
                        ? "déjà dans votre bibliothèque"
                        : piece.biblio === "plein"
                          ? "bibliothèque cloud pleine — non importé"
                          : "bibliothèque injoignable — non importé"}
                  </span>
                ) : null}
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
        <div className="chat-compose-toolbar">
          {/* Le sélecteur affiche la valeur PERSISTÉE (`thread.model`), qui peut être
              vide : ce vide signifie « suit le Wakie » et non « aucun modèle ».
              `modelId` n'est plus qu'un tampon de retour arrière — le serveur
              fait autorité, donc on n'affiche jamais une valeur optimiste que
              l'enregistrement n'a pas confirmée. */}
          <span className="wakies-model-picker">
            <ModelPicker
              disabled={enCours || modeleEnCours}
              modeleEffectif={thread.model || wakie.model || undefined}
              onCapacitesPieces={setCapacitesFichiers}
              onChoisir={(choisi) => void changerModele(choisi)}
              valeur={thread.model ?? ""}
            />
          </span>
          <Button
            aria-label="Importer des fichiers ou images"
            className="wakies-attachment-trigger"
            disabled={!accepteFichiers || modeleEnCours || paused || enCours}
            onClick={() => inputFichier.current?.click()}
            title={
              accepteFichiers
                ? "Joindre des fichiers compatibles avec ce modèle"
                : "Choisissez un modèle acceptant les images ou documents"
            }
            type="button"
            variant="ghost"
          >
            <FilePlus2Icon size={16} /> Joindre
          </Button>
          {modeleEnCours ? (
            <span role="status">Enregistrement du modèle…</span>
          ) : null}
        </div>
        <div className="chat-compose-row">
          {accepteFichiers && (
            <FileLibrary
              onOpenChange={setBibliothequeOuverte}
              onSelect={(piece) => {
                if (!acceptePiece(piece.type, capacitesFichiers))
                  throw new Error(
                    "Ce fichier est incompatible avec le modèle choisi."
                  );
                setPieces((current) =>
                  current.some(
                    (item) => item.pathname === piece.pathname && !item.retire
                  )
                    ? current
                    : [...current, piece]
                );
              }}
              open={bibliothequeOuverte}
              sansDeclencheur
            />
          )}
          <input
            accept={formatsPieces(capacitesFichiers)}
            className="visually-hidden-input"
            disabled={!accepteFichiers || modeleEnCours || paused || enCours}
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
            tabIndex={-1}
            type="file"
          />
          <DropdownMenu
            items={[
              ...(accepteFichiers
                ? [
                    {
                      id: "importer",
                      label: "Importer un fichier",
                      onSelect: () => inputFichier.current?.click(),
                    },
                    {
                      id: "bibliotheque",
                      label: "Choisir dans Mes fichiers",
                      onSelect: () => setBibliothequeOuverte(true),
                    },
                  ]
                : []),
              {
                id: "tache",
                label: "Planifier une tâche",
                onSelect: onSchedule,
              },
              {
                id: "source",
                label: sourceOpen
                  ? "Retirer le lien source"
                  : "Ajouter un lien source",
                onSelect: () => {
                  if (sourceOpen) setSource("");
                  setSourceOpen(!sourceOpen);
                },
              },
            ]}
            label="Ajouter au message"
            trigger={
              <Button
                aria-label="Ajouter au message"
                className="icon-button"
                type="button"
                variant="ghost"
              >
                <PlusIcon size={19} />
              </Button>
            }
          />
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
              // Ensuite seulement le menu `@` : `Entrée` y INSÈRE une mention.
              // Inverser ces deux tests enverrait un message à moitié écrit
              // pendant que l'utilisateur choisissait une ligne.
              if (mentionsRef.current?.traiterCle(event)) {
                event.preventDefault();
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
                !draft.trim() ||
                !contextePret ||
                paused ||
                envoiEnCours ||
                modeleEnCours
              }
              type="submit"
              variant="solid"
            >
              <ArrowUpIcon size={19} />
            </Button>
          )}
        </div>
        <ComposerAides
          brouillon={draft}
          onChoisir={setDraft}
          textareaRef={textareaRef}
        />
        <ComposerMentions
          brouillon={draft}
          handleRef={mentionsRef}
          onChoisir={insererMention}
          textareaRef={textareaRef}
        />
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
