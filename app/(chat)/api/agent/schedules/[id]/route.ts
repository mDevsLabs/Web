import { z } from "zod";
import { scheduleMutationSchema } from "@/lib/agent/contracts";
import { nextOccurrenceFromRule } from "@/lib/agent/scheduler/occurrence";
import { resolveOnceDueAt } from "@/lib/agent/scheduler/once";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import {
  getAgentScheduleById,
  listOccurrencesByScheduleId,
  mutateAgentSchedule,
} from "@/lib/db/agent-foundation-queries";

// Mutation d'une tâche planifiée : pause, reprise, modification, suppression
// logique — toutes protégées par la révision optimiste. Une modification de
// la règle ou du fuseau recalcule la prochaine échéance depuis la règle et le
// fuseau. Les runs passés restent consultables même après suppression.

const patchSchema = z.object({
  expectedRevision: z.number().int().min(0),
  mutation: scheduleMutationSchema,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const schedule = await getAgentScheduleById({ id, userId });
  if (!schedule || schedule.status === "deleted") {
    return errorResponse("not_found", {
      message: "Tâche planifiée introuvable.",
    });
  }

  const occurrences = await listOccurrencesByScheduleId({ scheduleId: id });
  return Response.json(
    { occurrences, schedule },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;
  await enforceChatRateLimit(request, userId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", { message: "Requête invalide." });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }

  const existing = await getAgentScheduleById({ id, userId });
  if (!existing || existing.status === "deleted") {
    return errorResponse("not_found", {
      message: "Tâche planifiée introuvable.",
    });
  }

  const { expectedRevision, mutation } = parsed.data;

  // Modification : recalcul de la prochaine échéance si la règle change.
  let patch: Record<string, unknown> = {};
  if (mutation.action === "update") {
    patch = { ...mutation.patch };
    if (mutation.patch.rule || mutation.patch.timezone) {
      const rule = mutation.patch.rule ?? existing.rule;
      const timezone = mutation.patch.timezone ?? existing.timezone;
      const once =
        rule.kind === "once" ? resolveOnceDueAt({ rule, timezone }) : null;
      const nextDue =
        rule.kind === "once"
          ? once?.ok
            ? once.dueAt
            : null
          : nextOccurrenceFromRule(rule, timezone, new Date());
      if (once && !once.ok) {
        return errorResponse("invalid_request", {
          message: once.error,
        });
      }
      if (nextDue) {
        patch.nextDueAt = nextDue;
      }
    }
  }

  const applied = await mutateAgentSchedule({
    expectedRevision,
    id,
    mutation:
      mutation.action === "update"
        ? { action: "update", patch: patch as typeof mutation.patch }
        : mutation,
    userId,
  });

  if (!applied) {
    return errorResponse("conflict", {
      message: "La tâche a été modifiée entre-temps. Rechargez et réessayez.",
    });
  }

  const updated = await getAgentScheduleById({ id, userId });
  return Response.json({ schedule: updated });
}
