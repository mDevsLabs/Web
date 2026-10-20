"use client";

/**
 * Sélecteur de modèle du Site — variante à groupes libres.
 *
 * Le playground regroupe par fournisseur (le seul découpage naturel d'un
 * catalogue de modèles). La page Configuration, elle, distingue deux
 * populations qui ne se mélangent pas : les modèles mAI locaux (Ollama) et
 * les modèles du catalogue Cloud `/v1/models`. Le même composant de base
 * (`components/site/model-selector.tsx`) sert aux deux ; seul le découpage
 * change.
 *
 * Un bouton de rafraîchissement accompagne la recherche : le catalogue est
 * revalidé toutes les 10 minutes, mais l'utilisateur qui attend un modèle
 * fraîchement publié ne doit pas attendre le timer.
 */

import { RefreshCwIcon as RefreshCw } from "@mdevs/icons";
import { useCallback, useMemo, useState } from "react";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/site/model-selector";
import { ModelSelectorLogo } from "@/lib/ai/model-selector/logo";
import { resolveProviderKey } from "@/lib/ai/model-selector/provider";
import type { SharedModel } from "@/lib/ai/model-selector/types";
import { cn } from "@/lib/utils";

/** Un groupe d'options, avec son titre affiché dans la liste. */
export type ModelOptionGroup = {
  heading: string;
  models: SharedModel[];
};

export type SiteModelSelectorProps = {
  groups: ModelOptionGroup[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  /** Revalidation forcée du catalogue. */
  onRefresh: () => Promise<unknown> | undefined;
  isRefreshing?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/** Retire les accents et met en minuscules, pour une recherche tolérante. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function SiteModelSelector({
  groups,
  selectedModelId,
  onSelectModel,
  onRefresh,
  isRefreshing = false,
  placeholder = "Choisir un modèle",
  disabled = false,
  className,
}: SiteModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const allModels = useMemo(
    () => groups.flatMap((group) => group.models),
    [groups]
  );

  const selectedModel = useMemo(
    () => allModels.find((model) => model.id === selectedModelId),
    [allModels, selectedModelId]
  );

  const filteredGroups = useMemo(() => {
    const query = normalize(search.trim());
    return (
      groups
        .map((group) => ({
          heading: group.heading,
          models: query
            ? group.models.filter((model) =>
                normalize(
                  `${model.name} ${model.id} ${model.description ?? ""} ${resolveProviderKey(model)}`
                ).includes(query)
              )
            : group.models,
        }))
        // Un groupe vide afficherait un titre orphelin : la cible inactive
        // (Ollama, Cloud) ne montre que ce qui est réellement disponible.
        .filter((group) => group.models.length > 0)
    );
  }, [groups, search]);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [onRefresh]);

  const spinning = isRefreshing || isManualRefreshing;

  return (
    <ModelSelector
      modal
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
      open={open}
    >
      <ModelSelectorTrigger asChild>
        <button
          className={cn(
            "w-full justify-between gap-2 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-left text-sm text-slate-900 shadow-xs transition-colors hover:bg-white disabled:opacity-60",
            className
          )}
          data-testid="site-model-selector"
          disabled={disabled}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedModel ? (
              <ModelSelectorLogo provider={resolveProviderKey(selectedModel)} />
            ) : null}
            <ModelSelectorName suppressHydrationWarning>
              {selectedModel?.name ?? placeholder}
            </ModelSelectorName>
          </span>
        </button>
      </ModelSelectorTrigger>

      <ModelSelectorContent
        className="w-[min(360px,calc(100vw-2rem))] overflow-hidden"
        commandDefaultValue={selectedModelId}
        shouldFilter={false}
      >
        {/* Barre de recherche + bouton de rafraîchissement */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pr-1.5">
          <ModelSelectorInput
            onValueChange={setSearch}
            placeholder="Rechercher un modèle…"
            value={search}
          />
          <button
            aria-label="Rafraîchir les modèles disponibles"
            className="shrink-0 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={spinning}
            onClick={handleRefresh}
            title="Rafraîchir les modèles disponibles"
            type="button"
          >
            <RefreshCw className={cn("size-4", spinning && "animate-spin")} />
          </button>
        </div>

        <ModelSelectorList className="max-h-[320px] overflow-y-auto p-1">
          {filteredGroups.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Aucun modèle trouvé pour « {search} »
            </p>
          ) : (
            filteredGroups.map((group) => (
              <ModelSelectorGroup heading={group.heading} key={group.heading}>
                {group.models.map((model) => (
                  <ModelSelectorItem
                    className={cn(
                      "flex w-full cursor-pointer flex-col transition-colors px-3 py-2",
                      model.id === selectedModelId && "bg-purple-50 font-medium"
                    )}
                    key={model.id}
                    onSelect={() => {
                      onSelectModel(model.id);
                      setOpen(false);
                    }}
                    value={`${model.name} ${model.id} ${model.description ?? ""}`}
                  >
                    <div className="flex w-full min-w-0 items-center">
                      <ModelSelectorLogo provider={resolveProviderKey(model)} />
                      <div className="flex min-w-0 flex-col pr-2">
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                        {model.description ? (
                          <span className="line-clamp-1 text-[11px] text-slate-500">
                            {model.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            ))
          )}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
