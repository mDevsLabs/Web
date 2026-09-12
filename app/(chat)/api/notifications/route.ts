import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  broadcastNewsNotification,
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const notificationSchema = z.object({
  body: z.string().max(500).nullish(),
  broadcast: z.boolean().optional(),
  link: z.string().max(500).nullish(),
  title: z.string().min(1).max(120),
  type: z.string().max(50).nullish(),
});

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const raw = process.env.MAI_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1),
    50
  );
  const offset = Math.max(
    Number.parseInt(searchParams.get("offset") || "0", 10),
    0
  );
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const notifications = await getNotificationsByUserId({
    limit,
    offset,
    unreadOnly,
    userId,
  });
  const unreadCount = await getUnreadNotificationCount(userId);
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const body = await request.json().catch(() => ({}));
  const parsed = notificationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Payload invalide (titre 1-120, corps/lien ≤500).",
    });
  }
  const { type, title, body: notifBody, link, broadcast } = parsed.data;

  if (broadcast) {
    // Broadcast réservé aux admins (corrige : tout authentifié pouvait spammer)
    if (!isAdminEmail(user.email)) {
      return errorResponse("access_denied");
    }
    const result = await broadcastNewsNotification({
      body: notifBody ?? null,
      link: link ?? null,
      title,
    });
    return NextResponse.json(result);
  }

  // single notification - for system triggers, not direct user creation; but allow manual test
  if (!title || !type) {
    return errorResponse("invalid_request", {
      message: "Les champs 'type' et 'titre' sont obligatoires.",
    });
  }
  const allowed = [
    "ai_response",
    "project_created",
    "mcp_created",
    "mcp_access_request",
    "news",
  ];
  if (!allowed.includes(type)) {
    return errorResponse("invalid_request", {
      message: "Type de notification invalide.",
    });
  }
  const userId = user.id || user.email;
  const created = await createNotification({
    body: notifBody ?? null,
    link: link ?? null,
    title,
    type: type as any,
    userId,
  });
  return NextResponse.json(created);
}

export async function PATCH(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const body = await request.json().catch(() => ({}));
  if (body.action === "markAllRead") {
    await markAllNotificationsRead(userId);
    return NextResponse.json({ success: true });
  }
  return errorResponse("invalid_request", {
    message: "Action invalide.",
  });
}

export async function DELETE(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const clearRead = searchParams.get("clearRead") === "true";
  const all = searchParams.get("all") === "true";

  if (all) {
    const { deleteAllNotifications } = await import("@/lib/db/queries");
    await deleteAllNotifications(userId);
    return NextResponse.json({ success: true });
  }

  if (clearRead) {
    const { getNotificationsByUserId, deleteNotification } = await import(
      "@/lib/db/queries"
    );
    const notifs = await getNotificationsByUserId({
      limit: 50,
      userId,
    });
    const toDelete = notifs.filter((n) => n.isRead);
    for (const n of toDelete) {
      await deleteNotification({ id: n.id, userId });
    }
    return NextResponse.json({ deleted: toDelete.length });
  }

  // Also check if body has action: 'deleteAll'
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      if (body?.action === "deleteAll") {
        const { deleteAllNotifications } = await import("@/lib/db/queries");
        await deleteAllNotifications(userId);
        return NextResponse.json({ success: true });
      }
    } catch (error) {
      console.warn("Corps JSON invalide pour DELETE notifications:", error);
    }
  }

  return errorResponse("invalid_request", {
    message: "Action de suppression invalide.",
  });
}
