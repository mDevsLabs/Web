import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { getUserImageUsageForUser } from "@/lib/site/image-usage";
import { authenticateSession } from "@/lib/site/session-auth";

export async function GET(req: NextRequest) {
  const session = await authenticateSession(req);
  if (!session.ok) {
    return errorResponse("auth_required", {
      message: "Authentification requise.",
      status: 401,
    });
  }

  const result = await getUserImageUsageForUser(session.identity.userId);

  if (!result.success) {
    return errorResponse("internal_error", {
      message: result.error || "Impossible de récupérer l'usage des images.",
      status: 500,
    });
  }

  return NextResponse.json(result.data);
}
