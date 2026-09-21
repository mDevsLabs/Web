import { isValidIanaTimezone, type ScheduleRule } from "@/lib/agent/contracts";
import { zonedTimeToUtc } from "./occurrence";

// Résolution d'une planification « once ».
//
// La règle ne portait aucune date d'exécution : `nextDueAt` était construit à
// `null` et la route refusait la création (« une date explicite est requise »),
// ce qui rendait le type « once » inutilisable. La date locale est désormais
// convertie dans le fuseau IANA de la planification — le fuseau est donc
// appliqué AVANT de comparer à l'instant présent, ce qui rend le calcul
// correct pour un utilisateur qui planifie depuis un autre fuseau.
//
// Les erreurs sont explicites et n'exposent aucune donnée interne.

export type OnceResolution =
  | { dueAt: Date; ok: true }
  | { error: string; ok: false };

const RUN_AT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function resolveOnceDueAt(params: {
  now?: Date;
  rule: ScheduleRule;
  timezone: string;
}): OnceResolution {
  if (params.rule.kind !== "once") {
    return { error: "La règle fournie n'est pas une exécution unique.", ok: false };
  }
  const runAt = params.rule.runAt;
  if (!runAt) {
    return {
      error:
        "Une tâche planifiée unique exige une date d'exécution (champ « runAt », format AAAA-MM-JJTHH:mm).",
      ok: false,
    };
  }
  const match = runAt.match(RUN_AT_PATTERN);
  if (!match) {
    return { error: "Date d'exécution invalide (attendu AAAA-MM-JJTHH:mm).", ok: false };
  }
  if (!isValidIanaTimezone(params.timezone)) {
    return { error: "Fuseau horaire IANA invalide.", ok: false };
  }

  const [, year, month, day, hour, minute] = match;
  const numeric = {
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    month: Number(month),
    year: Number(year),
  };
  if (numeric.hour > 23 || numeric.minute > 59) {
    return { error: "Heure d'exécution invalide.", ok: false };
  }
  // Une date impossible (31 février) est normalisée par Date.UTC : on la refuse
  // plutôt que de planifier une exécution à une date que l'utilisateur n'a pas
  // choisie.
  const probe = new Date(Date.UTC(numeric.year, numeric.month - 1, numeric.day));
  if (probe.getUTCDate() !== numeric.day || probe.getUTCMonth() !== numeric.month - 1) {
    return { error: "Cette date n'existe pas dans le calendrier.", ok: false };
  }

  const dueAt = zonedTimeToUtc(numeric, params.timezone);
  const now = params.now ?? new Date();
  if (dueAt.getTime() <= now.getTime()) {
    return {
      error: "La date d'exécution doit être dans le futur.",
      ok: false,
    };
  }
  return { dueAt, ok: true };
}
