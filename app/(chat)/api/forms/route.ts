import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getActiveForms } from "@/lib/forms/queries";

export async function GET() {
  try {
    const user = await getMaiUser();
    if (!user) {
      return errorResponse("auth_required");
    }

    const userId = user.id || user.email;
    const forms = await getActiveForms(userId);

    return NextResponse.json({
      data: forms,
      success: true,
    });
  } catch (error) {
    console.error("[api/forms] Erreur lecture formulaires :", error);
    return errorResponse("internal_error", {
      message: "Impossible de récupérer les formulaires.",
    });
  }
}
