import "server-only";

import type { AgentBusinessEvent } from "@/lib/agent/events/business";
import { addAgentBusinessEventListener } from "@/lib/agent/events/business";

// NotificationService Agent : unique point de consommation des événements
// métier pour la notification. Aucun appel dispersé dans le runtime : le
// runtime émet des événements, ce service décide qui est notifié, sur quel
// canal, et avec quel lien. Les emails système mAI passent par un transport
// dédié (port EmailTransport) — jamais par les connexions Gmail des
// utilisateurs, et rien n'est à configurer par l'utilisateur pour les recevoir.

type NotifiableEvent = Extract<
  AgentBusinessEvent,
  { type: "run_finished" | "approval_required" | "waiting_for_user" }
>;

// Seuls les événements IMPORTANTS déclenchent une notification : un run long
// terminé, un échec, une approbation requise, une information utilisateur
// requise, ou le résultat d'une tâche planifiée.
export const NOTIFIABLE_EVENT_TYPES: readonly NotifiableEvent["type"][] = [
  "approval_required",
  "run_finished",
  "waiting_for_user",
];

// Seuil au-delà duquel un run terminé réussi est considéré « long » : un run
// de quelques secondes ne mérite pas une interruption.
export const LONG_RUN_MS = 60_000;

export type AgentNotificationType =
  | "agent_approval_required"
  | "agent_run_failed"
  | "agent_run_finished"
  | "agent_user_input_required";

export type AgentNotificationPayload = {
  body: string;
  link: string;
  title: string;
  type: AgentNotificationType;
};

export type AgentNotificationPrefs = {
  agentApprovalRequired: boolean;
  agentEmailEnabled: boolean;
  agentPushEnabled: boolean;
  agentRunFailed: boolean;
  agentRunFinished: boolean;
  agentUserInputRequired: boolean;
};

// Port de transport email : l'implémentation concrète viendra de
// l'infrastructure mAI (endpoint dédié). Aucune clé utilisateur n'intervient.
export type EmailTransport = (message: {
  body: string;
  link: string;
  title: string;
  to: string;
}) => Promise<void>;

// Port de transport push (web push / appareils enregistrés côté mAI).
export type PushTransport = (message: {
  body: string;
  link: string;
  title: string;
  userId: string;
}) => Promise<void>;

// Adaptateurs par défaut : journalisation serveur. Ils garantissent la
// traçabilité des tentatives sans dépendre d'un provider non confirmé.
export const loggingEmailTransport: EmailTransport = async (message) => {
  console.info(
    `[agent-notifications] email → ${message.to} : ${message.title} (${message.link})`
  );
};

export const loggingPushTransport: PushTransport = async (message) => {
  console.info(
    `[agent-notifications] push → user ${message.userId} : ${message.title}`
  );
};

let emailTransport: EmailTransport = loggingEmailTransport;
let pushTransport: PushTransport = loggingPushTransport;

export function setAgentNotificationTransports(params: {
  email?: EmailTransport;
  push?: PushTransport;
}): void {
  if (params.email) {
    emailTransport = params.email;
  }
  if (params.push) {
    pushTransport = params.push;
  }
}

function linkFor(event: NotifiableEvent): string {
  if (event.type === "approval_required") {
    return `/agent/runs/${event.runId}?approval=${event.approvalRequestId}`;
  }
  return `/agent/runs/${event.runId}`;
}

function describeEvent(
  event: NotifiableEvent
): { body: string; title: string } | null {
  switch (event.type) {
    case "approval_required":
      return {
        body: "Agent attend votre accord pour continuer en toute sécurité.",
        title: "Approbation requise",
      };
    case "waiting_for_user":
      return {
        body: "Agent a une question pour vous avant de poursuivre.",
        title: "Information requise",
      };
    case "run_finished":
      if (event.status === "failed") {
        return {
          body: "Agent a échoué. Les étapes réalisées restent consultables.",
          title: "Agent a échoué",
        };
      }
      if (event.status === "timed_out") {
        return {
          body: "Agent a atteint la limite de durée de votre forfait. Le travail réalisé est conservé et consultable.",
          title: "Limite de durée atteinte",
        };
      }
      if (event.status === "completed") {
        return {
          body: "Agent a terminé la tâche confiée.",
          title: "Agent a terminé",
        };
      }
      return null;
    default:
      return null;
  }
}

// Construction de la notification depuis un événement. `isScheduledResult`
// qualifie le titre d'une tâche planifiée ; `durationMs` filtre les runs
// réussis trop courts pour mériter une interruption.
export function notificationForEvent(
  event: AgentBusinessEvent,
  context: {
    chatId?: string | null;
    durationMs?: number;
    isScheduledResult: boolean;
  }
): AgentNotificationPayload | null {
  if (!NOTIFIABLE_EVENT_TYPES.includes(event.type as NotifiableEvent["type"])) {
    return null;
  }
  const notifiable = event as NotifiableEvent;
  const described = describeEvent(notifiable);
  if (!described) {
    return null;
  }
  if (notifiable.type === "run_finished") {
    if (notifiable.status === "completed") {
      const long = (context.durationMs ?? 0) >= LONG_RUN_MS;
      const scheduled = context.isScheduledResult;
      if (!long && !scheduled) {
        return null; // run court réussi : pas d'interruption
      }
    }
  }
  const type: AgentNotificationType =
    notifiable.type === "approval_required"
      ? "agent_approval_required"
      : notifiable.type === "waiting_for_user"
        ? "agent_user_input_required"
        : notifiable.status === "failed"
          ? "agent_run_failed"
          : "agent_run_finished";
  return {
    body: described.body,
    // Lien RÉELLEMENT ouvert : la conversation qui contient le run
    // (/chat/<chatId>). Aucun lien vers une route page inexistante — sans
    // chatId connu, repli sur la liste des runs de l'espace Agent.
    link: context.chatId ? `/chat/${context.chatId}` : linkFor(notifiable),
    title:
      context.isScheduledResult && notifiable.type === "run_finished"
        ? `Tâche planifiée : ${described.title}`
        : described.title,
    type,
  };
}

export type AgentNotificationTarget = {
  // Conversation du run : utilisée pour un lien réellement ouvert.
  chatId?: string | null;
  email: string;
  isScheduledResult: boolean;
  prefs: AgentNotificationPrefs;
  userId: string;
};

// Abonnement du service au flux d'événements : à installer une fois au
// démarrage serveur. Le résolveur fourni par l'application charge l'utilisateur
// et ses préférences (user_notification_prefs) depuis la base.
export function installAgentNotificationListener(params: {
  resolveTarget: (runId: string) => Promise<AgentNotificationTarget | null>;
}): void {
  addAgentBusinessEventListener((event) => {
    if (
      !NOTIFIABLE_EVENT_TYPES.includes(event.type as NotifiableEvent["type"])
    ) {
      return;
    }
    void params
      .resolveTarget(event.runId)
      .then(async (target) => {
        if (!target) {
          return;
        }
        const notification = notificationForEvent(event, {
          chatId: target.chatId,
          isScheduledResult: target.isScheduledResult,
        });
        if (!notification) {
          return;
        }

        const allowedByType =
          (notification.type === "agent_approval_required" &&
            target.prefs.agentApprovalRequired) ||
          (notification.type === "agent_run_failed" &&
            target.prefs.agentRunFailed) ||
          (notification.type === "agent_run_finished" &&
            target.prefs.agentRunFinished) ||
          (notification.type === "agent_user_input_required" &&
            target.prefs.agentUserInputRequired);
        if (!allowedByType) {
          return;
        }

        // In-app persisté (table Notification) via l'application hôte : le
        // service ne dépend d'aucun provider — la persistance est injectée.
        // C'est le canal par défaut : l'utilisateur retrouve l'attente même
        // après avoir fermé l'application.
        await persistInAppNotification({
          dedupeKey: `${event.runId}:${event.type}`,
          payload: notification,
          userId: target.userId,
        }).catch(() => {});

        // Email système mAI : seulement si un canal email est activé ET qu'une
        // adresse est connue (jamais de repli sur un identifiant interne).
        if (target.prefs.agentEmailEnabled && target.email) {
          await emailTransport({
            body: notification.body,
            link: notification.link,
            title: notification.title,
            to: target.email,
          }).catch(() => {});
        }
        if (target.prefs.agentPushEnabled) {
          await pushTransport({
            body: notification.body,
            link: notification.link,
            title: notification.title,
            userId: target.userId,
          }).catch(() => {});
        }
      })
      .catch(() => {});
  });
}

// Injection de la persistance in-app : l'application fournit sa fonction de
// création de notification (tables et conventions locales), le service reste
// découplé.
let inAppWriter:
  | ((notification: {
      dedupeKey?: string;
      payload: AgentNotificationPayload;
      userId: string;
    }) => Promise<void>)
  | null = null;

export function setAgentInAppNotificationWriter(
  writer: (notification: {
    dedupeKey?: string;
    payload: AgentNotificationPayload;
    userId: string;
  }) => Promise<void>
): void {
  inAppWriter = writer;
}

export async function persistInAppNotification(params: {
  dedupeKey?: string;
  payload: AgentNotificationPayload;
  userId: string;
}): Promise<void> {
  await inAppWriter?.(params);
}
