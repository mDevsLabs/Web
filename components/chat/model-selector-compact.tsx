"use client";

import { BrainIcon, EyeIcon, WrenchIcon } from "lucide-react";
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
// (audio, provider optionnel) et ImageModel (images) sont tous compatibles.
// Le provider manquant est dérivé de l'id au rendu.
export type SharedModel = {
  id: string;
  name: string;
  architecture?: ChatModel["architecture"];
  description?: string;
  isFree?: boolean;
  maxContext?: number;
  maxOutput?: number;
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
  mai: "mAI",
  mdevslabs: "mAI Exclusif",
  "meta-llama": "Meta Llama",
  mistral: "Mistral AI",
  mistralai: "Mistral AI",
  openai: "OpenAI",
  qwen: "Qwen / Alibaba",
  "stability-ai": "Stability AI",
  xai: "xAI",
};

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
};

const DEFAULT_EMPTY_LABEL = "Par défaut / Automatique";

function SharedModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
  focusInputAfterSelect,
}: {
  capabilities?: Record<string, ModelCapabilities>;
  model: SharedModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  focusInputAfterSelect?: boolean;
}) {
  const [logoProvider] = model.id.split("/");
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
      value={`${model.name} ${model.id}`}
    >
      <ModelSelectorLogo provider={logoProvider} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <div className="ml-auto flex items-center gap-2 text-foreground/70">
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
              <BrainIcon className="size-3.5" />,
              "Raisonnement avancé"
            )
          : null}
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
  const [provider] = (selectedModel?.id || DEFAULT_CHAT_MODEL).split("/");
  const isEmptySelection = allowEmpty && !selectedModelId;
  const triggerLabel = isEmptySelection
    ? emptyLabel
    : (selectedModel?.name || placeholder);

  const grouped: Record<string, SharedModel[]> = {};
  for (const m of models) {
    const p = m.provider || m.id.split("/")[0] || "mAI";
    if (!grouped[p]) {
      grouped[p] = [];
    }
    grouped[p].push(m);
  }

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
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
      <ModelSelectorContent commandDefaultValue={selectedModel?.id}>
        <ModelSelectorInput placeholder="Rechercher un modèle..." />
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
