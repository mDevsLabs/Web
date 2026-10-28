"use client";

import {
  GaugeIcon,
  LanguagesIcon,
  SettingsIcon,
  SparklesIcon,
  StarIcon,
  Volume2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAutosavePreference } from "@/hooks/use-autosave-preference";
import { useFavoriteApp } from "@/hooks/use-favorite-app";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";
import { useSettings } from "@/hooks/use-settings";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import {
  REASONING_LEVEL_LABELS,
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import {
  APP_CATALOG,
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
import { useEconomy } from "@/lib/resources/economy";
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

const WEB_FAVORITE_OPTIONS: OptionSelectorItem[] = APP_ORDER.map(
  (entry: AppCatalogEntry) => ({
    description: entry.description,
    id: entry.key,
    label: entry.label,
  })
);

export function PreferencesTab() {
  const { data: settingsData } = useSettings();
  const { isDesktop } = useIsDesktopApp();
  const profile = settingsData?.user ?? null;
  const tierRaw = profile?.tier;
  // Le mode économie est un réglage d'APPAREIL : il vit dans le
  // `localStorage`, pas dans le compte. Un portable et un poste fixe n'ont
  // pas les mêmes ressources.
  const { isEconomyRequested: economyRequested, setEconomyRequested } =
    useEconomy();
  // Le CLI n'apparaît que dans l'application de bureau : sur le web, choisir
  // ce favori mènerait à une impasse au prochain login.
  const favoriteAppOptions = useMemo<OptionSelectorItem[]>(
    () =>
      isDesktop
        ? [
            ...WEB_FAVORITE_OPTIONS,
            {
              description: APP_CATALOG.cli.description,
              id: "cli",
              label: APP_CATALOG.cli.label,
            },
          ]
        : WEB_FAVORITE_OPTIONS,
    [isDesktop]
  );

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

  const [defaultAgentId, setDefaultAgentId] = useState<string>("none");
  const { favorite: favoriteApp, setFavorite: setFavoriteApp } =
    useFavoriteApp();
  const [showAgentChatIcons, setShowAgentChatIcons] = useState<boolean>(true);
  const [dictationLanguage, setDictationLanguage] = useState(
    AUTO_DICTATION_LANGUAGE
  );
  const [translationLanguage, setTranslationLanguage] = useState(
    DEFAULT_TRANSLATION_TARGET
  );
  const [regenerateMode, setRegenerateMode] = useState<"truncate" | "fork">(
    "truncate"
  );

  const { data: prefModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    fetcher,
    { dedupingInterval: 60_000 }
  );
  const prefModels: ChatModel[] = prefModelsData?.models || [];
  // Niveaux réellement acceptés par le modèle par défaut : le catalogue est
  // l'autorité, une liste universelle proposerait des efforts que le
  // fournisseur refuse (mAI-2-Mini n'en expose aucun).
  const selectedCapabilities = prefModelsData?.capabilities?.[defaultModelId];
  const supportedReasoningLevels: ReasoningLevel[] =
    selectedCapabilities?.reasoningLevels?.length > 0
      ? (selectedCapabilities.reasoningLevels as ReasoningLevel[])
      : selectedCapabilities
        ? []
        : [...REASONING_LEVELS];

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

  const prevCustomRef = useRef(customInstructions);
  const prevTempRef = useRef(customTemp);
  const prevTopPRef = useRef(customTopP);
  // Vitesse audio : la référence est la dernière valeur CONFIRMÉE par le
  // serveur, pas la valeur du premier rendu. Elle est synchronisée par
  // l'hydratation ; sans cela, revenir à 1,00× après un chargement à 1,05×
  // ne déclenchait aucune écriture (1,00 === valeur initiale du ref).
  const prevAudioSpeedRef = useRef(defaultAudioSpeed);
  const audioSpeedDraggingRef = useRef(false);

  useEffect(() => {
    if (customPrefData) {
      if (customPrefData.customInstructions !== undefined) {
        const ci = customPrefData.customInstructions || "";
        setCustomInstructions(ci);
        prevCustomRef.current = ci;
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
        prevTempRef.current = customPrefData.temperature;
      }
      if (customPrefData.topP !== undefined) {
        setCustomTopP(customPrefData.topP);
        prevTopPRef.current = customPrefData.topP;
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
        const serverSpeed = customPrefData.defaultAudioSpeed;
        // Ne pas écraser un geste utilisateur en cours (curseur maintenu) ;
        // sinon la valeur serveur devient la nouvelle référence confirmée et
        // un retour à 1,00× sera bien persisté.
        if (!audioSpeedDraggingRef.current) {
          setDefaultAudioSpeed(serverSpeed);
          prevAudioSpeedRef.current = serverSpeed;
        }
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

  const { save: savePreference } = useAutosavePreference({
    endpoint: "/api/user/preferences",
    revalidate: mutateCustomPref,
  });
  const handleModelChange = useCallback(
    (newModelId: string) => {
      const prev = defaultModelId;
      setDefaultModelId(newModelId);
      setCookie("chat-model", newModelId);
      savePreference({ defaultChatModel: newModelId }, () => {
        setDefaultModelId(prev);
        setCookie("chat-model", prev);
        savePreference({ defaultChatModel: prev }, () => {});
      });
    },
    [defaultModelId, savePreference]
  );

  const handleReasoningLevelChange = useCallback(
    (val: string) => {
      const prev = defaultReasoningLevel;
      const newLevel = val as ReasoningLevel;
      setDefaultReasoningLevel(newLevel);
      savePreference({ reasoningLevel: newLevel }, () => {
        setDefaultReasoningLevel(prev);
        savePreference({ reasoningLevel: prev }, () => {});
      });
    },
    [defaultReasoningLevel, savePreference]
  );

  const handleChatVisibilityChange = useCallback(
    (id: string) => {
      const prev = defaultChatVisibility;
      const newVis = id === "public" ? "public" : "private";
      setDefaultChatVisibility(newVis);
      savePreference({ defaultChatVisibility: newVis }, () => {
        setDefaultChatVisibility(prev);
        savePreference({ defaultChatVisibility: prev }, () => {});
      });
    },
    [defaultChatVisibility, savePreference]
  );

  const handleFavoriteAppChange = useCallback(
    (id: string) => {
      const prev = favoriteApp;
      const newApp = id as AppKey;
      setFavoriteApp(newApp);
      savePreference({ defaultApp: newApp }, () => {
        setFavoriteApp(prev);
        savePreference({ defaultApp: prev }, () => {});
      });
    },
    [favoriteApp, setFavoriteApp, savePreference]
  );

  const handleCustomEnabledChange = useCallback(
    (checked: boolean) => {
      const prev = customEnabled;
      setCustomEnabled(checked);
      savePreference({ enabled: checked }, () => {
        setCustomEnabled(prev);
        savePreference({ enabled: prev }, () => {});
      });
    },
    [customEnabled, savePreference]
  );

  const handleCustomInstructionsBlur = useCallback(() => {
    const trimmed = customInstructions.slice(0, customInstructionsMax);
    if (trimmed !== prevCustomRef.current) {
      const prev = prevCustomRef.current;
      prevCustomRef.current = trimmed;
      savePreference({ customInstructions: trimmed }, () => {
        setCustomInstructions(prev);
        prevCustomRef.current = prev;
        savePreference({ customInstructions: prev }, () => {});
      });
    }
  }, [customInstructions, customInstructionsMax, savePreference]);

  const handleTempCommit = useCallback(() => {
    if (customTemp !== prevTempRef.current) {
      const prev = prevTempRef.current;
      prevTempRef.current = customTemp;
      savePreference({ temperature: customTemp }, () => {
        setCustomTemp(prev);
        prevTempRef.current = prev;
        savePreference({ temperature: prev }, () => {});
      });
    }
  }, [customTemp, savePreference]);

  const handleTopPCommit = useCallback(() => {
    if (customTopP !== prevTopPRef.current) {
      const prev = prevTopPRef.current;
      prevTopPRef.current = customTopP;
      savePreference({ topP: customTopP }, () => {
        setCustomTopP(prev);
        prevTopPRef.current = prev;
        savePreference({ topP: prev }, () => {});
      });
    }
  }, [customTopP, savePreference]);

  const handleCreationModeChange = useCallback(
    (mode: CreationMode) => {
      const prev = defaultCreationMode;
      setDefaultCreationMode(mode);
      savePreference({ defaultCreationMode: mode }, () => {
        setDefaultCreationMode(prev);
        savePreference({ defaultCreationMode: prev }, () => {});
      });
    },
    [defaultCreationMode, savePreference]
  );

  const handleImageModelChange = useCallback(
    (model: string) => {
      const prev = defaultImageModel;
      setDefaultImageModel(model);
      savePreference({ defaultImageModel: model }, () => {
        setDefaultImageModel(prev);
        savePreference({ defaultImageModel: prev }, () => {});
      });
    },
    [defaultImageModel, savePreference]
  );

  const handleImageSizeChange = useCallback(
    (size: string) => {
      const prev = defaultImageSize;
      setDefaultImageSize(size);
      savePreference({ defaultImageSize: size }, () => {
        setDefaultImageSize(prev);
        savePreference({ defaultImageSize: prev }, () => {});
      });
    },
    [defaultImageSize, savePreference]
  );

  const handleAudioModelChange = useCallback(
    (model: string) => {
      const prev = defaultAudioModel;
      setDefaultAudioModel(model);
      savePreference({ defaultAudioModel: model }, () => {
        setDefaultAudioModel(prev);
        savePreference({ defaultAudioModel: prev }, () => {});
      });
    },
    [defaultAudioModel, savePreference]
  );

  const handleAudioVoiceChange = useCallback(
    (voice: string) => {
      const prev = defaultAudioVoice;
      setDefaultAudioVoice(voice);
      savePreference({ defaultAudioVoice: voice }, () => {
        setDefaultAudioVoice(prev);
        savePreference({ defaultAudioVoice: prev }, () => {});
      });
    },
    [defaultAudioVoice, savePreference]
  );

  const handleAudioSpeedCommit = useCallback(() => {
    const next = defaultAudioSpeed;
    const prev = prevAudioSpeedRef.current;
    if (next === prev) {
      audioSpeedDraggingRef.current = false;
      return;
    }
    prevAudioSpeedRef.current = next;
    audioSpeedDraggingRef.current = true;
    void savePreference({ defaultAudioSpeed: next }, () => {
      setDefaultAudioSpeed(prev);
      prevAudioSpeedRef.current = prev;
      savePreference({ defaultAudioSpeed: prev }, () => {});
    }).then((ok) => {
      if (!ok) {
        // L'écriture a échoué : la valeur affichée revient à la dernière
        // valeur confirmée, et la référence ne prétend pas le contraire.
        setDefaultAudioSpeed(prev);
        prevAudioSpeedRef.current = prev;
      }
      audioSpeedDraggingRef.current = false;
    });
  }, [defaultAudioSpeed, savePreference]);

  const handleDictationLanguageChange = useCallback(
    (val: string) => {
      const prev = dictationLanguage;
      setDictationLanguage(val);
      savePreference({ defaultDictationLanguage: val }, () => {
        setDictationLanguage(prev);
        savePreference({ defaultDictationLanguage: prev }, () => {});
      });
    },
    [dictationLanguage, savePreference]
  );

  const handleTranslationLanguageChange = useCallback(
    (val: string) => {
      const prev = translationLanguage;
      setTranslationLanguage(val);
      savePreference({ defaultTranslationLanguage: val }, () => {
        setTranslationLanguage(prev);
        savePreference({ defaultTranslationLanguage: prev }, () => {});
      });
    },
    [translationLanguage, savePreference]
  );

  const handleRegenerateModeChange = useCallback(
    (mode: "truncate" | "fork") => {
      const prev = regenerateMode;
      setRegenerateMode(mode);
      const versNotifications = {
        endpoint: "/api/notifications/preferences",
        revalidate: mutateNotifPrefs,
      };
      savePreference(
        { regenerateMode: mode },
        () => {
          setRegenerateMode(prev);
          savePreference({ regenerateMode: prev }, () => {}, versNotifications);
        },
        versNotifications
      );
    },
    [regenerateMode, savePreference, mutateNotifPrefs]
  );

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
            onModelChange={handleModelChange}
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
          {supportedReasoningLevels.length > 0 ? (
            <OptionSelector
              items={supportedReasoningLevels.map((level) => ({
                id: level,
                label: REASONING_LEVEL_LABELS[level],
              }))}
              onChange={handleReasoningLevelChange}
              placeholder="Effort de réflexion"
              value={
                supportedReasoningLevels.includes(defaultReasoningLevel)
                  ? defaultReasoningLevel
                  : supportedReasoningLevels[0]
              }
            />
          ) : (
            <p className="surface-muted px-3 py-2 text-[11px] text-muted-foreground">
              {selectedCapabilities?.reasoning
                ? "Ce modèle raisonne sans exposer de niveau : le fournisseur choisit lui-même l'effort."
                : "Le modèle par défaut ne prend pas en charge l'effort de réflexion."}
            </p>
          )}
          <span className="text-[11px] text-muted-foreground">
            Niveau appliqué par défaut à toutes les surfaces IA compatibles
            (Chat, Agent, Wakies, Vibe). Un modèle qui n'accepte pas ce niveau
            reçoit le plus proche niveau inférieur, ou aucun s'il n'en expose.
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
            onChange={handleChatVisibilityChange}
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
            items={favoriteAppOptions}
            onChange={handleFavoriteAppChange}
            placeholder="Application"
            value={favoriteApp}
          />
        </div>
      </div>

      {/* Mode économie */}
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="prefs-economy"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="shrink-0 p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
            <GaugeIcon className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Mode économie
            </h3>
            <p className="text-xs text-muted-foreground">
              Coupe les animations et suspend les rafraîchissements quand une
              application lourde tourne (Blackline) ou que l'onglet est en
              arrière-plan.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              checked={economyRequested}
              className="size-4 rounded border-border accent-primary"
              onChange={(e) => setEconomyRequested(e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-medium">Activé</span>
          </label>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Réglage d&apos;APPAREIL : il décrit la machine sur laquelle vous
          travaillez, et ne suit pas le compte. L&apos;économie automatique
          (onglet caché, application lourde) s&apos;applique quoi qu&apos;il
          arrive.
        </p>
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
              onChange={(e) => handleCustomEnabledChange(e.target.checked)}
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
            onBlur={handleCustomInstructionsBlur}
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
              onKeyUp={handleTempCommit}
              onPointerUp={handleTempCommit}
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
              onKeyUp={handleTopPCommit}
              onPointerUp={handleTopPCommit}
              step={0.05}
              type="range"
              value={customTopP}
            />
          </div>
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
                handleAudioModelChange(val);
                const m = audioModels.find((am) => am.id === val);
                if (
                  m?.voices &&
                  Array.isArray(m.voices) &&
                  m.voices.length > 0
                ) {
                  handleAudioVoiceChange(m.voices[0]);
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
                onChange={handleAudioVoiceChange}
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
            onKeyDown={() => {
              audioSpeedDraggingRef.current = true;
            }}
            onKeyUp={handleAudioSpeedCommit}
            onPointerDown={() => {
              audioSpeedDraggingRef.current = true;
            }}
            onPointerUp={handleAudioSpeedCommit}
            step={0.05}
            type="range"
            value={defaultAudioSpeed}
          />
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
              onChange={handleDictationLanguageChange}
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
              onChange={handleTranslationLanguageChange}
              value={translationLanguage}
            />
          </div>
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
            onClick={() => handleRegenerateModeChange("truncate")}
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
            onClick={() => handleRegenerateModeChange("fork")}
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
      </div>
    </div>
  );
}
