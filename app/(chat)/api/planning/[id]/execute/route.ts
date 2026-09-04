import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { getScheduledMessageById } from "@/lib/db/queries";
import { executeScheduledMessage } from "@/lib/planning/executor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  const item = await getScheduledMessageById({ id, userId });
  if (!item) {
    return NextResponse.json(
      { error: "Message planifié introuvable" },
      { status: 404 }
    );
  }

  try {
    const result = await executeScheduledMessage(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'exécution" },
      { status: 500 }
    );
  }
}
