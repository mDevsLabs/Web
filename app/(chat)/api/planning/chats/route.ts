import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { getChatsByUserId } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = user.id || user.email;
  const { chats } = await getChatsByUserId({
    id: userId,
    limit: 50,
    endingBefore: null,
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
