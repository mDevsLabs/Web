import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getChatsByUserId } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const userId = user.id || user.email;
  const { chats } = await getChatsByUserId({
    endingBefore: null,
    id: userId,
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
