import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
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
      return errorResponse("not_found", {
        message: "Version introuvable.",
      });
    }
    return Response.json(restored);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur restauration version skill", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la restauration de la version.",
    });
  }
}
