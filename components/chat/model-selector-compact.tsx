"use client";

import {
  BrainIcon,
  EyeIcon,
  ImageIcon,
  InfoIcon,
  SlidersIcon,
  SparklesIcon,
  Volume2Icon,
  WrenchIcon,
} from "@mdevs/icons";
import { toast } from "sonner";
import {
  type Dispatch,
  memo,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";
import {
  isReasoningLevel,
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";

// Forme minimale acceptée par le sélecteur : ChatModel (chat), SpeechModel
// (audio, provider optionnel) et ImageModel (images, qui expose owned_by) sont
// tous compatibles. Le provider est résolu à l'affichage par resolveProviderKey.
export type SharedModel = {
  id: string;
  name: string;
  architecture?: ChatModel["architecture"];
  description?: string;
  isFree?: boolean;
  maxContext?: number;
  maxOutput?: number;
  owned_by?: string;
  provider?: string;
  reasoning?: ChatModel["reasoning"];
  supported_parameters?: string[];
  voices?: string[];
};

export type ModelSelectorSource = "chat" | "images" | "speech";

export const PROVIDER_NAMES: Record<string, string> = {
  "01-ai": "01.AI (Yi)",
  ai21: "AI21 Labs",
  aionlabs: "Aion Labs",
  alibaba: "Alibaba Cloud",
  amazon: "Amazon Bedrock",
  "amazon-bedrock": "Amazon Bedrock",
  anthropic: "Anthropic",
  arceeai: "Arcee AI",
  aws: "Amazon AWS",
  azure: "Microsoft Azure",
  baichuan: "Baichuan",
  "black-forest-labs": "Black Forest Labs",
  bytedance: "ByteDance (Doubao)",
  cartesia: "Cartesia",
  cerebras: "Cerebras",
  cohere: "Cohere",
  deepgram: "Deepgram",
  deepinfra: "DeepInfra",
  deepseek: "DeepSeek",
  "dots-studio": "Dots Studio",
  doubao: "ByteDance (Doubao)",
  elevenlabs: "ElevenLabs",
  fal: "fal.ai",
  "fireworks-ai": "Fireworks AI",
  google: "Google",
  granite: "IBM Granite",
  grok: "xAI (Grok)",
  groq: "Groq",
  hunyuan: "Tencent Hunyuan",
  ibm: "IBM Granite",
  "ideogram-ai": "Ideogram",
  "inclusion-ai": "Inclusion AI",
  internlm: "InternLM",
  kwaipilot: "Kwaipilot (Kuaishou)",
  lepton: "Lepton AI",
  "liquid-ai": "Liquid AI (LFM)",
  luma: "Luma AI",
  mai: "mAI",
  mdevslabs: "mAI Exclusif",
  meituan: "Meituan",
  "meta-llama": "Meta Llama",
  midjourney: "Midjourney",
  minimax: "MiniMax",
  mistral: "Mistral AI",
  mistralai: "Mistral AI",
  moonshotai: "Moonshot AI (Kimi)",
  nebius: "Nebius AI",
  nextagi: "Next AGI",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  perceptron: "Perceptron",
  perplexity: "Perplexity",
  playht: "PlayHT",
  poolside: "Poolside (Laguna)",
  qwen: "Qwen / Alibaba",
  "recraft-ai": "Recraft",
  "reka-ai": "Reka AI",
  rekaai: "Reka AI",
  runway: "Runway",
  sambanova: "SambaNova",
  sensetime: "SenseTime",
  "stability-ai": "Stability AI",
  stabilityai: "Stability AI",
  stepfun: "StepFun",
  tencent: "Tencent (Hunyuan)",
  togetherai: "Together AI",
  upstage: "Upstage",
  writer: "Writer (Palmyra)",
  xai: "xAI (Grok)",
  zai: "Zhipu AI (Z-AI)",
  zhipuai: "Zhipu AI (GLM)",
};

// Les modèles d'image/audio du gateway n'ont pas de champ `provider` : leur
// laboratoire est porté par `owned_by`, et certains ids ne contiennent pas de
// préfixe. Une seule fonction de résolution pour que groupe, titre et logo
// restent d'accord entre eux. Gère aussi le préfixe ~ (modèles Latest).
export function resolveProviderKey(model: SharedModel): string {
  const raw = (
    model.provider ||
    model.owned_by ||
    model.id.split("/")[0] ||
    "mai"
  )
    .toLowerCase()
    .trim();

  // Retirer le préfixe ~ éventuel (~openai, ~anthropic, etc.)
  const p = raw.replace(/^~+/, "");

  if (p === "granite" || p === "ibm" || p.includes("granite")) return "ibm";
  if (
    p === "tencent" ||
    p === "hunyuan" ||
    p.startsWith("hy3") ||
    p.startsWith("hy4")
  )
    return "tencent";
  if (p === "qwen" || p === "alibaba" || p === "alibaba-cn") return "qwen";
  if (
    p === "zhipu" ||
    p === "zhipuai" ||
    p === "zai" ||
    p === "z-ai" ||
    p === "glm" ||
    p === "bigmodel"
  )
    return "zhipuai";
  if (p === "inclusion" || p === "inclusion-ai" || p === "inclusionai")
    return "inclusion-ai";
  if (p === "dots" || p === "dots-studio" || p === "dotsstudio")
    return "dots-studio";
  if (p === "bytedance" || p === "doubao" || p === "volcengine")
    return "bytedance";
  if (p === "xai" || p === "x-ai" || p === "grok") return "xai";
  if (p === "liquid" || p === "liquid-ai" || p === "liquidai" || p === "lfm")
    return "liquid-ai";
  if (p === "meituan" || p === "longcat") return "meituan";
  if (p === "kwaipilot" || p === "kuaishou" || p === "kwai" || p === "kolors")
    return "kwaipilot";
  if (p === "next-agi" || p === "nextagi") return "nextagi";
  if (p === "aion" || p === "aion-labs" || p === "aionlabs") return "aionlabs";
  if (p === "perceptron" || p === "perceptron-ai") return "perceptron";
  if (
    p === "mistral" ||
    p === "mistralai" ||
    p === "mistral-ai" ||
    p === "codestral" ||
    p === "pixtral" ||
    p === "ministral"
  )
    return "mistral";
  if (p === "arcee" || p === "arcee-ai" || p === "arceeai") return "arceeai";
  if (p === "reka" || p === "reka-ai" || p === "rekaai") return "rekaai";
  if (p === "writer" || p === "palmyra") return "writer";
  if (
    p === "amazon" ||
    p === "amazon-bedrock" ||
    p === "aws" ||
    p === "nova" ||
    p === "titan"
  )
    return "amazon";
  if (p === "meta" || p === "meta-llama" || p === "llama") return "meta-llama";
  if (p === "poolside" || p === "laguna") return "poolside";
  if (p === "kimi" || p === "moonshot" || p === "moonshotai")
    return "moonshotai";
  if (p === "01-ai" || p === "yi") return "01-ai";
  if (p === "microsoft" || p === "azure") return "azure";
  if (p === "together" || p === "togetherai") return "togetherai";
  if (p === "fireworks" || p === "fireworks-ai") return "fireworks-ai";
  if (p === "stability" || p === "stability-ai" || p === "stabilityai")
    return "stability-ai";
  if (p === "recraft" || p === "recraft-ai") return "recraft-ai";
  if (p === "google-vertex" || p === "google") return "google";

  return p || "mai";
}

const ENDPOINTS: Record<ModelSelectorSource, string> = {
  chat: "/api/models",
  images: "/api/models/images",
  speech: "/api/models/speech",
};

type ModelSelectorCompactProps = {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  source?: ModelSelectorSource;
  models?: SharedModel[];
  fallbackModels?: SharedModel[];
  capabilities?: Record<string, ModelCapabilities>;
  variant?: "compact" | "block";
  placeholder?: string;
  focusInputAfterSelect?: boolean;
  fallbackToFirst?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  // Requis quand le sélecteur est rendu dans une Dialog modale : sans cela,
  // le popover portallé hérite du pointer-events:none du body (inerte).
  modal?: boolean;
  side?: "top" | "bottom";
};

const DEFAULT_EMPTY_LABEL = "Par défaut / Automatique";

function ModelDetailsPanel({
  model,
  capabilities,
  currentReasoningLevel,
  onSelectReasoningLevel,
  source = "chat",
}: {
  model: SharedModel;
  capabilities?: ModelCapabilities;
  currentReasoningLevel?: ReasoningLevel;
  onSelectReasoningLevel?: (level: ReasoningLevel) => void;
  source?: ModelSelectorSource;
}) {
  const logoProvider = resolveProviderKey(model);
  const providerLabel =
    PROVIDER_NAMES[logoProvider.toLowerCase()] ||
    PROVIDER_NAMES[model.provider?.toLowerCase() ?? ""] ||
    model.provider ||
    "mAI";

  const supportedEfforts = useMemo(() => {
    const fromCaps = (capabilities as any)?.reasoningLevels;
    if (Array.isArray(fromCaps) && fromCaps.length > 0) {
      return fromCaps.filter((l): l is ReasoningLevel => isReasoningLevel(l));
    }
    const fromModel = model.reasoning?.supported_efforts;
    if (Array.isArray(fromModel) && fromModel.length > 0) {
      return fromModel.filter((l): l is ReasoningLevel => isReasoningLevel(l));
    }
    return [];
  }, [capabilities, model.reasoning]);

  const hasConfigurableReasoning =
    source === "chat" && supportedEfforts.length > 0;

  const contextStr = model.maxContext
    ? model.maxContext >= 1_000_000
      ? `${(model.maxContext / 1_000_000).toFixed(model.maxContext % 1_000_000 === 0 ? 0 : 1)}M ctx`
      : `${Math.round(model.maxContext / 1000)}k ctx`
    : null;

  const outputStr = model.maxOutput
    ? `${Math.round(model.maxOutput / 1000)}k max`
    : null;

  return (
    <div className="flex flex-col gap-3 text-xs w-full">
      <div className="flex items-start gap-2.5">
        <ModelSelectorLogo className="size-5 shrink-0 mt-0.5" provider={logoProvider} />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground text-[13px] leading-tight">
              {model.name}
            </span>
            {model.isFree ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                Gratuit
              </span>
            ) : null}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Fournisseur : {providerLabel}
          </span>
        </div>
      </div>

      {model.description ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
          {model.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Paramètres & Capacités
        </span>
        <div className="flex flex-wrap gap-1.5">
          {contextStr ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <SparklesIcon className="size-3 text-muted-foreground" />
              {contextStr}
            </span>
          ) : null}
          {outputStr ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              {outputStr}
            </span>
          ) : null}
          {capabilities?.tools || model.supported_parameters?.includes("tools") ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <WrenchIcon className="size-3 text-sky-500" />
              Outils
            </span>
          ) : null}
          {capabilities?.vision || capabilities?.image || capabilities?.file ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <EyeIcon className="size-3 text-purple-500" />
              Vision / Fichiers
            </span>
          ) : null}
          {capabilities?.reasoning || model.reasoning ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <BrainIcon className="size-3 text-amber-500" />
              Raisonnement
            </span>
          ) : null}
          {model.supported_parameters?.includes("temperature") ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <SlidersIcon className="size-3 text-muted-foreground" />
              Température
            </span>
          ) : null}
        </div>
      </div>

      {hasConfigurableReasoning ? (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <BrainIcon className="size-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Effort de réflexion
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {supportedEfforts.map((level) => {
              const active = currentReasoningLevel === level;
              return (
                <button
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded-md transition-colors border font-medium",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/40"
                  )}
                  key={level}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReasoningLevel?.(level);
                  }}
                  title={REASONING_LEVEL_DESCRIPTIONS[level]}
                  type="button"
                >
                  {REASONING_LEVEL_LABELS[level]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SharedModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
  focusInputAfterSelect,
  source,
  onHover,
  isMobileExpanded,
  onToggleMobileExpand,
  currentReasoningLevel,
  onSelectReasoningLevel,
}: {
  capabilities?: Record<string, ModelCapabilities>;
  model: SharedModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  focusInputAfterSelect?: boolean;
  source?: ModelSelectorSource;
  onHover?: () => void;
  isMobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
  currentReasoningLevel?: ReasoningLevel;
  onSelectReasoningLevel?: (level: ReasoningLevel) => void;
}) {
  const logoProvider = resolveProviderKey(model);
  const maybeWithTooltip = (icon: ReactNode, label: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{icon}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );

  const handleSelect = useCallback(() => {
    onModelChange?.(model.id);
    setOpen(false);
    if (focusInputAfterSelect) {
      setTimeout(() => {
        document
          .querySelector<HTMLTextAreaElement>(
            "[data-testid='multimodal-input']"
          )
          ?.focus();
      }, 50);
    }
  }, [focusInputAfterSelect, model.id, onModelChange, setOpen]);

  return (
    <ModelSelectorItem
      className={cn(
        "flex flex-col w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg",
        model.id === selectedModelId &&
          "bg-muted/80 font-medium text-foreground",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
      )}
      onPointerEnter={onHover}
      onSelect={handleSelect}
      value={`${model.name} ${model.id} ${model.description ?? ""}`}
    >
      <div className="flex items-center w-full min-w-0">
        <ModelSelectorLogo provider={logoProvider} />
        <div className="flex flex-col min-w-0 pr-2">
          <ModelSelectorName>{model.name}</ModelSelectorName>
          {model.description ? (
            <span className="text-[11px] text-muted-foreground line-clamp-1">
              {model.description}
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-foreground/70 shrink-0">
          {model.isFree ? (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
              Gratuit
            </span>
          ) : null}
          {source === "images" ? (
            maybeWithTooltip(
              <ImageIcon className="size-3.5 text-violet-500" />,
              "Génération d'images"
            )
          ) : source === "speech" ? (
            maybeWithTooltip(
              <Volume2Icon className="size-3.5 text-emerald-500" />,
              model.voices && model.voices.length > 0
                ? `${model.voices.length} voix disponibles`
                : "Synthèse vocale"
            )
          ) : (
            <>
              {capabilities?.[model.id]?.tools
                ? maybeWithTooltip(
                    <WrenchIcon className="size-3.5" />,
                    "Outils supportés"
                  )
                : null}
              {capabilities?.[model.id]?.image ||
              capabilities?.[model.id]?.file ||
              capabilities?.[model.id]?.vision
                ? maybeWithTooltip(
                    <EyeIcon className="size-3.5" />,
                    "Fichiers & Images supportés"
                  )
                : null}
              {capabilities?.[model.id]?.reasoning
                ? maybeWithTooltip(
                    <BrainIcon className="size-3.5 text-amber-500" />,
                    "Raisonnement avancé"
                  )
                : null}
            </>
          )}

          {/* Bouton d'expansion sur mobile */}
          <button
            className="md:hidden p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors ml-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMobileExpand?.();
            }}
            title="Détails du modèle"
            type="button"
          >
            <InfoIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Accordéon déplié sur mobile */}
      {isMobileExpanded ? (
        <div
          className="md:hidden w-full mt-2 pt-2 border-t border-border/40 text-left cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <ModelDetailsPanel
            capabilities={capabilities?.[model.id]}
            currentReasoningLevel={currentReasoningLevel}
            model={model}
            onSelectReasoningLevel={onSelectReasoningLevel}
            source={source}
          />
        </div>
      ) : null}
    </ModelSelectorItem>
  );
}

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
  source = "chat",
  models: modelsProp,
  fallbackModels,
  capabilities: capabilitiesProp,
  variant = "compact",
  placeholder = "Modèle IA",
  focusInputAfterSelect,
  fallbackToFirst = true,
  allowEmpty,
  emptyLabel = DEFAULT_EMPTY_LABEL,
  modal,
  side,
}: ModelSelectorCompactProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [mobileExpandedModelId, setMobileExpandedModelId] =
    useState<string | null>(null);

  const { data: userPrefs, mutate: mutateUserPrefs } = useSWR(
    "/api/user/preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  const handleSelectReasoningLevel = useCallback(
    async (level: ReasoningLevel) => {
      try {
        await fetch("/api/user/preferences", {
          body: JSON.stringify({ reasoningLevel: level }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        mutateUserPrefs({ ...userPrefs, reasoningLevel: level }, false);
        toast.success(
          `Effort de réflexion : ${REASONING_LEVEL_LABELS[level]}`
        );
      } catch {
        toast.error("Impossible d'enregistrer l'effort de réflexion");
      }
    },
    [userPrefs, mutateUserPrefs]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  }, []);

  const { data: modelsData } = useSWR(
    modelsProp
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${ENDPOINTS[source]}`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: true }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    capabilitiesProp ?? modelsData?.capabilities;

  // Pendant le SSR et l'hydratation initiale côté client, on s'assure d'utiliser
  // les mêmes modèles de référence (fallbackModels) pour éviter tout écart
  // d'hydratation entre le serveur (qui n'a pas de cache SWR) et le client.
  const activeModelsData = mounted ? modelsData : undefined;

  const models: SharedModel[] =
    modelsProp ??
    (activeModelsData?.models?.length > 0
      ? activeModelsData.models
      : activeModelsData?.data?.length > 0
        ? activeModelsData.data
        : fallbackModels) ??
    [];

  const selectedModel =
    models.find((m) => m.id === selectedModelId) ??
    (fallbackToFirst
      ? (models.find((m) => m.id === DEFAULT_CHAT_MODEL) ?? models[0])
      : undefined);
  const provider = selectedModel ? resolveProviderKey(selectedModel) : null;
  const isEmptySelection = allowEmpty && !selectedModelId;
  const triggerLabel = isEmptySelection
    ? emptyLabel
    : selectedModel?.name ||
      (selectedModelId ? "Modèle indisponible" : placeholder);

  // Filtrage intelligent insensible aux accents et à la casse
  const filteredModels = useMemo(() => {
    const q = search
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    if (!q) {
      return models;
    }
    return models.filter((m) => {
      const name = (m.name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const id = (m.id || "").toLowerCase();
      const desc = (m.description || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const provKey = resolveProviderKey(m);
      const provName = (PROVIDER_NAMES[provKey] || provKey)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      return (
        name.includes(q) ||
        id.includes(q) ||
        desc.includes(q) ||
        provKey.includes(q) ||
        provName.includes(q)
      );
    });
  }, [models, search]);

  const grouped: Record<string, SharedModel[]> = {};
  for (const m of filteredModels) {
    const p = resolveProviderKey(m);
    if (!grouped[p]) {
      grouped[p] = [];
    }
    grouped[p].push(m);
  }

  const activeModel = useMemo(
    () => models.find((m) => m.id === hoveredModelId) ?? selectedModel ?? models[0],
    [models, hoveredModelId, selectedModel]
  );

  return (
    <ModelSelector modal={modal} onOpenChange={handleOpenChange} open={open}>
      <ModelSelectorTrigger asChild>
        {variant === "compact" ? (
          <Button
            className="h-8 max-w-[min(220px,calc(100vw-9rem))] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer sm:h-7 sm:max-w-[220px]"
            data-testid="model-selector"
            suppressHydrationWarning
            variant="ghost"
          >
            {!isEmptySelection && provider ? (
              <ModelSelectorLogo provider={provider} />
            ) : null}
            <ModelSelectorName suppressHydrationWarning>
              {triggerLabel}
            </ModelSelectorName>
          </Button>
        ) : (
          <Button
            className="h-9 w-full justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 text-[13px] font-normal text-foreground hover:bg-muted/50 cursor-pointer"
            data-testid="model-selector"
            suppressHydrationWarning
            type="button"
            variant="outline"
          >
            <span className="flex min-w-0 items-center gap-2">
              {!isEmptySelection && provider ? (
                <ModelSelectorLogo provider={provider} />
              ) : null}
              <ModelSelectorName suppressHydrationWarning>
                {triggerLabel}
              </ModelSelectorName>
            </span>
          </Button>
        )}
      </ModelSelectorTrigger>
      <ModelSelectorContent
        className="w-[min(320px,calc(100vw-1rem))] md:w-[600px] max-w-[calc(100vw-1rem)] p-0 overflow-hidden"
        commandDefaultValue={selectedModel?.id}
        shouldFilter={false}
        side={side ?? (variant === "compact" ? "top" : "bottom")}
      >
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/60 max-h-[480px]">
          <div className="flex flex-col w-full md:w-[320px] shrink-0 min-h-0">
            <ModelSelectorInput
              onValueChange={setSearch}
              placeholder={
                source === "images"
                  ? "Rechercher un modèle d'image..."
                  : source === "speech"
                    ? "Rechercher un modèle audio..."
                    : "Rechercher un modèle IA..."
              }
              value={search}
            />
            <ModelSelectorList className="max-h-[390px] overflow-y-auto p-1">
              {allowEmpty && !search.trim() ? (
                <ModelSelectorItem
                  className={cn(
                    "flex w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg text-muted-foreground",
                    !selectedModelId && "bg-muted/80 font-medium text-foreground",
                    "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
                  )}
                  onSelect={() => {
                    onModelChange?.("");
                    setOpen(false);
                  }}
                  value={emptyLabel}
                >
                  <span>{emptyLabel}</span>
                </ModelSelectorItem>
              ) : null}
              {filteredModels.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Aucun modèle trouvé pour « {search} »
                </div>
              ) : (
                Object.entries(grouped).map(([groupKey, groupModels]) => (
                  <ModelSelectorGroup
                    heading={
                      PROVIDER_NAMES[groupKey.toLowerCase()] ||
                      groupKey.toUpperCase()
                    }
                    key={groupKey}
                  >
                    {groupModels.map((model) => (
                      <SharedModelSelectorOption
                        capabilities={capabilities}
                        currentReasoningLevel={
                          userPrefs?.reasoningLevel ?? "medium"
                        }
                        focusInputAfterSelect={focusInputAfterSelect}
                        isMobileExpanded={mobileExpandedModelId === model.id}
                        key={model.id}
                        model={model}
                        onHover={() => setHoveredModelId(model.id)}
                        onModelChange={onModelChange}
                        onSelectReasoningLevel={handleSelectReasoningLevel}
                        onToggleMobileExpand={() =>
                          setMobileExpandedModelId((prev) =>
                            prev === model.id ? null : model.id
                          )
                        }
                        selectedModelId={selectedModel?.id ?? selectedModelId}
                        setOpen={setOpen}
                        source={source}
                      />
                    ))}
                  </ModelSelectorGroup>
                ))
              )}
            </ModelSelectorList>
          </div>

          {/* Panneau latéral desktop d'aperçu au survol */}
          <div className="hidden md:flex flex-col w-[280px] shrink-0 p-3.5 bg-muted/20 overflow-y-auto max-h-[480px]">
            {activeModel ? (
              <ModelDetailsPanel
                capabilities={capabilities?.[activeModel.id]}
                currentReasoningLevel={userPrefs?.reasoningLevel ?? "medium"}
                model={activeModel}
                onSelectReasoningLevel={handleSelectReasoningLevel}
                source={source}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                <span className="text-[11px]">
                  Survolez un modèle pour afficher ses caractéristiques.
                </span>
              </div>
            )}
          </div>
        </div>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

export const ModelSelectorCompact = memo(PureModelSelectorCompact);
