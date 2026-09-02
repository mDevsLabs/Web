import { z } from "zod";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getSkillVersions, restoreSkillVersion } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(
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

  const versions = await getSkillVersions({ skillId: id, userId });
  return Response.json(versions);
}

const restoreSchema = z.object({
  versionId: z.string().uuid(),
});

export async function POST(
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
    const parsed = restoreSchema.parse(await request.json());
    const restored = await restoreSkillVersion({
      userId,
      versionId: parsed.versionId,
    });
    if (!restored || restored.id !== id) {
      return Response.json({ error: "Version introuvable" }, { status: 404 });
    }
    return Response.json(restored);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Erreur lors de la restauration" },
      { status: 400 }
    );
  }
}
