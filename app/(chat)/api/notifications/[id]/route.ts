import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { deleteNotification, markNotificationRead } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

/**
 * ============================================================================
 * PATCH / DELETE /api/notifications/:id — une notification unifiée
 * ============================================================================
 *
 * LA PROPAGATION DU « LU »
 *
 * La table `Notification` de l'hôte est l'unique source de vérité de l'état
 * lu/non lu (migration 0063). Mais Vibe et Wakies ont LEURS pages, qui
 * lisent LEUR source : si la cloche mAI marque une notification lue sans
 * prévenir la source, la page Vibe afficherait encore son point non lu.
 *
 * La propagation est donc OBLIGATOIRE, et son échec n'annule pas l'écriture
 * locale : l'utilisateur a lu la notification, l'interface mAI doit le
 * refléter quoi qu'il arrive à la source. L'incident est journalisé.
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { userId } = session;
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
    // La notification a été lue : on prévient sa source, pour que la page
    // d'origine affiche le même état.
    if (updated.origin && updated.origin !== "mai" && updated.sourceId) {
      await propagateReadState({
        isRead,
        origin: updated.origin,
        sourceId: updated.sourceId,
        sourceMeta: updated.sourceMeta as Record<string, unknown> | null,
        userId,
      }).catch((error) => {
        console.warn(
          `[notifications] propagation du « lu » impossible (${updated.origin}) :`,
          error
        );
      });
    }
    return NextResponse.json(updated);
  }
  return errorResponse("invalid_request", {
    message: "Action invalide pour cette notification.",
  });
}

/**
 * Prévient la SOURCE qu'une notification a été lue.
 *
 * WAKIES : la lecture se marque sur le `seq` de la CONVERSATION, pas sur la
 * notification — une réponse lue dans la cloche signifie « cette
 * conversation est à jour ». C'est faisable ici : les tables Wakies sont
 * dans la base de l'hôte.
 *
 * VIBE : ce n'est PAS faisable côté serveur. Le backend Vibe s'authentifie
 * par un JWT que le NAVIGATEUR détient (`localStorage`), jamais par la
 * session mAI : un appel serveur arriverait sans jeton et serait refusé.
 * La propagation Vibe est donc faite par le CLIENT, qui détient le jeton
 * (voir `components/chat/notification-bell.tsx`).
 */
async function propagateReadState(params: {
  isRead: boolean;
  origin: string;
  sourceId: string;
  sourceMeta: Record<string, unknown> | null;
  userId: string;
}) {
  const { isRead, origin, sourceId, sourceMeta, userId } = params;

  if (origin === "wakies") {
    if (!isRead) {
      // Marquer « non lu » une conversation n'a pas de sens : le curseur de
      // lecture de Wakies ne recule jamais.
      return;
    }
    const conversationId = sourceMeta?.conversationId;
    if (typeof conversationId !== "string" || !conversationId) {
      return;
    }
    const { listMessages, marquerConversationLue } = await import(
      "@/lib/wakies/queries"
    );
    const messages = await listMessages(userId, conversationId);
    const dernier = messages.at(-1);
    if (!dernier) {
      return;
    }
    await marquerConversationLue(userId, conversationId, dernier.seq);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const deleted = await deleteNotification({ id, userId: session.userId });
  if (!deleted) {
    return errorResponse("not_found", {
      message: "Notification introuvable.",
    });
  }
  return NextResponse.json({ success: true });
}
