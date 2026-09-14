"use client";

import {
  BookOpenIcon,
  CheckCircle2Icon,
  CpuIcon,
  ExternalLinkIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { SkillTemplateIcon } from "@/lib/mcp-templates/icon";
import type { SkillTemplateManifest } from "@/lib/skill-templates/types";
import { cn } from "@/lib/utils";

// Fiche détaillée d'un Skill : le même modèle d'expérience que les Plugins et
// les MCP. Identité, instructions système, outils autorisés, serveurs MCP
// requis, paramètres, niveau d'abonnement, état d'installation et actions.
// Toute action passe par les routes serveur existantes (/api/skills/...).

export default function SkillDetailClient({
  categoryLabel,
  installedSkillId,
  locked,
  manifest,
  installed,
}: {
  categoryLabel: string;
  installedSkillId: string | null;
  locked: boolean;
  manifest: SkillTemplateManifest;
  installed: boolean;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [skillId, setSkillId] = useState(installedSkillId);
  const [state, setState] = useState({ installed });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const runAction = async (
    action: () => Promise<Response>,
    onSuccess: () => void,
    successMessage: string
  ) => {
    setIsBusy(true);
    try {
      const response = await action();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          extractApiErrorMessage(payload) || "Action impossible."
        );
      }
      onSuccess();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleInstall = () => {
    runAction(
      () =>
        fetch("/api/skills/templates/install", {
          body: JSON.stringify({ templateId: manifest.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      () => setState({ installed: true }),
      `« ${manifest.name} » installé — utilisez-le dans le chat avec @.`
    );
  };

  const handleUninstall = () => {
    if (!skillId) {
      return;
    }
    runAction(
      () => fetch(`/api/skills/${skillId}`, { method: "DELETE" }),
      () => {
        setSkillId(null);
        setState({ installed: false });
      },
      `« ${manifest.name} » désinstallé.`
    );
  };

  const tierLabel =
    manifest.minTier === "free"
      ? "Tous les forfaits"
      : `Forfait ${manifest.minTier} minimum`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <PageBackButton fallbackHref="/tools?tab=skills" label="Retour" />
      </div>

      {/* En-tête : identité */}
      <header className="flex items-start gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: manifest.color }}
        >
          <SkillTemplateIcon className="size-7" icon={manifest.icon} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">{manifest.name}</h1>
          <p className="text-sm text-muted-foreground">
            {manifest.description}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              {categoryLabel}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              Auteur : {manifest.author}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {tierLabel}
            </span>
          </div>
        </div>
      </header>

      {/* État */}
      <section
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4",
          state.installed
            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
            : "border-border/60 bg-card"
        )}
      >
        {state.installed ? (
          <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
        ) : (
          <PlusIcon className="size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">
            {state.installed ? "Installé" : "Non installé"}
          </span>
          <span className="text-xs text-muted-foreground">
            {state.installed
              ? "Ce skill est disponible dans le chat (mention @) et dans Agent."
              : "Installez ce skill pour l'utiliser dans vos conversations."}
          </span>
        </div>
        {locked ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <LockIcon className="size-3" />
            {tierLabel}
          </span>
        ) : null}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {locked ? null : state.installed ? (
          <Button
            disabled={isBusy}
            onClick={() => setConfirmDelete(true)}
            variant="destructive"
          >
            {isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            Désinstaller
          </Button>
        ) : (
          <Button disabled={isBusy} onClick={handleInstall}>
            {isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Installer ce skill
          </Button>
        )}
      </div>

      {/* Instructions système */}
      <section className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <BookOpenIcon className="size-4 text-primary" />
          Instructions système
        </h2>
        <p className="rounded-xl border border-border/40 bg-muted/30 p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {manifest.instructions}
        </p>
      </section>

      {/* Outils + MCP */}
      <section className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <WrenchIcon className="size-4 text-primary" />
          Outils autorisés
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {manifest.tools.map((tool) => (
            <span
              className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground"
              key={tool}
            >
              {tool}
            </span>
          ))}
          {manifest.mcpServerNames.map((name) => (
            <span
              className="inline-flex items-center rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-violet-600 dark:text-violet-400"
              key={name}
            >
              MCP : {name}
            </span>
          ))}
        </div>
        {manifest.mcpServerNames.length > 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Ce skill exploite des serveurs MCP : connectez-les d'abord dans
            l'onglet MCP de la page Outils.
          </p>
        ) : null}
      </section>

      {/* Paramètres */}
      {manifest.parameters.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CpuIcon className="size-4 text-primary" />
            Paramètres
          </h2>
          <ul className="flex flex-col gap-1.5">
            {manifest.parameters.map((parameter) => (
              <li
                className="text-[12.5px] text-muted-foreground"
                key={parameter.name}
              >
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                  {parameter.name}
                </code>
                {parameter.required ? (
                  <span className="ml-1 text-[10px] font-semibold text-amber-600">
                    requis
                  </span>
                ) : null}
                {parameter.description ? ` — ${parameter.description}` : null}
                {parameter.defaultValue
                  ? ` (défaut : ${parameter.defaultValue})`
                  : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Confirmation */}
      <Dialog
        onOpenChange={(open) => !open && setConfirmDelete(false)}
        open={confirmDelete}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Désinstaller « {manifest.name} » ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le skill sera retiré de votre compte. Vous pourrez le réinstaller
            depuis le catalogue à tout moment.
          </p>
          <DialogFooter className="gap-2">
            <Button onClick={() => setConfirmDelete(false)} variant="outline">
              Annuler
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => {
                setConfirmDelete(false);
                handleUninstall();
              }}
              variant="destructive"
            >
              {isBusy ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Désinstaller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
