import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { submitFormResponse } from "@/lib/forms/queries";
import { REWARD_TYPES } from "@/lib/forms/types";

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  rewardType: z.enum(REWARD_TYPES),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const formId = params.id;

    if (!formId) {
      return errorResponse("invalid_request", {
        message: "Identifiant de formulaire manquant.",
      });
    }

    const [user, sessionToken] = await Promise.all([
      getMaiUser(),
      getMaiSessionToken(),
    ]);

    if (!user) {
      return errorResponse("auth_required");
    }

    const userId = user.id || user.email;

    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: "Format de réponse invalide ou récompense manquante.",
      });
    }

    const result = await submitFormResponse({
      answers: parsed.data.answers,
      formId,
      rewardType: parsed.data.rewardType,
      sessionToken,
      userId,
    });

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error("[api/forms/submit] Erreur soumission :", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la soumission.";
    return errorResponse("internal_error", { message });
  }
}
