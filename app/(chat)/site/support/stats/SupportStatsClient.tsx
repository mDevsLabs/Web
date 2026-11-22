"use client";

import {
  AlertTriangleIcon as AlertTriangle,
  ArrowLeftIcon as ArrowLeft,
  RefreshCwIcon as RefreshCw,
  ShieldCheckIcon as ShieldCheck,
} from "@mdevs/icons";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupportStats } from "@/app/(chat)/site/actions/support";
import { isAdminUser } from "@/app/(chat)/site/actions/support-utils";
import { useAuth } from "@/components/site/auth-provider";
import Link from "@/components/site/router";
import { SupportStatsSkeleton } from "@/components/site/support/SupportSkeletons";
import type {
  SupportStatsData,
  SupportStatsResult,
} from "@/components/site/support/stats/stats-types";

const SupportStatsCharts = dynamic(
  () =>
    import("@/components/site/support/stats/SupportStatsCharts").then(
      (module) => module.SupportStatsCharts
    ),
  {
    loading: () => (
      <div
        aria-label="Chargement des graphiques"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        role="status"
      >
        <div className="h-72 animate-pulse rounded-3xl border border-black/5 bg-white p-6 shadow-2xs" />
        <div className="h-72 animate-pulse rounded-3xl border border-black/5 bg-white p-6 shadow-2xs" />
      </div>
    ),
    ssr: false,
  }
);

export default function SupportStatsClient({
  initialResult = null,
}: {
  initialResult?: SupportStatsResult | null;
}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<SupportStatsData | null>(
    initialResult?.success && initialResult.stats ? initialResult.stats : null
  );
  const [loading, setLoading] = useState(!initialResult);
  const skipInitialFetchRef = useRef(Boolean(initialResult));
  const isAdmin =
    isAuthenticated &&
    (isAdminUser(user?.email) || Boolean(initialResult?.isAdmin));

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await getSupportStats();
      if (response.success && response.stats) setStats(response.stats);
    } catch (error: unknown) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    if (isAuthenticated) void fetchStats();
    else setLoading(false);
  }, [authLoading, isAuthenticated, fetchStats]);

  if (authLoading || loading) {
    return <SupportStatsSkeleton />;
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-3xl border border-black/5 bg-white p-12 text-center">
        <AlertTriangle
          aria-hidden="true"
          className="mx-auto h-10 w-10 text-amber-500"
        />
        <h2 className="text-xl font-bold text-slate-900">
          Données indisponibles
        </h2>
        <p className="text-xs text-slate-500">
          Les statistiques n&apos;ont pas pu être chargées. Assurez-vous
          d&apos;être connecté.
        </p>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-purple-500"
          href="/support"
        >
          Retour au support
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link
              className="mr-2 flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
              href="/support"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Support
            </Link>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              Observatoire & Métriques du Support
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {isAdmin
              ? "Analyse globale de la volumétrie, de la réactivité et de la stabilité des composants de la plateforme."
              : "Suivi statistique personnel de vos signalements d'incidents et délais de résolution."}
          </p>
        </div>
        <button
          className="flex cursor-pointer items-center gap-2 self-start rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 sm:self-auto"
          disabled={loading}
          onClick={() => void fetchStats()}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`}
          />
          <span>Actualiser</span>
        </button>
      </div>

      {isAdmin ? (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-900">
          <ShieldCheck
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-purple-600"
          />
          <span>
            <strong>Vue Administrateur :</strong> Les métriques affichées
            ci-dessous intègrent l&apos;ensemble des tickets créés par tous les
            utilisateurs de mAI.
          </span>
        </div>
      ) : null}

      <section
        aria-label="Indicateurs principaux du support"
        className="grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <div className="space-y-2 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total des dossiers
          </span>
          <p className="text-3xl font-black text-slate-900">
            {stats.total || 0}
          </p>
          <p className="text-xs text-slate-500">Demandes enregistrées</p>
        </div>
        <div className="space-y-2 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            En cours / Ouverts
          </span>
          <p className="text-3xl font-black text-amber-600">
            {(stats.open || 0) + (stats.inProgress || 0)}
          </p>
          <p className="text-xs font-medium text-amber-600">
            Actifs au traitement
          </p>
        </div>
        <div className="space-y-2 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dossiers résolus
          </span>
          <p className="text-3xl font-black text-emerald-600">
            {stats.resolved || 0}
          </p>
          <p className="text-xs font-medium text-emerald-600">
            Interventions réussies
          </p>
        </div>
        <div className="space-y-2 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Taux de résolution
          </span>
          <p className="text-3xl font-black text-purple-600">
            {typeof stats.resolutionRate === "number" && (stats.total ?? 0) > 0
              ? `${stats.resolutionRate}%`
              : "—"}
          </p>
          <p className="text-xs font-medium text-purple-600">Clôture globale</p>
        </div>
        <div className="col-span-2 space-y-2 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Délai moyen
          </span>
          <p className="text-3xl font-black text-blue-600">
            {typeof stats.avgResolutionHours === "number"
              ? `${stats.avgResolutionHours}h`
              : "—"}
          </p>
          <p className="text-xs font-medium text-blue-600">
            Temps de traitement
          </p>
        </div>
      </section>

      <SupportStatsCharts stats={stats} />
    </div>
  );
}
