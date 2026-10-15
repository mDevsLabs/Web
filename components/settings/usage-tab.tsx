"use client";

import {
  AlertCircleIcon,
  CloudIcon,
  ImageIcon,
  LineChartIcon,
  SparklesIcon,
  Volume2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { BotGlyph } from "@/components/agents/bot-avatar";
import {
  resolveImagesUsage,
  resolveSpeechUsage,
  useSettings,
} from "@/hooks/use-settings";
import { APP_PRICING_URL } from "@/lib/constants";
import {
  getTierChatWeeklyLimit,
  getTierStorageBytes,
} from "@/lib/plans/tier-limits";

function formatTokens(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Mo";
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Prochainement";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "long",
      weekday: "long",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function UsageTab() {
  const { data: settingsData } = useSettings({ revalidateOnFocus: true });
  const profile = settingsData?.user ?? null;
  const aiUsage = settingsData?.aiUsage ?? null;
  const cloudUsage = settingsData?.cloudUsage ?? null;

  const aiPercent = aiUsage?.limit
    ? Math.min(100, Math.round(((aiUsage.tokensUsed || 0) / aiUsage.limit) * 100))
    : 0;

  const resolvedImagesUsage = resolveImagesUsage(settingsData);
  const imagesPercent = resolvedImagesUsage.dailyLimit
    ? Math.min(
        100,
        Math.round(
          ((resolvedImagesUsage.usedToday || 0) / resolvedImagesUsage.dailyLimit) * 100
        )
      )
    : 0;

  const resolvedSpeechUsage = resolveSpeechUsage(settingsData);
  const speechPercent = resolvedSpeechUsage.limit
    ? Math.min(
        100,
        Math.round(
          ((resolvedSpeechUsage.tokensUsed || 0) / resolvedSpeechUsage.limit) * 100
        )
      )
    : 0;

  const cloudPercent = cloudUsage?.bytesLimit
    ? Math.min(
        100,
        Math.round(((cloudUsage.bytesUsed || 0) / cloudUsage.bytesLimit) * 100)
      )
    : 0;

  const aiLimitFallback = getTierChatWeeklyLimit(profile?.tier);
  const storageLimitFallback = getTierStorageBytes(profile?.tier);

  const currentTierKey = (profile?.tier || "free").toLowerCase().trim();
  const targetPlan =
    currentTierKey === "free"
      ? "pro"
      : currentTierKey === "plus"
        ? "pro"
        : currentTierKey === "pro"
          ? "max"
          : "pro";

  return (
    <div className="py-6 flex flex-col gap-6 max-w-4xl scroll-mt-6" id="usage-mAI">
      {/* Forfait actuel */}
      <div
        className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 scroll-mt-6"
        id="usage-plan"
      >
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Forfait Actuel
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold text-foreground">
              mAI {profile?.tier || "Free"}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              Actif
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.tier === "Free"
              ? `Accès gratuit avec ${formatTokens(aiUsage?.limit || aiLimitFallback)} tokens hebdomadaires et ${formatBytes(cloudUsage?.bytesLimit || storageLimitFallback)} de stockage cloud.`
              : "Forfait premium débloqué avec quotas étendus et modèles avancés."}
          </p>
        </div>

        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md shrink-0"
          href={`/site/pricing?plan=${targetPlan}`}
        >
          <SparklesIcon className="size-4" />
          <span>Gérer / Mettre à niveau</span>
        </Link>
      </div>

      <div className="surface-card flex flex-col gap-3" id="usage-stats">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-muted/60 text-foreground ring-1 ring-border">
            <LineChartIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Statistiques détaillées
            </h3>
            <p className="text-xs text-muted-foreground">
              Historique de consommation, conversations par mode et modèle le plus utilisé
            </p>
          </div>
        </div>
        <div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            href="/settings/statistiques"
          >
            <LineChartIcon className="size-4" />
            <span>Ouvrir les statistiques</span>
          </Link>
        </div>
      </div>

      {/* Consommation mAI (Tokens hebdomadaires) */}
      <div className="surface-card flex flex-col gap-4" id="usage">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <BotGlyph className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Utilisation de l'IA
              </h3>
              <p className="text-xs text-muted-foreground">
                Consommation calculée sur vos invites et réponses générées
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-foreground">
              {formatTokens(aiUsage?.tokensUsed || 0)} /{" "}
              {formatTokens(aiUsage?.limit || aiLimitFallback)}
            </span>
            <span className="text-xs text-muted-foreground block">
              tokens ({aiPercent}%)
            </span>
          </div>
        </div>

        {/* Jauge */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              aiPercent > 90
                ? "bg-destructive"
                : aiPercent > 75
                  ? "bg-warning"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600"
            }`}
            style={{ width: `${aiPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Renouvellement hebdomadaire :</span>
          <span className="font-medium text-foreground">
            {formatDate(aiUsage?.resetAt)}
          </span>
        </div>
      </div>

      {/* Consommation Images */}
      <div className="surface-card flex flex-col gap-4 scroll-mt-6" id="usage-images">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20 shrink-0">
              <ImageIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">
                Générations d'Images
              </h3>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Images générées aujourd'hui (quota réinitialisé à minuit UTC)
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-foreground">
              {resolvedImagesUsage.usedToday} / {resolvedImagesUsage.dailyLimit}
            </span>
            <span className="text-xs text-muted-foreground block">
              images ({imagesPercent}%)
            </span>
          </div>
        </div>

        {/* Jauge */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              imagesPercent >= 100
                ? "bg-destructive"
                : imagesPercent > 75
                  ? "bg-warning"
                  : "bg-gradient-to-r from-purple-500 to-pink-600"
            }`}
            style={{ width: `${imagesPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Réinitialisation du quota :</span>
          <span className="font-medium text-foreground">
            {formatDate(resolvedImagesUsage.resetAt)} (Minuit UTC)
          </span>
        </div>
      </div>

      {/* Consommation Synthèse Vocale */}
      <div className="surface-card flex flex-col gap-4 scroll-mt-6" id="usage-speech">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-success/10 text-success ring-1 ring-success/20 shrink-0">
              <Volume2Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">
                Synthèse Vocale
              </h3>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Tokens consommés pour l'API vocale et la synthèse vocale
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-foreground">
              {formatTokens(resolvedSpeechUsage.tokensUsed)} /{" "}
              {formatTokens(resolvedSpeechUsage.limit)}
            </span>
            <span className="text-xs text-muted-foreground block">
              tokens ({speechPercent}%)
            </span>
          </div>
        </div>

        {/* Jauge */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              speechPercent >= 100
                ? "bg-destructive"
                : speechPercent > 75
                  ? "bg-warning"
                  : "bg-foreground"
            }`}
            style={{ width: `${speechPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Renouvellement hebdomadaire :</span>
          <span className="font-medium text-foreground">
            {formatDate(resolvedSpeechUsage.resetAt || aiUsage?.resetAt)}
          </span>
        </div>
      </div>

      {/* Consommation Cloud Storage */}
      <div className="surface-card flex flex-col gap-4 scroll-mt-6" id="usage-cloud">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
              <CloudIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Stockage Cloud mAI
              </h3>
              <p className="text-xs text-muted-foreground">
                Espace utilisé pour vos documents, pièces jointes et médias
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-foreground">
              {formatBytes(cloudUsage?.bytesUsed || 0)} /{" "}
              {formatBytes(cloudUsage?.bytesLimit || storageLimitFallback)}
            </span>
            <span className="text-xs text-muted-foreground block">
              utilisés ({cloudPercent}%)
            </span>
          </div>
        </div>

        {/* Jauge */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              cloudPercent > 90
                ? "bg-destructive"
                : cloudPercent > 75
                  ? "bg-warning"
                  : "bg-foreground"
            }`}
            style={{ width: `${cloudPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Fichiers hébergés :</span>
          <span className="font-medium text-foreground">
            {cloudUsage?.filesCount || 0} fichier(s)
          </span>
        </div>
      </div>

      {/* Encadré d'information pour la mise à niveau */}
      <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 flex items-start gap-3">
        <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">
            Besoin de plus de tokens ou d'espace de stockage ?
          </p>
          <p>
            Les mises à niveau de forfait (Plus, Pro, Max) et l'activation des codes
            promotionnels s'effectuent directement sur le portail officiel{" "}
            <Link
              className="text-primary font-medium underline inline-flex items-center gap-0.5"
              href={APP_PRICING_URL}
            >
              la page des forfaits
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
