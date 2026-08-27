import { getMaiUser } from "@/lib/auth/session";
import { getMcpLogsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const logs = await getMcpLogsByUserId({ limit, userId });
  return Response.json(logs);
}
