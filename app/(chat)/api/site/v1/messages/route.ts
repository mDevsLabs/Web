import { type NextRequest, NextResponse } from "next/server";
import { resolveAuthorizationHeader } from "@/lib/site/session-bearer";

// POST /api/v1/messages - Anthropic Messages SDK Proxy
export async function POST(req: NextRequest) {
  try {
    const authHeader = await resolveAuthorizationHeader(req);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: {
            message: "Auth requise : Bearer token manquant.",
            type: "authentication_error",
          },
        },
        { status: 401 }
      );
    }
    const body = await req.json();

    const res = await fetch("https://mai.val.run/v1/messages", {
      body: JSON.stringify(body),
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message:
            err?.message || "Failed to process Anthropic Messages request.",
          type: "api_error",
        },
      },
      { status: 500 }
    );
  }
}
