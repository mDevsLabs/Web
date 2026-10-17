"use client";

import { SearchIcon, TagIcon, XIcon } from "@mdevs/icons";
import { AgentIcon } from "@/components/agents/agent-icon";
import { DEFAULT_AGENT_COLOR } from "@/components/agents/agent-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentTemplate } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export interface AgentTemplateGridProps {
  filteredTemplates: AgentTemplate[];
  onSelectTemplate: (template: AgentTemplate) => void;
  onTemplateModelChange: (model: string | null) => void;
  onTemplateQueryChange: (query: string) => void;
  onTemplateTagChange: (tag: string | null) => void;
  templateModel: string | null;
  templateModelIds: string[];
  templateQuery: string;
  templates: AgentTemplate[];
  templateTag: string | null;
  templateTags: string[];
}

export function AgentTemplateGrid({
  templates,
  filteredTemplates,
  templateQuery,
  onTemplateQueryChange,
  templateModel,
  onTemplateModelChange,
  templateTag,
  onTemplateTagChange,
  templateTags,
  templateModelIds,
  onSelectTemplate,
}: AgentTemplateGridProps) {
  const hasActiveFilters = Boolean(
    templateQuery || templateTag || templateModel
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de recherche et filtres dédiés aux types de bots */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              aria-label="Rechercher un type de bot"
              className="h-8 pl-8 text-xs bg-muted/40"
              onChange={(e) => onTemplateQueryChange(e.target.value)}
              placeholder="Rechercher un type de bot..."
              value={templateQuery}
            />
          </div>

          <select
            aria-label="Filtrer par modèle"
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => onTemplateModelChange(e.target.value || null)}
            value={templateModel ?? ""}
          >
            <option value="">Tous les modèles</option>
            {templateModelIds.map((modelId) => (
              <option key={modelId} value={modelId}>
                {modelId}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                onTemplateQueryChange("");
                onTemplateTagChange(null);
                onTemplateModelChange(null);
              }}
              variant="ghost"
            >
              <XIcon className="size-3.5" />
              Réinitialiser
            </Button>
          )}

          <span className="text-[11px] text-muted-foreground sm:ml-auto">
            {filteredTemplates.length} modèle
            {filteredTemplates.length > 1 ? "s" : ""}
            {filteredTemplates.length !== templates.length &&
              ` sur ${templates.length}`}
          </span>
        </div>

        {templateTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <TagIcon className="size-3.5 text-muted-foreground" />
            {templateTags.map((tag) => (
              <button
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer",
                  templateTag === tag
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-background text-muted-foreground hover:bg-muted"
                )}
                key={tag}
                onClick={() =>
                  onTemplateTagChange(templateTag === tag ? null : tag)
                }
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grille des modèles d'agents */}
      {filteredTemplates.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucun modèle ne correspond à ces filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTemplates.map((t) => (
            <button
              className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
              key={t.id}
              onClick={() => onSelectTemplate(t)}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className="size-8 rounded-lg flex items-center justify-center text-white text-sm"
                  style={{
                    backgroundColor: t.color || DEFAULT_AGENT_COLOR,
                  }}
                >
                  <AgentIcon icon={t.icon} size={16} variant="plain" />
                </div>
                <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Utiliser +
                </span>
              </div>
              <span className="font-semibold text-xs text-foreground mb-1 truncate">
                {t.name}
              </span>
              <span className="text-[11px] text-muted-foreground line-clamp-2">
                {t.description}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate">
                {t.defaultModelId}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
