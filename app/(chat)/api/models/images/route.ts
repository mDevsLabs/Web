import { NextResponse } from "next/server";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import { errorResponse } from "@/lib/api/error-response";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken } from "@/lib/auth/session";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const result = await upstreamJson<{ data?: any[] }>({
    path: "/v1/models/images",
    token,
  });
  if (!result.ok) {
    return NextResponse.json(result.payload, { status: result.payload.status });
  }

  const data = result.data ?? {};
  if (Array.isArray(data.data)) {
    data.data = data.data.map((m: any) => ({
      ...m,
      name: normalizeModelDisplayName(m.id, m.name || m.id),
    }));
  }
  return NextResponse.json(data);
}
