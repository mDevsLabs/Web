import { z } from "zod";
import {
  isValidIanaTimezone,
  scheduleIntentSchema,
} from "@/lib/agent/contracts";
import { checkAgentAccess } from "@/lib/agent/gate";
import { nextOccurrenceFromRule } from "@/lib/agent/scheduler/occurrence";
import { resolveOnceDueAt } from "@/lib/agent/scheduler/once";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { authenticateChatRequest, enforceChatRateLimit } from "@/lib/chat/auth";
import {
  createAgentSchedule,
  listAgentSchedules,
} from "@/lib/db/agent-foundation-queries";

// CRUD des tâches planifiées Agent. Le serveur fait autorité : l'intention
// (issue du modèle ou du client) est validée par le contrat ScheduleIntent,
// le fuseau IANA est revérifié, la prochaine échéance est calculée depuis la
// règle + fuseau, et l'accès Agent est requis.

const listQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const query = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!query.success) return errorResponse("invalid_request");
  const schedules = await listAgentSchedules({
    includeDeleted: query.data.includeDeleted,
    userId,
  });
  return Response.json(
    { schedules },
    {
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", {
      message: "Requête invalide.",
    });
  }

  const parsed = scheduleIntentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const intent = parsed.data;

  const { auth, error } = await authenticateChatRequest();
  if (error === "forbidden") {
    return errorResponse("access_denied");
  }
  if (error === "unauthorized" || !auth) {
    return errorResponse("auth_required");
  }
  await enforceChatRateLimit(request, auth.userId);
  const access = checkAgentAccess(auth);
  if (!access.allowed) {
    return access.response;
  }

  if (!isValidIanaTimezone(intent.timezone)) {
    return errorResponse("invalid_request", {
      message: "Fuseau horaire IANA invalide.",
    });
  }

  // Première échéance : calculée depuis la règle et le fuseau, jamais depuis
  // une conversion naïve UTC.
  // « once » : la date locale fournie est résolue dans le fuseau IANA de la
  // planification puis comparée à l'instant présent (date passée refusée).
  let firstDue: Date | null;
  if (intent.rule.kind === "once") {
    const once = resolveOnceDueAt({
      rule: intent.rule,
      timezone: intent.timezone,
    });
    if (!once.ok) {
      return errorResponse("invalid_request", { message: once.error });
    }
    firstDue = once.dueAt;
  } else {
    firstDue = nextOccurrenceFromRule(intent.rule, intent.timezone, new Date());
  }
  if (!firstDue) {
    return errorResponse("invalid_request", {
      message:
        "Impossible de déterminer la première échéance de cette planification.",
    });
  }

  const schedule = await createAgentSchedule({
    agentId: intent.agentId,
    config: {
      autonomy: intent.autonomy,
      enabledCategories: intent.enabledCategories,
      reasoningLevel: intent.reasoningLevel,
    },
    instructions: intent.instructions,
    modelId: intent.modelId,
    nextDueAt: firstDue,
    projectId: intent.projectId,
    rule: intent.rule,
    timezone: intent.timezone,
    title: intent.title,
    userId: auth.userId,
  });

  // Aucun événement run_started émis ici : la création d'un schedule n'est
  // PAS un run. run_started est émis par le runtime quand un vrai run
  // démarre — un événement avec runId = schedule.id fabriquait des
  // notifications mensongères (lien vers un run qui n'existe pas).

  return Response.json({ schedule }, { status: 201 });
}
