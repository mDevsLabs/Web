"use client";

import {
  BlocksIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  ClockIcon,
  CloudIcon,
  Loader2Icon,
  MessagesSquareIcon,
  RepeatIcon,
  SparklesIcon,
  WandSparklesIcon,
  WrenchIcon,
  XCircleIcon,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CHAT_MODEL, FALLBACK_MODELS } from "@/lib/ai/models";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { Agent, ScheduledMessage } from "@/lib/db/schema";
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

interface ScheduleDialogProps {
  agents: Agent[];
  initialData?: ScheduledMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleDialog({
  agents,
  initialData,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleDialogProps) {
  const [title, setTitle] = useState("Envoi planifié");
  const [prompt, setPrompt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
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
      const d = new Date(initialData.scheduledAt);
      // format to datetime-local (YYYY-MM-DDTHH:mm)
      const pad = (n: number) => n.toString().padStart(2, "0");
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setScheduledAt(localIso);
      setSelectedAgentId(initialData.agentId ?? null);
      setSelectedModel(initialData.modelId || DEFAULT_CHAT_MODEL);
      setCreateMode((initialData.createMode as any) || "new_chat");
      setSelectedChatId(initialData.chatId || "");
      setRecurrence((initialData.recurrence as any) || "none");
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
      const pad = (n: number) => n.toString().padStart(2, "0");
      const localIso = `${inOneHour.getFullYear()}-${pad(inOneHour.getMonth() + 1)}-${pad(inOneHour.getDate())}T${pad(inOneHour.getHours())}:${pad(inOneHour.getMinutes())}`;
      setScheduledAt(localIso);
      setSelectedAgentId(null);
      setSelectedModel(DEFAULT_CHAT_MODEL);
      setCreateMode("new_chat");
      setSelectedChatId("");
      setRecurrence("none");
      setTimezone(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris"
      );
      setDayOfMonth(new Date(Date.now() + 60 * 60 * 1000).getDate());
      setMonthlyPolicy("clamp");
      setToolMode(DEFAULT_SCHEDULE_TOOL_MODE);
      setCloudFileUrls([]);
      setCustomInstructions("");
    }
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
    const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setScheduledAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Veuillez saisir le message à envoyer.");
      return;
    }
    if (!scheduledAt) {
      toast.error("Veuillez définir une date et heure d'exécution.");
      return;
    }
    if (createMode === "existing_chat" && !selectedChatId) {
      toast.error("Veuillez sélectionner la discussion à continuer.");
      return;
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

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="size-4" />
            </span>
            <DialogTitle>
              {initialData
                ? "Modifier la planification"
                : "Nouvelle planification"}
            </DialogTitle>
          </div>
          <DialogDescription>
            Définissez la date, l'heure et les paramètres de votre message
            automatique à l'IA.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Titre du rappel
            </Label>
            <Input
              className="mt-1"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Veille IA du matin"
              value={title}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">
                Date & Heure d'exécution
              </Label>
              <div className="flex items-center gap-1">
                <button
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => setPresetTime(60)}
                  type="button"
                >
                  +1h
                </button>
                <button
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => setPresetTime(60 * 12)}
                  type="button"
                >
                  +12h
                </button>
                <button
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => setPresetTime(60 * 24)}
                  type="button"
                >
                  Demain
                </button>
              </div>
            </div>
            <Input
              className="mt-1 font-mono text-sm"
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              type="datetime-local"
              value={scheduledAt}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Message / Prompt à envoyer à l'IA
            </Label>
            <Textarea
              className="mt-1 min-h-[90px] text-sm"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Que voulez-vous demander à l'IA à cette date ?"
              required
              value={prompt}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Agent associé (optionnel)
              </Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                Modèle de langage
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

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Mode de discussion
            </Label>
            <div className="mt-1 flex gap-2">
              <button
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-left text-xs transition cursor-pointer",
                  createMode === "new_chat"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                )}
                onClick={() => setCreateMode("new_chat")}
                type="button"
              >
                <div className="font-semibold">Nouvelle discussion</div>
                <div className="text-[11px] opacity-80">
                  Crée une discussion dédiée pour cette exécution
                </div>
              </button>
              <button
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-left text-xs transition cursor-pointer",
                  createMode === "existing_chat"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                )}
                onClick={() => setCreateMode("existing_chat")}
                type="button"
              >
                <div className="font-semibold">Continuer un fil existant</div>
                <div className="text-[11px] opacity-80">
                  Ajoute les réponses dans la discussion sélectionnée
                </div>
              </button>
            </div>
            {createMode === "existing_chat" && (
              <div className="mt-2">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
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
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition cursor-pointer",
                    recurrence === r.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted/50"
                  )}
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
                  Le message sera réexécuté automatiquement{" "}
                  {recurrence === "daily"
                    ? "chaque jour"
                    : recurrence === "weekly"
                      ? "chaque semaine"
                      : "chaque mois"}{" "}
                  à la même heure, et une notification vous informera à chaque
                  exécution.
                </p>

                {/* Fuseau IANA explicite + réglages mensuels */}
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Fuseau horaire
                    </Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium transition cursor-pointer",
                            monthlyPolicy === p.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:bg-muted/50"
                          )}
                          key={p.id}
                          onClick={() => setMonthlyPolicy(p.id)}
                          type="button"
                        >
                          <div>{p.label}</div>
                          <div className="text-[10px] opacity-75">{p.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aperçu des dix prochaines exécutions */}
                {upcoming.length > 0 && (
                  <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3">
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
                            {at.toISOString().slice(0, 16).replace("T", " ")}{" "}
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

          {/* Section Fichiers Cloud / Bibliothèque */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <CloudIcon className="size-3.5" />
                Fichiers de la bibliothèque (optionnel)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {cloudFileUrls.length}/10
              </span>
            </div>
            <Button
              className="w-full h-8 text-[12px] border border-dashed border-border/60 bg-muted/40 hover:bg-muted/70 text-muted-foreground cursor-pointer"
              disabled={cloudFileUrls.length >= 10}
              onClick={() => setIsCloudPickerOpen(true)}
              type="button"
              variant="ghost"
            >
              <CloudIcon className="size-3.5 mr-1.5" />
              Depuis la bibliothèque
            </Button>
            {cloudFileUrls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {cloudFileUrls.map((url, i) => (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] border border-border/40 max-w-[240px]"
                    key={i}
                  >
                    <CloudIcon className="size-2.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {cloudFileNames[url] || url.split("/").pop() || url}
                    </span>
                    <button
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
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
                      "flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition cursor-pointer",
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

          <DialogFooter className="pt-2">
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
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
          </DialogFooter>
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
