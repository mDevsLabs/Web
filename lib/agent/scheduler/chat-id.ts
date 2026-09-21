import { createHash } from "node:crypto";

// Identifiant de conversation d'une tâche planifiée.
//
// Une tâche planifiée ne doit PAS réutiliser le `projectId` comme `chatId` :
// plusieurs planifications d'un même projet partageaient alors une seule
// conversation, avec un contexte, des reprises et des approbations mélangés
// entre tâches (et potentiellement entre utilisateurs si le projet est partagé).
//
// L'identifiant est dérivé de façon DÉTERMINISTE du schedule : la même tâche
// retrouve toujours la même conversation (l'historique persiste à travers les
// occurrences), sans ajouter de colonne en base. Le résultat est un UUID
// valide, imposé par le type `uuid` de la colonne `Chat.id`.

const NAMESPACE = "mai-agent-schedule-chat:v1:";

/** UUID déterministe (format v5) dérivé de l'identifiant du schedule. */
export function scheduleChatId(scheduleId: string): string {
  const digest = createHash("sha256")
    .update(`${NAMESPACE}${scheduleId}`, "utf8")
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  // Version 5 (nom/namespace) et variante RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** Vrai si la chaîne est un UUID canonique (format attendu par `Chat.id`). */
export function isCanonicalUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}
