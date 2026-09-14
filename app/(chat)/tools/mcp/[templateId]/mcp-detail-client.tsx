"use client";

import {
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  ExternalLinkIcon,
  KeyIcon,
  Loader2Icon,
  LockIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  ZapIcon,
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
import { getMcpCategoryLabel } from "@/lib/mcp-templates/catalog";
import { McpTemplateLogo } from "@/lib/mcp-templates/logo";
import type { McpTemplateManifest } from "@/lib/mcp-templates/types";
import { cn } from "@/lib/utils";

// Fiche détaillée d'un modèle MCP : le même modèle d'expérience que la page
// de détail des Plugins. La fiche couvre identité, capacités (outils du
// transport), permissions, exigences d'authentification, paramètres, niveau
// d'abonnement, état réel (non configuré / configuré / connecté / en erreur)
// et actions. Le champ de token est un input de type password : la valeur
// part en POST vers la route serveur qui chiffre (AES-256-GCM) — elle n'est
// jamais renvoyée au client, journalisée, ni placée dans une URL.

type ConnectionState = "not_configured" | "configured" | "connected" | "error";

function connectionState(params: {
  credentials: { key: string; required: boolean }[];
  enabled: boolean;
  configuredFields: string[];
}): { label: string; state: ConnectionState; tone: string } {
  const required = params.credentials.filter((c) => c.required);
  const missing = required.filter(
    (c) => !params.configuredFields.includes(c.key)
  );
  if (required.length === 0) {
    return params.enabled
      ? {
          label: "Connecté",
          state: "connected",
          tone: "text-emerald-600 dark:text-emerald-400",
        }
      : {
          label: "Configuré (désactivé)",
          state: "configured",
          tone: "text-muted-foreground",
        };
  }
  if (missing.length === 0) {
    return params.enabled
      ? {
          label: "Connecté",
          state: "connected",
          tone: "text-emerald-600 dark:text-emerald-400",
        }
      : {
          label: "Prêt à activer",
          state: "configured",
          tone: "text-amber-600 dark:text-amber-400",
        };
  }
  if (params.configuredFields.length > 0) {
    return {
      label: "Configuration incomplète",
      state: "not_configured",
      tone: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: "Non configuré",
    state: "not_configured",
    tone: "text-muted-foreground",
  };
}

export default function McpDetailClient({
  configuredFields,
  enabled,
  installError,
  installedServerId,
  locked,
  manifest,
  installed,
}: {
  configuredFields: string[];
  enabled: boolean;
  installError: string | null;
  installedServerId: string | null;
  locked: boolean;
  manifest: McpTemplateManifest;
  installed: boolean;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [serverId, setServerId] = useState(installedServerId);
  const [state, setState] = useState({ configuredFields, enabled, installed });
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const connection = connectionState({
    configuredFields: state.configuredFields,
    credentials: manifest.credentials,
    enabled: state.enabled,
  });

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
        fetch("/api/mcp/templates/install", {
          body: JSON.stringify({ templateId: manifest.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      () => {
        void fetch("/api/mcp", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then(
            (
              data: {
                servers?: Array<{ id: string; templateId?: string | null }>;
              } | null
            ) => {
              const match = data?.servers?.find(
                (s) => s.templateId === manifest.id
              );
              if (match) {
                setServerId(match.id);
              }
            }
          )
          .catch(() => {});
        setState((s) => ({ ...s, installed: true }));
      },
      `« ${manifest.name} » installé.`
    );
  };

  const handleToggle = () => {
    if (!state.installed) {
      return;
    }
    runAction(
      () =>
        fetch(`/api/mcp/${serverId}`, {
          body: JSON.stringify({ toggleEnabled: true }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      () => setState((s) => ({ ...s, enabled: !s.enabled })),
      state.enabled ? "Serveur désactivé." : "Serveur activé."
    );
  };

  const handleSaveSecrets = () => {
    const entries = Object.entries(secretDrafts).filter(([, v]) => v.trim());
    if (entries.length === 0) {
      toast.error("Saisissez au moins une valeur avant d'enregistrer.");
      return;
    }
    runAction(
      () =>
        fetch(`/api/mcp/${serverId}`, {
          body: JSON.stringify({
            encryptedSecrets: Object.fromEntries(entries),
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      () => {
        setSecretDrafts({});
        setState((s) => ({
          ...s,
          configuredFields: [
            ...new Set([...s.configuredFields, ...entries.map(([k]) => k)]),
          ],
        }));
      },
      "Secret enregistré (chiffré côté serveur)."
    );
  };

  const handleDelete = () => {
    runAction(
      () => fetch(`/api/mcp/${serverId}`, { method: "DELETE" }),
      () =>
        setState({ configuredFields: [], enabled: false, installed: false }),
      `« ${manifest.name} » déconnecté.`
    );
  };

  const handleSync = () => {
    if (!state.installed || !serverId) {
      return;
    }
    runAction(
      () =>
        fetch(`/api/mcp/${serverId}`, {
          body: JSON.stringify({ refreshTools: true }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      () => {},
      "Outils synchronisés."
    );
  };

  const tierLabel =
    manifest.minTier === "free"
      ? "Tous les forfaits"
      : `Forfait ${manifest.minTier} minimum`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* En-tête : identité + retour */}
      <div className="flex items-start justify-between gap-4">
        <PageBackButton fallbackHref="/tools?tab=mcp" label="Retour" />
      </div>
      <header className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card p-2.5 shadow-sm">
          <McpTemplateLogo
            className="size-full object-contain dark:invert"
            manifest={manifest}
          />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">{manifest.name}</h1>
          <p className="text-sm text-muted-foreground">
            {manifest.description}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              {getMcpCategoryLabel(manifest.category)}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {manifest.transport.toUpperCase()}
              {manifest.authType === "none"
                ? " · sans auth"
                : ` · auth ${manifest.authType}`}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {tierLabel}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              {manifest.readOnly ? "Lecture seule" : "Lecture / écriture"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              Fournisseur : {manifest.author}
            </span>
          </div>
        </div>
      </header>

      {/* État de connexion */}
      <section
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4",
          connection.state === "connected"
            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
            : connection.state === "error" || installError
              ? "border-red-500/30 bg-red-500/[0.04]"
              : "border-border/60 bg-card"
        )}
      >
        {installError ? (
          <AlertTriangleIcon className="size-5 shrink-0 text-red-500" />
        ) : connection.state === "connected" ? (
          <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
        ) : (
          <CircleSlashIcon className="size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">
            État : {installError ? "Indisponible" : connection.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {state.installed
              ? `Serveur installé${state.enabled ? " et activé" : " (désactivé)"} — ${state.configuredFields.length} champ(s) secret(s) renseigné(s).`
              : (installError ??
                "Ce serveur n'est pas encore installé sur votre compte.")}
          </span>
        </div>
        {locked ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <LockIcon className="size-3" />
            {tierLabel}
          </span>
        ) : null}
      </section>

      {/* Actions principales */}
      <div className="flex flex-wrap items-center gap-2">
        {locked ? null : state.installed ? (
          <>
            <Button disabled={isBusy} onClick={handleToggle} variant="outline">
              {isBusy ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ZapIcon className="size-4" />
              )}
              {state.enabled ? "Désactiver" : "Activer"}
            </Button>
            <Button disabled={isBusy} onClick={handleSync} variant="outline">
              <RefreshCwIcon className="size-4" />
              Synchroniser les outils
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => setConfirmDelete(true)}
              variant="destructive"
            >
              <Trash2Icon className="size-4" />
              Déconnecter
            </Button>
          </>
        ) : (
          <Button disabled={isBusy} onClick={handleInstall}>
            {isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ZapIcon className="size-4" />
            )}
            Connecter ce serveur
          </Button>
        )}
        <a
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          href={manifest.docsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon className="size-3" />
          Documentation officielle
        </a>
      </div>

      {/* Champ sécurisé par credential : saisie → chiffrement serveur */}
      {manifest.credentials.length > 0 && !locked ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <KeyIcon className="size-4 text-amber-500" />
            Authentification
          </h2>
          {manifest.credentials.map((credential) => {
            const isConfigured = state.configuredFields.includes(
              credential.key
            );
            return (
              <div className="flex flex-col gap-1.5" key={credential.key}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {credential.label}
                    {credential.required ? (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-600">
                        requis
                      </span>
                    ) : null}
                  </span>
                  {isConfigured ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <ShieldCheckIcon className="size-3" />
                      Renseigné (masqué)
                    </span>
                  ) : null}
                </div>
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
                  Obtenir ce token
                </a>
                <div className="flex items-center gap-2">
                  <input
                    autoComplete="off"
                    className="h-9 flex-1 rounded-xl border border-border/60 bg-background px-3 font-mono text-xs text-foreground outline-none focus:border-primary/50"
                    onChange={(event) =>
                      setSecretDrafts((d) => ({
                        ...d,
                        [credential.key]: event.target.value,
                      }))
                    }
                    placeholder={
                      isConfigured
                        ? "•••••••••••• (laisser vide pour conserver)"
                        : "Collez la valeur ici"
                    }
                    spellCheck={false}
                    type="password"
                    value={secretDrafts[credential.key] ?? ""}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheckIcon className="size-3 text-emerald-500" />
              Chiffré AES-256-GCM côté serveur. Jamais affiché, journalisé ni
              renvoyé au modèle.
            </p>
            <Button
              className="h-8 text-xs"
              disabled={isBusy}
              onClick={handleSaveSecrets}
              size="sm"
            >
              {isBusy ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : null}
              Enregistrer
            </Button>
          </div>
        </section>
      ) : null}

      {/* Mode d'emploi */}
      <section className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <BookOpenIcon className="size-4 text-primary" />
          Configuration pas à pas
        </h2>
        <ol className="flex list-decimal flex-col gap-1 pl-4">
          {manifest.setupInstructions.map((step) => (
            <li
              className="text-[12.5px] leading-relaxed text-muted-foreground"
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Permissions et risques */}
      <section className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Permissions et risques
        </h2>
        <ul className="flex flex-col gap-1 text-[12.5px] text-muted-foreground">
          <li>
            Niveau d'approbation par défaut :{" "}
            <strong className="text-foreground">
              {manifest.requireApproval === "always_allow"
                ? "exécution automatique (lecture seule)"
                : manifest.requireApproval === "write_only"
                  ? "approbation des écritures uniquement"
                  : "approbation à chaque exécution"}
            </strong>
          </li>
          <li>
            {manifest.readOnly
              ? "Ce serveur n'expose que des opérations de lecture."
              : "Ce serveur peut modifier des données côté fournisseur."}
          </li>
          <li>
            Transport {manifest.transport.toUpperCase()}
            {manifest.url
              ? " vers un point de terminaison distant"
              : " via un process local"}{" "}
            — les appels partent du serveur mAI, jamais du navigateur.
          </li>
        </ul>
      </section>

      {/* Confirmation de suppression */}
      <Dialog
        onOpenChange={(open) => !open && setConfirmDelete(false)}
        open={confirmDelete}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Déconnecter « {manifest.name} » ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Les secrets enregistrés pour ce serveur seront supprimés.
            L'historique des exécutions est conservé.
          </p>
          <DialogFooter className="gap-2">
            <Button onClick={() => setConfirmDelete(false)} variant="outline">
              Annuler
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => {
                setConfirmDelete(false);
                handleDelete();
              }}
              variant="destructive"
            >
              {isBusy ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
