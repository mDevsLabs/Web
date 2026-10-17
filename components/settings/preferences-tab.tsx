"use client";

import {
  LanguagesIcon,
  Loader2Icon,
  SettingsIcon,
  SparklesIcon,
  StarIcon,
  Volume2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BotGlyph } from "@/components/agents/bot-avatar";
import {
  ModelSelectorCompact,
  type SharedModel,
} from "@/components/chat/model-selector-compact";
import {
  OptionSelector,
  type OptionSelectorItem,
} from "@/components/settings/option-selector";
import {
  ImageSizeOptionSelector,
  mapVoicesForModel,
  useVoicePresets,
  VoiceOptionSelector,
} from "@/components/settings/option-selectors";
import { Label } from "@/components/ui/label";
import { useFavoriteApp } from "@/hooks/use-favorite-app";
import { useSettings } from "@/hooks/use-settings";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import {
  REASONING_LEVEL_LABELS,
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import {
  APP_ORDER,
  type AppCatalogEntry,
  type AppKey,
} from "@/lib/apps/catalog";
import { APP_PRICING_URL } from "@/lib/constants";
import { type CreationMode, normalizeCreationMode } from "@/lib/creation/mode";
import {
  AUTO_DICTATION_LANGUAGE,
  DEFAULT_TRANSLATION_TARGET,
  DICTATION_LANGUAGES,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
  TRANSLATION_TARGETS,
} from "@/lib/i18n/languages";
import {
  customInstructionsCounterLabel,
  customInstructionsHint,
  formatCharCount,
} from "@/lib/plans/custom-instructions";
import {
  exceedsCustomInstructionsProductLimit,
  getCustomInstructionsEffectiveMax,
  getTierCustomInstructionsMax,
  getTierLimits,
} from "@/lib/plans/tier-limits";
import { cn, fetcher } from "@/lib/utils";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.split("=")[1]) : null;
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

const FAVORITE_APP_OPTIONS: OptionSelectorItem[] = APP_ORDER.map(
  (entry: AppCatalogEntry) => ({
    description: entry.description,
    id: entry.key,
    label: entry.label,
  })
);

export function PreferencesTab() {
  const { data: settingsData } = useSettings();
  const profile = settingsData?.user ?? null;
  const tierRaw = profile?.tier;

  const [defaultModelId, setDefaultModelId] =
    useState<string>(DEFAULT_CHAT_MODEL);
  const [defaultReasoningLevel, setDefaultReasoningLevel] =
    useState<ReasoningLevel>("medium");
  const [defaultChatVisibility, setDefaultChatVisibility] = useState<
    "private" | "public"
  >("private");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customTemp, setCustomTemp] = useState(0.7);
  const [customTopP, setCustomTopP] = useState(0.9);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Préférences Outils IA
  const [defaultCreationMode, setDefaultCreationMode] =
    useState<CreationMode>("image");
  const [defaultImageModel, setDefaultImageModel] = useState<string>(
    "black-forest-labs/flux-schnell"
  );
  const [defaultImageSize, setDefaultImageSize] = useState<string>("1024x1024");
  const [defaultAudioModel, setDefaultAudioModel] = useState<string>(
    "deepgram/flux-tts:free"
  );
  const [defaultAudioVoice, setDefaultAudioVoice] = useState<string>("");
  const [defaultAudioSpeed, setDefaultAudioSpeed] = useState<number>(1.0);
  const [isSavingToolsPref, setIsSavingToolsPref] = useState<boolean>(false);

  const [defaultAgentId, setDefaultAgentId] = useState<string>("none");
  const { favorite: favoriteApp, setFavorite: setFavoriteApp } =
    useFavoriteApp();
  const [isSavingDefaultAgent, setIsSavingDefaultAgent] = useState(false);
  const [showAgentChatIcons, setShowAgentChatIcons] = useState<boolean>(true);
  const [isSavingAgentIconsPref, setIsSavingAgentIconsPref] = useState(false);
  const [dictationLanguage, setDictationLanguage] = useState(
    AUTO_DICTATION_LANGUAGE
  );
  const [translationLanguage, setTranslationLanguage] = useState(
    DEFAULT_TRANSLATION_TARGET
  );
  const [isSavingLanguages, setIsSavingLanguages] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState<"truncate" | "fork">(
    "truncate"
  );

  const { data: prefModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    fetcher,
    { dedupingInterval: 60_000 }
  );
  const prefModels: ChatModel[] = prefModelsData?.models || [];

  const { data: imageModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models/images`,
    fetcher,
    { dedupingInterval: 60_000 }
  );
  const imageModels: SharedModel[] =
    imageModelsData?.data || imageModelsData?.models || [];

  const { data: audioModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models/speech`,
    fetcher,
    { dedupingInterval: 60_000 }
  );
  const audioModels: SharedModel[] =
    audioModelsData?.data || audioModelsData?.models || [];

  const voicePresets = useVoicePresets();
  const audioModelVoices = useMemo(
    () =>
      mapVoicesForModel(
        defaultAudioModel
          ? audioModels.find((m) => m.id === defaultAudioModel)?.voices
          : undefined,
        voicePresets
      ),
    [audioModels, defaultAudioModel, voicePresets]
  );

  useEffect(() => {
    if (audioModelVoices.length === 0) {
      if (defaultAudioVoice) setDefaultAudioVoice("");
      return;
    }
    if (!audioModelVoices.some((v) => v.id === defaultAudioVoice)) {
      setDefaultAudioVoice(audioModelVoices[0].id);
    }
  }, [audioModelVoices, defaultAudioVoice]);

  const { data: customPrefData, mutate: mutateCustomPref } = useSWR(
    "/api/user/preferences",
    fetcher,
    { dedupingInterval: 30_000 }
  );

  const { data: notifPrefsData, mutate: mutateNotifPrefs } = useSWR(
    "/api/notifications/preferences",
    fetcher,
    { dedupingInterval: 10_000 }
  );

  const customInstructionsMax = getCustomInstructionsEffectiveMax(tierRaw);
  const customInstructionsOverLimit = exceedsCustomInstructionsProductLimit(
    tierRaw,
    customInstructions.length
  );

  useEffect(() => {
    const cModel = getCookie("chat-model");
    if (cModel) setDefaultModelId(cModel);
  }, []);

  useEffect(() => {
    if (notifPrefsData) {
      if (
        notifPrefsData.regenerateMode === "truncate" ||
        notifPrefsData.regenerateMode === "fork"
      ) {
        setRegenerateMode(notifPrefsData.regenerateMode);
      }
    }
  }, [notifPrefsData]);

  useEffect(() => {
    if (customPrefData) {
      if (customPrefData.customInstructions !== undefined) {
        setCustomInstructions(customPrefData.customInstructions || "");
      }
      if (customPrefData.defaultChatVisibility === "public") {
        setDefaultChatVisibility("public");
      }
      if (customPrefData.defaultChatModel && !getCookie("chat-model")) {
        setDefaultModelId(customPrefData.defaultChatModel);
      }
      if (customPrefData.reasoningLevel) {
        setDefaultReasoningLevel(
          customPrefData.reasoningLevel as ReasoningLevel
        );
      }
      if (customPrefData.defaultAgentId !== undefined) {
        setDefaultAgentId(customPrefData.defaultAgentId || "none");
      }
      if (typeof customPrefData.showAgentChatIcons === "boolean") {
        setShowAgentChatIcons(customPrefData.showAgentChatIcons);
      }
      if (customPrefData.enabled !== undefined) {
        setCustomEnabled(!!customPrefData.enabled);
      }
      if (customPrefData.temperature !== undefined) {
        setCustomTemp(customPrefData.temperature);
      }
      if (customPrefData.topP !== undefined) {
        setCustomTopP(customPrefData.topP);
      }
      setDefaultCreationMode(
        normalizeCreationMode(customPrefData.defaultCreationMode)
      );
      if (customPrefData.defaultImageModel) {
        setDefaultImageModel(customPrefData.defaultImageModel);
      }
      if (customPrefData.defaultImageSize) {
        setDefaultImageSize(customPrefData.defaultImageSize);
      }
      if (customPrefData.defaultAudioModel) {
        setDefaultAudioModel(customPrefData.defaultAudioModel);
      }
      if (customPrefData.defaultAudioVoice) {
        setDefaultAudioVoice(customPrefData.defaultAudioVoice);
      }
      if (customPrefData.defaultAudioSpeed) {
        setDefaultAudioSpeed(customPrefData.defaultAudioSpeed);
      }
      if (customPrefData.defaultDictationLanguage !== undefined) {
        setDictationLanguage(
          normalizeDictationLanguage(customPrefData.defaultDictationLanguage)
        );
      }
      if (customPrefData.defaultTranslationLanguage !== undefined) {
        setTranslationLanguage(
          normalizeTranslationTarget(
            customPrefData.defaultTranslationLanguage
          ) ?? DEFAULT_TRANSLATION_TARGET
        );
      }
    }
  }, [customPrefData]);

  const handleSavePreferences = useCallback(async () => {
    setCookie("chat-model", defaultModelId);
    try {
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultChatModel: defaultModelId,
          defaultChatVisibility,
          reasoningLevel: defaultReasoningLevel,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde des préférences IA.");
      return;
    }
    toast.success("Préférences IA enregistrées !");
  }, [
    defaultModelId,
    defaultChatVisibility,
    defaultReasoningLevel,
    mutateCustomPref,
  ]);

  const handleSaveToolsPreferences = useCallback(async () => {
    setIsSavingToolsPref(true);
    try {
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultAudioModel,
          defaultAudioSpeed,
          defaultAudioVoice,
          defaultCreationMode,
          defaultImageModel,
          defaultImageSize,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      toast.success("Préférences d'outils Images & Audio enregistrées !");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde des préférences outils.");
    } finally {
      setIsSavingToolsPref(false);
    }
  }, [
    defaultImageModel,
    defaultCreationMode,
    defaultImageSize,
    defaultAudioModel,
    defaultAudioVoice,
    defaultAudioSpeed,
    mutateCustomPref,
  ]);

  const handleSaveLanguages = useCallback(async () => {
    setIsSavingLanguages(true);
    try {
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultDictationLanguage: dictationLanguage,
          defaultTranslationLanguage: translationLanguage,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      toast.success("Langues enregistrées !");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde des langues.");
    } finally {
      setIsSavingLanguages(false);
    }
  }, [dictationLanguage, translationLanguage, mutateCustomPref]);

  const handleSaveCustomInstructions = useCallback(async () => {
    setIsSavingCustom(true);
    try {
      const payloadText = customInstructions.slice(0, customInstructionsMax);
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          customInstructions: payloadText,
          enabled: customEnabled,
          temperature: customTemp,
          topP: customTopP,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiErrorMessage(data) || "Erreur");
      if (payloadText.length === customInstructions.length) {
        toast.success("Instructions personnalisées enregistrées !");
      } else {
        setCustomInstructions(payloadText);
        toast.warning("Texte tronqué", {
          description: `Conservé ${formatCharCount(payloadText.length)} caractères sur ${formatCharCount(customInstructions.length)}.`,
        });
      }
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSavingCustom(false);
    }
  }, [
    customInstructions,
    customInstructionsMax,
    customEnabled,
    customTemp,
    customTopP,
    mutateCustomPref,
  ]);

  const handleSaveRegenerateMode = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        body: JSON.stringify({ regenerateMode }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur sauvegarde mode régénération");
      toast.success("Mode régénération enregistré !");
      mutateNotifPrefs();
    } catch {
      toast.error("Erreur sauvegarde mode régénération");
    }
  }, [regenerateMode, mutateNotifPrefs]);

  return (
    <div className="py-6 flex flex-col gap-6 max-w-4xl">
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-defaults"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <SparklesIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Préférences IA
            </h3>
            <p className="text-xs text-muted-foreground">
              Modèle par défaut (enregistré dans votre compte) et réglages
              généraux.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Modèle par défaut
          </Label>
          <ModelSelectorCompact
            capabilities={prefModelsData?.capabilities}
            models={prefModels.length > 0 ? prefModels : undefined}
            onModelChange={setDefaultModelId}
            selectedModelId={defaultModelId}
            variant="block"
          />
          <span className="text-[11px] text-muted-foreground">
            Ce modèle sera pré-sélectionné pour chaque nouvelle conversation.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Effort de réflexion par défaut
          </Label>
          <OptionSelector
            items={REASONING_LEVELS.map((level) => ({
              id: level,
              label: REASONING_LEVEL_LABELS[level],
            }))}
            onChange={(val) => setDefaultReasoningLevel(val as ReasoningLevel)}
            placeholder="Effort de réflexion"
            value={defaultReasoningLevel}
          />
          <span className="text-[11px] text-muted-foreground">
            Niveau appliqué par défaut à toutes les surfaces IA (Chat, Agent,
            Wakies, Vibe) pour les modèles compatibles.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Visibilité par défaut des conversations
          </Label>
          <OptionSelector
            items={[
              { id: "private", label: "Privée (recommandé)" },
              { id: "public", label: "Publique" },
            ]}
            onChange={(id) =>
              setDefaultChatVisibility(id === "public" ? "public" : "private")
            }
            placeholder="Visibilité"
            value={defaultChatVisibility}
          />
        </div>
      </div>

      {/* Menu favori */}
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-favorite-app"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="shrink-0 p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
            <StarIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Menu favori
            </h3>
            <p className="text-xs text-muted-foreground">
              L'application ouverte automatiquement à la connexion.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Application préférée
          </Label>
          <OptionSelector
            items={FAVORITE_APP_OPTIONS}
            onChange={(id) => setFavoriteApp(id as AppKey)}
            placeholder="Application"
            value={favoriteApp}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <BotGlyph className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Bots IA</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
            Nouveau
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Les <strong>Bots</strong> remplacent les Modes IA. Créez des bots
          personnalisés avec des compétences et outils dédiés.
        </p>
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-fit"
          href="/agents"
        >
          <BotGlyph className="size-3.5" /> Gérer mes bots →
        </Link>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
          onClick={handleSavePreferences}
          type="button"
        >
          Enregistrer les préférences
        </button>
      </div>

      {/* Instructions personnalisées */}
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-instructions"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-warning/10 text-warning ring-1 ring-warning/20">
            <BotGlyph className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Instructions personnalisées
            </h3>
            <p className="text-xs text-muted-foreground">
              Personnalisez le comportement de mAI — ton, langue, contexte
              métier.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              checked={customEnabled}
              className="size-4 rounded border-border accent-primary"
              onChange={(e) => setCustomEnabled(e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-medium">Activé</span>
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <Label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="settings-custom-instructions"
          >
            Qui êtes-vous ? Que doit savoir mAI sur vous ?{" "}
            {customInstructionsHint(tierRaw)
              ? "(illimité)"
              : `(max ${formatCharCount(getCustomInstructionsEffectiveMax(tierRaw))}c)`}
          </Label>
          <textarea
            className="field-input resize-y"
            id="settings-custom-instructions"
            maxLength={getCustomInstructionsEffectiveMax(tierRaw)}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Je suis développeur full-stack à Paris. Réponds toujours en français, tutoie, sois concis, privilégie TypeScript..."
            rows={5}
            value={customInstructions}
          />
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              {customInstructionsHint(tierRaw)}
            </span>
            <span
              className={cn(
                "text-[11px] text-right tabular-nums",
                customInstructionsOverLimit
                  ? "font-semibold text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {customInstructionsCounterLabel(
                tierRaw,
                customInstructions.length
              )}
            </span>
          </div>
          {customInstructionsOverLimit ? (
            <div className="surface-muted border-destructive/30 bg-destructive/5 flex flex-col gap-2 p-3">
              <p className="text-[11px] leading-relaxed text-destructive">
                Ce texte dépasse la limite du forfait{" "}
                {getTierLimits(tierRaw).label}.
              </p>
              <Link
                className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-foreground hover:underline"
                href={APP_PRICING_URL}
              >
                <SparklesIcon className="size-3" />
                Voir les forfaits
              </Link>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="settings-temperature"
            >
              Température ({customTemp})
            </Label>
            <input
              className="w-full accent-primary"
              id="settings-temperature"
              max={2}
              min={0}
              onChange={(e) => setCustomTemp(Number.parseFloat(e.target.value))}
              step={0.1}
              type="range"
              value={customTemp}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="settings-top-p"
            >
              Top P ({customTopP})
            </Label>
            <input
              className="w-full accent-primary"
              id="settings-top-p"
              max={1}
              min={0}
              onChange={(e) => setCustomTopP(Number.parseFloat(e.target.value))}
              step={0.05}
              type="range"
              value={customTopP}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSavingCustom}
            onClick={handleSaveCustomInstructions}
            type="button"
          >
            {isSavingCustom ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {isSavingCustom ? "Enregistrement..." : "Enregistrer instructions"}
          </button>
        </div>
      </div>

      {/* Préférences Outil Audio & Synthèse Vocale */}
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-audio"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-success/10 text-success ring-1 ring-success/20">
            <Volume2Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Outil Synthèse Vocale & Audio
            </h3>
            <p className="text-xs text-muted-foreground">
              Configurez le modèle vocal, la voix par défaut et le rythme de
              lecture audio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Modèle audio par défaut
            </Label>
            <ModelSelectorCompact
              models={audioModels.length > 0 ? audioModels : undefined}
              onModelChange={(val) => {
                setDefaultAudioModel(val);
                const m = audioModels.find((am) => am.id === val);
                if (
                  m?.voices &&
                  Array.isArray(m.voices) &&
                  m.voices.length > 0
                ) {
                  setDefaultAudioVoice(m.voices[0]);
                }
              }}
              placeholder="Modèle audio par défaut"
              selectedModelId={defaultAudioModel}
              source="speech"
              variant="block"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Voix par défaut
            </Label>
            {audioModelVoices.length === 0 ? (
              <div className="h-10 flex items-center rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-muted-foreground">
                Voix par défaut du modèle
              </div>
            ) : (
              <VoiceOptionSelector
                onChange={setDefaultAudioVoice}
                value={defaultAudioVoice}
                voices={audioModelVoices}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Vitesse de lecture ({defaultAudioSpeed.toFixed(2)}x)
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {defaultAudioSpeed === 1.0
                ? "Normal"
                : defaultAudioSpeed < 1.0
                  ? "Plus lent"
                  : "Plus rapide"}
            </span>
          </div>
          <input
            aria-label="Vitesse de lecture audio"
            className="w-full accent-foreground"
            max={2.0}
            min={0.5}
            onChange={(e) =>
              setDefaultAudioSpeed(Number.parseFloat(e.target.value))
            }
            step={0.05}
            type="range"
            value={defaultAudioSpeed}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSavingToolsPref}
            onClick={handleSaveToolsPreferences}
            type="button"
          >
            {isSavingToolsPref ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {isSavingToolsPref
              ? "Enregistrement..."
              : "Enregistrer les outils dans votre profil"}
          </button>
        </div>
      </div>

      {/* Langues : dictée vocale + cible de traduction */}
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-languages"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
            <LanguagesIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Langues</h3>
            <p className="text-xs text-muted-foreground">
              Langue de dictée vocale et langue de traduction par défaut des
              réponses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Langue de dictée vocale
            </Label>
            <OptionSelector
              items={DICTATION_LANGUAGES.map((entry) => ({
                id: entry.value,
                label: entry.label,
              }))}
              onChange={setDictationLanguage}
              value={dictationLanguage}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Traduire les réponses en
            </Label>
            <OptionSelector
              items={TRANSLATION_TARGETS.map((entry) => ({
                id: entry.code,
                label: entry.label,
              }))}
              onChange={setTranslationLanguage}
              value={translationLanguage}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSavingLanguages}
            onClick={handleSaveLanguages}
            type="button"
          >
            {isSavingLanguages ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {isSavingLanguages
              ? "Enregistrement..."
              : "Enregistrer les langues"}
          </button>
        </div>
      </div>

      {/* Mode régénération */}
      <div
        className="surface-card flex flex-col gap-4 scroll-mt-6"
        id="prefs-regenerate"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
            <SettingsIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Mode régénération des messages
            </h3>
            <p className="text-xs text-muted-foreground">
              Choisissez le comportement du bouton « Régénérer » sur les
              messages de l'assistant.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              regenerateMode === "truncate"
                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                : "bg-muted/20 border-border/50 hover:bg-muted/40"
            }`}
            onClick={() => setRegenerateMode("truncate")}
            type="button"
          >
            <span className="text-sm font-semibold text-foreground">
              Tronquer
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Supprime les messages suivants et régénère à partir du message
              ciblé.
            </span>
          </button>
          <button
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              regenerateMode === "fork"
                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                : "bg-muted/20 border-border/50 hover:bg-muted/40"
            }`}
            onClick={() => setRegenerateMode("fork")}
            type="button"
          >
            <span className="text-sm font-semibold text-foreground">
              Fork (Brancher)
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Crée une nouvelle conversation branchée, l'historique original
              reste intact.
            </span>
          </button>
        </div>
        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 cursor-pointer"
            onClick={handleSaveRegenerateMode}
            type="button"
          >
            Enregistrer le mode
          </button>
        </div>
      </div>
    </div>
  );
}
