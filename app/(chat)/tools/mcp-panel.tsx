"use client";

import {
  BookOpenIcon,
  CheckIcon,
  ExternalLinkIcon,
  KeyIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import {
  buildMcpTemplateEntries,
  MCP_CATEGORIES,
} from "@/lib/mcp-templates/catalog";
import { McpTemplateIcon } from "@/lib/mcp-templates/icon";
import type { McpTemplateCatalogEntry } from "@/lib/mcp-templates/types";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { cn, fetcher } from "@/lib/utils";

type McpServersResponse = {
  servers: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
  }>;
};

// Panneau MCP de la page Outils : la recherche est la barre globale de
// l'en-tête (aucune recherche locale) et les boutons d'action sont portés
// dans la rangée globale via un portail.
export default function McpPanel({
  searchQuery = "",
}: {
  searchQuery?: string;
} = {}) {
  const { data, isLoading, mutate } = useSWR<McpServersResponse>(
    "/api/mcp",
    fetcher
  );
  const servers = useMemo(() => data?.servers ?? [], [data]);
  const [category, setCategory] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [details, setDetails] = useState<McpTemplateCatalogEntry | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
  }, []);

  // Le catalogue de la page est le manifeste statique enrichi de l'état
  // d'installation renvoyé par l'API (correspondance par nom de serveur).
  const merged = useMemo(() => buildMcpTemplateEntries(servers), [servers]);
  const installed = merged.filter((t) => t.installed);

  async function runAction(
    templateId: string,
    action: () => Promise<Response>,
    successMessage: string
  ) {
    setBusyTemplateId(templateId);
    try {
      const response = await action();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          extractApiErrorMessage(payload) || "Action impossible."
        );
      }
      await mutate();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setBusyTemplateId(null);
    }
  }

  const handleConnect = (template: McpTemplateCatalogEntry) => {
    if (template.installed) {
      return;
    }
    runAction(
      template.id,
      () =>
        fetch("/api/mcp/templates/install", {
          body: JSON.stringify({ templateId: template.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      `${template.name} connecté — les instructions de tokens restent accessibles sur la fiche.`
    );
  };

  const handleToggle = (template: McpTemplateCatalogEntry) => {
    if (!template.installedServerId) {
      return;
    }
    runAction(
      template.id,
      () =>
        fetch(`/api/mcp/${template.installedServerId}`, {
          body: JSON.stringify({ toggleEnabled: true }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      template.enabled
        ? `${template.name} désactivé.`
        : `${template.name} activé.`
    );
  };

  const handleDisconnect = (template: McpTemplateCatalogEntry) => {
    if (!template.installedServerId) {
      return;
    }
    runAction(
      template.id,
      () =>
        fetch(`/api/mcp/${template.installedServerId}`, { method: "DELETE" }),
      `${template.name} déconnecté.`
    );
  };

  // Recherche globale : filtrage par catégorie + correspondance, puis tri par
  // pertinence (nom > description > tags) et alphabétiquement.
  const filtered = useMemo(() => {
    const matching = merged.filter(
      (template) =>
        (!category || template.category === category) &&
        matchesQuery(searchQuery, {
          primary: template.name,
          secondary: [template.description, template.transport],
          tags: template.tags,
        })
    );
    return sortByRelevance(matching, searchQuery, (template) => ({
      primary: template.name,
      secondary: [template.description, template.transport],
      tags: template.tags,
    }));
  }, [merged, searchQuery, category]);

  const sortedInstalled = useMemo(
    () =>
      sortByRelevance(installed, searchQuery, (template) => ({
        primary: template.name,
        secondary: [template.description, template.transport],
        tags: template.tags,
      })),
    [installed, searchQuery]
  );

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Boutons portés dans la rangée globale (recherche dans l'en-tête). */}
      {actionsAnchor
        ? createPortal(
            <Button
              className="h-8 shrink-0 gap-1.5 text-xs font-medium"
              onClick={() => window.open("/mcp", "_blank")}
              variant="outline"
            >
              <SettingsIcon className="size-3.5" />
              Avancé
            </Button>,
            actionsAnchor
          )
        : null}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Chargement du catalogue…
        </div>
      ) : null}

      {/* Connectés */}
      {installed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Connectés</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sortedInstalled.map((template) => (
              <button
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm transition hover:scale-105 cursor-pointer",
                  !template.enabled && "opacity-45"
                )}
                key={template.id}
                onClick={() => setDetails(template)}
                title={`${template.name} — ${template.enabled ? "actif" : "inactif"}`}
                type="button"
              >
                <McpTemplateIcon className="size-6" icon={template.icon} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Catégories */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            category === null
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setCategory(null)}
          type="button"
        >
          Toutes
        </button>
        {MCP_CATEGORIES.map((cat) => (
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              category === cat.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            type="button"
          >
            <McpTemplateIcon
              className="size-3.5"
              icon={{ name: cat.icon, type: "lucide" }}
            />
            {cat.label}
          </button>
        ))}
      </section>

      {/* Catalogue */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Tous les modèles
        </h3>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun modèle MCP ne correspond à votre recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((template) => {
              const isBusy = busyTemplateId === template.id;
              return (
                <div
                  className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border/50 hover:bg-muted/30"
                  key={template.id}
                >
                  <button
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm cursor-pointer"
                    onClick={() => setDetails(template)}
                    title={`${template.name} — voir la fiche`}
                    type="button"
                  >
                    <McpTemplateIcon className="size-5" icon={template.icon} />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {template.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  </div>
                  {template.installed ? (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={isBusy}
                      onClick={() => handleToggle(template)}
                      title={template.enabled ? "Désactiver" : "Activer"}
                      variant="outline"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon
                          className={cn(
                            "size-4",
                            template.enabled
                              ? "text-emerald-500"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={isBusy}
                      onClick={() => handleConnect(template)}
                      title="Connecter"
                      variant="ghost"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <PlusIcon className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Détails d'un modèle MCP : instructions de tokens + actions */}
      <Dialog
        onOpenChange={(open) => !open && setDetails(null)}
        open={Boolean(details)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
          {details ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
                    <McpTemplateIcon className="size-5" icon={details.icon} />
                  </span>
                  <div>
                    <DialogTitle>{details.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1.5">
                      {details.transport.toUpperCase()}
                      {details.authType === "none"
                        ? " · sans auth"
                        : ` · auth ${details.authType}`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {details.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {details.tags.map((tag) => (
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Où trouver les tokens */}
              {details.credentials.length > 0 ? (
                <section className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <KeyIcon className="size-3.5 text-amber-500" />
                    Où trouver les tokens
                  </h4>
                  {details.credentials.map((credential) => (
                    <div className="flex flex-col gap-1" key={credential.key}>
                      <span className="text-xs font-medium text-foreground">
                        {credential.label}
                        {credential.required ? (
                          <span className="ml-1 text-[10px] font-semibold text-amber-600">
                            requis
                          </span>
                        ) : (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            optionnel
                          </span>
                        )}
                      </span>
                      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                        {credential.instructions}
                      </p>
                      <a
                        className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        href={credential.docsUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLinkIcon className="size-3" />
                        Ouvrir la page des tokens
                      </a>
                    </div>
                  ))}
                </section>
              ) : null}

              {/* Mode d'emploi */}
              <section className="flex flex-col gap-1.5">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <BookOpenIcon className="size-3.5 text-primary" />
                  Configuration pas à pas
                </h4>
                <ol className="flex flex-col gap-1">
                  {details.setupInstructions.map((step) => (
                    <li
                      className="text-[11.5px] leading-relaxed text-muted-foreground"
                      key={step}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </section>

              <DialogFooter className="gap-2">
                {details.installed ? (
                  <>
                    <Button
                      disabled={busyTemplateId === details.id}
                      onClick={() => {
                        handleDisconnect(details);
                        setDetails(null);
                      }}
                      variant="destructive"
                    >
                      <Trash2Icon className="size-4" />
                      Déconnecter
                    </Button>
                    <Button
                      disabled={busyTemplateId === details.id}
                      onClick={() => handleToggle(details)}
                      variant="outline"
                    >
                      <ZapIcon className="size-4" />
                      {details.enabled ? "Désactiver" : "Activer"}
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled={busyTemplateId === details.id}
                    onClick={() => {
                      handleConnect(details);
                      setDetails(null);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    Connecter
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
