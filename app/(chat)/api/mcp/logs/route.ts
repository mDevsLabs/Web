import { requireUser } from "@/lib/auth/require-user";
import { getMcpLogsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { toMcpLogDtoList } from "@/lib/mcp/dto";

export async function GET(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { userId } = session;
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
    : 50;

  const logs = await getMcpLogsByUserId({ limit, userId });
  return Response.json(toMcpLogDtoList(logs));
}
