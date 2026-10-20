import "server-only";

/**
 * Accès aux réglages du jeu BLACKLINE.
 *
 * Une seule table, une seule ligne par compte : la lecture et l'écriture
 * passent par `userId`, jamais par un identifiant fourni par le client.
 *
 * LE SERVEUR FAIT FOI
 *
 * Les réglages enregistrés remplacent intégralement ceux du jeu : le client
 * envoie l'ensemble, le serveur le normalise et l'écrit. Une lecture renvoie
 * toujours un objet (éventuellement vide) — jamais `null` — pour que l'appelant
 * n'ait pas à traiter un cas particulier.
 */

import { eq } from "drizzle-orm";
import { normalizeBlacklineSettings } from "@/lib/blackline/settings";
import { dbReady, getDb } from "@/lib/db/queries";
import { blacklineSettings } from "@/lib/db/schema";

/**
 * Les réglages enregistrés du compte.
 *
 * Une ligne absente n'est pas une erreur : elle signifie « le compte n'a
 * encore rien enregistré », et le jeu utilisera ses réglages locaux. La
 * ligne est donc créée à la lecture, comme pour Wakies — un compte qui
 * arrive sur /blackline a une ligne même s'il n'a jamais touché aux
 * réglages.
 */
export async function getBlacklineSettings(
  userId: string
): Promise<Record<string, unknown>> {
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(blacklineSettings)
    .values({ userId })
    .onConflictDoNothing({ target: blacklineSettings.userId })
    .returning();
  if (row) {
    return normalizeBlacklineSettings(row.settings);
  }
  const [existant] = await db
    .select()
    .from(blacklineSettings)
    .where(eq(blacklineSettings.userId, userId))
    .limit(1);
  return normalizeBlacklineSettings(existant?.settings);
}

/**
 * Remplace les réglages du compte.
 *
 * L'objet reçu est NORMALISÉ avant écriture : les clés illisibles sont
 * ignorées, les nombres bornés, les énumérations ramenées à une valeur
 * connue. La base ne contient donc jamais un réglage que le jeu refuserait.
 */
export async function saveBlacklineSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const normalises = normalizeBlacklineSettings(settings);
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(blacklineSettings)
    .values({ settings: normalises, userId })
    .onConflictDoUpdate({
      set: { settings: normalises, updatedAt: new Date() },
      target: blacklineSettings.userId,
    })
    .returning();
  return normalizeBlacklineSettings(row?.settings);
}
