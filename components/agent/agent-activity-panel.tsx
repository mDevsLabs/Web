"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { fetcher } from "@/lib/utils";

type ActivityRun = {
  id: string;
  chatId: string;
  parentRunId: string | null;
  status: string;
  createdAt: string;
  useful: boolean | null;
  goalReached: boolean | null;
  usage: { durationMs?: number; totalTokens?: number };
};
type Activity = {
  totals: {
    runs: number;
    tokens: number;
    activeMs: number;
    resumed: number;
    cost: null;
    byStatus: Record<string, number>;
    useful: { count: number; positive: number };
    goalReached: { count: number; positive: number };
  };
  runs: ActivityRun[];
};

function responseRate(value: { count: number; positive: number }) {
  return value.count
    ? `${Math.round((100 * value.positive) / value.count)} % (${value.count} réponses)`
    : "Aucune réponse";
}

export function AgentActivityPanel() {
  const [days, setDays] = useState(30);
  const { data, error, mutate } = useSWR<Activity>(
    `/api/agent/runs?view=activity&days=${days}`,
    fetcher
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function feedback(
    run: ActivityRun,
    field: "useful" | "goalReached",
    value: boolean
  ) {
    setSaving(run.id);
    try {
      const response = await fetch(`/api/agent/runs/${run.id}`, {
        body: JSON.stringify({ [field]: value }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (response.ok) await mutate();
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="space-y-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Activité Agent</h2>
        <div className="flex gap-1">
          {[7, 30, 90].map((value) => (
            <button
              className={`rounded-md border px-3 py-1 text-sm ${days === value ? "bg-primary text-primary-foreground" : ""}`}
              key={value}
              onClick={() => setDays(value)}
              type="button"
            >
              {value} j
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="text-destructive">L'activité est indisponible.</p>
      ) : null}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4">
              <strong>{data.totals.runs}</strong>
              <p className="text-sm text-muted-foreground">Runs</p>
            </div>
            <div className="rounded-xl border p-4">
              <strong>{Math.round(data.totals.activeMs / 60_000)} min</strong>
              <p className="text-sm text-muted-foreground">Durée active</p>
            </div>
            <div className="rounded-xl border p-4">
              <strong>{data.totals.tokens.toLocaleString("fr-FR")}</strong>
              <p className="text-sm text-muted-foreground">Tokens</p>
            </div>
            <div className="rounded-xl border p-4">
              <strong>{data.totals.resumed}</strong>
              <p className="text-sm text-muted-foreground">Reprises liées</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl border p-3 text-sm">
              Utile : {responseRate(data.totals.useful)}
            </p>
            <p className="rounded-xl border p-3 text-sm">
              Objectif atteint : {responseRate(data.totals.goalReached)}
            </p>
            <p className="rounded-xl border p-3 text-sm">Coût : indisponible</p>
          </div>
          <p className="text-xs text-muted-foreground">
            États :{" "}
            {Object.entries(data.totals.byStatus)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => `${status} ${count}`)
              .join(" · ") || "aucun run"}
          </p>
          <div className="space-y-2">
            {data.runs.slice(0, 100).map((run) => (
              <div className="rounded-xl border p-3 text-sm" key={run.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="font-medium underline"
                    href={apiEndpoints.chatPath(run.chatId)}
                  >
                    {new Date(run.createdAt).toLocaleString("fr-FR")}
                  </Link>
                  <span className="rounded bg-muted px-2 py-0.5">
                    {run.status}
                  </span>
                  {run.parentRunId ? <span>Reprise</span> : null}
                  <span className="text-muted-foreground">
                    {run.usage?.totalTokens ?? 0} tokens ·{" "}
                    {Math.round((run.usage?.durationMs ?? 0) / 1000)} s
                  </span>
                </div>
                {["completed", "failed", "cancelled", "timed_out"].includes(
                  run.status
                ) ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(["useful", "goalReached"] as const).map((field) => (
                      <div className="flex items-center gap-1" key={field}>
                        <span className="mr-1 text-muted-foreground">
                          {field === "useful"
                            ? "Utile ?"
                            : "Objectif atteint ?"}
                        </span>
                        {[true, false].map((value) => (
                          <button
                            aria-pressed={run[field] === value}
                            className={`rounded border px-2 py-0.5 ${run[field] === value ? "border-primary bg-primary/10" : ""}`}
                            disabled={saving === run.id}
                            key={String(value)}
                            onClick={() => feedback(run, field, value)}
                            type="button"
                          >
                            {value ? "Oui" : "Non"}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
    </section>
  );
}
