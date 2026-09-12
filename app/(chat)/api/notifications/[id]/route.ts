import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
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
      return errorResponse("not_found", {
        message: "Notification introuvable.",
      });
    }
    return NextResponse.json(updated);
  }
  return errorResponse("invalid_request", {
    message: "Action invalide pour cette notification.",
  });
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
    return errorResponse("not_found", {
      message: "Notification introuvable.",
    });
  }
  return NextResponse.json({ success: true });
}
