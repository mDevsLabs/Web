"use client";

/**
 * ============================================================================
 * CRÉATION D'UNE PLANIFICATION — trois étapes, un aperçu permanent
 * ============================================================================
 *
 * POURQUOI UN ASSISTANT
 *
 * Le formulaire précédent présentait onze champs à la suite dans une colonne
 * défilante : titre, date, prompt, agent, modèle, mode de discussion,
 * répétition, fuseau, jour du mois, fichiers, outils, consignes. Rien n'y
 * indiquait par quoi commencer, et l'aperçu des prochaines exécutions — la
 * seule information qui permet de se relire — arrivait en bas.
 *
 * La création est donc découpée selon la seule question que se pose
 * réellement l'utilisateur, dans l'ordre :
 *
 *   1. QUOI  — ce que l'IA doit produire (titre, consigne, modèle, agent) ;
 *   2. QUAND — l'instant (langage naturel, date, répétition, aperçu) ;
 *   3. COMMENT — les options d'exécution (fil, fichiers, outils, consignes).
 *
 * L'APERÇU EST PERMANENT
 *
 * Une bande de synthèse reste visible sous les étapes : elle reformule en une
 * phrase ce qui va être créé. C'est ce qui manquait le plus — un formulaire
 * long ne se relit pas, il se soumet.
 *
 * CE QUI N'A PAS CHANGÉ
 *
 * Le contrat serveur est identique : mêmes champs, mêmes noms, même validation
 * (le serveur tranche). Les champs calendaires (`hour`, `minute`, `timezone`,
 * `dayOfMonth`, `monthlyPolicy`) continuent de n'être envoyés que pour une
 * récurrence — le serveur recalcule l'UTC depuis l'heure murale.
 */

import {
  BlocksIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleSlashIcon,
  ClockIcon,
  CloudIcon,
  Loader2Icon,
  MessagesSquareIcon,
  RepeatIcon,
  SparklesIcon,
  WandSparklesIcon,
  XIcon,
} from "@mdevs/icons";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CHAT_MODEL, FALLBACK_MODELS } from "@/lib/ai/models";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { Agent, ScheduledMessage } from "@/lib/db/schema";
import { parseNaturalDate } from "@/lib/planning/natural-date";
import {
  buildScheduleFromRecord,
  computeUpcomingOccurrences,
  formatInZone,
  listIANATimezones,
} from "@/lib/planning/recurrence";
import {
  DEFAULT_SCHEDULE_TOOL_MODE,
  deriveScheduleToolMode,
  SCHEDULE_TOOL_MODE_META,
  SCHEDULE_TOOL_MODES,
  type ScheduleToolMode,
} from "@/lib/planning/tool-mode";
import { cn, fetcher } from "@/lib/utils";

// Icône associée à chaque mode d'outils (cf. lib/planning/tool-mode).
const TOOL_MODE_ICONS = {
  auto: WandSparklesIcon,
  none: CircleSlashIcon,
  plugins: BlocksIcon,
} as const;

/** Les trois étapes de la création. L'ordre est celui des questions. */
const STEPS = [
  { id: "quoi", label: "Quoi" },
  { id: "quand", label: "Quand" },
  { id: "comment", label: "Options" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/**
 * Modèles de départ : ils remplissent le titre, la consigne et la répétition.
 * Ce sont des points de départ, pas des prescriptions — tout reste modifiable.
 */
const TEMPLATES: Array<{
  id: string;
  label: string;
  title: string;
  prompt: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  icon: typeof SparklesIcon;
}> = [
  {
    icon: SparklesIcon,
    id: "veille",
    label: "Veille du matin",
    prompt:
      "Génère un résumé complet des actualités technologiques et IA d'aujourd'hui, avec les sources.",
    recurrence: "daily",
    title: "Veille IA du matin",
  },
  {
    icon: MessagesSquareIcon,
    id: "recap",
    label: "Récap de projet",
    prompt:
      "Résume les décisions prises cette semaine et liste les prochaines étapes concrètes.",
    recurrence: "weekly",
    title: "Récap hebdomadaire du projet",
  },
  {
    icon: ClockIcon,
    id: "relance",
    label: "Relance d'une tâche",
    prompt:
      "Vérifie l'état de la tâche en cours et rappelle ce qu'il reste à faire.",
    recurrence: "none",
    title: "Relance de la tâche",
  },
  {
    icon: RepeatIcon,
    id: "bilan",
    label: "Bilan mensuel",
    prompt:
      "Dresse le bilan du mois : ce qui a été livré, ce qui a glissé, et ce qu'il faut ajuster.",
    recurrence: "monthly",
    title: "Bilan mensuel",
  },
];

interface ScheduleDialogProps {
  agents: Agent[];
  initialData?: ScheduledMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** « YYYY-MM-DDTHH:mm » en heure locale, format attendu par `datetime-local`. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleDialog({
  agents,
  initialData,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleDialogProps) {
  const [step, setStep] = useState<StepId>("quoi");
  const [title, setTitle] = useState("Envoi planifié");
  const [prompt, setPrompt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [naturalWhen, setNaturalWhen] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [createMode, setCreateMode] = useState<"new_chat" | "existing_chat">(
    "new_chat"
  );
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [recurrence, setRecurrence] = useState<
    "none" | "daily" | "weekly" | "monthly"
  >("none");
  // Récurrence calendaire (migration 0046) : fuseau IANA, heure/minute
  // murales, jour du mois et politique des mois courts. L'aperçu affiche les
  // dix prochaines exécutions, recalculées à chaque frappe (aucun aller-retour
  // réseau : le même moteur que l'exécuteur sert prévision et réalité).
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris"
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [monthlyPolicy, setMonthlyPolicy] = useState<
    "clamp" | "report" | "skip"
  >("clamp");
  const [toolMode, setToolMode] = useState<ScheduleToolMode>(
    DEFAULT_SCHEDULE_TOOL_MODE
  );
  const [cloudFileUrls, setCloudFileUrls] = useState<string[]>([]);
  const [cloudFileNames, setCloudFileNames] = useState<Record<string, string>>(
    {}
  );
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPrompt(initialData.prompt);
      setScheduledAt(toLocalInput(new Date(initialData.scheduledAt)));
      setSelectedAgentId(initialData.agentId ?? null);
      setSelectedModel(initialData.modelId || DEFAULT_CHAT_MODEL);
      setCreateMode((initialData.createMode as "new_chat") || "new_chat");
      setSelectedChatId(initialData.chatId || "");
      setRecurrence((initialData.recurrence as "none") || "none");
      setTimezone(
        (initialData as { timezone?: string | null }).timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "Europe/Paris"
      );
      setDayOfMonth(
        (initialData as { dayOfMonth?: number | null }).dayOfMonth || 1
      );
      setMonthlyPolicy(
        ((initialData as { monthlyPolicy?: string | null }).monthlyPolicy as
          | "clamp"
          | "report"
          | "skip") || "clamp"
      );
      setToolMode(
        deriveScheduleToolMode({
          enabledTools: initialData.enabledTools,
          storedMode: (initialData as { toolMode?: unknown }).toolMode,
        })
      );
      setCloudFileUrls((initialData.cloudFileUrls as string[]) || []);
      setCustomInstructions(initialData.customInstructions || "");
    } else {
      setTitle("Rapport matinal");
      setPrompt(
        "Génère un résumé complet des actualités technologiques et IA d'aujourd'hui."
      );
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
      setScheduledAt(toLocalInput(inOneHour));
      setSelectedAgentId(null);
      setSelectedModel(DEFAULT_CHAT_MODEL);
      setCreateMode("new_chat");
      setSelectedChatId("");
      setRecurrence("none");
      setTimezone(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris"
      );
      setDayOfMonth(inOneHour.getDate());
      setMonthlyPolicy("clamp");
      setToolMode(DEFAULT_SCHEDULE_TOOL_MODE);
      setCloudFileUrls([]);
      setCustomInstructions("");
    }
    // Une ouverture repart de la première question : arriver sur « Options »
    // sans avoir rien saisi désoriente plus qu'il n'aide.
    setStep("quoi");
    setNaturalWhen("");
  }, [initialData]);

  // Liste des discussions pour le mode "Continuer un fil existant"
  const { data: availableChats } = useSWR<
    { id: string; title: string; createdAt: string | Date }[]
  >(
    isOpen && createMode === "existing_chat" ? "/api/planning/chats" : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const natural = useMemo(
    () => (naturalWhen.trim() ? parseNaturalDate(naturalWhen) : null),
    [naturalWhen]
  );

  // Aperçu des dix prochaines exécutions : le même moteur que l'exécuteur
  // tourne côté client. Le point de départ est « maintenant » — l'aperçu
  // montre ce qui se passera réellement à l'enregistrement.
  const upcoming = useMemo(() => {
    if (recurrence === "none") return [];
    // L'heure murale de la première occurrence découle du datetime-local
    // choisi : on le projette dans le fuseau de la tâche.
    const chosen = scheduledAt ? new Date(scheduledAt) : new Date();
    const schedule = buildScheduleFromRecord(
      {
        dayOfMonth: recurrence === "monthly" ? dayOfMonth : null,
        hour: chosen.getHours(),
        minute: chosen.getMinutes(),
        monthlyPolicy,
        recurrence,
        timezone,
      },
      { scheduledAt: chosen }
    );
    try {
      return computeUpcomingOccurrences(schedule, new Date(), 10);
    } catch {
      return [];
    }
  }, [recurrence, scheduledAt, timezone, dayOfMonth, monthlyPolicy]);

  const availableTimezones = useMemo(() => listIANATimezones(), []);

  const setPresetTime = (minutesFromNow: number) => {
    setScheduledAt(
      toLocalInput(new Date(Date.now() + minutesFromNow * 60_000))
    );
    setNaturalWhen("");
  };

  /** Applique la saisie en langage naturel quand elle est comprise. */
  const applyNaturalWhen = (value: string) => {
    setNaturalWhen(value);
    const guess = value.trim() ? parseNaturalDate(value) : null;
    if (guess) {
      setScheduledAt(toLocalInput(guess.at));
    }
  };

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    setTitle(template.title);
    setPrompt(template.prompt);
    setRecurrence(template.recurrence);
    toast.success(`Modèle « ${template.label}» appliqué.`);
  };

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);

  /** Valide l'étape courante ; renvoie true si l'on peut avancer. */
  const validateStep = (id: StepId): boolean => {
    if (id === "quoi" && !prompt.trim()) {
      toast.error("Décrivez ce que l'IA doit produire.");
      return false;
    }
    if (id === "quand" && !scheduledAt) {
      toast.error("Choisissez une date et une heure.");
      return false;
    }
    if (id === "comment" && createMode === "existing_chat" && !selectedChatId) {
      // Le fil est choisi À CETTE ÉTAPE : la validation doit y rester, sinon
      // l'utilisateur est renvoyé sur « Quand» pour un champ qui n'y est pas.
      toast.error("Sélectionnez la discussion à continuer.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      return;
    }
    const next = STEPS[Math.min(STEPS.length - 1, stepIndex + 1)];
    setStep(next.id);
  };

  const goPrevious = () => {
    const previous = STEPS[Math.max(0, stepIndex - 1)];
    setStep(previous.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const entry of STEPS) {
      if (!validateStep(entry.id)) {
        setStep(entry.id);
        return;
      }
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate.getTime() <= Date.now() && !initialData) {
      toast.warning("L'heure programmée est déjà passée ou très proche.");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        agentId: selectedAgentId,
        cloudFileUrls,
        createMode,
        customInstructions: customInstructions.trim() || null,
        modelId: selectedModel,
        prompt: prompt.trim(),
        recurrence,
        scheduledAt: scheduledDate.toISOString(),
        title: title.trim() || "Envoi planifié",
        toolMode,
        // Champs calendaires envoyés pour toute récurrence : le serveur
        // recalcule l'UTC depuis l'heure murale et le fuseau.
        ...(recurrence === "none"
          ? {}
          : {
              hour: scheduledDate.getHours(),
              minute: scheduledDate.getMinutes(),
              timezone,
              ...(recurrence === "monthly"
                ? {
                    dayOfMonth,
                    monthlyPolicy,
                  }
                : {}),
            }),
        ...(createMode === "existing_chat" ? { chatId: selectedChatId } : {}),
      };

      const url = initialData
        ? `/api/planning/${initialData.id}`
        : "/api/planning";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          extractApiErrorMessage(data) || "Erreur lors de l'enregistrement"
        );
      }

      toast.success(
        initialData
          ? "Planification modifiée avec succès"
          : "Message planifié avec succès !"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const agentName =
    agents.find((agent) => agent.id === selectedAgentId)?.name ?? null;
  const recurrenceLabel =
    recurrence === "none"
      ? "une seule fois"
      : recurrence === "daily"
        ? "chaque jour"
        : recurrence === "weekly"
          ? "chaque semaine"
          : "chaque mois";

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="size-4" />
          </span>
          <div>
            <DialogTitle>
              {initialData
                ? "Modifier la planification"
                : "Nouvelle planification"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Trois questions : quoi, quand, et avec quels outils.
            </DialogDescription>
          </div>
        </div>

        {/* Fil des étapes — l'étape courante se reconnaît à `data-active`. */}
        <nav
          aria-label="Étapes de création"
          className="mt-4 flex items-center gap-1.5"
        >
          {STEPS.map((entry, index) => {
            const active = entry.id === step;
            const done = index < stepIndex;
            return (
              <button
                aria-current={active ? "step" : undefined}
                className={cn(
                  "chip flex-1 justify-center gap-2 py-1.5 text-xs",
                  done && "text-success"
                )}
                data-active={active ? "true" : undefined}
                key={entry.id}
                onClick={() => {
                  // Revenir en arrière est toujours permis ; avancer exige de
                  // valider ce qui précède.
                  if (index < stepIndex) {
                    setStep(entry.id);
                  } else if (index === stepIndex + 1 && validateStep(step)) {
                    setStep(entry.id);
                  }
                }}
                type="button"
              >
                <span className="font-mono text-[10px] opacity-70">
                  {done ? <CheckCircle2Icon className="size-3" /> : index + 1}
                </span>
                {entry.label}
              </button>
            );
          })}
        </nav>

        <form className="space-y-4 pt-3" onSubmit={handleSubmit}>
          {step === "quoi" && (
            <div className="space-y-4">
              {!initialData && (
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((template) => (
                    <button
                      className="chip gap-1.5"
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      type="button"
                    >
                      <template.icon className="size-3" />
                      {template.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Titre
                </Label>
                <Input
                  className="mt-1"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. : Veille IA du matin"
                  value={title}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Consigne envoyée à l'IA
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {prompt.trim().length} car.
                  </span>
                </div>
                <Textarea
                  className="mt-1 min-h-[110px] text-sm"
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Que voulez-vous demander à l'IA à cette date ?"
                  required
                  value={prompt}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Agent (optionnel)
                  </Label>
                  <select
                    className="field-input mt-1 text-sm"
                    onChange={(e) => {
                      const agId = e.target.value || null;
                      setSelectedAgentId(agId);
                      if (agId) {
                        const ag = agents.find((a) => a.id === agId);
                        if (ag?.defaultModelId) {
                          setSelectedModel(ag.defaultModelId);
                        }
                      }
                    }}
                    value={selectedAgentId || ""}
                  >
                    <option value="">Aucun (mAI Standard)</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Modèle
                  </Label>
                  <div className="mt-1">
                    <ModelSelectorCompact
                      fallbackModels={FALLBACK_MODELS}
                      modal
                      onModelChange={setSelectedModel}
                      placeholder="Modèle de langage"
                      selectedModelId={selectedModel}
                      source="chat"
                      variant="block"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "quand" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  En une phrase
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    className="font-mono text-sm"
                    onChange={(e) => applyNaturalWhen(e.target.value)}
                    placeholder="demain 9h · dans 2 heures · lundi prochain 8h"
                    value={naturalWhen}
                  />
                  <span
                    className={cn(
                      "shrink-0 text-[11px]",
                      natural ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {natural ? natural.label : "—"}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    { label: "Dans 1 h", minutes: 60 },
                    { label: "Ce soir", minutes: 60 * 8 },
                    { label: "Demain 8h", minutes: 60 * 18 },
                    { label: "Dans 3 jours", minutes: 60 * 24 * 3 },
                  ].map((preset) => (
                    <button
                      className="chip"
                      key={preset.label}
                      onClick={() => setPresetTime(preset.minutes)}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Date & heure d'exécution
                </Label>
                <Input
                  className="mt-1 font-mono text-sm"
                  onChange={(e) => {
                    setScheduledAt(e.target.value);
                    setNaturalWhen("");
                  }}
                  required
                  type="datetime-local"
                  value={scheduledAt}
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <RepeatIcon className="size-3.5" />
                  Répétition
                </Label>
                <div className="mt-1 grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: "none", label: "Une fois" },
                      { id: "daily", label: "Quotidien" },
                      { id: "weekly", label: "Hebdo" },
                      { id: "monthly", label: "Mensuel" },
                    ] as const
                  ).map((r) => (
                    <button
                      className="chip justify-center py-1.5"
                      data-active={recurrence === r.id ? "true" : undefined}
                      key={r.id}
                      onClick={() => setRecurrence(r.id)}
                      type="button"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {recurrence !== "none" && (
                  <>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Réexécution automatique {recurrenceLabel}, à la même heure
                      : une notification vous prévient à chaque fois.
                    </p>

                    {/* Fuseau IANA explicite + réglages mensuels */}
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Fuseau horaire
                        </Label>
                        <select
                          className="field-input mt-1 text-sm"
                          onChange={(e) => setTimezone(e.target.value)}
                          value={timezone}
                        >
                          {availableTimezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                      {recurrence === "monthly" && (
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Jour du mois (1–31)
                          </Label>
                          <Input
                            className="mt-1"
                            max={31}
                            min={1}
                            onChange={(e) => {
                              const v = Number.parseInt(e.target.value, 10);
                              if (!Number.isNaN(v)) {
                                setDayOfMonth(Math.min(31, Math.max(1, v)));
                              }
                            }}
                            type="number"
                            value={dayOfMonth}
                          />
                        </div>
                      )}
                    </div>
                    {recurrence === "monthly" && (
                      <div className="mt-2">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Si le jour n'existe pas (ex. 31 en février)
                        </Label>
                        <div className="mt-1 grid grid-cols-3 gap-1.5">
                          {(
                            [
                              {
                                hint: "31 janv. → 28 févr.",
                                id: "clamp",
                                label: "Dernier jour",
                              },
                              {
                                hint: "pas d'exécution en février",
                                id: "skip",
                                label: "Sauter",
                              },
                              {
                                hint: "31 janv. → 3 mars",
                                id: "report",
                                label: "Reporter",
                              },
                            ] as const
                          ).map((p) => (
                            <button
                              className="chip flex-col items-center gap-0.5 py-1.5 text-center"
                              data-active={
                                monthlyPolicy === p.id ? "true" : undefined
                              }
                              key={p.id}
                              onClick={() => setMonthlyPolicy(p.id)}
                              type="button"
                            >
                              <span>{p.label}</span>
                              <span className="text-[10px] opacity-75">
                                {p.hint}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aperçu des dix prochaines exécutions */}
                    {upcoming.length > 0 && (
                      <div className="surface-muted mt-3">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">
                            Dix prochaines exécutions
                          </span>
                        </div>
                        <ol className="mt-2 space-y-1">
                          {upcoming.map((at, i) => (
                            <li
                              className="flex items-baseline justify-between gap-2 text-[11px]"
                              key={at.toISOString()}
                            >
                              <span className="w-6 shrink-0 text-muted-foreground">
                                #{i + 1}
                              </span>
                              <span className="font-mono text-foreground">
                                {formatInZone(timezone, at)}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {at
                                  .toISOString()
                                  .slice(0, 16)
                                  .replace("T", " ")}{" "}
                                UTC
                              </span>
                            </li>
                          ))}
                        </ol>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">
                          Heures affichées dans le fuseau {timezone}, avec la
                          conversion UTC correspondante.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {step === "comment" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Destination
                </Label>
                <div className="mt-1 flex gap-2">
                  <button
                    className="chip flex-1 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left normal-case"
                    data-active={createMode === "new_chat" ? "true" : undefined}
                    onClick={() => setCreateMode("new_chat")}
                    type="button"
                  >
                    <span className="text-xs font-semibold">
                      Nouvelle discussion
                    </span>
                    <span className="text-[11px] opacity-80">
                      Une discussion dédiée par exécution
                    </span>
                  </button>
                  <button
                    className="chip flex-1 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left normal-case"
                    data-active={
                      createMode === "existing_chat" ? "true" : undefined
                    }
                    onClick={() => setCreateMode("existing_chat")}
                    type="button"
                  >
                    <span className="text-xs font-semibold">
                      Continuer un fil
                    </span>
                    <span className="text-[11px] opacity-80">
                      Les réponses s'ajoutent au fil choisi
                    </span>
                  </button>
                </div>
                {createMode === "existing_chat" && (
                  <div className="mt-2">
                    <select
                      className="field-input text-sm"
                      onChange={(e) => setSelectedChatId(e.target.value)}
                      required
                      value={selectedChatId}
                    >
                      <option value="">
                        {availableChats
                          ? "Sélectionnez une discussion..."
                          : "Chargement des discussions..."}
                      </option>
                      {(availableChats || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title || "Sans titre"}
                        </option>
                      ))}
                    </select>
                    {availableChats && availableChats.length === 0 && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MessagesSquareIcon className="size-3" />
                        Aucune discussion existante. Créez-en une d'abord ou
                        choisissez « Nouvelle discussion ».
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Outils disponibles pour l'exécution
                </Label>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                  {SCHEDULE_TOOL_MODES.map((mode) => {
                    const meta = SCHEDULE_TOOL_MODE_META[mode];
                    const Icon = TOOL_MODE_ICONS[mode];
                    const active = toolMode === mode;
                    return (
                      <button
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition",
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-background hover:bg-muted/50"
                        )}
                        key={mode}
                        onClick={() => setToolMode(mode)}
                        type="button"
                      >
                        <span className="flex w-full items-center gap-1.5">
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0",
                              active ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              active ? "text-primary" : "text-foreground"
                            )}
                          >
                            {meta.label}
                          </span>
                          {active && (
                            <CheckCircle2Icon className="ml-auto size-3.5 text-primary" />
                          )}
                        </span>
                        <span className="text-[11px] leading-snug text-muted-foreground">
                          {meta.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <CloudIcon className="size-3.5" />
                    Fichiers de la bibliothèque
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {cloudFileUrls.length}/10
                  </span>
                </div>
                <Button
                  className="mt-1 h-8 w-full border border-dashed border-border/60 bg-muted/40 text-[12px] text-muted-foreground hover:bg-muted/70"
                  disabled={cloudFileUrls.length >= 10}
                  onClick={() => setIsCloudPickerOpen(true)}
                  type="button"
                  variant="ghost"
                >
                  <CloudIcon className="mr-1.5 size-3.5" />
                  Depuis la bibliothèque
                </Button>
                {cloudFileUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {cloudFileUrls.map((url, i) => (
                      <span
                        className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-border/40 bg-muted px-2.5 py-1 text-[11px]"
                        key={url}
                      >
                        <CloudIcon className="size-2.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {cloudFileNames[url] || url.split("/").pop() || url}
                        </span>
                        <button
                          className="cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onClick={() => {
                            setCloudFileUrls((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            );
                            setCloudFileNames((prev) => {
                              const copy = { ...prev };
                              delete copy[url];
                              return copy;
                            });
                          }}
                          type="button"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Consignes personnalisées (optionnel)
                </Label>
                <Input
                  className="mt-1 text-sm"
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ex. : réponds en trois puces, sans préambule."
                  value={customInstructions}
                />
              </div>
            </div>
          )}

          {/* Bande de synthèse : ce qui va être créé, en une phrase. */}
          <div className="surface-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">
              {title.trim() || "Sans titre"}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {scheduledAt
                ? new Date(scheduledAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                  })
                : "date à définir"}
            </span>
            <span className="flex items-center gap-1">
              <RepeatIcon className="size-3" />
              {recurrenceLabel}
            </span>
            <span className="flex items-center gap-1">
              <SparklesIcon className="size-3" />
              {agentName ?? "mAI Standard"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              disabled={stepIndex === 0 || isSubmitting}
              onClick={goPrevious}
              type="button"
              variant="outline"
            >
              <ChevronLeftIcon className="mr-1 size-4" />
              Précédent
            </Button>

            <div className="flex items-center gap-2">
              <Button
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
                variant="ghost"
              >
                Annuler
              </Button>
              {step === "comment" ? (
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : initialData ? (
                    "Sauvegarder"
                  ) : (
                    "Planifier l'envoi"
                  )}
                </Button>
              ) : (
                <Button onClick={goNext} type="button">
                  Suivant
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Dialog cloud picker */}
        <CloudFilePickerDialog
          onOpenChange={setIsCloudPickerOpen}
          onSelectAttachments={(attachments) => {
            const toAdd = attachments.filter(
              (a) => !cloudFileUrls.includes(a.url)
            );
            const remaining = 10 - cloudFileUrls.length;
            const slice = toAdd.slice(0, remaining);
            if (slice.length > 0) {
              setCloudFileUrls((prev) => [...prev, ...slice.map((a) => a.url)]);
              setCloudFileNames((prev) => {
                const copy = { ...prev };
                for (const a of slice) {
                  copy[a.url] = a.name;
                }
                return copy;
              });
            }
          }}
          open={isCloudPickerOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
