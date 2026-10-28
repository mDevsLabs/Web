import "server-only";

import { eq } from "drizzle-orm";
import { ChatbotError } from "@/lib/errors";
import { timingSafeCompare } from "@/lib/security/timing";
import { chat, chatSecurity } from "../schema";
import { dbReady } from "./connection";

// Une ligne par conversation sécurisée. `pinHash` n'est jamais renvoyé par les
// routes : seules les fonctions de vérification le lisent, et les réponses
// publiques exposent au plus `isSecure`/`locked`.
export async function getChatSecurity({ chatId }: { chatId: string }) {
  if (!chatId) {
    return null;
  }
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(chatSecurity)
      .where(eq(chatSecurity.chatId, chatId))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function upsertChatSecurity({
  chatId,
  pinHash,
}: {
  chatId: string;
  pinHash: string;
}) {
  try {
    const db = await dbReady();
    const now = new Date();
    // La visibilité est relue et verrouillée DANS la transaction : une
    // création de PIN concurrente avec un passage en privé ne peut pas
    // ressusciter une ligne ChatSecurity après la suppression. Si la
    // conversation n'est plus publique, aucune ligne n'est écrite.
    return await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ visibility: chat.visibility })
        .from(chat)
        .where(eq(chat.id, chatId))
        .for("update");
      if (target?.visibility !== "public") {
        return null;
      }

      const [row] = await tx
        .insert(chatSecurity)
        .values({
          chatId,
          pinHash,
          pinUpdatedAt: now,
          resetAttempts: 0,
        })
        .onConflictDoUpdate({
          set: {
            pinHash,
            pinUpdatedAt: now,
            resetAttempts: 0,
            resetCodeExpiresAt: null,
            resetCodeHash: null,
            resetLastSentAt: null,
          },
          target: chatSecurity.chatId,
        })
        .returning();
      return row ?? null;
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteChatSecurity({ chatId }: { chatId: string }) {
  try {
    const db = await dbReady();
    await db.delete(chatSecurity).where(eq(chatSecurity.chatId, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setChatPinResetCode({
  chatId,
  codeHash,
  expiresAt,
  sentAt,
}: {
  chatId: string;
  codeHash: string;
  expiresAt: Date;
  sentAt: Date;
}) {
  try {
    const db = await dbReady();
    const [row] = await db
      .update(chatSecurity)
      .set({
        resetAttempts: 0,
        resetCodeExpiresAt: expiresAt,
        resetCodeHash: codeHash,
        resetLastSentAt: sentAt,
      })
      .where(eq(chatSecurity.chatId, chatId))
      .returning();
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// L'envoi a échoué : le code n'a jamais atteint l'utilisateur. On efface le
// hash pour ne pas laisser un secret orphelin, mais on conserve `resetLastSentAt`
// afin que le cooldown anti-rafale reste applicable.
export async function clearChatPinResetCode({ chatId }: { chatId: string }) {
  try {
    const db = await dbReady();
    await db
      .update(chatSecurity)
      .set({
        resetAttempts: 0,
        resetCodeExpiresAt: null,
        resetCodeHash: null,
      })
      .where(eq(chatSecurity.chatId, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export type ChatPinResetResult =
  | { ok: true; pinUpdatedAt: Date }
  | { ok: false; reason: "expired" | "invalid" | "missing" | "too_many" };

// Vérification et remplacement du PIN dans une seule transaction : deux
// réinitialisations concurrentes ne peuvent pas consommer le même code, et un
// code faux n'est jamais comparé sans incrémenter le compteur.
export async function resetChatPinWithCode({
  chatId,
  codeHash,
  pinHash,
  now,
}: {
  chatId: string;
  codeHash: string;
  pinHash: string;
  now: Date;
}): Promise<ChatPinResetResult> {
  try {
    const db = await dbReady();
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(chatSecurity)
        .where(eq(chatSecurity.chatId, chatId))
        .for("update");

      if (!row) {
        return { ok: false, reason: "missing" } as const;
      }
      if (
        !row.resetCodeHash ||
        !row.resetCodeExpiresAt ||
        row.resetCodeExpiresAt.getTime() <= now.getTime()
      ) {
        return { ok: false, reason: "expired" } as const;
      }
      if (row.resetAttempts >= 5) {
        return { ok: false, reason: "too_many" } as const;
      }

      if (!timingSafeCompare(row.resetCodeHash, codeHash)) {
        const nextAttempts = row.resetAttempts + 1;
        await tx
          .update(chatSecurity)
          .set({ resetAttempts: nextAttempts })
          .where(eq(chatSecurity.chatId, chatId));
        return {
          ok: false,
          reason: nextAttempts >= 5 ? "too_many" : "invalid",
        } as const;
      }

      const [updated] = await tx
        .update(chatSecurity)
        .set({
          pinHash,
          pinUpdatedAt: now,
          resetAttempts: 0,
          resetCodeExpiresAt: null,
          resetCodeHash: null,
          resetLastSentAt: null,
        })
        .where(eq(chatSecurity.chatId, chatId))
        .returning({ pinUpdatedAt: chatSecurity.pinUpdatedAt });

      return { ok: true, pinUpdatedAt: updated?.pinUpdatedAt ?? now } as const;
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
