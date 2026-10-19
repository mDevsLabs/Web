import { type NextRequest, NextResponse } from "next/server";
import { getUserImageUsageForUser } from "@/lib/site/image-usage";
import { authenticateOpenAIRequest } from "@/lib/site/openai-auth";

export async function GET(req: NextRequest) {
  const auth = await authenticateOpenAIRequest(req);
  if (!auth.valid) {
    return auth.response;
  }

  // Identité réelle du propriétaire de la clé (jamais le libellé de forfait ni un en-tête client)
  const userId = auth.ownerId || auth.apiKeyId || "dev_user";
  const result = await getUserImageUsageForUser(userId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
