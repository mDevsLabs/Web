import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { resumeQuizzly } from "@/lib/quizzly/queries";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const resume = await resumeQuizzly(session.userId, session.user);
    return Response.json(resume, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/quizzly/resume", error);
    return errorResponse("database_error");
  }
}
