"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ImageUpIcon,
  InfoIcon,
  LinkIcon,
  Loader2Icon,
  PaperclipIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { useActiveChat } from "@/hooks/use-active-chat";
import { PHOTO_STATUS } from "@/lib/ai/tools/account-status";
import type { UpdateProfilePictureOutput } from "@/lib/ai/tools/update-profile-picture";
import { cn } from "@/lib/utils";

type ProfilePictureCardProps = {
  args?: { imageUrl?: string; reason?: string; source?: string };
  output?: UpdateProfilePictureOutput;
  state: string;
  toolCallId: string;
  isReadonly?: boolean;
};

function statusBadge(status?: string) {
  switch (status) {
    case PHOTO_STATUS.AWAITING:
      return {
        className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        label: "En attente",
      };
    case PHOTO_STATUS.SUBMITTED:
      return {
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        label: "Succès",
      };
    case PHOTO_STATUS.INVALID:
      return { className: "bg-red-500/15 text-red-600", label: "Erreur" };
    case PHOTO_STATUS.FAILED:
      return { className: "bg-red-500/15 text-red-600", label: "Échec" };
    case PHOTO_STATUS.CANCELLED:
      return { className: "bg-muted text-muted-foreground", label: "Annulé" };
    default:
      return {
        className: "bg-sky-500/20 text-sky-600 dark:text-sky-400 animate-pulse",
        label: "Préparation…",
      };
  }
}

// Recalcule côté client le même hachage canonique que la route : la
// confirmation POST porte ce hachage et la route le revérifie serveur.
async function canonicalSourceHash(rawUrl: string): Promise<string> {
  let canonical = rawUrl.trim();
  try {
    canonical = new URL(rawUrl.trim()).toString();
  } catch {
    // La source affichée a déjà été validée par le tool ; on hache tel quel.
  }
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function ProfilePictureCard({
  args,
  output,
  state: _state,
  toolCallId,
  isReadonly,
}: ProfilePictureCardProps) {
  const { addToolOutput, messages } = useActiveChat();
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = output?.status;
  const badge = statusBadge(status);

  // addToolOutput ne patche que le dernier message : une confirmation depuis
  // un message plus ancien serait silencieusement perdue → vue « expirée ».
  const isInLastMessage = useMemo(() => {
    const last = messages.at(-1);
    return Boolean(
      last?.parts?.some(
        (part) => (part as { toolCallId?: string }).toolCallId === toolCallId
      )
    );
  }, [messages, toolCallId]);

  const isAwaiting = status === PHOTO_STATUS.AWAITING;
  const canInteract = isAwaiting && isInLastMessage && !isReadonly;

  const preview =
    output && output.status === PHOTO_STATUS.AWAITING
      ? output.preview
      : undefined;

  const sendOutput = (next: UpdateProfilePictureOutput) => {
    addToolOutput({
      output: next,
      tool: "updateProfilePicture",
      toolCallId,
    } as any);
  };

  const handleConfirm = async () => {
    if (!preview || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const sourceHash = await canonicalSourceHash(preview.sourceUrl);
      const res = await fetch("/api/settings", {
        body: JSON.stringify({
          action: "set_avatar",
          imageUrl: preview.sourceUrl,
          sourceHash,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        mutate("/api/settings");
        toast.success("Photo de profil mise à jour !");
        sendOutput({
          avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : "",
          message: "Photo de profil mise à jour.",
          status: PHOTO_STATUS.SUBMITTED,
          success: true,
        });
        return;
      }

      const message =
        data?.message || data?.error || "Le changement de photo a échoué.";
      setError(message);
      mutate("/api/settings");
    } catch {
      // Échec volontairement local (pas d'addToolOutput) : le flux ne reprend
      // pas, l'utilisateur peut réessayer directement depuis la carte.
      setError(
        "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    sendOutput({
      message: "Changement de photo annulé par l'utilisateur.",
      status: PHOTO_STATUS.CANCELLED,
    });
  };

  return (
    <div
      className="my-3 w-[min(100%,480px)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur-xs transition"
      data-testid="profile-picture-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageUpIcon className="size-4" />
          </span>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              Photo de profil
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
        {preview && (
          <>
            <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-2">
              {/* L'URL a été validée par le pipeline d'upload ou par la garde
                  SSRF avant l'affichage ; l'aperçu est chargé par le client. */}
              <img
                alt={preview.label}
                className="max-h-48 w-auto rounded-lg object-contain"
                src={preview.sourceUrl}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs">
              {preview.origin === "attachment" ? (
                <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">
                Source&nbsp;:{" "}
                {preview.origin === "attachment"
                  ? `pièce jointe · ${preview.label}`
                  : `URL distante · ${preview.label}`}
              </span>
            </div>
          </>
        )}

        {status === PHOTO_STATUS.SUBMITTED && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4 shrink-0" />
            <span>Photo de profil mise à jour avec succès.</span>
          </div>
        )}

        {status === PHOTO_STATUS.CANCELLED && (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="size-4 shrink-0" />
            <span>
              Changement annulé — votre photo de profil est inchangée.
            </span>
          </div>
        )}

        {status === PHOTO_STATUS.INVALID && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>{output?.error || "Demande de changement invalide."}</span>
          </div>
        )}

        {status === PHOTO_STATUS.FAILED && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>
              {output?.error ||
                "Le changement a échoué — votre photo est inchangée."}
            </span>
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
              Cette confirmation n'est plus active — redemandez le changement à
              l'IA pour recommencer.
            </span>
          </div>
        )}

        {canInteract && preview && (
          <div className="space-y-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <InfoIcon className="size-4 text-amber-600" />
              <span>Confirmation requise</span>
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              Cette image remplacera votre photo de profil actuelle. La
              confirmation ne vaut que pour cette image exacte.
            </p>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <Button
                data-testid="cancel-profile-picture"
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
                data-testid="confirm-profile-picture"
                disabled={isSubmitting}
                onClick={handleConfirm}
                size="sm"
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Application…</span>
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
