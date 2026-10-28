import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  broadcastNewsNotification,
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  isNotificationOrigin,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/notifications/types";

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
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { userId } = session;
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
  // Filtre par origine : la cloche mAI affiche les trois applications, mais
  // l'utilisateur peut n'en vouloir qu'une. Une origine inconnue est
  // ignorée — jamais appliquée comme un filtre qui ne définirait rien.
  const rawOrigins = searchParams.get("origins");
  const origins = rawOrigins
    ? rawOrigins
        .split(",")
        .map((valeur) => valeur.trim())
        .filter(isNotificationOrigin)
    : undefined;
  const notifications = await getNotificationsByUserId({
    limit,
    offset,
    origins,
    unreadOnly,
    userId,
  });
  const unreadCount = await getUnreadNotificationCount(userId, origins);
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { user } = session;
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
  // Aligné sur `Notification_type_check` (migration 0026) via
  // NOTIFICATION_TYPES. Cette liste n'en listait que 5 : les 6 types Agent et
  // `project_member_joined` étaient rejetés en 400 alors que la contrainte
  // base les autorisait. Les types Agent sont produits en interne par
  // lib/agent/notifications, mais ils doivent aussi pouvoir transiter par
  // cette route (tests, rejeux, intégrations).
  const allowed: readonly string[] = NOTIFICATION_TYPES;
  if (!allowed.includes(type)) {
    return errorResponse("invalid_request", {
      message: "Type de notification invalide.",
    });
  }
  const created = await createNotification({
    body: notifBody ?? null,
    link: link ?? null,
    title,
    type: type as NotificationType,
    userId: session.userId,
  });
  return NextResponse.json(created);
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const body = await request.json().catch(() => ({}));
  if (body.action === "markAllRead") {
    await markAllNotificationsRead(session.userId);
    // Ce marquage porte sur la table unifiée. Les SOURCES ont leur propre
    // granularité : Vibe est propagé par le CLIENT (seul détenteur du JWT
    // Vibe), et la lecture d'une conversation Wakies reste portée par la
    // page du fil — une conversation n'est pas « lue » parce qu'une
    // notification l'a été.
    return NextResponse.json({ success: true });
  }
  return errorResponse("invalid_request", {
    message: "Action invalide.",
  });
}

export async function DELETE(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { userId } = session;
  const { searchParams } = new URL(request.url);
  const clearRead = searchParams.get("clearRead") === "true";
  const all = searchParams.get("all") === "true";

  if (all) {
    const { deleteAllNotifications } = await import("@/lib/db/queries");
    await deleteAllNotifications(userId);
    return NextResponse.json({ success: true });
  }

  if (clearRead) {
    // Filtre `isRead` EN BASE, sans borne de lot : les lues anciennes ne sont
    // plus invisibles derrière les 50 notifications récentes.
    const { deleteReadNotifications } = await import("@/lib/db/queries");
    const result = await deleteReadNotifications(userId);
    return NextResponse.json(result);
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
