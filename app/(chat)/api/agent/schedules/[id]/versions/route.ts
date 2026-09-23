import { errorResponse } from "@/lib/api/error-response";
import { getAgentFlags } from "@/lib/agent/flags";
import { getMaiUser } from "@/lib/auth/session";
import { getAgentScheduleById, listScheduleVersions } from "@/lib/db/agent-foundation-queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) return errorResponse("auth_required");
  if (!getAgentFlags()["agent.scheduleHistory"]) return errorResponse("service_unavailable");
  const userId = user.id || user.email;
  const schedule = await getAgentScheduleById({ id, userId });
  if (!schedule) return errorResponse("not_found");
  const versions = await listScheduleVersions({ scheduleId: id });
  return Response.json({ versions }, { headers: { "Cache-Control": "private, no-store" } });
}
