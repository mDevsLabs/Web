import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { createSkill, getSkillsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const createSkillSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(20_000),
  isPublic: z.boolean().optional(),
  mcpServerIds: z.array(z.string().uuid()).max(20).optional(),
  mcpToolFilter: z.record(z.string(), z.array(z.string()).nullable()).optional(),
  name: z.string().min(1).max(100),
  parameters: z
    .array(
      z.object({
        defaultValue: z.string().optional(),
        description: z.string().optional(),
        enumValues: z.array(z.string()).optional(),
        name: z.string().min(1).max(50),
        required: z.boolean().optional(),
        type: z.enum(["string","number","boolean","enum"]).optional(),
      })
    )
    .optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  templateId: z.string().uuid().nullable().optional(),
  tools: z.array(z.string()).optional(),
});

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;

  const skills = await getSkillsByUserId({ userId });
  return Response.json(skills);
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const json = await request.json();
    const parsed = createSkillSchema.parse(json);

    const created = await createSkill({
      ...parsed,
      userId,
    });

    return Response.json(created, { status: 201 });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Données invalides" },
      { status: 400 }
    );
  }
}
