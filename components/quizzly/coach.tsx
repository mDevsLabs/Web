"use client";

import { MoreHorizontalIcon, PinIcon } from "@mdevs/icons";
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
import { cn, fetcher } from "@/lib/utils";

type Intention = CoachIntent;

type Erreur = {
  question: string;
  questionId: string;
  quizId: string;
  quizTitle: string;
  subjectLabel: string;
  givenOptions: string[];
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

const ACTIONS = [
  { id: "explain", label: "Expliquer mon erreur" },
  { id: "summary", label: "Résumer mes apprentissages" },
  { id: "encourage", label: "M'encourager" },
] as const;

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
        className="chip px-2"
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
        className="chip self-end px-2 text-foreground"
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
        className="chip self-start px-2"
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
}: {
  conversationId: string | null;
  questionId: string | null;
  quizId: string | null;
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
  const dejaLance = useRef(false);
  const bas = useRef<HTMLDivElement | null>(null);

  const demander = useCallback(
    async (params: {
      conversationId?: string;
      intent?: Intention;
      questionId?: string;
      quizId?: string;
      text?: string;
    }) => {
      abandon.current?.abort();
      const controle = new AbortController();
      abandon.current = controle;
      setMessage(null);
      setEnCours(true);
      setCourant("");
      setEpilogue(null);
      try {
        const reponse = await fetch(COACH_DONNEES_URL, {
          body: JSON.stringify(params),
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
    [fil, liste, router]
  );

  useEffect(
    () => () => {
      abandon.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (dejaLance.current || !donnees.data || !quizId || !questionId) {
      return;
    }
    if (conversationId) {
      return;
    }
    dejaLance.current = true;
    const trouve = donnees.data.misses.some(
      (erreur) => erreur.quizId === quizId && erreur.questionId === questionId
    );
    if (!trouve) {
      setMontrerErreurs(true);
      setMessage(
        "Cette question n'est pas une erreur de ta dernière tentative."
      );
      return;
    }
    void demander({ intent: "explain", questionId, quizId });
  }, [conversationId, demander, donnees.data, questionId, quizId]);

  const defilement = `${fil.data?.messages.length ?? 0}:${courant ?? ""}:${epilogue?.text ?? ""}`;
  useEffect(() => {
    if (defilement.length === 0) {
      return;
    }
    bas.current?.scrollIntoView({ block: "end" });
  }, [defilement]);

  useEffect(() => {
    if (!epilogue || !fil.data) {
      return;
    }
    if (fil.data.conversation.id !== epilogue.conversationId) {
      return;
    }
    const trouve = fil.data.messages.some(
      (entree) => entree.role === "assistant" && entree.text === epilogue.text
    );
    if (trouve) {
      setEpilogue(null);
    }
  }, [epilogue, fil.data]);

  async function choisirModele(modelId: string) {
    setModeleEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/profil", {
        body: JSON.stringify({
          modelId: modelId.trim() ? modelId.trim() : null,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Enregistrement refusé.");
      }
      await resume.mutate();
      await donnees.mutate();
    } catch (raison) {
      setMessage(
        raison instanceof Error ? raison.message : "Enregistrement refusé."
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
    await Promise.all([liste.mutate(), fil.mutate()]);
  }

  async function patchMessage(
    id: string,
    corps: { pinned?: boolean; text?: string }
  ) {
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
      <p className="p-8 text-sm text-muted-foreground">Chargement du coach…</p>
    );
  }
  if (donnees.error || !donnees.data) {
    return (
      <p className="p-8 text-sm text-destructive">
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
    <section className="flex h-full min-h-0 flex-col md:flex-row">
      <aside
        className={cn(
          "flex max-h-72 shrink-0 flex-col gap-2 overflow-auto border-b border-border/60 p-3 md:max-h-none md:w-72 md:border-r md:border-b-0",
          historiqueOuvert ? "flex" : "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Historique</h2>
          <button
            className="chip"
            onClick={() => {
              setMontrerErreurs(false);
              setMessage(null);
              router.replace("/quizzly/coach", { scroll: false });
            }}
            type="button"
          >
            Nouveau
          </button>
        </div>
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Les conversations apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => {
              const actif = conversation.id === conversationId;
              const edition =
                renommage?.kind === "conversation" &&
                renommage.id === conversation.id;
              return (
                <li
                  className={cn(
                    "flex items-start gap-1 rounded-xl border px-2 py-1.5",
                    actif ? "border-foreground" : "border-transparent"
                  )}
                  key={conversation.id}
                >
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
                        className="field-input"
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
                        className="chip w-fit"
                        data-active="true"
                        type="submit"
                      >
                        Enregistrer
                      </button>
                    </form>
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left text-sm"
                      onClick={() => {
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
                        <PinIcon className="mr-1 inline size-3 text-warning" />
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-q-quest/30 bg-q-quest/10 px-4 py-3">
          <button
            className="chip md:hidden"
            onClick={() => setHistoriqueOuvert((valeur) => !valeur)}
            type="button"
          >
            Historique
          </button>
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-q-quest">
            {titreActif}
          </h1>
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
          {epingles.length > 0 ? (
            <div className="surface-muted flex flex-col gap-1 px-3 py-2 text-xs">
              {epingles.map((entree) => (
                <p className="truncate" key={entree.id}>
                  <PinIcon className="mr-1 inline size-3 text-warning" />
                  {entree.text}
                </p>
              ))}
            </div>
          ) : null}

          {affiches.length === 0 && courant === null ? (
            <p className="text-sm text-muted-foreground">
              Écris une question, ou choisis une action.
            </p>
          ) : null}

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
                    "flex max-w-[85%] flex-col gap-2 rounded-2xl px-3 py-2 text-sm",
                    bulle.role === "user"
                      ? "border border-border/60 bg-muted text-foreground"
                      : "border border-border/60 bg-card"
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
                        className="field-input min-h-20 text-foreground"
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
                        className="chip w-fit text-foreground"
                        data-active="true"
                        type="submit"
                      >
                        Enregistrer
                      </button>
                    </form>
                  ) : (
                    <p className="whitespace-pre-wrap">{bulle.text}</p>
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
              <p className="max-w-[85%] rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm whitespace-pre-wrap">
                {courant.trim() ? courant : "Le coach réfléchit…"}
              </p>
            </div>
          )}
          <div ref={bas} />
        </div>

        <form
          className="flex flex-col gap-2 border-t border-border/60 p-4"
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
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((action) => (
              <button
                className="chip"
                data-active={
                  action.id === "explain" && montrerErreurs ? "true" : "false"
                }
                disabled={enCours}
                key={action.id}
                onClick={() => {
                  if (action.id === "explain") {
                    setMontrerErreurs(true);
                    return;
                  }
                  setMontrerErreurs(false);
                  void demander({ intent: action.id });
                }}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
          {montrerErreurs ? (
            donnees.data.misses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Fais un quiz pour que je puisse revenir sur tes erreurs.
              </p>
            ) : (
              <ul className="flex max-h-40 flex-col gap-2 overflow-auto">
                {donnees.data.misses.map((erreur) => (
                  <li key={`${erreur.quizId}:${erreur.questionId}`}>
                    <button
                      className="flex w-full flex-col gap-1 rounded-xl border border-border px-3 py-2 text-left"
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
                      <span className="text-xs text-muted-foreground">
                        {[erreur.subjectLabel, erreur.quizTitle]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="text-sm">{erreur.question}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          <label className="sr-only" htmlFor="quizzly-coach-saisie">
            Message
          </label>
          <textarea
            className="field-input min-h-16"
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
            value={brouillon}
          />
          <button
            className="chip w-fit"
            data-active="true"
            disabled={enCours || complet || brouillon.trim().length === 0}
            type="submit"
          >
            Envoyer
          </button>
          {complet ? (
            <p className="text-xs text-muted-foreground">
              Cette conversation est complète. Ouvre-en une nouvelle.
            </p>
          ) : null}
          {message ? <p className="text-sm">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
