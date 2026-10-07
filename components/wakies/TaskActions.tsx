"use client";

import { Clock3, Pause, Play, Square } from "lucide-react";
import type { Action, Settings, Task } from "@/lib/wakies/shared/types";
export function TaskActions({
  task,
  busy,
  settings,
  onAction,
  onSchedule,
}: {
  task: Task;
  busy: boolean;
  settings: Settings;
  onAction: (action: Action) => void;
  onSchedule: () => void;
}) {
  const active = task.status === "running" || task.status === "queued";
  return (
    <div className="task-controls">
      {active ? (
        <button disabled={busy} onClick={() => onAction("pause")}>
          <Pause size={14} />
          Mettre la tâche en pause
        </button>
      ) : (
        <button
          disabled={busy || settings.paused || !settings.researchAllowed}
          onClick={() => onAction("run")}
        >
          <Play size={14} />
          {task.status === "failed"
            ? "Relancer la tâche"
            : task.status === "paused"
              ? "Reprendre la tâche"
              : "Relancer"}
        </button>
      )}
      {task.status === "completed" && !!task.intervalSeconds && (
        <button disabled={busy} onClick={() => onAction("pause")}>
          <Pause size={14} />
          Mettre la planification en pause
        </button>
      )}
      <button onClick={onSchedule}>
        <Clock3 size={14} />
        {task.intervalSeconds
          ? "Modifier la planification"
          : "Définir une planification"}
      </button>
      {task.status !== "cancelled" && (
        <button
          className="quiet-button"
          disabled={busy}
          onClick={() => onAction("cancel")}
        >
          <Square size={12} />
          Annuler
        </button>
      )}
    </div>
  );
}
