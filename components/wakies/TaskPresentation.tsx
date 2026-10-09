"use client";

import {
  CheckCheckIcon as CheckCheck,
  ChevronRightIcon as ChevronRight,
  LoaderCircleIcon as LoaderCircle,
  MessageCircleIcon as MessageCircle,
} from "@mdevs/icons";
import { Mascot } from "@/components/wakies/Mascot";
import type { Task, Status as TaskStatus } from "@/lib/wakies/shared/types";
export const relative = (value: number) => {
  const minutes = Math.floor((Date.now() - value) / 60_000);
  return minutes < 1
    ? "À l’instant"
    : minutes < 60
      ? `il y a ${minutes} min`
      : minutes < 1440
        ? `il y a ${Math.floor(minutes / 60)} h`
        : new Date(value).toLocaleDateString();
};
// Les statuts sont stockés en anglais ; l'interface est monolingue français
// (AGENTS.md §7). Une valeur inconnue retombe sur son nom brut.
const STATUS_LABELS: Record<TaskStatus, string> = {
  cancelled: "Annulée",
  completed: "Terminée",
  failed: "Échec",
  paused: "En pause",
  queued: "En attente",
  running: "En cours",
};

export const statusLabel = (task: Task) =>
  task.status === "completed" && task.nextRunAt
    ? "Planifiée"
    : (STATUS_LABELS[task.status] ?? task.status);
export function Status({ task }: { task: Task }) {
  return (
    <span className={`status ${task.status}`}>
      <span />
      {statusLabel(task)}
    </span>
  );
}

export function TaskRow({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  return (
    <button className="task-row" onClick={onClick}>
      <span className="task-row-icon">
        {task.status === "completed" ? (
          <CheckCheck size={19} />
        ) : task.status === "running" ? (
          <LoaderCircle className="spin" size={19} />
        ) : (
          <MessageCircle size={19} />
        )}
      </span>
      <div>
        <strong>{task.prompt}</strong>
        <span>
          {task.intervalSeconds
            ? `Repeats every ${task.intervalSeconds < 3600 ? `${task.intervalSeconds / 60} min` : `${task.intervalSeconds / 3600} hr`} · `
            : ""}
          {relative(task.updatedAt)}
        </span>
      </div>
      <Status task={task} />
      <ChevronRight size={16} />
    </button>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="large-empty">
      <Mascot />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
