import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken } from "@/lib/auth/session";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const result = await upstreamJson({ path: "/v1/images/usage", token });
  if (!result.ok) {
    return NextResponse.json(result.payload, { status: result.payload.status });
  }

  return NextResponse.json(result.data);
}
