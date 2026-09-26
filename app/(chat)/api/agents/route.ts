import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import { createAgent, getAgentsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { agentQuotaMessage, getTierAgentLimit } from "@/lib/plans/tier-limits";

const createAgentSchema = z.object({
  cloudFileUrls: z
    .array(z.string().url().or(z.string().min(1)))
    .max(10)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  defaultModelId: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(5000),
  maxTokens: z.number().int().min(1).max(1_000_000).nullable().optional(),
  mcpServerIds: z.array(z.string().min(1)).max(10).optional(),
  memoryMode: z.enum(["global", "custom"]).optional(),
  name: z.string().min(1).max(100),
  pinned: z.boolean().optional(),
  skillIds: z.array(z.string().min(1)).max(10).optional(),
  starterPrompts: z.array(z.string().min(1).max(500)).max(10).optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  topP: z.number().min(0).max(1).nullable().optional(),
  welcomeMessage: z.string().max(2000).nullable().optional(),
});

export async function GET() {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const agents = await getAgentsByUserId({ userId });
  // La limite dépend du forfait (Plus 15 / Pro 25 / Max illimité) : elle est
  // renvoyée avec la liste pour que chaque affichage affiche la bonne valeur
  // sans avoir à refaire un appel de résolution de forfait.
  return Response.json({
    agents,
    limit: getTierAgentLimit(user.tier),
  });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  // Quota d'agents : Plus 15 / Pro 25 / Max illimité (null = pas de contrôle).
  const existing = await getAgentsByUserId({ userId });
  const agentLimit = getTierAgentLimit(user.tier);
  if (agentLimit !== null && existing.length >= agentLimit) {
    return errorResponse("quota_exceeded", {
      details: { limit: agentLimit, used: existing.length },
      message: agentQuotaMessage(agentLimit),
      status: 403,
    });
  }

  try {
    const json = await request.json();
    const parsed = createAgentSchema.parse(json);
    const created = await createAgent({
      ...parsed,
      instructions: parsed.instructions.slice(0, 5000),
      userId,
    });
    return Response.json(created, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e: any) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur création agent", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la création de l'agent.",
    });
  }
}
