import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { deleteNotification, markNotificationRead } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const body = await request.json().catch(() => ({}));
  if (
    body.action === "read" ||
    body.action === "unread" ||
    typeof body.isRead === "boolean"
  ) {
    const isRead =
      typeof body.isRead === "boolean" ? body.isRead : body.action === "read";
    const updated = await markNotificationRead({ id, isRead, userId });
    if (!updated) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const deleted = await deleteNotification({ id, userId });
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
