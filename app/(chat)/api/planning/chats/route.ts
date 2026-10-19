import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getChatsByUserId } from "@/lib/db/queries";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { chats } = await getChatsByUserId({
    endingBefore: null,
    id: session.userId,
    limit: 50,
    startingAfter: null,
  });

  return NextResponse.json(
    chats.slice(0, 50).map((c: any) => ({
      createdAt: c.createdAt,
      id: c.id,
      title: c.title,
    }))
  );
}
