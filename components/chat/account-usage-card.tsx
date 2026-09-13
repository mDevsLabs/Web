"use client";

import {
  BotIcon,
  ExternalLinkIcon,
  GaugeIcon,
  HardDriveIcon,
  ImageIcon,
  InfoIcon,
  Volume2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  formatBytesFr,
  formatResetFr,
  formatTokensFr,
} from "@/lib/account/format";
import type { UsageSummary } from "@/lib/account/usage";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AccountUsageCardProps = {
  output?: UsageSummary & { error?: string };
  state: string;
};

function UsageGauge({
  gradient,
  icon,
  label,
  note,
  percent,
  resetLabel,
  right,
}: {
  gradient: string;
  icon: ReactNode;
  label: string;
  note?: string;
  percent: number;
  resetLabel?: string;
  right: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/50">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            {note && (
              <p className="text-[10.5px] text-muted-foreground">{note}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-xs font-bold text-foreground">
            {right}
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            {percent}%
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percent > 90
              ? "bg-red-500"
              : percent > 75
                ? "bg-amber-500"
                : gradient
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      {resetLabel && (
        <p className="text-[10.5px] text-muted-foreground">
          Réinitialisation :{" "}
          <span className="font-medium text-foreground/80">{resetLabel}</span>
        </p>
      )}
    </div>
  );
}

function UnavailableRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
      <InfoIcon className="size-3.5 shrink-0" />
      <span>Donnée indisponible pour : {label}.</span>
    </div>
  );
}

export function AccountUsageCard({ output, state }: AccountUsageCardProps) {
  const isError = state === "output-error" || Boolean(output?.error);
  const isDone = state === "output-available" && !isError;

  return (
    <div
      className="my-3 w-[min(100%,480px)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur-xs transition"
      data-testid="account-usage-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GaugeIcon className="size-4" />
          </span>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              Consommation & forfait
            </h4>
            <p className="text-xs text-muted-foreground">
              Utilisation et quotas de votre compte
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
            isError
              ? "bg-red-500/15 text-red-600"
              : isDone
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-sky-500/20 text-sky-600 dark:text-sky-400 animate-pulse"
          )}
        >
          {isError ? "Erreur" : isDone ? "Terminé" : "Exécution…"}
        </span>
      </div>

      <div className="space-y-2.5 p-4">
        {isError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
            <InfoIcon className="size-3.5 shrink-0" />
            <span>
              {output?.error ||
                "Impossible de récupérer votre consommation. Réessayez."}
            </span>
          </div>
        )}

        {!output && !isError && (
          <p className="text-xs text-muted-foreground">
            Chargement de votre consommation…
          </p>
        )}

        {output && !isError && (
          <>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary uppercase tracking-wide">
                  mAI {output.tier}
                </span>
                <span className="text-xs text-muted-foreground">
                  Forfait actuel
                </span>
              </div>
              <a
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                href={MAI_UPGRADE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Gérer / Mettre à niveau
                <ExternalLinkIcon className="size-3" />
              </a>
            </div>

            {output.ai && (
              <UsageGauge
                gradient="bg-gradient-to-r from-indigo-500 to-purple-600"
                icon={<BotIcon className="size-3.5" />}
                label="Utilisation de l'IA"
                note="Tokens hebdomadaires (invites + réponses)"
                percent={output.ai.percent}
                resetLabel={formatResetFr(output.ai.resetAt)}
                right={`${formatTokensFr(output.ai.tokensUsed)} / ${formatTokensFr(output.ai.limit)}`}
              />
            )}

            {output.images ? (
              <UsageGauge
                gradient="bg-gradient-to-r from-purple-500 to-pink-600"
                icon={<ImageIcon className="size-3.5" />}
                label="Générations d'images"
                note="Images générées aujourd'hui"
                percent={output.images.percent}
                resetLabel={`${formatResetFr(output.images.resetAt)} (minuit UTC)`}
                right={`${formatTokensFr(output.images.usedToday)} / ${formatTokensFr(output.images.dailyLimit)}`}
              />
            ) : (
              <UnavailableRow label="images" />
            )}

            {output.speech ? (
              <UsageGauge
                gradient="bg-gradient-to-r from-emerald-500 to-teal-600"
                icon={<Volume2Icon className="size-3.5" />}
                label="Synthèse vocale"
                note="Tokens audio hebdomadaires"
                percent={output.speech.percent}
                resetLabel={formatResetFr(output.speech.resetAt)}
                right={`${formatTokensFr(output.speech.tokensUsed)} / ${formatTokensFr(output.speech.limit)}`}
              />
            ) : (
              <UnavailableRow label="synthèse vocale" />
            )}

            {output.storage ? (
              <UsageGauge
                gradient="bg-gradient-to-r from-sky-500 to-blue-600"
                icon={<HardDriveIcon className="size-3.5" />}
                label="Stockage cloud mAI"
                note={`${formatTokensFr(output.storage.filesCount)} fichier(s)${
                  output.storage.overLimit ? " — limite dépassée" : ""
                }`}
                percent={output.storage.percent}
                right={`${formatBytesFr(output.storage.bytesUsed)} / ${formatBytesFr(output.storage.bytesLimit)}`}
              />
            ) : (
              <UnavailableRow label="stockage cloud" />
            )}

            {output.warnings && output.warnings.length > 0 && (
              <p className="px-1 text-[10.5px] text-muted-foreground">
                Données momentanément indisponibles :{" "}
                {output.warnings.join(", ")}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
