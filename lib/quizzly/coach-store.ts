/**
 * Fils du Coach, par compte.
 *
 * Le modèle relit ces lignes. Une conversation et un message n'existent
 * que pour le compte qui les a écrits.
 */

import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import { quizzlyCoachConversation, quizzlyCoachMessage } from "@/lib/db/schema";
import {
  COACH_CONVERSATIONS_MAX,
  COACH_MESSAGES_EPINGLES_MAX,
  COACH_MESSAGES_MAX,
  type CoachIntent,
  texteMessageEnregistrable,
  titreDepuisTexte,
  titreEnregistrable,
} from "@/lib/quizzly/coach";

export type CodeFil =
  | "full_conversations"
  | "full_messages"
  | "invalid_text"
  | "invalid_title"
  | "missing"
  | "pin_limit";

export type ConversationVue = {
  createdAt: string;
  id: string;
  intent: CoachIntent;
  pinned: boolean;
  pinnedAt: string | null;
  questionId: string | null;
  quizId: string | null;
  title: string;
  updatedAt: string;
};

export type MessageVue = {
  createdAt: string;
  id: string;
  pinned: boolean;
  pinnedAt: string | null;
  role: "assistant" | "user";
  text: string;
};

type LigneConversation = typeof quizzlyCoachConversation.$inferSelect;
type LigneMessage = typeof quizzlyCoachMessage.$inferSelect;

function iso(valeur: Date | null): string | null {
  return valeur ? valeur.toISOString() : null;
}

function lireIntent(valeur: string): CoachIntent {
  if (
    valeur === "chat" ||
    valeur === "explain" ||
    valeur === "summary" ||
    valeur === "encourage"
  ) {
    return valeur;
  }
  return "chat";
}

function lireRole(valeur: string): "assistant" | "user" {
  return valeur === "assistant" ? "assistant" : "user";
}

function vueConversation(ligne: LigneConversation): ConversationVue {
  return {
    createdAt: ligne.createdAt.toISOString(),
    id: ligne.id,
    intent: lireIntent(ligne.intent),
    pinned: ligne.pinned,
    pinnedAt: iso(ligne.pinnedAt),
    questionId: ligne.questionId,
    quizId: ligne.quizId,
    title: ligne.title,
    updatedAt: ligne.updatedAt.toISOString(),
  };
}

function vueMessage(ligne: LigneMessage): MessageVue {
  return {
    createdAt: ligne.createdAt.toISOString(),
    id: ligne.id,
    pinned: ligne.pinned,
    pinnedAt: iso(ligne.pinnedAt),
    role: lireRole(ligne.role),
    text: ligne.text,
  };
}

export async function listerConversationsCoach(
  userId: string
): Promise<ConversationVue[]> {
  await dbReady();
  const lignes = await getDb()
    .select()
    .from(quizzlyCoachConversation)
    .where(eq(quizzlyCoachConversation.userId, userId))
    .orderBy(
      desc(quizzlyCoachConversation.pinned),
      desc(quizzlyCoachConversation.updatedAt)
    );
  return lignes.map(vueConversation);
}

export async function lireConversationCoach(
  userId: string,
  id: string
): Promise<{ conversation: ConversationVue; messages: MessageVue[] } | null> {
  await dbReady();
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(quizzlyCoachConversation)
    .where(
      and(
        eq(quizzlyCoachConversation.id, id),
        eq(quizzlyCoachConversation.userId, userId)
      )
    )
    .limit(1);
  if (!conversation) {
    return null;
  }
  const messages = await db
    .select()
    .from(quizzlyCoachMessage)
    .where(
      and(
        eq(quizzlyCoachMessage.conversationId, id),
        eq(quizzlyCoachMessage.userId, userId)
      )
    )
    .orderBy(asc(quizzlyCoachMessage.createdAt));
  return {
    conversation: vueConversation(conversation),
    messages: messages.map(vueMessage),
  };
}

export async function ouvrirConversationCoach(params: {
  intent: CoachIntent;
  questionId: string | null;
  quizId: string | null;
  text: string;
  userId: string;
}): Promise<
  | { code: CodeFil; ok: false }
  | { conversation: ConversationVue; messages: MessageVue[]; ok: true }
> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    const [compte] = await tx
      .select({ valeur: count() })
      .from(quizzlyCoachConversation)
      .where(eq(quizzlyCoachConversation.userId, params.userId));
    if (Number(compte?.valeur ?? 0) >= COACH_CONVERSATIONS_MAX) {
      return { code: "full_conversations", ok: false as const };
    }
    const maintenant = new Date();
    const [conversation] = await tx
      .insert(quizzlyCoachConversation)
      .values({
        intent: params.intent,
        questionId: params.questionId,
        quizId: params.quizId,
        title: titreDepuisTexte(params.text),
        updatedAt: maintenant,
        userId: params.userId,
      })
      .returning();
    if (!conversation) {
      return { code: "missing", ok: false as const };
    }
    const [message] = await tx
      .insert(quizzlyCoachMessage)
      .values({
        conversationId: conversation.id,
        role: "user",
        text: params.text,
        userId: params.userId,
      })
      .returning();
    if (!message) {
      return { code: "missing", ok: false as const };
    }
    return {
      conversation: vueConversation(conversation),
      messages: [vueMessage(message)],
      ok: true as const,
    };
  });
}

export async function poursuivreConversationCoach(params: {
  id: string;
  text: string;
  userId: string;
}): Promise<
  | { code: CodeFil; ok: false }
  | { conversation: ConversationVue; messages: MessageVue[]; ok: true }
> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(quizzlyCoachConversation)
      .where(
        and(
          eq(quizzlyCoachConversation.id, params.id),
          eq(quizzlyCoachConversation.userId, params.userId)
        )
      )
      .for("update")
      .limit(1);
    if (!conversation) {
      return { code: "missing", ok: false as const };
    }
    const [compte] = await tx
      .select({ valeur: count() })
      .from(quizzlyCoachMessage)
      .where(eq(quizzlyCoachMessage.conversationId, params.id));
    if (Number(compte?.valeur ?? 0) >= COACH_MESSAGES_MAX) {
      return { code: "full_messages", ok: false as const };
    }
    const maintenant = new Date();
    await tx.insert(quizzlyCoachMessage).values({
      conversationId: params.id,
      role: "user",
      text: params.text,
      userId: params.userId,
    });
    await tx
      .update(quizzlyCoachConversation)
      .set({ updatedAt: maintenant })
      .where(eq(quizzlyCoachConversation.id, params.id));
    const messages = await tx
      .select()
      .from(quizzlyCoachMessage)
      .where(
        and(
          eq(quizzlyCoachMessage.conversationId, params.id),
          eq(quizzlyCoachMessage.userId, params.userId)
        )
      )
      .orderBy(asc(quizzlyCoachMessage.createdAt));
    return {
      conversation: vueConversation({ ...conversation, updatedAt: maintenant }),
      messages: messages.map(vueMessage),
      ok: true as const,
    };
  });
}

export async function enregistrerReponseCoach(params: {
  conversationId: string;
  text: string;
  userId: string;
}): Promise<void> {
  const propre = params.text.trim().slice(0, 8000);
  if (!propre) {
    return;
  }
  await dbReady();
  const db = getDb();
  const [conversation] = await db
    .select({ id: quizzlyCoachConversation.id })
    .from(quizzlyCoachConversation)
    .where(
      and(
        eq(quizzlyCoachConversation.id, params.conversationId),
        eq(quizzlyCoachConversation.userId, params.userId)
      )
    )
    .limit(1);
  if (!conversation) {
    return;
  }
  const maintenant = new Date();
  await db.insert(quizzlyCoachMessage).values({
    conversationId: params.conversationId,
    role: "assistant",
    text: propre,
    userId: params.userId,
  });
  await db
    .update(quizzlyCoachConversation)
    .set({ updatedAt: maintenant })
    .where(eq(quizzlyCoachConversation.id, params.conversationId));
}

export async function modifierConversationCoach(params: {
  id: string;
  pinned?: boolean;
  title?: string;
  userId: string;
}): Promise<
  { code: CodeFil; ok: false } | { conversation: ConversationVue; ok: true }
> {
  const title =
    params.title === undefined ? undefined : titreEnregistrable(params.title);
  if (params.title !== undefined && !title) {
    return { code: "invalid_title", ok: false };
  }
  await dbReady();
  const maintenant = new Date();
  const [ligne] = await getDb()
    .update(quizzlyCoachConversation)
    .set({
      ...(title ? { title } : {}),
      ...(params.pinned === undefined
        ? {}
        : {
            pinned: params.pinned,
            pinnedAt: params.pinned ? maintenant : null,
          }),
      updatedAt: maintenant,
    })
    .where(
      and(
        eq(quizzlyCoachConversation.id, params.id),
        eq(quizzlyCoachConversation.userId, params.userId)
      )
    )
    .returning();
  if (!ligne) {
    return { code: "missing", ok: false };
  }
  return { conversation: vueConversation(ligne), ok: true };
}

export async function modifierMessageCoach(params: {
  conversationId: string;
  messageId: string;
  pinned?: boolean;
  text?: string;
  userId: string;
}): Promise<{ code: CodeFil; ok: false } | { message: MessageVue; ok: true }> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    const [message] = await tx
      .select()
      .from(quizzlyCoachMessage)
      .where(
        and(
          eq(quizzlyCoachMessage.id, params.messageId),
          eq(quizzlyCoachMessage.conversationId, params.conversationId),
          eq(quizzlyCoachMessage.userId, params.userId)
        )
      )
      .for("update")
      .limit(1);
    if (!message) {
      return { code: "missing", ok: false as const };
    }
    let text = message.text;
    if (params.text !== undefined) {
      const propre = texteMessageEnregistrable(
        lireRole(message.role),
        params.text
      );
      if (!propre) {
        return { code: "invalid_text", ok: false as const };
      }
      text = propre;
    }
    let pinned = message.pinned;
    let pinnedAt = message.pinnedAt;
    if (params.pinned !== undefined) {
      if (params.pinned && !message.pinned) {
        const [compte] = await tx
          .select({ valeur: count() })
          .from(quizzlyCoachMessage)
          .where(
            and(
              eq(quizzlyCoachMessage.conversationId, params.conversationId),
              eq(quizzlyCoachMessage.userId, params.userId),
              eq(quizzlyCoachMessage.pinned, true)
            )
          );
        if (Number(compte?.valeur ?? 0) >= COACH_MESSAGES_EPINGLES_MAX) {
          return { code: "pin_limit", ok: false as const };
        }
      }
      pinned = params.pinned;
      pinnedAt = params.pinned ? new Date() : null;
    }
    const [ligne] = await tx
      .update(quizzlyCoachMessage)
      .set({ pinned, pinnedAt, text })
      .where(eq(quizzlyCoachMessage.id, message.id))
      .returning();
    await tx
      .update(quizzlyCoachConversation)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(quizzlyCoachConversation.id, params.conversationId),
          eq(quizzlyCoachConversation.userId, params.userId)
        )
      );
    if (!ligne) {
      return { code: "missing", ok: false as const };
    }
    return { message: vueMessage(ligne), ok: true as const };
  });
}

export function messageEchecFil(
  code: CodeFil,
  cible: "conversation" | "message"
): string {
  switch (code) {
    case "full_conversations":
      return "Tu as atteint le nombre de conversations du Coach.";
    case "full_messages":
      return "Cette conversation est complète. Ouvre-en une nouvelle.";
    case "invalid_text":
      return "Ce message est vide ou trop long.";
    case "invalid_title":
      return "Le titre est vide ou trop long.";
    case "pin_limit":
      return "Trois messages épinglés au maximum.";
    default:
      return cible === "message"
        ? "Ce message est introuvable."
        : "Cette conversation est introuvable.";
  }
}
