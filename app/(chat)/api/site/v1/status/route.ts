/**
 * Route GET `/api/site/v1/status` exposant l'état Instatus mis en cache par le serveur.
 */
import { connection, NextResponse } from "next/server";
import { getSupportStatus } from "@/lib/site/support-status";

function responseHeaders(): HeadersInit {
  return {
    "Cache-Control": "public, max-age=60, s-maxage=60",
  };
}

export async function GET() {
  await connection();

  const status = await getSupportStatus();
  return NextResponse.json(status, { headers: responseHeaders() });
}
