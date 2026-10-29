"use client";

import {
  BrainIcon,
  EyeIcon,
  InfoIcon,
  SlidersIcon,
  SparklesIcon,
  WrenchIcon,
} from "@mdevs/icons";
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
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorDescription,
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
  MODEL_CATALOG_ENDPOINTS,
  MODEL_CATALOG_REFRESH_INTERVAL,
  MODEL_CATALOG_SWR_KEYS,
  modelCatalogKey,
} from "@/lib/ai/model-catalog";
import {
  groupModelsByProvider,
  isMai2Model,
} from "@/lib/ai/model-selector/order";
// Forme minimale acceptée par le sélecteur : ChatModel (chat), SpeechModel
// (audio, provider optionnel) et ImageModel (images, qui expose owned_by) sont
// tous compatibles. Le provider est résolu à l'affichage par resolveProviderKey.
//
// Ces types vivent dans lib/ai/model-selector/types.ts : le sélecteur du Site
// officiel consomme exactement la même forme.
import {
  MAI_PROVIDER_KEY,
  MAI_PROVIDER_RECOMMENDED_LABEL,
  PROVIDER_NAMES,
  resolveProviderKey,
} from "@/lib/ai/model-selector/provider";
import {
  displayedReasoningLevel,
  supportedReasoningLevels,
} from "@/lib/ai/model-selector/reasoning";
import { RecommendedBadge } from "@/lib/ai/model-selector/recommended-badge";
import type {
  ModelSelectorSource,
  SharedModel,
} from "@/lib/ai/model-selector/types";
import { DEFAULT_CHAT_MODEL, type ModelCapabilities } from "@/lib/ai/models";
import {
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { cn } from "@/lib/utils";

export {
  MAI_PROVIDER_KEY,
  MAI_PROVIDER_RECOMMENDED_LABEL,
  PROVIDER_NAMES,
  resolveProviderKey,
} from "@/lib/ai/model-selector/provider";
export type {
  ModelSelectorSource,
  SharedModel,
} from "@/lib/ai/model-selector/types";

// La table des endpoints vit dans lib/ai/model-catalog.ts : le revalidation
// global s'appuie sur des clés SWR strictement identiques à celles du
// `useSWR` ci-dessous, et deux écritures divergentes casseraient ça.
const ENDPOINTS: Record<ModelSelectorSource, string> = MODEL_CATALOG_ENDPOINTS;

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
  /**
   * Sélection de l'entrée vide. Par défaut le sélecteur émet `""` ; Wakies
   * a besoin de `null` (« revenir au modèle du Wakie »), deux intentions
   * distinctes que le composant ne doit pas confondre.
   */
  onEmptySelect?: () => void;
  /** Désactive le déclencheur (ex. enregistrement d'un modèle en cours). */
  disabled?: boolean;
};

const DEFAULT_EMPTY_LABEL = "Par défaut / Automatique";

/**
 * Niveau à afficher comme actif pour CE modèle.
 *
 * La préférence globale ne s'applique que si le modèle accepte ce niveau :
 * mAI-2 expose `max | high | low` et n'a donc aucun « medium ». Sans ce repli,
 * aucun bouton n'apparaîtrait actif, alors que le fournisseur, lui, a un
 * défaut (`high`).
 *
 * L'implémentation vit dans lib/ai/model-selector/reasoning.ts : elle est
 * partagée avec le sélecteur du Site officiel.
 */

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

  const supportedEfforts = useMemo(
    () => supportedReasoningLevels(model, capabilities),
    [capabilities, model]
  );

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
        <ModelSelectorLogo
          className="size-5 shrink-0 mt-0.5"
          pixelSize={20}
          provider={logoProvider}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground text-[13px] leading-tight">
              {model.name}
            </span>
            {model.isFree ? (
              <span className="text-[10px] bg-success/10 text-success font-semibold px-1.5 py-0.5 rounded">
                Gratuit
              </span>
            ) : null}
            {isMai2Model(model) ? <RecommendedBadge /> : null}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Fournisseur : {providerLabel}
          </span>
        </div>
      </div>

      {model.description ? (
        <ModelSelectorDescription className="text-[11px] leading-relaxed text-muted-foreground">
          {model.description}
        </ModelSelectorDescription>
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
          {capabilities?.tools ||
          model.supported_parameters?.includes("tools") ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <WrenchIcon className="size-3 text-info" />
              Outils
            </span>
          ) : null}
          {capabilities?.vision || capabilities?.image || capabilities?.file ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <EyeIcon className="size-3 text-muted-foreground" />
              Vision / Fichiers
            </span>
          ) : null}
          {capabilities?.reasoning || model.reasoning ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-foreground font-medium border border-border/40">
              <BrainIcon className="size-3 text-warning" />
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
            <BrainIcon className="size-3.5 text-warning" />
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
        <ModelSelectorLogo className="mr-2" provider={logoProvider} />
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ModelSelectorName>{model.name}</ModelSelectorName>
            {isMai2Model(model) ? <RecommendedBadge /> : null}
          </div>
          {model.description ? (
            <ModelSelectorDescription
              className="text-[11px] text-muted-foreground"
              compact
            >
              {model.description}
            </ModelSelectorDescription>
          ) : null}
        </div>
        <div className="ml-auto flex items-center shrink-0">
          {/* Bouton d'expansion sur mobile */}
          <button
            className="md:hidden p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
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
  onEmptySelect,
  disabled,
}: ModelSelectorCompactProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [mobileExpandedModelId, setMobileExpandedModelId] = useState<
    string | null
  >(null);

  const { data: userPrefs, mutate: mutateUserPrefs } = useSWR(
    "/api/user/preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  const handleSelectReasoningLevel = useCallback(
    async (level: ReasoningLevel) => {
      try {
        const response = await fetch("/api/user/preferences", {
          body: JSON.stringify({ reasoningLevel: level }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!response.ok) throw new Error("refus serveur");
        mutateUserPrefs({ ...userPrefs, reasoningLevel: level }, false);
        toast.success(`Effort de réflexion : ${REASONING_LEVEL_LABELS[level]}`);
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
    modelsProp ? null : modelCatalogKey(ENDPOINTS[source]),
    (url: string) => fetch(url).then((r) => r.json()),
    {
      dedupingInterval: 60_000,
      // Le catalogue bouge en arrière-plan (modèles ajoutés ou retirés,
      // accès par forfait). On le relit périodiquement même sans
      // interaction : un onglet laissé ouvert ne doit pas proposer un
      // modèle retiré.
      refreshInterval: MODEL_CATALOG_REFRESH_INTERVAL,
      revalidateOnFocus: true,
    }
  );

  /**
   * Sélection d'un modèle : au passage, on revalide les catalogues.
   *
   * Changer de modèle, c'est regarder le catalogue — c'est donc le moment où
   * il doit être à jour. Le contenu de `/v1/models` dépend du forfait : un
   * modèle peut être apparu entre deux consultations. On force la
   * revalidation (`revalidate: true`) pour ne pas resservir la copie mise en
   * cache par SWR.
   *
   * Les six clés (hôte + Site) sont visées : les deux interfaces lisent le
   * même backend filtré par le tier, un catalogue périmé d'un côté l'est
   * forcément de l'autre.
   */
  const { mutate: mutateCatalog } = useSWRConfig();
  const handleModelChange = useCallback(
    (modelId: string) => {
      onModelChange?.(modelId);
      for (const key of MODEL_CATALOG_SWR_KEYS) {
        void mutateCatalog(key, undefined, { revalidate: true });
      }
    },
    [mutateCatalog, onModelChange]
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    capabilitiesProp ?? modelsData?.capabilities;

  // Pendant le SSR et l'hydratation initiale côté client, on s'assure d'utiliser
  // les mêmes modèles de référence (fallbackModels) pour éviter tout écart
  // d'hydratation entre le serveur (qui n'a pas de cache SWR) et le client.
  const activeModelsData = mounted ? modelsData : undefined;

  const rawModels: SharedModel[] =
    modelsProp ??
    (activeModelsData?.models?.length > 0
      ? activeModelsData.models
      : activeModelsData?.data?.length > 0
        ? activeModelsData.data
        : fallbackModels) ??
    [];

  const models: SharedModel[] = useMemo(() => {
    const seen = new Set<string>();
    const res: SharedModel[] = [];
    for (const m of rawModels) {
      if (m?.id && !seen.has(m.id)) {
        seen.add(m.id);
        res.push(m);
      }
    }
    return res;
  }, [rawModels]);

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

  // Le catalogue remonte dans l'ordre de gestion de la source. L'ordre
  // d'AFFICHAGE est decided ailleurs (lib/ai/model-selector/order.ts) : la
  // famille mAI-2 ouvre la liste, le groupe mAI suit.
  const grouped = useMemo(
    () => groupModelsByProvider(filteredModels),
    [filteredModels]
  );

  const activeModel = useMemo(
    () =>
      models.find((m) => m.id === hoveredModelId) ?? selectedModel ?? models[0],
    [models, hoveredModelId, selectedModel]
  );

  return (
    <ModelSelector modal={modal} onOpenChange={handleOpenChange} open={open}>
      <ModelSelectorTrigger asChild>
        {variant === "compact" ? (
          <Button
            className="h-8 max-w-[min(220px,calc(100vw-9rem))] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer sm:h-7 sm:max-w-[220px]"
            data-testid="model-selector"
            disabled={disabled}
            suppressHydrationWarning
            type="button"
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
            disabled={disabled}
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
                    !selectedModelId &&
                      "bg-muted/80 font-medium text-foreground",
                    "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
                  )}
                  onSelect={() => {
                    if (onEmptySelect) {
                      onEmptySelect();
                    } else {
                      handleModelChange("");
                    }
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
                grouped.map(({ models: groupModels, providerKey }) => (
                  <ModelSelectorGroup
                    heading={
                      <span className="flex items-center gap-1.5">
                        <span>
                          {PROVIDER_NAMES[providerKey.toLowerCase()] ||
                            providerKey.toUpperCase()}
                        </span>
                        {providerKey === MAI_PROVIDER_KEY ? (
                          <RecommendedBadge />
                        ) : null}
                      </span>
                    }
                    key={providerKey}
                  >
                    {groupModels.map((model) => (
                      <SharedModelSelectorOption
                        capabilities={capabilities}
                        currentReasoningLevel={displayedReasoningLevel(
                          model,
                          capabilities?.[model.id],
                          userPrefs?.reasoningLevel
                        )}
                        focusInputAfterSelect={focusInputAfterSelect}
                        isMobileExpanded={mobileExpandedModelId === model.id}
                        key={model.id}
                        model={model}
                        onHover={() => setHoveredModelId(model.id)}
                        onModelChange={handleModelChange}
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
                currentReasoningLevel={displayedReasoningLevel(
                  activeModel,
                  capabilities?.[activeModel.id],
                  userPrefs?.reasoningLevel
                )}
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
