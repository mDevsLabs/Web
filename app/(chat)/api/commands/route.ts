import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { commandPayloadSchema } from "@/lib/commands/types";
import {
  createCustomCommand,
  getCustomCommandsByUserId,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const createCommandSchema = z.object({
  actionType: z.enum([
    "mcp",
    "agent",
    "skill",
    "prompt",
    "tools",
    "navigation",
  ]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  icon: z.string().max(50).optional(),
  kind: z.enum(["slash", "mention"]),
  name: z.string().min(1).max(100),
  payload: commandPayloadSchema.optional(),
  pinned: z.boolean().optional(),
  trigger: z.string().regex(/^[a-z0-9_-]{1,32}$/),
});

export async function GET(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  const kind = new URL(request.url).searchParams.get("kind");
  const commands = await getCustomCommandsByUserId({
    kind: kind === "slash" || kind === "mention" ? kind : undefined,
    userId,
  });
  return Response.json(commands);
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const parsed = createCommandSchema.parse(await request.json());
    const created = await createCustomCommand({
      ...parsed,
      userId,
    });
    return Response.json(created, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(err),
      });
    }
    const message = String((err as any)?.message ?? "");
    if (/duplicate|unique/i.test(String((err as any)?.cause ?? message))) {
      return errorResponse("conflict", {
        message: "Cette commande existe déjà (déclencheur ou nom identique).",
      });
    }
    logError("Erreur création commande", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la création de la commande.",
    });
  }
}
