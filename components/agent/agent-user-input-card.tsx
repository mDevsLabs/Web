"use client";

import {
  CheckCircle2Icon,
  HelpCircleIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AskUserQuestion,
  askUserQuestionSchema,
  type UserInputAnswerValue,
} from "@/lib/agent/contracts";
import { cn } from "@/lib/utils";

// Carte de clarification Agent : le modèle produit un questionnaire STRUCTURÉ,
// le serveur le valide et le persiste, l'utilisateur répond quand il veut (la
// question survit à un refresh), puis la réponse est réinjectée dans le MÊME
// run. Cette carte ne décide de rien : elle affiche le contrat reçu, collecte
// une saisie typée et délègue l'enregistrement au serveur. Elle reste utilisable
// au clavier et avec un lecteur d'écran (fieldset/legend, focus natif, erreurs
// annoncées), et se relit sur mobile.

const answersSchema = z.array(
  z.object({ questionId: z.string(), value: z.unknown() })
);

// Sortie de l'outil telle qu'elle arrive au client : contrat de succès
// (données de la question persistée) ou d'échec. Aucun champ n'est supposé
// présent : une sortie inattendue n'affiche rien plutôt qu'une carte fausse.
const agentUserInputOutputSchema = z.object({
  answers: answersSchema.optional(),
  data: z
    .object({
      answers: answersSchema.optional(),
      context: z.string().nullable().optional(),
      expiresAt: z.string().optional(),
      questions: z.array(askUserQuestionSchema),
      requestId: z.string().min(1),
      revision: z.number().int().min(0),
      runId: z.string().optional(),
      status: z.string().optional(),
      title: z.string(),
    })
    .optional(),
  success: z.boolean().optional(),
});

export type AgentUserInputSubmit = (params: {
  answers: { questionId: string; value: UserInputAnswerValue }[];
  requestId: string;
  revision: number;
  runId?: string;
  toolCallId: string;
}) => Promise<{ message?: string; ok: boolean }>;

type PendingQuestion = {
  context: string | null;
  expiresAt: string | null;
  questions: AskUserQuestion[];
  requestId: string;
  revision: number;
  runId?: string;
  title: string;
};

function readPending(output: unknown): PendingQuestion | null {
  const parsed = agentUserInputOutputSchema.safeParse(output);
  if (!parsed.success || !parsed.data.data) {
    return null;
  }
  const data = parsed.data.data;
  return {
    context: data.context ?? null,
    expiresAt: data.expiresAt ?? null,
    questions: data.questions,
    requestId: data.requestId,
    revision: data.revision,
    ...(data.runId === undefined ? {} : { runId: data.runId }),
    title: data.title,
  };
}

function readAnswers(
  output: unknown
): { questionId: string; value: unknown }[] | null {
  const parsed = agentUserInputOutputSchema.safeParse(output);
  if (!parsed.success) return null;
  return parsed.data.answers ?? parsed.data.data?.answers ?? null;
}

function inputQuestions(input: unknown): AskUserQuestion[] {
  const candidate = (input as { questions?: unknown } | null)?.questions;
  const parsed = z.array(askUserQuestionSchema).safeParse(candidate);
  return parsed.success ? parsed.data : [];
}

function isBlank(value: UserInputAnswerValue | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  return Array.isArray(value) && value.length === 0;
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  return String(value);
}

function defaultFor(
  question: AskUserQuestion
): UserInputAnswerValue | undefined {
  if (question.defaultValue !== undefined) {
    return question.defaultValue;
  }
  if (question.type === "slider") {
    return (question.min ?? 0) + (question.max ?? 100) / 2;
  }
}

export function AgentUserInputCard({
  input,
  onSubmit,
  output,
  toolCallId,
}: {
  input?: unknown;
  onSubmit?: AgentUserInputSubmit;
  output?: unknown;
  toolCallId: string;
}) {
  const pending = useMemo(() => readPending(output), [output]);
  const submittedAnswers = useMemo(() => readAnswers(output), [output]);
  const questions = pending?.questions ?? inputQuestions(input);

  const [answers, setAnswers] = useState<
    Record<string, UserInputAnswerValue | undefined>
  >(() => {
    const initial: Record<string, UserInputAnswerValue | undefined> = {};
    for (const question of questions) {
      const value = defaultFor(question);
      if (value !== undefined) {
        initial[question.id] = value;
      }
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (questions.length === 0) {
    return null;
  }

  const isAnswered = submittedAnswers !== null || isSubmitted;
  const isExpired = pending?.expiresAt
    ? Date.parse(pending.expiresAt) <= Date.now()
    : false;
  const title = pending?.title ?? "Précisions nécessaires";
  const answeredById = new Map(
    (submittedAnswers ?? []).map((answer) => [answer.questionId, answer.value])
  );

  const setAnswer = (questionId: string, value: UserInputAnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => {
      if (!current[questionId]) {
        return current;
      }
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || isAnswered || isExpired || !pending || !onSubmit) {
      return;
    }
    const missing: Record<string, string> = {};
    for (const question of questions) {
      if (question.required && isBlank(answers[question.id])) {
        missing[question.id] = "Cette question est obligatoire.";
      }
    }
    setErrors(missing);
    setFailure(null);
    if (Object.keys(missing).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const payload = questions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => ({
        questionId: question.id,
        value: answers[question.id] as UserInputAnswerValue,
      }));

    const result = await onSubmit({
      answers: payload,
      requestId: pending.requestId,
      revision: pending.revision,
      ...(pending.runId === undefined ? {} : { runId: pending.runId }),
      toolCallId,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setFailure(
        result.message ??
          "Votre réponse n'a pas pu être enregistrée. Réessayez."
      );
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <section
      aria-labelledby={`agent-question-title-${toolCallId}`}
      className="w-[min(100%,520px)] overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-xs"
    >
      <div className="flex items-start gap-2.5 border-b border-primary/20 bg-primary/5 px-4 py-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <HelpCircleIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3
            className="font-semibold text-foreground text-sm"
            id={`agent-question-title-${toolCallId}`}
          >
            {title}
          </h3>
          {pending?.context ? (
            <p className="mt-0.5 text-muted-foreground text-xs">
              {pending.context}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-3.5">
        {questions.map((question) => {
          const questionError = errors[question.id];
          const helpId = `agent-q-${toolCallId}-${question.id}-help`;
          const errorId = `agent-q-${toolCallId}-${question.id}-error`;
          const describedBy =
            [question.help ? helpId : null, questionError ? errorId : null]
              .filter(Boolean)
              .join(" ") || undefined;
          const answeredValue = answeredById.get(question.id);
          const currentValue =
            answeredValue === undefined ? answers[question.id] : answeredValue;
          const isDisabled =
            isAnswered || isExpired || isSubmitting || !onSubmit;

          return (
            <fieldset
              className="space-y-2 border-0 p-0"
              disabled={isDisabled}
              key={question.id}
            >
              <legend className="text-foreground text-sm">
                {question.question}
                {question.required ? (
                  <span className="ml-1 text-destructive" title="Obligatoire">
                    *<span className="sr-only"> (obligatoire)</span>
                  </span>
                ) : (
                  <span className="ml-1 text-muted-foreground text-xs">
                    (facultatif)
                  </span>
                )}
              </legend>
              {question.help ? (
                <p className="text-muted-foreground text-xs" id={helpId}>
                  {question.help}
                </p>
              ) : null}

              {(question.type === "single_choice" ||
                question.type === "boolean") && (
                <div className="space-y-1.5">
                  {(question.type === "boolean"
                    ? ["Oui", "Non"]
                    : (question.options ?? [])
                  ).map((option) => {
                    const value =
                      question.type === "boolean" ? option === "Oui" : option;
                    const isChecked =
                      question.type === "boolean"
                        ? currentValue === (option === "Oui")
                        : currentValue === option;
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 text-sm hover:bg-muted/40"
                        key={option}
                      >
                        <input
                          aria-describedby={describedBy}
                          aria-invalid={questionError ? true : undefined}
                          checked={isChecked}
                          className="size-4 accent-primary"
                          name={`agent-q-${toolCallId}-${question.id}`}
                          onChange={() => setAnswer(question.id, value)}
                          type="radio"
                          value={option}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                  {question.type === "single_choice" &&
                  question.allowCustomInput ? (
                    <Input
                      aria-describedby={describedBy}
                      aria-label={`Autre réponse pour : ${question.question}`}
                      onChange={(event) =>
                        setAnswer(question.id, event.target.value)
                      }
                      placeholder="Autre réponse…"
                      value={
                        typeof currentValue === "string" &&
                        !(question.options ?? []).includes(currentValue)
                          ? currentValue
                          : ""
                      }
                    />
                  ) : null}
                </div>
              )}

              {question.type === "multiple_choice" && (
                <div className="space-y-1.5">
                  {(question.options ?? []).map((option) => {
                    const selected = Array.isArray(currentValue)
                      ? currentValue.includes(option)
                      : false;
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 text-sm hover:bg-muted/40"
                        key={option}
                      >
                        <input
                          aria-describedby={describedBy}
                          aria-invalid={questionError ? true : undefined}
                          checked={selected}
                          className="size-4 accent-primary"
                          onChange={() => {
                            const current = Array.isArray(currentValue)
                              ? currentValue
                              : [];
                            setAnswer(
                              question.id,
                              selected
                                ? current.filter((item) => item !== option)
                                : [...current, option]
                            );
                          }}
                          type="checkbox"
                          value={option}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === "text" && (
                <Input
                  aria-describedby={describedBy}
                  aria-invalid={questionError ? true : undefined}
                  aria-label={question.question}
                  disabled={isDisabled}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                  value={typeof currentValue === "string" ? currentValue : ""}
                />
              )}

              {question.type === "date" && (
                <Input
                  aria-describedby={describedBy}
                  aria-invalid={questionError ? true : undefined}
                  aria-label={question.question}
                  disabled={isDisabled}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                  type="date"
                  value={typeof currentValue === "string" ? currentValue : ""}
                />
              )}

              {question.type === "slider" && (
                <div className="space-y-1">
                  <input
                    aria-describedby={describedBy}
                    aria-valuetext={`${String(currentValue ?? question.min ?? 0)}`}
                    className="w-full accent-primary"
                    disabled={isDisabled}
                    max={question.max ?? 100}
                    min={question.min ?? 0}
                    onChange={(event) =>
                      setAnswer(question.id, Number(event.target.value))
                    }
                    step={question.step ?? 1}
                    type="range"
                    value={Number(currentValue ?? question.min ?? 0)}
                  />
                  <output
                    className="block text-right text-muted-foreground text-xs"
                    htmlFor={`agent-q-${toolCallId}-${question.id}`}
                  >
                    {String(currentValue ?? question.min ?? 0)}
                  </output>
                </div>
              )}

              {questionError ? (
                <p
                  className="text-destructive text-xs"
                  id={errorId}
                  role="alert"
                >
                  {questionError}
                </p>
              ) : null}
              {answeredValue === undefined ? null : (
                <p className="text-muted-foreground text-xs">
                  Réponse transmise : {displayValue(answeredValue)}
                </p>
              )}
            </fieldset>
          );
        })}

        {failure ? (
          <p
            className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs"
            role="alert"
          >
            <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>{failure}</span>
          </p>
        ) : null}

        {isExpired && !isAnswered ? (
          <p className="text-muted-foreground text-xs" role="status">
            Cette question a expiré. Relancez la tâche dans la conversation pour
            qu'Agent vous la repose.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-2.5">
        <p aria-live="polite" className="text-muted-foreground text-xs">
          {isAnswered
            ? "Réponses transmises à Agent."
            : isExpired
              ? "Question expirée"
              : "Agent reprendra après votre réponse."}
        </p>
        {isAnswered ? (
          <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
            <CheckCircle2Icon className="size-3.5" />
            Envoyé
          </span>
        ) : (
          <Button
            aria-disabled={isExpired || !onSubmit}
            className={cn(
              "gap-1.5",
              isExpired && "pointer-events-none opacity-50"
            )}
            disabled={isSubmitting || isExpired || !onSubmit}
            onClick={handleSubmit}
            size="sm"
            type="button"
          >
            <SendIcon className="size-3.5" />
            {isSubmitting ? "Envoi…" : "Envoyer"}
          </Button>
        )}
      </div>
    </section>
  );
}
