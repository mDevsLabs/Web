"use client";

import {
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FileTextIcon,
  ImageIcon,
  KeyIcon,
  Loader2Icon,
  MessageSquareIcon,
  MicIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  REWARD_LABELS,
  type RewardType,
  type UserFormDetail,
} from "@/lib/forms/types";
import { cn, fetcher } from "@/lib/utils";

const REWARD_ICONS: Record<RewardType, typeof MessageSquareIcon> = {
  api: KeyIcon,
  audio: MicIcon,
  images: ImageIcon,
  mai: MessageSquareIcon,
};

export function FormsTab() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data?: UserFormDetail[];
    success: boolean;
  }>("/api/forms", fetcher, {
    revalidateOnFocus: true,
  });

  const [selectedForm, setSelectedForm] = useState<UserFormDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [selectedReward, setSelectedReward] = useState<RewardType>("mai");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forms = data?.data || [];

  const handleStartForm = useCallback((form: UserFormDetail) => {
    setSelectedForm(form);
    setAnswers({});
    setSelectedReward("mai");
  }, []);

  const handleCancelForm = useCallback(() => {
    setSelectedForm(null);
    setAnswers({});
  }, []);

  const handleTextAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleSingleChoiceChange = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleMultiChoiceToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : [];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm || isSubmitting) return;

    // Vérifier les questions requises
    for (const q of selectedForm.questions) {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && !val.trim()) ||
          (Array.isArray(val) && val.length === 0)
        ) {
          toast.error(`Veuillez répondre à la question : « ${q.title} »`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${selectedForm.id}/submit`, {
        body: JSON.stringify({
          answers,
          rewardType: selectedReward,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          resData.error?.message ||
            resData.message ||
            "Échec de l'envoi de la réponse."
        );
      }

      toast.success(
        "Merci pour votre réponse ! Votre limite sélectionnée a été réinitialisée avec succès."
      );
      setSelectedForm(null);
      setAnswers({});
      await mutate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-6"
      data-app-update-blocked={
        isSubmitting || selectedForm ? "true" : undefined
      }
    >
      {/* En-tête de section */}
      <div className="surface-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <ClipboardListIcon className="size-5 text-primary" />
            Formulaires & Sondages
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Répondez à nos formulaires pour partager vos retours et obtenez en
            récompense la réinitialisation immédiate de la limite de votre
            choix.
          </p>
        </div>
      </div>

      {isLoading && !error && (
        <div className="surface-card flex items-center justify-center py-12 text-muted-foreground">
          <Loader2Icon className="mr-2 size-5 animate-spin" />
          Chargement des formulaires…
        </div>
      )}

      {error && (
        <div
          className="surface-card flex flex-wrap items-center justify-between gap-3 text-sm"
          role="alert"
        >
          <p className="text-destructive">
            Impossible de charger les formulaires pour le moment.
          </p>
          <Button
            disabled={isValidating}
            onClick={() => void mutate().catch(() => undefined)}
            size="sm"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !error && forms.length === 0 && !selectedForm && (
        <div className="surface-card flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileTextIcon className="size-10 stroke-1 opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">
            Aucun formulaire disponible actuellement
          </p>
          <p className="mt-1 text-sm max-w-md">
            Revenez régulièrement pour participer aux enquêtes et débloquer des
            remises à zéro de vos limites.
          </p>
        </div>
      )}

      {/* Vue formulaire sélectionné pour y répondre */}
      {selectedForm && (
        <div className="surface-card space-y-6">
          <div className="flex flex-col gap-2 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="chip text-xs mb-1.5 inline-flex items-center gap-1 font-medium">
                <SparklesIcon className="size-3 text-warning" />
                Formulaire en cours
              </span>
              <h3 className="text-xl font-semibold text-foreground">
                {selectedForm.name}
              </h3>
              {selectedForm.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedForm.description}
                </p>
              )}
            </div>
            <Button
              disabled={isSubmitting}
              onClick={handleCancelForm}
              size="sm"
              variant="outline"
            >
              Retour à la liste
            </Button>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Questions dynamiques */}
            <div className="space-y-6">
              {selectedForm.questions.map((question, index) => {
                const qValue = answers[question.id];

                return (
                  <fieldset
                    aria-labelledby={`form-question-label-${question.id}`}
                    className="surface-muted rounded-xl p-4 sm:p-5 space-y-3"
                    key={question.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label
                        className="text-sm font-semibold text-foreground"
                        htmlFor={
                          question.type === "text"
                            ? `form-question-${question.id}`
                            : undefined
                        }
                        id={`form-question-label-${question.id}`}
                      >
                        {index + 1}. {question.title}
                        {question.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </label>
                    </div>

                    {question.description && (
                      <p className="text-xs text-muted-foreground">
                        {question.description}
                      </p>
                    )}

                    {/* Type Texte */}
                    {question.type === "text" && (
                      <Textarea
                        className="field-input min-h-[90px]"
                        disabled={isSubmitting}
                        id={`form-question-${question.id}`}
                        onChange={(e) =>
                          handleTextAnswerChange(question.id, e.target.value)
                        }
                        placeholder="Votre réponse ici…"
                        required={question.required}
                        value={(qValue as string) || ""}
                      />
                    )}

                    {/* Type Choix unique */}
                    {question.type === "single_choice" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options?.map((option) => {
                          const isSelected = qValue === option;
                          return (
                            <button
                              aria-pressed={isSelected}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/10 font-medium text-foreground"
                                  : "border-border/60 bg-card/40 hover:bg-muted/50 text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                              key={option}
                              onClick={() =>
                                handleSingleChoiceChange(question.id, option)
                              }
                              type="button"
                            >
                              <div
                                className={cn(
                                  "size-4 rounded-full border flex items-center justify-center shrink-0",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {isSelected && (
                                  <div className="size-1.5 rounded-full bg-background" />
                                )}
                              </div>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Type Choix multiple */}
                    {question.type === "multi_choice" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options?.map((option) => {
                          const currentArr = Array.isArray(qValue)
                            ? (qValue as string[])
                            : [];
                          const isSelected = currentArr.includes(option);
                          return (
                            <button
                              aria-pressed={isSelected}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/10 font-medium text-foreground"
                                  : "border-border/60 bg-card/40 hover:bg-muted/50 text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                              key={option}
                              onClick={() =>
                                handleMultiChoiceToggle(question.id, option)
                              }
                              type="button"
                            >
                              <div
                                className={cn(
                                  "size-4 rounded border flex items-center justify-center shrink-0",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {isSelected && (
                                  <CheckCircle2Icon className="size-3.5" />
                                )}
                              </div>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Type Évaluation (Note 1 à 5) */}
                    {question.type === "rating" && (
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = Number(qValue) >= star;
                          return (
                            <button
                              aria-label={`Note de ${star} sur 5`}
                              aria-pressed={Number(qValue) === star}
                              className={cn(
                                "size-10 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center",
                                isSelected
                                  ? "border-warning bg-warning/15 text-warning font-bold scale-105"
                                  : "border-border/60 bg-card/50 text-muted-foreground hover:bg-muted/50"
                              )}
                              disabled={isSubmitting}
                              key={star}
                              onClick={() =>
                                handleRatingChange(question.id, star)
                              }
                              type="button"
                            >
                              {star}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>

            {/* Sélecteur de récompense */}
            <div className="surface-card border-border/80 p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Récompense offerte
                </span>
                <h4 className="text-base font-semibold text-foreground mt-0.5">
                  Choisissez la limite à réinitialiser immédiatement
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Dès validation de vos réponses, la limite sélectionnée
                  repartira instantanément à zéro pour vous permettre de
                  continuer à utiliser vos outils.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(REWARD_LABELS) as RewardType[]).map((type) => {
                  const info = REWARD_LABELS[type];
                  const Icon = REWARD_ICONS[type];
                  const isSelected = selectedReward === type;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground shadow-sm"
                          : "border-border/60 bg-card/50 hover:bg-muted/40 text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                      key={type}
                      onClick={() => setSelectedReward(type)}
                      type="button"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">
                            {info.title}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-semibold text-primary">
                            Sélectionné
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col-reverse items-stretch justify-end gap-3 pt-2 sm:flex-row sm:items-center">
              <Button
                disabled={isSubmitting}
                onClick={handleCancelForm}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                Envoyer et réinitialiser ma limite
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des formulaires disponibles */}
      {!selectedForm && forms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <div
              className={cn(
                "surface-card flex flex-col justify-between transition-all hover:border-border",
                form.hasSubmitted && "opacity-80"
              )}
              key={form.id}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="chip text-[11px] font-medium flex items-center gap-1">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    {form.endDate
                      ? `Jusqu'au ${new Date(form.endDate).toLocaleDateString("fr-FR")}`
                      : "Permanent"}
                  </span>
                  {form.hasSubmitted ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                      <CheckCircle2Icon className="size-3" />
                      Répondu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      Disponible
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {form.name}
                  </h3>
                  {form.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {form.description}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{form.questions.length} question(s)</span>
                  <span>•</span>
                  <span className="text-warning font-medium">
                    Récompense : Réinitialisation au choix
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-border/40 pt-4 flex items-center justify-between">
                {form.hasSubmitted ? (
                  <div className="text-xs text-muted-foreground">
                    {form.submittedReward && (
                      <span>
                        Limite réinitialisée :{" "}
                        <strong>
                          {REWARD_LABELS[form.submittedReward]?.title ||
                            form.submittedReward}
                        </strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => handleStartForm(form)}
                    size="sm"
                  >
                    Répondre au formulaire
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
