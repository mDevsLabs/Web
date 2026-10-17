import { CopyIcon, PlusIcon } from "@mdevs/icons";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { McpTemplateRow } from "./mcp-types";

export function McpLibraryTab({
  installableTemplates,
  templates,
  mutateTpl,
  handleInstallTemplate,
  handleCopyTemplate,
  handleNewServer,
}: {
  installableTemplates: McpTemplateRow[];
  templates: McpTemplateRow[];
  mutateTpl: () => void;
  handleInstallTemplate: (tpl: McpTemplateRow) => void;
  handleCopyTemplate: (tpl: McpTemplateRow) => void;
  handleNewServer: (tpl?: McpTemplateRow) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          Bibliothèque MCP — {installableTemplates.length} modèles installables
          sur {templates.length}
        </h2>
        <Button onClick={() => mutateTpl()} size="sm" variant="outline">
          Actualiser
        </Button>
      </div>
      {templates.length === 0 ? (
        <div className="text-xs text-muted-foreground p-8 border rounded-xl text-center">
          Chargement marketplace...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <div
              className="rounded-2xl border bg-card p-4 flex flex-col"
              key={tpl.id}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs">{tpl.name}</span>
                <div className="flex items-center gap-1.5">
                  <Badge className="text-[10px]" variant="outline">
                    {tpl.transport}
                  </Badge>
                  {tpl.activation === "requires_oauth_flow" ? (
                    <Badge
                      className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
                      variant="outline"
                    >
                      OAuth requise
                    </Badge>
                  ) : tpl.activation === "requires_vetted_stdio" ? (
                    <Badge
                      className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
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
                  disabled={tpl.activation !== "ready"}
                  onClick={() => handleInstallTemplate(tpl)}
                  size="sm"
                  title={
                    tpl.activation === "ready"
                      ? undefined
                      : tpl.activation === "requires_vetted_stdio"
                        ? "Wrapper stdio non vérifié : installation indisponible pour le moment."
                        : "Flux OAuth interactif non pris en charge : installation indisponible pour le moment."
                  }
                >
                  <PlusIcon className="size-3 mr-1" />
                  Installer
                </Button>
                <Button
                  className="h-7 text-xs"
                  onClick={() => handleCopyTemplate(tpl)}
                  size="sm"
                  variant="outline"
                >
                  <CopyIcon className="size-3 mr-1" />
                  Copier
                </Button>
              </div>
            </div>
          ))}
          {installableTemplates.map((t) => (
            <div
              className="rounded-2xl border border-dashed bg-muted/20 p-4 flex flex-col"
              key={`${t.id}preset`}
            >
              <span className="font-semibold text-xs mb-1">
                {t.name} (pré-remplissage)
              </span>
              <p className="text-[11px] text-muted-foreground mb-3">
                {t.description}
              </p>
              <Button
                className="h-7 text-xs"
                onClick={() => handleNewServer(t)}
                size="sm"
                variant="outline"
              >
                Utiliser
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
