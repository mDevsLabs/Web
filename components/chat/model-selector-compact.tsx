"use client";

import {
  BrainIcon,
  EyeIcon,
  ImageIcon,
  Volume2Icon,
  WrenchIcon,
} from "lucide-react";
import {
  type Dispatch,
  memo,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import useSWR from "swr";
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
  supported_parameters?: string[];
  voices?: string[];
};

export type ModelSelectorSource = "chat" | "images" | "speech";

export const PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  cohere: "Cohere",
  "black-forest-labs": "Black Forest Labs",
  deepgram: "Deepgram",
  deepseek: "DeepSeek",
  google: "Google",
  "ideogram-ai": "Ideogram",
  luma: "Luma AI",
  mai: "mAI",
  mdevslabs: "mAI Exclusif",
  "meta-llama": "Meta Llama",
  midjourney: "Midjourney",
  mistral: "Mistral AI",
  mistralai: "Mistral AI",
  openai: "OpenAI",
  qwen: "Qwen / Alibaba",
  "recraft-ai": "Recraft",
  "stability-ai": "Stability AI",
  stabilityai: "Stability AI",
  xai: "xAI",
};

// Les modèles d'image/audio du gateway n'ont pas de champ `provider` : leur
// laboratoire est porté par `owned_by`, et certains ids ne contiennent pas de
// préfixe. Une seule fonction de résolution pour que groupe, titre et logo
// restent d'accord entre eux.
export function resolveProviderKey(model: SharedModel): string {
  return model.provider || model.owned_by || model.id.split("/")[0] || "mai";
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
  allowEmpty?: boolean;
  emptyLabel?: string;
  // Requis quand le sélecteur est rendu dans une Dialog modale : sans cela,
  // le popover portallé hérite du pointer-events:none du body (inerte).
  modal?: boolean;
  side?: "top" | "bottom";
};

const DEFAULT_EMPTY_LABEL = "Par défaut / Automatique";

function SharedModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
  focusInputAfterSelect,
  source,
}: {
  capabilities?: Record<string, ModelCapabilities>;
  model: SharedModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  focusInputAfterSelect?: boolean;
  source?: ModelSelectorSource;
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
          .querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")
          ?.focus();
      }, 50);
    }
  }, [focusInputAfterSelect, model.id, onModelChange, setOpen]);

  return (
    <ModelSelectorItem
      className={cn(
        "flex w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg",
        model.id === selectedModelId &&
          "bg-muted/80 font-medium text-foreground",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
      )}
      onSelect={handleSelect}
      value={`${model.name} ${model.id} ${model.description ?? ""}`}
    >
      <ModelSelectorLogo provider={logoProvider} />
      <div className="flex flex-col min-w-0 pr-2">
        <ModelSelectorName>{model.name}</ModelSelectorName>
        {model.description ? (
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {model.description}
          </span>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-2 text-foreground/70 shrink-0">
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
      </div>
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
  allowEmpty,
  emptyLabel = DEFAULT_EMPTY_LABEL,
  modal,
  side,
}: ModelSelectorCompactProps) {
  const [open, setOpen] = useState(false);

  const { data: modelsData } = useSWR(
    modelsProp ? null : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${ENDPOINTS[source]}`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: true }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    capabilitiesProp ?? modelsData?.capabilities;

  const models: SharedModel[] =
    modelsProp ??
    (modelsData?.models?.length > 0
      ? modelsData.models
      : modelsData?.data?.length > 0
        ? modelsData.data
        : fallbackModels) ??
    [];

  const selectedModel =
    models.find((m) => m.id === selectedModelId) ??
    models.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
    models[0];
  const provider = selectedModel ? resolveProviderKey(selectedModel) : null;
  const isEmptySelection = allowEmpty && !selectedModelId;
  const triggerLabel = isEmptySelection
    ? emptyLabel
    : (selectedModel?.name || placeholder);

  const grouped: Record<string, SharedModel[]> = {};
  for (const m of models) {
    const p = resolveProviderKey(m);
    if (!grouped[p]) {
      grouped[p] = [];
    }
    grouped[p].push(m);
  }

  return (
    <ModelSelector modal={modal} onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        {variant === "compact" ? (
          <Button
            className="h-8 sm:h-7 max-w-[220px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            data-testid="model-selector"
            variant="ghost"
          >
            {!isEmptySelection && provider ? (
              <ModelSelectorLogo provider={provider} />
            ) : null}
            <ModelSelectorName>{triggerLabel}</ModelSelectorName>
          </Button>
        ) : (
          <Button
            className="h-9 w-full justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 text-[13px] font-normal text-foreground hover:bg-muted/50 cursor-pointer"
            data-testid="model-selector"
            type="button"
            variant="outline"
          >
            <span className="flex min-w-0 items-center gap-2">
              {!isEmptySelection && provider ? (
                <ModelSelectorLogo provider={provider} />
              ) : null}
              <ModelSelectorName>{triggerLabel}</ModelSelectorName>
            </span>
          </Button>
        )}
      </ModelSelectorTrigger>
      <ModelSelectorContent
        commandDefaultValue={selectedModel?.id}
        side={side ?? (variant === "compact" ? "top" : "bottom")}
      >
        <ModelSelectorInput
          placeholder={
            source === "images"
              ? "Rechercher un modèle d'image..."
              : source === "speech"
                ? "Rechercher un modèle audio..."
                : "Rechercher un modèle IA..."
          }
        />
        <ModelSelectorList>
          {allowEmpty ? (
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
          {Object.entries(grouped).map(([groupKey, groupModels]) => (
            <ModelSelectorGroup
              heading={
                PROVIDER_NAMES[groupKey.toLowerCase()] || groupKey.toUpperCase()
              }
              key={groupKey}
            >
              {groupModels.map((model) => (
                <SharedModelSelectorOption
                  capabilities={capabilities}
                  focusInputAfterSelect={focusInputAfterSelect}
                  key={model.id}
                  model={model}
                  onModelChange={onModelChange}
                  selectedModelId={selectedModel?.id}
                  setOpen={setOpen}
                  source={source}
                />
              ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

export const ModelSelectorCompact = memo(PureModelSelectorCompact);
