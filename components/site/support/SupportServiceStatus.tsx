"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/site/router";
import {
  SUPPORT_STATUS_VALUES,
  type SupportStatus,
  type SupportStatusResponse,
  type SupportStatusService,
} from "@/components/site/support/support-status-types";
import { formatDisplayDateTime } from "@/lib/site/date-format";

const STATUS_PRESENTATION: Record<
  SupportStatus,
  {
    label: string;
    description: string;
    dot: string;
    text: string;
    background: string;
    icon: typeof CheckCircle2;
  }
> = {
  HASISSUES: {
    background: "bg-amber-50 border-amber-200",
    description: "Certains services rencontrent des difficultés.",
    dot: "bg-amber-500",
    icon: AlertTriangle,
    label: "Services dégradés",
    text: "text-amber-700",
  },
  MAJOROUTAGE: {
    background: "bg-red-50 border-red-200",
    description: "Une interruption importante est signalée.",
    dot: "bg-red-500",
    icon: AlertTriangle,
    label: "Incident majeur",
    text: "text-red-700",
  },
  MINOROUTAGE: {
    background: "bg-orange-50 border-orange-200",
    description: "Une perturbation mineure est signalée.",
    dot: "bg-orange-500",
    icon: AlertTriangle,
    label: "Incident mineur",
    text: "text-orange-700",
  },
  UNDERMAINTENANCE: {
    background: "bg-blue-50 border-blue-200",
    description: "Une opération de maintenance est en cours.",
    dot: "bg-blue-500",
    icon: Info,
    label: "Maintenance",
    text: "text-blue-700",
  },
  UNKNOWN: {
    background: "bg-slate-50 border-slate-200",
    description: "Le fournisseur de statut n'a pas répondu.",
    dot: "bg-slate-400",
    icon: Info,
    label: "État indisponible",
    text: "text-slate-600",
  },
  UP: {
    background: "bg-emerald-50 border-emerald-200",
    description: "Aucun incident majeur signalé.",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    label: "Opérationnels",
    text: "text-emerald-700",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSupportStatus(value: unknown): value is SupportStatus {
  return (
    typeof value === "string" &&
    (SUPPORT_STATUS_VALUES as readonly string[]).includes(value)
  );
}

function isService(value: unknown): value is SupportStatusService {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isSupportStatus(value.status) &&
    typeof value.description === "string"
  );
}

function isStatusResponse(value: unknown): value is SupportStatusResponse {
  if (!isRecord(value) || !isRecord(value.page)) return false;
  if (
    typeof value.page.name !== "string" ||
    typeof value.page.url !== "string" ||
    !isSupportStatus(value.page.status) ||
    !Array.isArray(value.services) ||
    !value.services.every(isService) ||
    !Array.isArray(value.components) ||
    !value.components.every(isService) ||
    typeof value.updatedAt !== "string" ||
    (value.source !== "instatus" &&
      value.source !== "cache" &&
      value.source !== "fallback") ||
    typeof value.stale !== "boolean"
  ) {
    return false;
  }
  return value.error === undefined || typeof value.error === "string";
}

function isAbortError(reason: unknown): boolean {
  return (
    (reason instanceof DOMException && reason.name === "AbortError") ||
    (reason instanceof Error && reason.name === "AbortError")
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return formatDisplayDateTime(date, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: SupportStatus }) {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${presentation.background} ${presentation.text}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {presentation.label}
    </span>
  );
}

export function SupportServiceStatus() {
  const [data, setData] = useState<SupportStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadStatus = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/status", {
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        throw new Error(`Le service de statut a répondu ${response.status}.`);
      }
      const payload: unknown = await response.json();
      if (!isStatusResponse(payload)) {
        throw new Error("Réponse de statut invalide.");
      }
      setData(payload);
    } catch (reason: unknown) {
      if (isAbortError(reason)) return;
      setData(null);
      setError("Le statut des services est momentanément indisponible.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal);
    return () => controller.abort();
  }, [loadStatus, refreshToken]);

  const refresh = () => setRefreshToken((value) => value + 1);
  const presentation = data
    ? STATUS_PRESENTATION[data.page.status]
    : STATUS_PRESENTATION.UNKNOWN;
  const GlobalIcon = presentation.icon;

  return (
    <section aria-labelledby="support-status-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <Activity aria-hidden="true" className="h-4 w-4" />
            État des services
          </p>
          <h2
            className="mt-1 text-lg font-extrabold text-slate-900"
            id="support-status-title"
          >
            La plateforme fonctionne-t-elle ?
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          disabled={loading}
          onClick={refresh}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      <div
        aria-busy={loading}
        className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
      >
        {loading && !data ? (
          <div
            className="flex items-center gap-3 py-5 text-sm text-slate-500"
            role="status"
          >
            <Loader2
              aria-hidden="true"
              className="h-5 w-5 animate-spin text-emerald-600"
            />
            Chargement de l&apos;état des services…
          </div>
        ) : error ? (
          <div
            className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            role="alert"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Statut indisponible
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {error}
              </p>
              <button
                className="mt-3 text-xs font-bold text-amber-900 underline"
                onClick={refresh}
                type="button"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${presentation.background} ${presentation.text}`}
                >
                  <GlobalIcon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {data.page.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={data.page.status} />
                    <span className="text-[11px] text-slate-500">
                      {presentation.description}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-left text-[11px] text-slate-400 sm:text-right">
                <p>Mis à jour le {formatDate(data.updatedAt)}</p>
                {data.stale || data.source !== "instatus" ? (
                  <p className="mt-1 inline-flex items-center gap-1 font-semibold text-amber-600">
                    <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                    Données de repli ou ancien instantané
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500">
                État global :
              </span>
              <StatusBadge status={data.page.status} />
              {data.stale ? (
                <span className="text-[11px] text-slate-500">
                  Les informations peuvent être anciennes.
                </span>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Composants surveillés
                </h3>
                <span className="text-[11px] text-slate-400">
                  {data.services.length} service(s)
                </span>
              </div>
              {data.services.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.services.map((service) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      key={service.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {service.name}
                        </p>
                        {service.description ? (
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold">
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 rounded-full ${STATUS_PRESENTATION[service.status].dot}`}
                        />
                        <span
                          className={STATUS_PRESENTATION[service.status].text}
                        >
                          {STATUS_PRESENTATION[service.status].label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Le fournisseur ne publie pas encore le détail par service.
                  Consultez la page publique pour les annonces.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-400">
                Source :{" "}
                {data.source === "instatus" ? "Instatus" : "repli local"}
              </p>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                href={data.page.url || "https://mai.instatus.com/"}
                rel="noopener noreferrer"
                target="_blank"
              >
                Voir la page de statut{" "}
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
