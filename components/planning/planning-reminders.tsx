"use client";

/**
 * ============================================================================
 * RAPPELS DE LA PAGE PLANIFICATION
 * ============================================================================
 *
 * Trois choses, une seule surface :
 *
 * 1. une liste de RAPPELS D'APPAREIL (« penser à relancer la veille »), créés
 *    en langage naturel — « demain 9h », « dans 2 heures » ;
 * 2. un délai d'ALERTE D'EXÉCUTION appliqué à toutes les planifications du
 *    compte (« me prévenir 10 minutes avant ») ;
 * 3. l'AUTORISATION de notification, demandée depuis un geste explicite —
 *    `Notification.requestPermission()` hors geste utilisateur est ignoré par
 *    les navigateurs, et c'est la raison d'être du bouton.
 *
 * Les décisions de calcul sont dans `lib/planning/reminders.ts` (pur, testé) :
 * ce composant ne fait qu'afficher, stocker et sonner.
 *
 * POURQUOI LES RAPPELS SONT LOCAUX
 *
 * Une planification s'exécute côté serveur, application fermée. Un rappel, non :
 * il n'a de sens que si quelqu'un est devant l'écran. Le stocker en base
 * laisserait croire qu'il sonnera sur un poste éteint.
 */

import {
  AlarmClockIcon,
  BellIcon,
  BellOffIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  RepeatIcon,
  Trash2Icon,
  XIcon,
} from "@mdevs/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ScheduledMessage } from "@/lib/db/schema";
import { parseNaturalDate } from "@/lib/planning/natural-date";
import {
  ALERT_LEAD_OPTIONS,
  type AlertLeadMinutes,
  afterNotification,
  createReminder,
  currentOccurrence,
  formatCountdown,
  nextOccurrence,
  PLANNING_REMINDERS_STORAGE_KEY,
  type PlanningReminder,
  parseReminders,
  REMINDER_RECURRENCE_LABELS,
  type ReminderRecurrence,
  readAlertLeadMinutes,
  readReminders,
  remindersToNotify,
  serializeReminders,
  sortReminders,
  writeAlertLeadMinutes,
  writeReminders,
} from "@/lib/planning/reminders";
import { cn } from "@/lib/utils";

/** Cadence de la boucle : une minute suffit, un rappel est à la minute près. */
const TICK_MS = 30_000;

type PermissionState = NotificationPermission | "unsupported";

function readPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

function formatWhen(at: Date): string {
  return at.toLocaleString("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  });
}

function fireNotification(title: string, body: string, tag: string) {
  if (readPermission() !== "granted") {
    return;
  }
  try {
    const notification = new Notification(title, { body, tag });
    // Cliquer la notification ramène à l'onglet et la referme : sans cela,
    // elle reste dans le centre de notifications après qu'on l'a traitée.
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Un contexte non sécurisé refuse la construction : le toast reste.
  }
}

interface PlanningRemindersPanelProps {
  /** Identifiant du compte : les rappels sont stockés par compte. */
  accountId: string;
  /** Planifications du compte — sert à l'alerte « avant exécution ». */
  schedules: ScheduledMessage[];
}

export function PlanningRemindersPanel({
  accountId,
  schedules,
}: PlanningRemindersPanelProps) {
  const [reminders, setReminders] = useState<PlanningReminder[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftRecurrence, setDraftRecurrence] =
    useState<ReminderRecurrence>("none");
  const [alertLead, setAlertLead] = useState(10);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [now, setNow] = useState(() => new Date());

  // Les alertes d'exécution déjà envoyées. Une clé = une planification À UNE
  // HEURE DONNÉE : réactiver une tâche doit pouvoir re-sonner.
  const alerteEnvoyee = useRef<Set<string>>(new Set());

  const parsed = useMemo(
    () => (draft.trim() ? parseNaturalDate(draft, now) : null),
    [draft, now]
  );

  // Les rappels sont relus au montage ET au changement de compte : sans cela,
  // se connecter avec un autre compte garderait la liste du précédent.
  useEffect(() => {
    setReminders(readReminders(accountId));
  }, [accountId]);

  useEffect(() => {
    setAlertLead(readAlertLeadMinutes());
    setPermission(readPermission());
  }, []);

  // La liste est réécrite à chaque changement : une seule source de vérité,
  // le `localStorage`, et l'état React n'en est que le reflet.
  const persist = useCallback(
    (next: PlanningReminder[]) => {
      const sorted = sortReminders(next);
      setReminders(sorted);
      writeReminders(sorted, accountId);
    },
    [accountId]
  );

  const addReminder = useCallback(() => {
    if (!parsed) {
      return;
    }
    const reminder = createReminder({
      at: parsed.at,
      recurrence: draftRecurrence,
      title: draftTitle.trim() || "Rappel",
    });
    persist([...reminders, reminder]);
    setDraft("");
    setDraftTitle("");
    setDraftRecurrence("none");
    toast.success(`Rappel créé : ${parsed.label}`);
  }, [draftRecurrence, draftTitle, parsed, persist, reminders]);

  const removeReminder = useCallback(
    (id: string) => {
      persist(reminders.filter((entry) => entry.id !== id));
    },
    [persist, reminders]
  );

  // La boucle de notification. Elle tourne aussi onglet caché : c'est
  // précisément là qu'un rappel est utile. Seul l'affichage du compte à
  // rebours est figé quand l'onglet est en arrière-plan (React le fait seul).
  useEffect(() => {
    const tick = () => {
      const instant = new Date();
      setNow(instant);
      const due = remindersToNotify(reminders, instant);
      if (due.length === 0) {
        return;
      }
      let next = reminders;
      for (const reminder of due) {
        const occurrence = currentOccurrence(reminder, instant) ?? instant;
        fireNotification(
          reminder.title,
          `${reminder.note || "C'est l'heure de votre rappel."} · ${formatWhen(occurrence)}`,
          `mai-rappel-${reminder.id}`
        );
        toast.info(reminder.title, {
          description: reminder.note || "C'est l'heure de votre rappel.",
          duration: 15_000,
        });
        next = next.map((entry) =>
          entry.id === reminder.id ? afterNotification(entry, instant) : entry
        );
      }
      persist(next);
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [persist, reminders]);

  // Alerte « avant exécution » : la planification n'est PAS locale, mais
  // l'avertissement l'est — il prévient l'utilisateur, il ne déclenche rien.
  useEffect(() => {
    if (alertLead <= 0) {
      return;
    }
    const tick = () => {
      const instant = Date.now();
      const windowMs = alertLead * 60_000;
      for (const item of schedules) {
        if (item.status !== "pending") {
          continue;
        }
        const at = new Date(item.scheduledAt).getTime();
        const delta = at - instant;
        if (delta <= 0 || delta > windowMs) {
          continue;
        }
        const cle = `${item.id}@${item.scheduledAt}`;
        if (alerteEnvoyee.current.has(cle)) {
          continue;
        }
        alerteEnvoyee.current.add(cle);
        const minutes = Math.max(1, Math.round(delta / 60_000));
        fireNotification(
          `Dans ${minutes} min : ${item.title}`,
          "Une planification du compte va s'exécuter.",
          `mai-planning-${cle}`
        );
        toast.info(`Dans ${minutes} min : ${item.title}`, {
          description: "Une planification du compte va s'exécuter.",
          duration: 12_000,
        });
      }
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [alertLead, schedules]);

  const demanderAutorisation = async () => {
    if (permission === "unsupported") {
      toast.error("Ce navigateur ne gère pas les notifications.");
      return;
    }
    // Le geste utilisateur est obligatoire : hors de ce clic, la demande est
    // ignorée sans message par Safari et Firefox.
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications autorisées pour les rappels.");
    } else if (result === "denied") {
      toast.warning(
        "Notifications refusées : les rappels s'afficheront dans l'application."
      );
    }
  };

  const enAttente = useMemo(
    () => remindersToNotify(reminders, now).length,
    [now, reminders]
  );

  // Prochaine exécution du compte : l'information que la liste des cartes ne
  // donne pas d'un coup d'œil dès qu'il y a plus de deux planifications.
  const prochaineExecution = useMemo(() => {
    const pending = schedules
      .filter((item) => item.status === "pending")
      .map((item) => new Date(item.scheduledAt))
      .filter(
        (at) => Number.isFinite(at.getTime()) && at.getTime() > now.getTime()
      )
      .sort((a, b) => a.getTime() - b.getTime());
    return pending[0] ?? null;
  }, [now, schedules]);

  return (
    <section className="surface-card mb-5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlarmClockIcon className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Rappels</h2>
            <p className="text-xs text-muted-foreground">
              Un rappel d'appareil : il sonne ici, tant que mAI est ouvert.
              {enAttente > 0 && (
                <span className="ml-1 font-medium text-warning">
                  {enAttente} à traiter
                </span>
              )}
              {prochaineExecution && (
                <span className="ml-1 text-info">
                  · prochaine exécution{" "}
                  {formatCountdown(prochaineExecution, now)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            M'avertir avant une exécution
            <select
              className="field-input h-8 px-2 py-0 text-xs"
              onChange={(event) => {
                const value = Number(event.target.value) as AlertLeadMinutes;
                setAlertLead(value);
                writeAlertLeadMinutes(value);
              }}
              value={alertLead}
            >
              {ALERT_LEAD_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes === 0 ? "jamais" : `${minutes} min`}
                </option>
              ))}
            </select>
          </label>

          {permission !== "granted" && (
            <button
              className="chip gap-1.5 px-2.5 py-1.5 text-xs"
              onClick={demanderAutorisation}
              title="Autoriser les notifications du navigateur"
              type="button"
            >
              {permission === "denied" ? (
                <BellOffIcon className="size-3.5" />
              ) : (
                <BellIcon className="size-3.5" />
              )}
              Autoriser
            </button>
          )}

          <button
            className="chip gap-1.5 px-2.5 py-1.5 text-xs"
            data-active={open ? "true" : undefined}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <PlusIcon
              className={cn(
                "size-3.5 transition-transform",
                open && "rotate-45"
              )}
            />
            Nouveau rappel
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-2 rounded-xl border border-border/50 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            className="field-input text-xs"
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Intitulé (ex. : relancer la veille)"
            value={draftTitle}
          />
          <div className="flex items-center gap-2">
            <input
              aria-label="Quand"
              className="field-input min-w-0 flex-1 font-mono text-xs"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addReminder();
                }
              }}
              placeholder="demain 9h, dans 2 heures…"
              value={draft}
            />
            <select
              aria-label="Répétition"
              className="field-input w-28 px-2 text-xs"
              onChange={(event) =>
                setDraftRecurrence(event.target.value as ReminderRecurrence)
              }
              value={draftRecurrence}
            >
              <option value="none">Une fois</option>
              <option value="daily">Chaque jour</option>
              <option value="weekly">Chaque semaine</option>
            </select>
          </div>
          <span
            className={cn(
              "self-center text-[11px]",
              parsed ? "text-success" : "text-muted-foreground"
            )}
          >
            {parsed ? parsed.label : "Ex. : « demain 9h », « dans 20 minutes »"}
          </span>
          <button
            className="chip items-center justify-center gap-1 px-3 py-1.5 text-xs disabled:opacity-40"
            disabled={!parsed}
            onClick={addReminder}
            type="button"
          >
            <CheckIcon className="size-3.5" />
            Créer
          </button>
        </div>
      )}

      {reminders.length > 0 && (
        <ul className="mt-3 divide-y divide-border/40">
          {reminders.map((reminder) => {
            const prochaine = nextOccurrence(reminder, now);
            const retard =
              reminder.recurrence === "none" &&
              prochaine.getTime() <= now.getTime();
            return (
              <li
                className="flex items-center justify-between gap-3 py-2"
                key={reminder.id}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                    {reminder.title}
                    {reminder.recurrence !== "none" && (
                      <span className="flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] font-semibold text-info">
                        <RepeatIcon className="size-2.5" />
                        {REMINDER_RECURRENCE_LABELS[reminder.recurrence]}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {formatWhen(prochaine)}
                    {reminder.note ? ` · ${reminder.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      retard ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {retard ? "échu" : formatCountdown(prochaine, now)}
                  </span>
                  <button
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => removeReminder(reminder.id)}
                    title="Supprimer le rappel"
                    type="button"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reminders.length === 0 && !open && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <XIcon className="size-3" />
          Aucun rappel. Les rappels sont propres à cet appareil.
        </p>
      )}
    </section>
  );
}

/**
 * Réexporté pour les tests et pour l'aperçu : la sérialisation doit rester
 * lisible par son propre analyseur, dans les deux sens.
 */
export const __reminderStorage = {
  key: PLANNING_REMINDERS_STORAGE_KEY,
  parse: parseReminders,
  serialize: serializeReminders,
};
