"use client";

import { SearchIcon } from "@mdevs/icons/controls/search";
import { TimerIcon } from "@mdevs/icons/time/timer";
import { Input } from "@mdevs/ui/primitives/input";
import type React from "react";
import { api } from "@/components/wakies/api";
import { TaskActions } from "@/components/wakies/TaskActions";
import { TaskRow } from "@/components/wakies/TaskPresentation";
import { promptInApp } from "@/lib/ui/app-dialog";
import type { Detail, State } from "@/lib/wakies/shared/types";

export interface TasksActivityScreenProps {
  tasks: State["tasks"];
  settings: State["settings"];
  search: string;
  setSearch: (val: string) => void;
  taskDetail: Detail | undefined;
  setTaskDetail: (d: Detail | undefined) => void;
  busy: boolean;
  setError: (err: string) => void;
  mutate: (url: string, method: string, body?: any) => Promise<boolean>;
}

export const TasksActivityScreen: React.FC<TasksActivityScreenProps> = ({
  tasks,
  settings,
  search,
  setSearch,
  taskDetail,
  setTaskDetail,
  busy,
  setError,
  mutate,
}) => {
  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">VOTRE ESPACE DE TRAVAIL</span>
          <h1>Un peu de suivi.</h1>
          <p>
            Les tours planifiés s’exécutent sur le serveur dans leur conversation
            d’origine.
          </p>
        </div>
      </div>

      <label className="search-box">
        <SearchIcon size={16} />
        <Input
          aria-label="Rechercher des tâches"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Trouver une tâche…"
          value={search}
        />
      </label>

      <div className="task-list">
        {tasks
          .filter((task) =>
            task.prompt.toLowerCase().includes(search.toLowerCase())
          )
          .map((task) => (
            <TaskRow
              key={task.id}
              onClick={() =>
                void api<Detail>(`/tasks/${task.id}`)
                  .then(setTaskDetail)
                  .catch((e) => setError(e.message))
              }
              task={task}
            />
          ))}
      </div>

      {!tasks.length && (
        <div className="large-empty">
          <TimerIcon size={32} />
          <h2>Laissez une réflexion revenir plus tard.</h2>
          <p>
            Ouvrez une conversation et utilisez le bouton horloge pour planifier
            une tâche côté serveur.
          </p>
        </div>
      )}

      {taskDetail && (
        <section className="task-detail-card">
          <h2>{taskDetail.task.prompt}</h2>
          <TaskActions
            busy={busy}
            onAction={(action) =>
              void mutate(`/tasks/${taskDetail.task.id}/actions`, "POST", {
                action,
              })
            }
            onSchedule={async () => {
              const raw = await promptInApp(
                "Intervalle de répétition en minutes (0 supprime la planification)",
                String((taskDetail.task.intervalSeconds ?? 0) / 60)
              );
              if (raw === null) return;
              const value = Number(raw);
              if (!Number.isFinite(value) || value < 0) {
                setError("Saisissez un nombre de minutes valide.");
                return;
              }
              if (value > 0 && value < 1) {
                setError("L’intervalle doit être d’au moins 1 minute.");
                return;
              }
              await mutate(
                `/tasks/${taskDetail.task.id}/schedule`,
                "PUT",
                {
                  intervalSeconds: value ? Math.round(value * 60) : null,
                }
              );
            }}
            settings={settings}
            task={taskDetail.task}
          />
          {taskDetail.task.error && (
            <p className="chat-error">{taskDetail.task.error}</p>
          )}
          {taskDetail.events.slice(-6).map((event) => (
            <p className="muted" key={event.id}>
              {event.text}
            </p>
          ))}
          <small>
            {taskDetail.runs.length} exécution
            {taskDetail.runs.length > 1 ? "s" : ""} enregistrée
            {taskDetail.runs.length > 1 ? "s" : ""}
          </small>
        </section>
      )}
    </main>
  );
};
