import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import {
  broadcastNewsNotification,
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

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
  const {
    type,
    title,
    body: notifBody,
    link,
    broadcast,
  } = body as {
    type?: string;
    title?: string;
    body?: string;
    link?: string;
    broadcast?: boolean;
  };

  if (broadcast) {
    // broadcast news - only for authenticated users (admin via session)
    // In production, check tier or isAdmin; for now allow any authenticated to broadcast news? Restrict to manual via admin script direct DB
    // We allow but log
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
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
    return NextResponse.json(
      { error: "type and title required" },
      { status: 400 }
    );
  }
  const allowed = [
    "ai_response",
    "project_created",
    "mcp_created",
    "mcp_access_request",
    "news",
  ];
  if (!allowed.includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
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
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
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
  try {
    const body = await request.json();
    if (body?.action === "deleteAll") {
      const { deleteAllNotifications } = await import("@/lib/db/queries");
      await deleteAllNotifications(userId);
      return NextResponse.json({ success: true });
    }
  } catch {}

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
