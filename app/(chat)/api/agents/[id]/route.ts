import { z } from "zod";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import { deleteAgent, getAgentById, updateAgent } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const updateAgentSchema = z.object({
  cloudFileUrls: z.array(z.string()).max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  defaultModelId: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).nullable().optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(5000).optional(),
  maxTokens: z.number().int().min(1).max(1_000_000).nullable().optional(),
  mcpServerIds: z.array(z.string().uuid()).max(10).optional(),
  name: z.string().min(1).max(100).optional(),
  pinned: z.boolean().optional(),
  skillIds: z.array(z.string().uuid()).max(10).optional(),
  starterPrompts: z.array(z.string().min(1).max(500)).max(10).optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  topP: z.number().min(0).max(1).nullable().optional(),
  welcomeMessage: z.string().max(2000).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;
  const found = await getAgentById({ id, userId });
  // Allow fetching own agent or public template fallback via same id? Only own for now
  if (!found) {
    return Response.json({ error: "Agent introuvable" }, { status: 404 });
  }
  return Response.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;
  try {
    const json = await request.json();
    const parsed = updateAgentSchema.parse(json);
    if (parsed.instructions) {
      parsed.instructions = parsed.instructions.slice(0, 5000);
    }
    const updated = await updateAgent({ data: parsed as any, id, userId });
    if (!updated) {
      return Response.json({ error: "Agent introuvable" }, { status: 404 });
    }
    return Response.json(updated);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Erreur mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;
  const deleted = await deleteAgent({ id, userId });
  if (!deleted) {
    return Response.json({ error: "Agent introuvable" }, { status: 404 });
  }
  return Response.json({ message: "Agent supprimé", success: true });
}
