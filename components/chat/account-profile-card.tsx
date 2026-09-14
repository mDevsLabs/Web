"use client";

import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveChat } from "@/hooks/use-active-chat";
import { PROFILE_STATUS } from "@/lib/ai/tools/account-status";
import type {
  ProfileChanges,
  ProfileCurrent,
  UpdateAccountProfileOutput,
} from "@/lib/ai/tools/update-account-profile";
import { cn } from "@/lib/utils";

type AccountProfileCardProps = {
  args?: { phone?: string; reason?: string; username?: string };
  output?: UpdateAccountProfileOutput;
  state: string;
  toolCallId: string;
  isReadonly?: boolean;
};

type ChangeRow = { from: string; label: string; to: string };

function fmtUsername(value: string | null): string {
  return value ? `@${value}` : "—";
}

function fmtPhone(value: string | null): string {
  return value || "—";
}

function statusBadge(status?: string) {
  switch (status) {
    case PROFILE_STATUS.AWAITING:
      return {
        className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        label: "En attente",
      };
    case PROFILE_STATUS.SUBMITTED:
      return {
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        label: "Succès",
      };
    case PROFILE_STATUS.INVALID:
      return { className: "bg-red-500/15 text-red-600", label: "Erreur" };
    case PROFILE_STATUS.CANCELLED:
      return { className: "bg-muted text-muted-foreground", label: "Annulé" };
    case PROFILE_STATUS.NO_CHANGE:
      return {
        className: "bg-muted text-muted-foreground",
        label: "Aucun changement",
      };
    default:
      return {
        className: "bg-sky-500/20 text-sky-600 dark:text-sky-400 animate-pulse",
        label: "Préparation…",
      };
  }
}

export function AccountProfileCard({
  args,
  output,
  state: _state,
  toolCallId,
  isReadonly,
}: AccountProfileCardProps) {
  const { addToolOutput, messages } = useActiveChat();
  const { mutate } = useSWRConfig();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = output?.status;
  const badge = statusBadge(status);

  // addToolOutput ne patche que le dernier message : une confirmation depuis un
  // message plus ancien serait silencieusement perdue → vue « expirée ».
  const isInLastMessage = useMemo(() => {
    const last = messages.at(-1);
    return Boolean(
      last?.parts?.some(
        (part) => (part as { toolCallId?: string }).toolCallId === toolCallId
      )
    );
  }, [messages, toolCallId]);

  const isAwaiting = status === PROFILE_STATUS.AWAITING;
  const canInteract = isAwaiting && isInLastMessage && !isReadonly;

  const changes: ProfileChanges | undefined =
    output && output.status === PROFILE_STATUS.AWAITING
      ? output.changes
      : undefined;

  const currentValues: ProfileCurrent | undefined =
    output && "current" in output ? output.current : undefined;

  const changeRows = useMemo<ChangeRow[]>(() => {
    if (!output) {
      return [];
    }
    if (output.status === PROFILE_STATUS.SUBMITTED) {
      const rows: ChangeRow[] = [];
      if (output.previous.username !== output.current.username) {
        rows.push({
          from: fmtUsername(output.previous.username),
          label: "Nom d'utilisateur",
          to: fmtUsername(output.current.username),
        });
      }
      if ((output.previous.phone ?? "") !== (output.current.phone ?? "")) {
        rows.push({
          from: fmtPhone(output.previous.phone),
          label: "Téléphone",
          to: fmtPhone(output.current.phone),
        });
      }
      return rows;
    }
    if (output.status === PROFILE_STATUS.AWAITING) {
      const rows: ChangeRow[] = [];
      if (output.changes.username) {
        rows.push({
          from: fmtUsername(output.changes.username.from),
          label: "Nom d'utilisateur",
          to: fmtUsername(output.changes.username.to),
        });
      }
      if (output.changes.phone) {
        rows.push({
          from: fmtPhone(output.changes.phone.from),
          label: "Téléphone",
          to: fmtPhone(output.changes.phone.to),
        });
      }
      return rows;
    }
    return [];
  }, [output]);

  const sendOutput = (next: UpdateAccountProfileOutput) => {
    addToolOutput({
      output: next,
      tool: "updateAccountProfile",
      toolCallId,
    } as any);
  };

  const handleConfirm = async () => {
    if (!password || isSubmitting || !changes) {
      return;
    }
    setIsSubmitting(true);
    setError(null);

    // Seules les valeurs réellement modifiées sont envoyées — notamment jamais
    // `phone` vide, qui effacerait le numéro côté backend.
    const body: Record<string, string> = { currentPassword: password };
    if (changes.username) {
      body.username = changes.username.to;
    }
    if (changes.phone) {
      body.phone = changes.phone.to;
    }

    try {
      const res = await fetch("/api/settings", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setPassword("");
        mutate("/api/settings");
        toast.success("Profil mis à jour !");
        sendOutput({
          current: {
            phone: data.phone ?? changes.phone?.to ?? null,
            username: data.username ?? changes.username?.to ?? "",
          },
          message: "Profil mis à jour.",
          previous: currentValues ?? {
            phone: changes.phone?.from ?? null,
            username: changes.username?.from ?? "",
          },
          status: PROFILE_STATUS.SUBMITTED,
          success: true,
        });
        return;
      }

      const message =
        data?.message || data?.error || "La modification a échoué.";
      setError(message);
      // Échec volontairement local (pas d'addToolOutput) : le flux ne reprend
      // pas, l'utilisateur peut corriger et réessayer directement dans la
      // carte — c'est aussi ce qui garde la carte dans le dernier message.
      // Le backend applique username puis phone séquentiellement : un échec sur
      // le second champ peut suivre l'application du premier → rafraîchir.
      mutate("/api/settings");
    } catch {
      // Pas d'addToolOutput : la continuation échouerait aussi, on laisse
      // l'utilisateur réessayer depuis la carte.
      setError(
        "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    sendOutput({
      message: "Modification annulée par l'utilisateur.",
      status: PROFILE_STATUS.CANCELLED,
    });
  };

  return (
    <div
      className="my-3 w-[min(100%,480px)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur-xs transition"
      data-testid="account-profile-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRoundIcon className="size-4" />
          </span>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              Modification du profil
            </h4>
            {args?.reason && (
              <p className="text-xs text-muted-foreground">{args.reason}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {changeRows.length > 0 && (
          <div className="space-y-1.5">
            {changeRows.map((row) => (
              <div
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                key={row.label}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {row.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground line-through">
                    {row.from}
                  </span>
                  <ArrowRightIcon className="size-3 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {row.to}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {status === PROFILE_STATUS.SUBMITTED && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4 shrink-0" />
            <span>Profil mis à jour avec succès.</span>
          </div>
        )}

        {status === PROFILE_STATUS.CANCELLED && (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="size-4 shrink-0" />
            <span>Modification annulée — aucune donnée n'a été modifiée.</span>
          </div>
        )}

        {status === PROFILE_STATUS.NO_CHANGE && (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="size-4 shrink-0" />
            <span>{output?.message || "Aucune modification à appliquer."}</span>
          </div>
        )}

        {status === PROFILE_STATUS.INVALID && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>{output?.error || "Demande de modification invalide."}</span>
          </div>
        )}

        {!output && (
          <p className="text-xs text-muted-foreground">
            Préparation de la modification…
          </p>
        )}

        {isAwaiting && !isInLastMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="size-4 shrink-0" />
            <span>
              Cette confirmation n'est plus active — redemandez la modification
              à l'IA pour recommencer.
            </span>
          </div>
        )}

        {canInteract && (
          <div className="space-y-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <ShieldCheckIcon className="size-4 text-amber-600" />
              <span>Confirmation requise</span>
            </div>

            {currentValues && (
              <p className="text-[11.5px] text-muted-foreground">
                Profil actuel : {fmtUsername(currentValues.username)} ·{" "}
                {fmtPhone(currentValues.phone)}
              </p>
            )}

            <div className="space-y-1">
              <label
                className="text-xs font-medium text-foreground"
                htmlFor={`profile-password-${toolCallId}`}
              >
                Mot de passe actuel (requis pour confirmer)
              </label>
              <Input
                autoComplete="current-password"
                disabled={isSubmitting}
                id={`profile-password-${toolCallId}`}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder="Votre mot de passe"
                type="password"
                value={password}
              />
              <p className="text-[10.5px] text-muted-foreground">
                Il n'est jamais transmis à l'IA et sert uniquement à valider le
                changement auprès du serveur.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <Button
                data-testid="cancel-profile-change"
                disabled={isSubmitting}
                onClick={handleCancel}
                size="sm"
                type="button"
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                className="gap-2"
                data-testid="confirm-profile-change"
                disabled={!password || isSubmitting}
                onClick={handleConfirm}
                size="sm"
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Vérification…</span>
                  </>
                ) : (
                  <span>Confirmer</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
