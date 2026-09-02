import { z } from "zod";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import { createAgent, getAgentsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

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
  emoji: z.string().max(10).nullable().optional(),
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
  return Response.json(agents);
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  // Enforce max 10 agents per user
  const existing = await getAgentsByUserId({ userId });
  if (existing.length >= 10) {
    return Response.json(
      {
        error:
          "Limite de 10 agents atteinte. Supprimez un agent avant d'en créer un nouveau.",
      },
      { status: 403 }
    );
  }

  try {
    const json = await request.json();
    const parsed = createAgentSchema.parse(json);
    if (parsed.emoji?.trim()) {
      const graphemes = Array.from(parsed.emoji.trim());
      if (graphemes.length > 4) {
        return Response.json(
          { error: "Emoji trop long (max 4 caractères)" },
          { status: 400 }
        );
      }
    }
    const created = await createAgent({
      ...parsed,
      instructions: parsed.instructions.slice(0, 5000),
      userId,
    });
    return Response.json(created, { status: 201 });
  } catch (err: any) {
    console.error("Erreur création agent:", err);
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e: any) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return Response.json(
        { error: `Données invalides : ${issues}` },
        { status: 400 }
      );
    }
    return Response.json(
      { error: err.message ?? "Erreur lors de la création de l'agent" },
      { status: 500 }
    );
  }
}
