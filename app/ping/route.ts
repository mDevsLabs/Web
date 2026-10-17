import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("pong", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    },
  });
}
