"use client";

import {
  FileTextIcon,
  GraduationCapIcon,
  HeartIcon,
  LightbulbIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PinIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
} from "@mdevs/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CoachIntent } from "@/lib/quizzly/coach";
import {
  COACH_CONVERSATIONS_URL,
  COACH_DONNEES_URL,
  ENTETE_CONVERSATION_COACH,
} from "@/lib/quizzly/coach-paths";
import {
  markdownConversation,
  markdownMessage,
  nomFichierCoach,
  partagerTexte,
  telechargerMarkdown,
} from "@/lib/quizzly/coach-share";
import { playClickSound, playCorrectSound } from "@/lib/quizzly/sound-effects";
import { cn, fetcher } from "@/lib/utils";

type Intention = CoachIntent;

type Erreur = {
  givenOptions: string[];
  question: string;
  questionId: string;
  quizId: string;
  quizTitle: string;
  subjectLabel: string;
};

type CoachDonnees = {
  misses: Erreur[];
  modelId: string | null;
};

type ConversationListe = {
  id: string;
  intent: string;
  pinned: boolean;
  title: string;
  updatedAt: string;
};

type MessageFil = {
  createdAt: string;
  id: string;
  pinned: boolean;
  role: "assistant" | "user";
  text: string;
};

type Fil = {
  conversation: ConversationListe;
  messages: MessageFil[];
};

const MESSAGES_MAX = 80;

function MenuActions({
  epingle,
  onEpingler,
  onExporter,
  onPartager,
  onRenommer,
}: {
  epingle: boolean;
  onEpingler: () => void;
  onExporter: () => void;
  onPartager: () => void;
  onRenommer: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Actions de la conversation"
        className="rounded-lg p-1 text-muted-foreground hover:bg-q-level/10 hover:text-foreground transition-colors"
        type="button"
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onRenommer}>Renommer</DropdownMenuItem>
        <DropdownMenuItem onSelect={onEpingler}>
          {epingle ? "Désépingler" : "Épingler"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExporter}>Exporter</DropdownMenuItem>
        <DropdownMenuItem onSelect={onPartager}>Partager</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuMessageEleve({
  onCopier,
  onModifier,
}: {
  onCopier: () => void;
  onModifier: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Actions du message"
        className="self-end rounded-lg p-1 text-muted-foreground hover:bg-q-level/10 hover:text-foreground transition-colors"
        type="button"
      >
        <MoreHorizontalIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onCopier}>Copier</DropdownMenuItem>
        <DropdownMenuItem onSelect={onModifier}>Modifier</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuMessageIa({
  onCopier,
  onExporter,
  onModifier,
  onPartager,
}: {
  onCopier: () => void;
  onExporter: () => void;
  onModifier: () => void;
  onPartager: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Actions du message"
        className="self-start rounded-lg p-1 text-muted-foreground hover:bg-q-level/10 hover:text-foreground transition-colors"
        type="button"
      >
        <MoreHorizontalIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={onCopier}>Copier</DropdownMenuItem>
        <DropdownMenuItem onSelect={onPartager}>Partager</DropdownMenuItem>
        <DropdownMenuItem onSelect={onModifier}>Modifier</DropdownMenuItem>
        <DropdownMenuItem onSelect={onExporter}>Exporter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CoachQuizzly({
  conversationId,
  questionId,
  quizId,
  sheetId,
  sheetSubject,
  sheetTitle,
}: {
  conversationId: string | null;
  questionId: string | null;
  quizId: string | null;
  sheetId?: string | null;
  sheetSubject?: string | null;
  sheetTitle?: string | null;
}) {
  const router = useRouter();
  const resume = useResumeQuizzly();
  const donnees = useSWR<CoachDonnees>(COACH_DONNEES_URL, fetcher);
  const liste = useSWR<{ conversations: ConversationListe[] }>(
    COACH_CONVERSATIONS_URL,
    fetcher
  );
  const fil = useSWR<Fil>(
    conversationId ? `${COACH_CONVERSATIONS_URL}/${conversationId}` : null,
    fetcher
  );
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [montrerErreurs, setMontrerErreurs] = useState(
    Boolean(quizId && questionId)
  );
  const [brouillon, setBrouillon] = useState("");
  const [courant, setCourant] = useState<string | null>(null);
  const [epilogue, setEpilogue] = useState<{
    conversationId: string;
    text: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [modeleEnCours, setModeleEnCours] = useState(false);
  const [renommage, setRenommage] = useState<{
    id: string;
    kind: "conversation" | "message";
    text: string;
  } | null>(null);
  const abandon = useRef<AbortController | null>(null);
  const bas = useRef<HTMLDivElement | null>(null);

  const demander = useCallback(
    async (params: {
      conversationId?: string;
      intent?: Intention;
      questionId?: string;
      quizId?: string;
      sheetId?: string;
      sheetTitle?: string;
      text?: string;
    }) => {
      playClickSound();
      abandon.current?.abort();
      const controle = new AbortController();
      abandon.current = controle;
      setMessage(null);
      setEnCours(true);
      setCourant("");
      setEpilogue(null);
      try {
        const corpsRequete = {
          ...params,
          sheetId: params.sheetId ?? sheetId ?? undefined,
          sheetTitle: params.sheetTitle ?? sheetTitle ?? undefined,
        };
        const reponse = await fetch(COACH_DONNEES_URL, {
          body: JSON.stringify(corpsRequete),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controle.signal,
        });
        if (!reponse.ok) {
          const corps = (await reponse.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(corps?.message || "Le coach n'a pas pu répondre.");
        }
        const identifiant = reponse.headers.get(ENTETE_CONVERSATION_COACH);
        const reader = reponse.body?.getReader();
        if (!reader) {
          throw new Error("Réponse vide.");
        }
        const decoder = new TextDecoder();
        let accum = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done || controle.signal.aborted) {
            break;
          }
          accum += decoder.decode(value, { stream: true });
          setCourant(accum);
        }
        if (controle.signal.aborted) {
          return;
        }
        accum += decoder.decode();
        const texte = accum.trim();
        if (!texte) {
          throw new Error("Le coach n'a pas répondu. Réessaie.");
        }
        setCourant(null);
        setEpilogue({
          conversationId: identifiant ?? params.conversationId ?? "",
          text: texte,
        });
        playCorrectSound();
        if (identifiant && identifiant !== params.conversationId) {
          router.replace(
            `/quizzly/coach?conversation=${encodeURIComponent(identifiant)}`,
            { scroll: false }
          );
        }
        await Promise.all([liste.mutate(), fil.mutate()]);
        window.setTimeout(() => {
          void fil.mutate();
          void liste.mutate();
        }, 400);
      } catch (raison) {
        if (raison instanceof DOMException && raison.name === "AbortError") {
          return;
        }
        if (controle.signal.aborted) {
          return;
        }
        setCourant(null);
        setMessage(
          raison instanceof Error
            ? raison.message
            : "Le coach n'a pas pu répondre."
        );
      } finally {
        if (abandon.current === controle) {
          setEnCours(false);
        }
      }
    },
    [fil, liste, router, sheetId, sheetTitle]
  );

  useEffect(
    () => () => {
      abandon.current?.abort();
    },
    []
  );

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth" });
  }, [courant, epilogue, fil.data?.messages]);

  async function choisirModele(modelId: string | null) {
    setModeleEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/profil", {
        body: JSON.stringify({ modelId }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const charge = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(charge?.message || "Changement de modèle refusé.");
      }
      await resume.mutate();
      await donnees.mutate();
      toast.success("Modèle mis à jour.");
    } catch (raison) {
      setMessage(
        raison instanceof Error
          ? raison.message
          : "Changement de modèle refusé."
      );
    } finally {
      setModeleEnCours(false);
    }
  }

  async function patchConversation(
    id: string,
    corps: { pinned?: boolean; title?: string }
  ) {
    setMessage(null);
    const reponse = await fetch(`${COACH_CONVERSATIONS_URL}/${id}`, {
      body: JSON.stringify(corps),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const charge = (await reponse.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!reponse.ok) {
      setMessage(charge?.message || "Enregistrement refusé.");
      return;
    }
    setRenommage(null);
    await liste.mutate();
    if (conversationId === id) {
      await fil.mutate();
    }
  }

  async function patchMessage(id: string, corps: { text: string }) {
    if (!conversationId) {
      return;
    }
    setMessage(null);
    const reponse = await fetch(
      `${COACH_CONVERSATIONS_URL}/${conversationId}/messages/${id}`,
      {
        body: JSON.stringify(corps),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );
    const charge = (await reponse.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!reponse.ok) {
      setMessage(charge?.message || "Enregistrement refusé.");
      return;
    }
    setRenommage(null);
    await fil.mutate();
  }

  async function partager(titre: string, texte: string) {
    try {
      const resultat = await partagerTexte(titre, texte);
      if (resultat === "copie") {
        toast.success("Texte copié !");
      }
    } catch {
      setMessage("Le partage a échoué.");
    }
  }

  async function copierTexte(texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success("Message copié !");
    } catch {
      setMessage("Impossible de copier dans le presse-papier.");
    }
  }

  if (donnees.isLoading || liste.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
        <SparklesIcon className="size-8 text-q-level animate-spin" />
        <p className="text-sm">Chargement du coach…</p>
      </div>
    );
  }

  if (donnees.error || !donnees.data) {
    return (
      <p className="p-8 text-sm text-destructive text-center">
        Le coach n'a pas pu être chargé.
      </p>
    );
  }

  const conversations = liste.data?.conversations ?? [];
  const messages = fil.data?.messages ?? [];
  const titreActif =
    fil.data?.conversation.title ??
    conversations.find((entree) => entree.id === conversationId)?.title ??
    "Nouvelle conversation";
  const epingles = messages.filter((entree) => entree.pinned);
  const complet = messages.length >= MESSAGES_MAX;
  const epilogueVisible =
    epilogue &&
    (epilogue.conversationId === conversationId ||
      (!conversationId && epilogue.conversationId.length > 0))
      ? epilogue.text
      : null;
  const affiches = epilogueVisible
    ? [
        ...messages,
        {
          createdAt: "",
          id: "epilogue",
          pinned: false,
          role: "assistant" as const,
          text: epilogueVisible,
        },
      ]
    : messages;

  return (
    <section className="flex h-full min-h-0 flex-col md:flex-row bg-background">
      {/* Volet Historique gauche */}
      <aside
        className={cn(
          "flex max-h-72 shrink-0 flex-col gap-3 overflow-auto border-b border-q-border/30 bg-card/60 p-4 md:max-h-none md:w-72 md:border-r md:border-b-0",
          historiqueOuvert ? "flex" : "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">Historique</h2>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-q-level px-3 py-1.5 text-xs font-bold text-q-on shadow-sm transition-all hover:opacity-90 active:scale-95"
            onClick={() => {
              playClickSound();
              setMontrerErreurs(false);
              setMessage(null);
              router.replace("/quizzly/coach", { scroll: false });
            }}
            type="button"
          >
            <PlusIcon className="size-3.5 stroke-[2.5]" />
            Nouveau
          </button>
        </div>

        {conversations.length === 0 ? (
          <p className="py-4 text-xs text-muted-foreground text-center">
            Les conversations apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {conversations.map((conversation) => {
              const actif = conversation.id === conversationId;
              const edition =
                renommage?.kind === "conversation" &&
                renommage.id === conversation.id;
              return (
                <li
                  className={cn(
                    "group flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all",
                    actif
                      ? "border-q-level/60 bg-q-level/10 font-semibold text-foreground shadow-xs"
                      : "border-transparent text-muted-foreground hover:bg-q-level/5 hover:text-foreground"
                  )}
                  key={conversation.id}
                >
                  <MessageSquareIcon
                    className={cn(
                      "size-4 shrink-0",
                      actif ? "text-q-level" : "text-muted-foreground"
                    )}
                  />
                  {edition ? (
                    <form
                      className="flex min-w-0 flex-1 flex-col gap-1"
                      onSubmit={(evenement) => {
                        evenement.preventDefault();
                        void patchConversation(conversation.id, {
                          title: renommage.text,
                        });
                      }}
                    >
                      <input
                        className="field-input text-xs"
                        maxLength={80}
                        onChange={(evenement) =>
                          setRenommage({
                            id: conversation.id,
                            kind: "conversation",
                            text: evenement.target.value,
                          })
                        }
                        value={renommage.text}
                      />
                      <button
                        className="rounded-lg bg-q-level px-2 py-0.5 text-xs font-bold text-q-on"
                        type="submit"
                      >
                        Enregistrer
                      </button>
                    </form>
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left text-xs"
                      onClick={() => {
                        playClickSound();
                        setHistoriqueOuvert(false);
                        setMontrerErreurs(false);
                        router.replace(
                          `/quizzly/coach?conversation=${encodeURIComponent(conversation.id)}`,
                          { scroll: false }
                        );
                      }}
                      type="button"
                    >
                      {conversation.pinned ? (
                        <PinIcon className="mr-1 inline size-3 text-amber-500" />
                      ) : null}
                      {conversation.title}
                    </button>
                  )}
                  <MenuActions
                    epingle={conversation.pinned}
                    onEpingler={() => {
                      void patchConversation(conversation.id, {
                        pinned: !conversation.pinned,
                      });
                    }}
                    onExporter={() => {
                      void (async () => {
                        const charge = (await fetcher(
                          `${COACH_CONVERSATIONS_URL}/${conversation.id}`
                        )) as Fil;
                        telechargerMarkdown(
                          nomFichierCoach(charge.conversation.title),
                          markdownConversation(
                            charge.conversation.title,
                            charge.messages
                          )
                        );
                      })().catch(() => {
                        setMessage("L'export a échoué.");
                      });
                    }}
                    onPartager={() => {
                      void (async () => {
                        const charge = (await fetcher(
                          `${COACH_CONVERSATIONS_URL}/${conversation.id}`
                        )) as Fil;
                        await partager(
                          charge.conversation.title,
                          markdownConversation(
                            charge.conversation.title,
                            charge.messages
                          )
                        );
                      })();
                    }}
                    onRenommer={() =>
                      setRenommage({
                        id: conversation.id,
                        kind: "conversation",
                        text: conversation.title,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Zone de discussion principale */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-q-border/30 bg-card/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-q-border/30 px-2.5 py-1 text-xs font-semibold md:hidden"
              onClick={() => setHistoriqueOuvert((valeur) => !valeur)}
              type="button"
            >
              Historique
            </button>
            <h1 className="truncate text-base font-bold text-foreground">
              {titreActif}
            </h1>
          </div>
          <div className="w-full sm:w-64">
            <ModelSelectorCompact
              allowEmpty
              disabled={modeleEnCours}
              emptyLabel="Modèle du compte"
              fallbackToFirst={false}
              onModelChange={(modelId) => {
                void choisirModele(modelId);
              }}
              selectedModelId={
                resume.data?.modelId ?? donnees.data.modelId ?? ""
              }
              variant="block"
            />
          </div>
        </header>

        {/* Corps des messages ou Écran d'accueil du Coach */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6">
          {epingles.length > 0 ? (
            <div className="surface-muted flex flex-col gap-1 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs">
              {epingles.map((entree) => (
                <p className="truncate text-foreground font-medium" key={entree.id}>
                  <PinIcon className="mr-1.5 inline size-3 text-amber-500" />
                  {entree.text}
                </p>
              ))}
            </div>
          ) : null}

          {/* État d'accueil si conversation vide */}
          {affiches.length === 0 && courant === null ? (
            <div className="my-auto flex flex-col items-center justify-center py-6 text-center">
              {/* Mascotte Quizzy au centre */}
              <div className="relative mb-3 flex items-center justify-center">
                <Image
                  alt="Quizzy Mascotte"
                  className="size-32 object-contain drop-shadow-md select-none animate-bounce"
                  height={128}
                  priority
                  src="/quizzly/quizzy.png"
                  style={{ animationDuration: "3s" }}
                  width={128}
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">
                Écris une question, ou choisis une action.
              </h2>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Je connais ta classe, ta ligue, tes fiches et tes derniers quiz pour
                t'aider à progresser chaque jour !
              </p>

              {sheetTitle && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-q-level/30 bg-q-level/10 px-3 py-1 text-xs font-semibold text-q-level">
                  <GraduationCapIcon className="size-3.5" />
                  <span>Fiche active : {sheetTitle}</span>
                </div>
              )}

              {/* Boutons d'actions rapides (Image 4) */}
              <div className="mt-6 flex flex-wrap justify-center gap-2.5 max-w-lg">
                <button
                  className="surface-quizzly-card flex items-center gap-2 rounded-2xl border border-q-border/40 bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-q-level/60 hover:bg-q-level/5 active:scale-95"
                  onClick={() => {
                    setMontrerErreurs(true);
                  }}
                  type="button"
                >
                  <LightbulbIcon className="size-4 text-amber-500" />
                  <span>Expliquer mon erreur</span>
                </button>

                <button
                  className="surface-quizzly-card flex items-center gap-2 rounded-2xl border border-q-border/40 bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-q-level/60 hover:bg-q-level/5 active:scale-95"
                  onClick={() => {
                    setMontrerErreurs(false);
                    void demander({ intent: "summary" });
                  }}
                  type="button"
                >
                  <FileTextIcon className="size-4 text-q-level" />
                  <span>Résumer mes apprentissages</span>
                </button>

                <button
                  className="surface-quizzly-card flex items-center gap-2 rounded-2xl border border-q-border/40 bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-q-level/60 hover:bg-q-level/5 active:scale-95"
                  onClick={() => {
                    setMontrerErreurs(false);
                    void demander({ intent: "encourage" });
                  }}
                  type="button"
                >
                  <HeartIcon className="size-4 text-rose-500 fill-rose-500" />
                  <span>M'encourager</span>
                </button>

                {sheetTitle && (
                  <button
                    className="surface-quizzly-card flex items-center gap-2 rounded-2xl border border-q-level/40 bg-q-level/10 px-4 py-2.5 text-xs font-bold text-q-level shadow-xs transition-all hover:bg-q-level/20 active:scale-95"
                    onClick={() => {
                      setMontrerErreurs(false);
                      void demander({
                        intent: "chat",
                        sheetId: sheetId ?? undefined,
                        sheetTitle: sheetTitle ?? undefined,
                        text: `Peux-tu m'expliquer en détail les points essentiels de la fiche de révision "${sheetTitle}" et me poser 2 questions d'entraînement ?`,
                      });
                    }}
                    type="button"
                  >
                    <GraduationCapIcon className="size-4" />
                    <span>Réviser cette fiche</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Liste des bulles de messages */}
          {affiches.map((bulle) => {
            const edition =
              renommage?.kind === "message" && renommage.id === bulle.id;
            return (
              <div
                className={cn(
                  "flex",
                  bulle.role === "user" ? "justify-end" : "justify-start"
                )}
                key={bulle.id}
              >
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-2 rounded-3xl p-4 text-sm shadow-xs",
                    bulle.role === "user"
                      ? "bg-q-level text-q-on rounded-br-sm"
                      : "surface-quizzly-card border border-q-border/30 bg-card text-foreground rounded-bl-sm"
                  )}
                >
                  {edition ? (
                    <form
                      className="flex flex-col gap-2"
                      onSubmit={(evenement) => {
                        evenement.preventDefault();
                        void patchMessage(bulle.id, { text: renommage.text });
                      }}
                    >
                      <textarea
                        className="field-input min-h-20 text-foreground text-xs"
                        maxLength={bulle.role === "user" ? 2000 : 8000}
                        onChange={(evenement) =>
                          setRenommage({
                            id: bulle.id,
                            kind: "message",
                            text: evenement.target.value,
                          })
                        }
                        value={renommage.text}
                      />
                      <button
                        className="rounded-xl bg-card px-3 py-1 text-xs font-bold text-foreground"
                        type="submit"
                      >
                        Enregistrer
                      </button>
                    </form>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {bulle.text}
                    </p>
                  )}
                  {bulle.id === "epilogue" ? null : bulle.role === "user" ? (
                    <MenuMessageEleve
                      onCopier={() => {
                        void copierTexte(bulle.text);
                      }}
                      onModifier={() =>
                        setRenommage({
                          id: bulle.id,
                          kind: "message",
                          text: bulle.text,
                        })
                      }
                    />
                  ) : (
                    <MenuMessageIa
                      onCopier={() => {
                        void copierTexte(bulle.text);
                      }}
                      onExporter={() => {
                        telechargerMarkdown(
                          nomFichierCoach("coach"),
                          markdownMessage(bulle)
                        );
                      }}
                      onModifier={() =>
                        setRenommage({
                          id: bulle.id,
                          kind: "message",
                          text: bulle.text,
                        })
                      }
                      onPartager={() => {
                        void partager("Coach", bulle.text);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {courant === null ? null : (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-3xl rounded-bl-sm border border-q-border/30 bg-card p-4 text-sm text-foreground shadow-xs whitespace-pre-wrap">
                {courant.trim() ? (
                  courant
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <SparklesIcon className="size-4 animate-spin text-q-level" />
                    Le coach réfléchit…
                  </span>
                )}
              </div>
            </div>
          )}
          <div ref={bas} />
        </div>

        {/* Sélecteur d'erreurs si mode explain activé */}
        {montrerErreurs ? (
          <div className="border-t border-q-border/30 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">
                Choisis une question à analyser :
              </span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setMontrerErreurs(false)}
                type="button"
              >
                Fermer
              </button>
            </div>
            {donnees.data.misses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Fais un quiz pour que je puisse analyser tes erreurs.
              </p>
            ) : (
              <ul className="flex max-h-40 flex-col gap-2 overflow-auto">
                {donnees.data.misses.map((erreur) => (
                  <li key={`${erreur.quizId}:${erreur.questionId}`}>
                    <button
                      className="flex w-full flex-col gap-1 rounded-2xl border border-q-border/40 bg-card p-2.5 text-left transition-all hover:border-q-level/60 hover:bg-q-level/5"
                      disabled={enCours}
                      onClick={() => {
                        setMontrerErreurs(false);
                        void demander({
                          intent: "explain",
                          questionId: erreur.questionId,
                          quizId: erreur.quizId,
                        });
                      }}
                      type="button"
                    >
                      <span className="text-[10px] font-bold text-q-level">
                        {[erreur.subjectLabel, erreur.quizTitle]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {erreur.question}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Barre de saisie inférieure (Image 4) */}
        <form
          className="border-t border-q-border/30 bg-card/80 p-3 sm:p-4 backdrop-blur-md"
          onSubmit={(evenement) => {
            evenement.preventDefault();
            const text = brouillon.trim();
            if (!text || enCours || complet) {
              return;
            }
            setBrouillon("");
            void demander({
              conversationId: conversationId ?? undefined,
              intent: conversationId ? undefined : "chat",
              text,
            });
          }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-q-border/40 bg-background px-3 py-1.5 shadow-xs focus-within:border-q-level focus-within:ring-2 focus-within:ring-q-level/20">
            <button
              className="p-1.5 text-muted-foreground hover:text-q-level transition-colors shrink-0"
              onClick={() => {
                toast.info("Pièce jointe", {
                  description:
                    "Pour poser une question sur un cours, mentionne directement le sujet ou sélectionne une fiche de révision.",
                });
              }}
              title="Joindre un contexte"
              type="button"
            >
              <PaperclipIcon className="size-4" />
            </button>

            <textarea
              className="min-h-9 max-h-28 flex-1 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={enCours || complet}
              id="quizzly-coach-saisie"
              maxLength={2000}
              onChange={(evenement) => setBrouillon(evenement.target.value)}
              onKeyDown={(evenement) => {
                if (evenement.key === "Enter" && !evenement.shiftKey) {
                  evenement.preventDefault();
                  evenement.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Écris au Coach"
              rows={1}
              value={brouillon}
            />

            <button
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-all shrink-0",
                brouillon.trim().length > 0 && !enCours && !complet
                  ? "bg-q-level text-q-on hover:opacity-90 active:scale-95 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={enCours || complet || brouillon.trim().length === 0}
              type="submit"
            >
              <SendIcon className="size-3.5" />
              <span>Envoyer</span>
            </button>
          </div>

          {complet ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Cette conversation est complète. Ouvre-en une nouvelle.
            </p>
          ) : null}
          {message ? (
            <p className="mt-2 text-center text-xs text-destructive">{message}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
