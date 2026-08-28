import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { createAgent, getAgentsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const createAgentSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cloudFileUrls: z.array(z.string().url().or(z.string().min(1))).max(10).optional(),
  defaultModelId: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).nullable().optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(5000),
  mcpServerIds: z.array(z.string().uuid()).max(10).optional(),
  name: z.string().min(1).max(100),
  skillIds: z.array(z.string().uuid()).max(10).optional(),
});

export async function GET() {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const agents = await getAgentsByUserId({ userId });
  return Response.json(agents);
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) return planGuardResponse(guard)!;
  const user = guard.user;
  const userId = user.id || user.email;

  // Enforce max 10 agents per user
  const existing = await getAgentsByUserId({ userId });
  if (existing.length >= 10) {
    return Response.json({ error: "Limite de 10 agents atteinte. Supprimez un agent avant d'en créer un nouveau." }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = createAgentSchema.parse(json);
    if (parsed.emoji && parsed.emoji.trim()) {
      const graphemes = Array.from(parsed.emoji.trim());
      if (graphemes.length > 4) return Response.json({ error: "Emoji trop long (max 4 caractères)" }, { status: 400 });
    }
    const created = await createAgent({ ...parsed, userId, instructions: parsed.instructions.slice(0, 5000) });
    return Response.json(created, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Données invalides" }, { status: 400 });
  }
}
