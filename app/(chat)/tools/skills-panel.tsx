"use client";

import {
  BookOpenIcon,
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
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
  buildSkillTemplateEntries,
  SKILL_CATEGORIES,
} from "@/lib/skill-templates/catalog";
import { SkillTemplateIcon } from "@/lib/skill-templates/icon";
import type { SkillTemplateCatalogEntry } from "@/lib/skill-templates/types";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { cn, fetcher } from "@/lib/utils";

type SkillLite = {
  id: string;
  name: string;
  /** Slug du modèle d'origine — appariement exact catalogue ↔ installation. */
  templateId?: string | null;
};

function SkillGlyph({ color }: { color: string }) {
  return (
    <span
      className="flex size-7 items-center justify-center rounded-lg text-white"
      style={{ backgroundColor: color }}
    >
      <SparklesIcon className="size-3.5" />
    </span>
  );
}

// Panneau Skills de la page Outils : la recherche est la barre globale de
// l'en-tête (aucune recherche locale) et les boutons d'action sont portés
// dans la rangée globale via un portail.
export default function SkillsPanel({
  searchQuery = "",
}: {
  searchQuery?: string;
} = {}) {
  // L'API /api/skills renvoie directement la liste des skills de l'utilisateur.
  const { data, isLoading, mutate } = useSWR<SkillLite[]>(
    "/api/skills",
    fetcher
  );
  const skills = useMemo(() => data ?? [], [data]);
  const [category, setCategory] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [details, setDetails] = useState<SkillTemplateCatalogEntry | null>(
    null
  );
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
  }, []);

  // Le catalogue de la page est le manifeste statique enrichi de l'état
  // d'installation renvoyé par l'API (correspondance par nom de skill).
  const merged = useMemo(() => buildSkillTemplateEntries(skills), [skills]);
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

  const handleInstall = (template: SkillTemplateCatalogEntry) => {
    if (template.installed) {
      return;
    }
    runAction(
      template.id,
      () =>
        fetch("/api/skills/templates/install", {
          body: JSON.stringify({ templateId: template.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      `${template.name} installé — utilisez-le dans le chat avec @.`
    );
  };

  const handleUninstall = (template: SkillTemplateCatalogEntry) => {
    if (!template.installedSkillId) {
      return;
    }
    runAction(
      template.id,
      () =>
        fetch(`/api/skills/${template.installedSkillId}`, {
          method: "DELETE",
        }),
      `${template.name} désinstallé.`
    );
  };

  // Recherche globale : filtrage par catégorie + correspondance, puis tri par
  // pertinence (nom > description > instructions > tags) et alphabétiquement.
  const filtered = useMemo(() => {
    const matching = merged.filter(
      (template) =>
        (!category || template.category === category) &&
        matchesQuery(searchQuery, {
          primary: template.name,
          secondary: [template.description, template.instructions],
          tags: template.tags,
        })
    );
    return sortByRelevance(matching, searchQuery, (template) => ({
      primary: template.name,
      secondary: [template.description, template.instructions],
      tags: template.tags,
    }));
  }, [merged, searchQuery, category]);

  const sortedInstalled = useMemo(
    () =>
      sortByRelevance(installed, searchQuery, (template) => ({
        primary: template.name,
        secondary: [template.description, template.instructions],
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
              onClick={() => window.open("/skills", "_blank")}
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

      {/* Installés */}
      {installed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Installés</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sortedInstalled.map((template) => (
              <a
                className="flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm transition hover:scale-105 cursor-pointer"
                href={`/tools/skills/${template.id}`}
                key={template.id}
                title={`${template.name} — voir la fiche`}
              >
                <SkillGlyph color={template.color} />
              </a>
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
        {SKILL_CATEGORIES.map((cat) => (
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
            <SkillTemplateIcon
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
            Aucun modèle de skill ne correspond à votre recherche.
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
                  <a
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm cursor-pointer"
                    href={`/tools/skills/${template.id}`}
                    title={`${template.name} — voir la fiche détaillée`}
                  >
                    <SkillGlyph color={template.color} />
                  </a>
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
                      onClick={() => handleUninstall(template)}
                      title="Désinstaller"
                      variant="outline"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon className="size-4 text-emerald-500" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={isBusy}
                      onClick={() => handleInstall(template)}
                      title="Installer"
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

      {/* Détails d'un modèle de skill */}
      <Dialog
        onOpenChange={(open) => !open && setDetails(null)}
        open={Boolean(details)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
          {details ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <SkillGlyph color={details.color} />
                  <div>
                    <DialogTitle>{details.name}</DialogTitle>
                    <DialogDescription>
                      {details.author} ·{" "}
                      {SKILL_CATEGORIES.find((c) => c.id === details.category)
                        ?.label ?? details.category}
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

              {/* Instructions */}
              <section className="flex flex-col gap-1.5">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <BookOpenIcon className="size-3.5 text-primary" />
                  Instructions système
                </h4>
                <p className="rounded-xl border border-border/40 bg-muted/30 p-2.5 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {details.instructions}
                </p>
              </section>

              {/* Outils + MCP */}
              <section className="flex flex-col gap-1.5">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <WrenchIcon className="size-3.5 text-primary" />
                  Outils associés
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {details.tools.map((tool) => (
                    <span
                      className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground"
                      key={tool}
                    >
                      {tool}
                    </span>
                  ))}
                  {details.mcpServerNames.map((name) => (
                    <span
                      className="inline-flex items-center rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-violet-600 dark:text-violet-400"
                      key={name}
                    >
                      MCP : {name}
                    </span>
                  ))}
                </div>
                {details.mcpServerNames.length > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Ce skill exploite des serveurs MCP : connectez-les d'abord
                    dans l'onglet MCP (Google Drive, Slack, Sentry…).
                  </p>
                ) : null}
              </section>

              <DialogFooter className="gap-2">
                {details.installed ? (
                  <Button
                    disabled={busyTemplateId === details.id}
                    onClick={() => {
                      handleUninstall(details);
                      setDetails(null);
                    }}
                    variant="destructive"
                  >
                    <Trash2Icon className="size-4" />
                    Désinstaller
                  </Button>
                ) : (
                  <Button
                    disabled={busyTemplateId === details.id}
                    onClick={() => {
                      handleInstall(details);
                      setDetails(null);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    Installer
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
