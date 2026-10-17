import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("pong", {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain",
    },
    status: 200,
  });
}
