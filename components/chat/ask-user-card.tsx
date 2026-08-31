"use client";

import { CheckCircle2Icon, HelpCircleIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveChat } from "@/hooks/use-active-chat";
import { cn } from "@/lib/utils";

interface AskUserCardProps {
  args?: {
    description?: string;
    questions?: Array<{
      allowCustomInput?: boolean;
      id: string;
      options: string[];
      question: string;
      required?: boolean;
      type: "single_choice" | "multiple_choice" | "text";
    }>;
    title?: string;
  };
  output?: {
    answers?: Record<string, string | string[]>;
    status?: string;
  };
  state: "input-available" | "output-available" | "loading" | string;
  toolCallId: string;
}

export function AskUserCard({
  args,
  output,
  state,
  toolCallId,
}: AskUserCardProps) {
  const { addToolOutput } = useActiveChat();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [isSubmittedLocally, setIsSubmittedLocally] = useState(false);

  const questions = args?.questions || [];
  const title = args?.title || "Précisions nécessaires";
  const description = args?.description;

  const isCompleted =
    state === "output-available" ||
    Boolean(output?.answers) ||
    isSubmittedLocally;

  const displayAnswers = output?.answers || answers;

  const handleSingleSelect = (questionId: string, option: string) => {
    if (isCompleted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleMultipleSelect = (questionId: string, option: string) => {
    if (isCompleted) return;
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return {
        ...prev,
        [questionId]: updated,
      };
    });
  };

  const handleCustomInputChange = (questionId: string, value: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    // Vérifier si les questions requises ont une réponse
    for (const q of questions) {
      if (q.required !== false) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          toast.error(`Veuillez répondre à la question : "${q.question}"`);
          return;
        }
      }
    }

    setIsSubmittedLocally(true);

    try {
      (addToolOutput as any)({
        output: {
          answers,
          submittedAt: new Date().toISOString(),
        },
        state: "output-available",
        tool: "askUser",
        toolCallId,
      });
      toast.success("Vos réponses ont été transmises à l'IA !");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi des réponses");
      setIsSubmittedLocally(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-primary/20 bg-card/90 shadow-sm backdrop-blur-xs transition">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircleIcon className="size-4" />
          </span>
          <div>
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-5 p-4 sm:p-5">
        {questions.map((q, idx) => {
          const currentAns = displayAnswers[q.id];
          const isMultiple = q.type === "multiple_choice";

          return (
            <div
              className="space-y-2.5 rounded-xl border border-border/40 bg-background/50 p-3.5"
              key={q.id || idx}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-xs text-foreground sm:text-sm">
                  {idx + 1}. {q.question}
                </span>
                {q.required !== false && !isCompleted && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                    Requis
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isSelected = isMultiple
                    ? Array.isArray(currentAns) && currentAns.includes(opt)
                    : currentAns === opt;

                  return (
                    <button
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition",
                        isSelected
                          ? "border-primary bg-primary/10 font-medium text-primary shadow-2xs"
                          : "border-border/60 bg-card text-muted-foreground hover:bg-muted/60",
                        isCompleted && "cursor-default opacity-90"
                      )}
                      disabled={isCompleted}
                      key={opt}
                      onClick={() =>
                        isMultiple
                          ? handleMultipleSelect(q.id, opt)
                          : handleSingleSelect(q.id, opt)
                      }
                      type="button"
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <CheckCircle2Icon className="size-3.5 text-primary shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Champ libre si allowCustomInput */}
              {q.allowCustomInput && !isCompleted && (
                <div className="pt-1">
                  <Input
                    className="h-8 text-xs"
                    onChange={(e) =>
                      handleCustomInputChange(q.id, e.target.value)
                    }
                    placeholder="Autre (saisie libre)..."
                    value={customInputs[q.id] || ""}
                  />
                </div>
              )}

              {/* Affichage de la réponse en mode complété si champ libre */}
              {isCompleted &&
                typeof currentAns === "string" &&
                !q.options.includes(currentAns) && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary font-medium">
                    Réponse personnalisée : {currentAns}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Footer / Bouton de soumission */}
      {!isCompleted ? (
        <div className="border-t border-border/40 bg-muted/20 px-4 py-3 text-right sm:px-5">
          <Button
            className="gap-2 shadow-xs"
            onClick={handleSubmit}
            size="sm"
          >
            <SendIcon className="size-3.5" />
            <span>Valider et envoyer mes réponses</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2Icon className="size-3.5" />
            <span>Réponses transmises à l'assistant</span>
          </div>
        </div>
      )}
    </div>
  );
}