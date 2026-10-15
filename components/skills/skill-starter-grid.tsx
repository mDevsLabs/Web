"use client";

import {
  CopyIcon,
  PlusIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { STARTER_TEMPLATES } from "./starter-templates";

export function SkillStarterGrid({
  onSelectTemplate,
}: {
  onSelectTemplate: (template: (typeof STARTER_TEMPLATES)[0]) => void;
}) {
  return (
    <div className="w-full text-left mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Modèles suggérés pour démarrer rapidement :
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STARTER_TEMPLATES.map((tmpl) => (
          <button
            className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
            key={tmpl.name}
            onClick={() => onSelectTemplate(tmpl)}
            type="button"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className="size-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: tmpl.color }}
              >
                <SparklesIcon className="size-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Utiliser +
              </span>
            </div>
            <span className="font-semibold text-xs text-foreground mb-1">
              {tmpl.name}
            </span>
            <span className="text-[11px] text-muted-foreground line-clamp-2">
              {tmpl.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SkillLibraryTemplates({
  skillTemplates,
  onInstallSuccess,
  onSelectStarter,
}: {
  skillTemplates: any[];
  onInstallSuccess: () => void;
  onSelectStarter: (t: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          Bibliothèque — {skillTemplates.length} templates
        </h2>
        <Button
          className="h-7 text-xs"
          onClick={() => {
            const el = document.getElementById("skill-tpl-search");
            el?.focus();
          }}
          size="sm"
          variant="outline"
        >
          Rechercher
        </Button>
      </div>
      {skillTemplates.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-xs text-muted-foreground">
          Chargement marketplace…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skillTemplates.map((tpl: any) => (
            <div
              className="rounded-2xl border bg-card p-4 flex flex-col"
              key={tpl.id}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="size-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: tpl.color || "#6366f1" }}
                >
                  <SparklesIcon className="size-3.5" />
                </div>
                <span className="font-semibold text-xs truncate">
                  {tpl.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                {tpl.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {(tpl.tags ?? []).map((t: string) => (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    key={t}
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 mt-auto">
                <Button
                  className="flex-1 h-7 text-xs"
                  onClick={async () => {
                    try {
                      const r = await fetch("/api/skills/templates", {
                        body: JSON.stringify({ templateId: tpl.id }),
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                      });
                      const d = await r.json();
                      if (!r.ok) {
                        throw new Error(
                          extractApiErrorMessage(d) ||
                            "Erreur lors de l'installation du template."
                        );
                      }
                      toast.success(d.message);
                      onInstallSuccess();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                  size="sm"
                >
                  <PlusIcon className="size-3 mr-1" />
                  Installer
                </Button>
                <Button
                  className="h-7 text-xs"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      JSON.stringify(tpl, null, 2)
                    );
                    toast.success("Template copié !");
                  }}
                  size="sm"
                  variant="outline"
                >
                  <CopyIcon className="size-3 mr-1" />
                  Copier
                </Button>
              </div>
            </div>
          ))}
          {STARTER_TEMPLATES.map((t) => (
            <div
              className="rounded-2xl border border-dashed bg-muted/20 p-4 flex flex-col"
              key={`${t.name}starter`}
            >
              <span className="font-semibold text-xs mb-1">
                {t.name} (starter)
              </span>
              <p className="text-[11px] text-muted-foreground mb-3">
                {t.description}
              </p>
              <Button
                className="h-7 text-xs"
                onClick={() => onSelectStarter(t)}
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
