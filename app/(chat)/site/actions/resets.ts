"use server";

import { neon } from "@neondatabase/serverless";
import { getSessionIdentity } from "@/lib/site/session-auth";

export interface AvailableResetItem {
  createdAt: string;
  expiresAt: string | null;
  id: number;
  resetType: "all" | "api" | "mai" | "images" | "audio";
}

/** Résout l'identité serveur puis les identifiants alternatifs (id, username, email) associés. */
async function resolveTargetUserIds(sql: any): Promise<string[] | null> {
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const userId = identity.userId;
  const uRows = await sql`
    SELECT id, username, email 
    FROM users 
    WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text 
    LIMIT 1
  `.catch(() => []);

  const targetUserIds = [userId];
  if (uRows.length > 0) {
    if (uRows[0].id) targetUserIds.push(String(uRows[0].id));
    if (uRows[0].username) targetUserIds.push(String(uRows[0].username));
    if (uRows[0].email) targetUserIds.push(String(uRows[0].email));
  }
  return targetUserIds;
}

export async function getUserAvailableResets(): Promise<{
  success: boolean;
  resets: AvailableResetItem[];
  error?: string;
}> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { resets: [], success: true };
    }

    const sql = neon(databaseUrl);

    // Initialisation opportuniste de la table si elle n'existe pas encore
    await sql`
      CREATE TABLE IF NOT EXISTS user_pending_resets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        reset_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        used_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `.catch(() => {});

    const targetUserIds = await resolveTargetUserIds(sql);
    if (!targetUserIds) {
      return { error: "Authentification requise.", resets: [], success: false };
    }

    const rows = await sql`
      SELECT id, reset_type, expires_at, created_at
      FROM user_pending_resets
      WHERE user_id = ANY(${targetUserIds})
        AND status = 'available'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `;

    return {
      resets: rows.map((r: any) => ({
        createdAt: r.created_at
          ? new Date(r.created_at).toISOString()
          : new Date().toISOString(),
        expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        id: r.id,
        resetType: r.reset_type as AvailableResetItem["resetType"],
      })),
      success: true,
    };
  } catch (err: any) {
    console.error("Erreur lors de la récupération des réinitialisations:", err);
    return {
      error: "Impossible de récupérer les réinitialisations disponibles.",
      resets: [],
      success: false,
    };
  }
}

export async function claimUserReset(resetId: number): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  resetType?: string;
}> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { error: "Base de données non accessible.", success: false };
    }

    const sql = neon(databaseUrl);

    const targetUserIds = await resolveTargetUserIds(sql);
    if (!targetUserIds) {
      return { error: "Authentification requise.", success: false };
    }

    // Récupérer la réinitialisation
    const resetRows = await sql`
      SELECT id, user_id, reset_type, expires_at, status
      FROM user_pending_resets
      WHERE id = ${resetId}
        AND user_id = ANY(${targetUserIds})
      LIMIT 1
    `;

    if (resetRows.length === 0) {
      return {
        error: "Réinitialisation introuvable ou non autorisée.",
        success: false,
      };
    }

    const reset = resetRows[0];
    if (reset.expires_at && new Date(reset.expires_at) < new Date()) {
      await sql`UPDATE user_pending_resets SET status = 'expired' WHERE id = ${resetId} AND status = 'available'`;
      return { error: "Cette réinitialisation a expiré.", success: false };
    }

    // Réclamation atomique : un seul appelant peut passer 'available' → 'used'
    const claimed = await sql`
      UPDATE user_pending_resets
      SET status = 'used', used_at = NOW()
      WHERE id = ${resetId} AND status = 'available'
      RETURNING id
    `;
    if (claimed.length === 0) {
      return {
        error: "Cette réinitialisation a déjà été utilisée.",
        success: false,
      };
    }

    const resetType = reset.reset_type;

    // Appliquer la remise à 0 en fonction du type
    if (resetType === "all" || resetType === "api") {
      await sql`
        UPDATE mprojects_api_keys
        SET request_count = 0
        WHERE user_id = ANY(${targetUserIds})
      `;
    }

    if (resetType === "all" || resetType === "mai") {
      await sql`
        UPDATE weekly_usage
        SET tokens_used = 0
        WHERE user_id = ANY(${targetUserIds})
      `;
    }

    if (resetType === "all" || resetType === "images") {
      await sql`
        UPDATE mprojects_daily_image_usage
        SET images_generated = 0, updated_at = NOW()
        WHERE user_id = ANY(${targetUserIds})
          AND usage_date = CURRENT_DATE
      `;
    }

    if (resetType === "all" || resetType === "audio") {
      await sql`
        UPDATE weekly_speech_usage
        SET tokens_used = 0, requests_count = 0
        WHERE user_id = ANY(${targetUserIds})
      `;
    }

    const labels: Record<string, string> = {
      all: "L'ensemble de vos quotas",
      api: "Votre quota d'API",
      audio: "Votre quota de synthèse vocale Audio",
      images: "Votre quota journalier d'images",
      mai: "Votre quota de tokens mAI",
    };

    return {
      message: `${labels[resetType] || "Votre quota"} a été réinitialisé à 0 avec succès !`,
      resetType,
      success: true,
    };
  } catch (err: any) {
    console.error("Erreur claimUserReset:", err);
    return {
      error: "Une erreur est survenue lors de la réinitialisation.",
      success: false,
    };
  }
}
