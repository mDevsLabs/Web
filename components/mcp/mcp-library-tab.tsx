import {
  CheckIcon,
  CopyIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
} from "@mdevs/icons";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { McpServerItem, McpTemplateRow } from "./mcp-types";

export function McpLibraryTab({
  installableTemplates,
  templates,
  servers = [],
  mutateTpl,
  handleInstallTemplate,
  handleCopyTemplate,
  handleNewServer,
}: {
  installableTemplates: McpTemplateRow[];
  templates: McpTemplateRow[];
  servers?: McpServerItem[];
  mutateTpl: () => void;
  handleInstallTemplate: (tpl: McpTemplateRow) => void;
  handleCopyTemplate: (tpl: McpTemplateRow) => void;
  handleNewServer: (tpl?: McpTemplateRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyReady, setOnlyReady] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (onlyReady && tpl.activation !== "ready") return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        tpl.transport.toLowerCase().includes(q)
      );
    });
  }, [onlyReady, query, templates]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">
            Bibliothèque MCP — {installableTemplates.length} modèles
            installables sur {templates.length}
          </h2>
          <p className="text-xs text-muted-foreground">
            Installez en 1 clic ou personnalisez un modèle avant connexion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="chip text-xs"
            data-active={onlyReady}
            onClick={() => setOnlyReady((v) => !v)}
            type="button"
          >
            Prêts uniquement ({installableTemplates.length})
          </button>
          <Button onClick={() => mutateTpl()} size="sm" variant="outline">
            Actualiser
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          aria-label="Filtrer la bibliothèque MCP"
          className="h-9 pl-8 text-xs"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un modèle, tag ou transport…"
          value={query}
        />
      </div>

      {templates.length === 0 ? (
        <div className="text-xs text-muted-foreground p-8 border rounded-xl text-center">
          Chargement du catalogue…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground p-8 border rounded-xl text-center">
          Aucun modèle ne correspond à votre filtre.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tpl) => {
            const installed = servers.find(
              (s) => (s.templateId ?? null) === tpl.id || s.name === tpl.name
            );
            return (
              <div
                className={cn(
                  "rounded-2xl border bg-card p-4 flex flex-col",
                  installed ? "border-success/30" : "border-border/60"
                )}
                key={tpl.id}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-xs truncate">
                    {tpl.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {installed && (
                      <Badge
                        className="border-success/30 bg-success/10 text-[10px] text-success"
                        variant="outline"
                      >
                        <CheckIcon className="size-2.5 mr-0.5" />
                        Installé
                      </Badge>
                    )}
                    <Badge className="text-[10px] uppercase" variant="outline">
                      {tpl.transport}
                    </Badge>
                    {tpl.activation === "requires_oauth_flow" ? (
                      <Badge
                        className="border-warning/30 bg-warning/10 text-[10px] text-warning"
                        variant="outline"
                      >
                        OAuth requise
                      </Badge>
                    ) : tpl.activation === "requires_vetted_stdio" ? (
                      <Badge
                        className="border-warning/30 bg-warning/10 text-[10px] text-warning"
                        variant="outline"
                      >
                        stdio à vérifier
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                  {tpl.description}
                </p>
                <div className="flex gap-1.5 mt-auto">
                  <Button
                    className="flex-1 h-7 text-xs"
                    disabled={tpl.activation !== "ready" || Boolean(installed)}
                    onClick={() => handleInstallTemplate(tpl)}
                    size="sm"
                    title={
                      installed
                        ? "Modèle déjà installé dans vos serveurs"
                        : tpl.activation === "ready"
                          ? undefined
                          : tpl.activation === "requires_vetted_stdio"
                            ? "Wrapper stdio non vérifié : installation indisponible pour le moment."
                            : "Flux OAuth interactif non pris en charge : installation indisponible pour le moment."
                    }
                  >
                    <PlusIcon className="size-3 mr-1" />
                    {installed ? "Installé" : "Installer"}
                  </Button>
                  {tpl.activation === "ready" && (
                    <Button
                      className="h-7 text-xs"
                      onClick={() => handleNewServer(tpl)}
                      size="sm"
                      title="Pré-remplir et personnaliser avant création"
                      variant="outline"
                    >
                      <SlidersIcon className="size-3 mr-1" />
                      Configurer
                    </Button>
                  )}
                  <Button
                    className="h-7 px-2 text-xs"
                    onClick={() => handleCopyTemplate(tpl)}
                    size="sm"
                    title="Copier le JSON du modèle"
                    variant="ghost"
                  >
                    <CopyIcon className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
