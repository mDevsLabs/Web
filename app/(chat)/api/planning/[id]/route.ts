import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteScheduledMessage,
  getScheduledMessageById,
  updateScheduledMessage,
} from "@/lib/db/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;
  const message = await getScheduledMessageById({ id, userId });

  if (!message) {
    return NextResponse.json(
      { error: "Message planifié introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  try {
    const json = await request.json();
    const updated = await updateScheduledMessage({
      id,
      userId,
      ...json,
      scheduledAt: json.scheduledAt ? new Date(json.scheduledAt) : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Message planifié introuvable ou échec de mise à jour" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur de mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  const success = await deleteScheduledMessage({ id, userId });
  if (!success) {
    return NextResponse.json(
      { error: "Message introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}