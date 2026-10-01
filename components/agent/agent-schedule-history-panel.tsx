"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type Schedule = {
  id: string;
  title: string;
  status: string;
  revision: number;
  lastError: string | null;
};
type Version = {
  id: string;
  revision: number;
  createdAt: string;
  snapshot: {
    instructions: string;
    modelId: string;
    timezone: string;
    rule: unknown;
    config: {
      autonomy: string;
      reasoningLevel: string;
      enabledCategories: string[] | null;
    };
  };
};
type Occurrence = {
  id: string;
  dueAt: string;
  status: string;
  scheduleVersionId: string | null;
};

export function AgentScheduleHistoryPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: list } = useSWR<{ schedules: Schedule[] }>(
    "/api/agent/schedules?includeDeleted=true",
    fetcher
  );
  const { data: detail } = useSWR<{ occurrences: Occurrence[] }>(
    selectedId ? `/api/agent/schedules/${selectedId}` : null,
    fetcher
  );
  const { data: history } = useSWR<{ versions: Version[] }>(
    selectedId ? `/api/agent/schedules/${selectedId}/versions` : null,
    fetcher
  );
  return (
    <section className="space-y-4 py-6">
      <h2 className="text-xl font-semibold">
        Historique des tâches planifiées
      </h2>
      <p className="text-sm text-muted-foreground">
        Chaque version conserve les consignes et réglages exécutés. Les
        anciennes occurrences sans version sont indiquées comme historiques non
        attribuables.
      </p>
      <div className="flex flex-wrap gap-2">
        {(list?.schedules ?? []).map((schedule) => (
          <button
            className={`rounded-lg border px-3 py-2 text-sm ${selectedId === schedule.id ? "border-primary bg-primary/10" : ""}`}
            key={schedule.id}
            onClick={() => setSelectedId(schedule.id)}
            type="button"
          >
            {schedule.title} · {schedule.status}
          </button>
        ))}
      </div>
      {selectedId &&
      list?.schedules.find((item) => item.id === selectedId)?.lastError ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Motif de pause :{" "}
          {list.schedules.find((item) => item.id === selectedId)?.lastError}
        </p>
      ) : null}
      {selectedId && !history ? (
        <p className="text-sm text-muted-foreground">
          Chargement des versions…
        </p>
      ) : null}
      {(history?.versions ?? []).map((version) => (
        <article className="rounded-xl border p-4 text-sm" key={version.id}>
          <h3 className="font-semibold">
            Version {version.revision} ·{" "}
            {new Date(version.createdAt).toLocaleString("fr-FR")}
          </h3>
          <p className="mt-2 whitespace-pre-wrap">
            {version.snapshot.instructions}
          </p>
          <p className="mt-2 text-muted-foreground">
            Modèle : {version.snapshot.modelId} · Autonomie :{" "}
            {version.snapshot.config.autonomy} · Réflexion :{" "}
            {version.snapshot.config.reasoningLevel} · Fuseau :{" "}
            {version.snapshot.timezone}
          </p>
          <p className="text-muted-foreground">
            Catégories :{" "}
            {version.snapshot.config.enabledCategories?.join(", ") ??
              "réglages utilisateur"}
          </p>
          <p className="text-muted-foreground">
            Règle : {JSON.stringify(version.snapshot.rule)}
          </p>
        </article>
      ))}
      {detail?.occurrences?.length ? (
        <div className="space-y-1">
          <h3 className="font-semibold">Occurrences</h3>
          {detail.occurrences.map((occurrence) => {
            const version = history?.versions.find(
              (item) => item.id === occurrence.scheduleVersionId
            );
            return (
              <p className="rounded-lg border p-2 text-sm" key={occurrence.id}>
                {new Date(occurrence.dueAt).toLocaleString("fr-FR")} ·{" "}
                {occurrence.status} ·{" "}
                {version
                  ? `version ${version.revision}`
                  : "historique non attribuable"}
              </p>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
