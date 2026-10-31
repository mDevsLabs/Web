"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { cn, fetcher } from "@/lib/utils";

type Intention = "encourage" | "explain" | "summary";

type Erreur = {
  answeredAt: string;
  chapterTitle: string;
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
  passedCount: number;
  streakCount: number;
  xp: number;
};

type Bulle = {
  role: "assistant" | "user";
  text: string;
};

const ACTIONS = [
  { id: "explain", label: "Expliquer mon erreur" },
  { id: "summary", label: "Résumer mes apprentissages" },
  { id: "encourage", label: "M'encourager" },
] as const;

// Même plafond que `COACH_SUIVI_MAX` : le serveur refuse au-delà.
const SUIVI_MAX = 6;

export function CoachQuizzly({
  questionId,
  quizId,
}: {
  questionId: string | null;
  quizId: string | null;
}) {
  const resume = useResumeQuizzly();
  const { data, error, isLoading } = useSWR<CoachDonnees>(
    "/api/quizzly/coach",
    fetcher
  );
  const [intention, setIntention] = useState<Intention | null>(
    quizId && questionId ? "explain" : null
  );
  const [cible, setCible] = useState<{
    questionId: string;
    quizId: string;
  } | null>(quizId && questionId ? { questionId, quizId } : null);
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [courant, setCourant] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [modeleEnCours, setModeleEnCours] = useState(false);
  const abandon = useRef<AbortController | null>(null);
  const dejaLance = useRef(false);

  const demander = useCallback(
    async (params: {
      intent: Intention;
      messages: Bulle[];
      questionId?: string;
      quizId?: string;
      remplacer: boolean;
    }) => {
      abandon.current?.abort();
      const controle = new AbortController();
      abandon.current = controle;
      setIntention(params.intent);
      setMessage(null);
      setEnCours(true);
      setCourant("");
      if (params.remplacer) {
        setBulles([]);
        setCible(
          params.quizId && params.questionId
            ? { questionId: params.questionId, quizId: params.quizId }
            : null
        );
      }
      try {
        const reponse = await fetch("/api/quizzly/coach", {
          body: JSON.stringify({
            intent: params.intent,
            messages: params.messages,
            questionId: params.questionId,
            quizId: params.quizId,
          }),
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
        setBulles((precedent) =>
          params.remplacer
            ? [{ role: "assistant", text: texte }]
            : [...precedent, { role: "assistant", text: texte }]
        );
        setCourant(null);
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
    []
  );

  useEffect(
    () => () => {
      abandon.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (dejaLance.current || !data || !quizId || !questionId) {
      return;
    }
    dejaLance.current = true;
    const trouve = data.misses.some(
      (erreur) => erreur.quizId === quizId && erreur.questionId === questionId
    );
    if (!trouve) {
      setIntention("explain");
      setMessage(
        "Cette question n'est pas une erreur de ta dernière tentative."
      );
      return;
    }
    void demander({
      intent: "explain",
      messages: [],
      questionId,
      quizId,
      remplacer: true,
    });
  }, [data, demander, questionId, quizId]);

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
    } catch (raison) {
      setMessage(
        raison instanceof Error ? raison.message : "Enregistrement refusé."
      );
    } finally {
      setModeleEnCours(false);
    }
  }

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Chargement du coach…</p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-destructive">
        Le coach n'a pas pu être chargé.
      </p>
    );
  }

  const suiviPlein = bulles.length >= SUIVI_MAX;

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Coach</h1>
        <p className="text-sm text-muted-foreground">
          mAI t'aide à comprendre une erreur, à faire le bilan, et à continuer.
        </p>
      </div>

      <div className="surface-card flex flex-col gap-2">
        <p className="text-xs font-semibold">Modèle</p>
        <ModelSelectorCompact
          allowEmpty
          disabled={modeleEnCours}
          emptyLabel="Modèle du compte"
          fallbackToFirst={false}
          onModelChange={(modelId) => {
            void choisirModele(modelId);
          }}
          selectedModelId={resume.data?.modelId ?? data.modelId ?? ""}
          variant="block"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            className="chip"
            data-active={intention === action.id ? "true" : "false"}
            disabled={enCours}
            key={action.id}
            onClick={() => {
              if (action.id === "explain") {
                abandon.current?.abort();
                setIntention("explain");
                setBulles([]);
                setCourant(null);
                setCible(null);
                setEnCours(false);
                setMessage(null);
                return;
              }
              void demander({
                intent: action.id,
                messages: [],
                remplacer: true,
              });
            }}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>

      {intention === "explain" ? (
        data.misses.length === 0 ? (
          <p className="surface-muted px-3 py-2 text-sm text-muted-foreground">
            Fais un quiz pour que je puisse revenir sur tes erreurs.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.misses.map((erreur) => {
              const actif =
                cible?.quizId === erreur.quizId &&
                cible.questionId === erreur.questionId;
              return (
                <li key={`${erreur.quizId}:${erreur.questionId}`}>
                  <button
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl border px-3 py-2 text-left",
                      actif ? "border-foreground" : "border-border"
                    )}
                    disabled={enCours}
                    onClick={() => {
                      void demander({
                        intent: "explain",
                        messages: [],
                        questionId: erreur.questionId,
                        quizId: erreur.quizId,
                        remplacer: true,
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
                    {erreur.givenOptions.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Ton choix : {erreur.givenOptions.join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Pas de réponse
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {bulles.length > 0 || courant !== null ? (
        <div
          aria-live="polite"
          className="surface-card flex flex-col gap-3 text-sm"
        >
          {bulles.map((bulle, index) => (
            <p
              className={
                bulle.role === "user" ? "text-muted-foreground" : undefined
              }
              key={`${bulle.role}-${index}`}
            >
              {bulle.text}
            </p>
          ))}
          {courant === null ? null : (
            <p>{courant.trim() ? courant : "Le coach réfléchit…"}</p>
          )}
        </div>
      ) : null}

      {bulles.some((bulle) => bulle.role === "assistant") && !suiviPlein ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(evenement) => {
            evenement.preventDefault();
            const text = brouillon.trim();
            if (!text || enCours || !intention) {
              return;
            }
            const messages: Bulle[] = [
              ...bulles.map((bulle) =>
                bulle.role === "assistant"
                  ? { ...bulle, text: bulle.text.slice(0, 8000) }
                  : bulle
              ),
              { role: "user", text },
            ];
            setBrouillon("");
            setBulles(messages);
            void demander({
              intent: intention,
              messages,
              questionId: cible?.questionId,
              quizId: cible?.quizId,
              remplacer: false,
            });
          }}
        >
          <label
            className="text-xs font-semibold"
            htmlFor="quizzly-coach-suivi"
          >
            Demander une précision
          </label>
          <input
            className="field-input"
            disabled={enCours}
            id="quizzly-coach-suivi"
            maxLength={2000}
            onChange={(evenement) => setBrouillon(evenement.target.value)}
            value={brouillon}
          />
          <button
            className="chip w-fit"
            data-active="true"
            disabled={enCours || brouillon.trim().length === 0}
            type="submit"
          >
            Envoyer
          </button>
        </form>
      ) : null}

      {suiviPlein ? (
        <p className="text-xs text-muted-foreground">
          Cet échange est complet. Relance une action pour un nouveau bilan.
        </p>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}
