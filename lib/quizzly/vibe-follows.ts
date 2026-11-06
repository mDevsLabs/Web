/**
 * Miroir des amitiés Quizzly vers les abonnements Vibe.
 *
 * Vibe ne connaît que `follows`, unilatéral. On écrit les deux sens au
 * moment de l'acceptation, et on ne supprime ensuite que les lignes que
 * CET insert a créées. Un suivi choisi sur Vibe avant l'amitié reste.
 *
 * Pas de DDL : la table appartient au backend. Une base sans `follows`
 * laisse l'amitié Quizzly en place.
 */

import "server-only";

import { vibeSql } from "@/lib/vibe/server/db";
import { tableExists, userIdCast } from "@/lib/vibe/server/schema";

export type PaireSuivi = {
  followerVibeId: string;
  followingVibeId: string;
};

function identifiant(
  valeur: string,
  cast: "bigint" | "text" | "uuid"
): number | string | null {
  if (cast === "bigint") {
    if (!/^\d{1,19}$/.test(valeur)) {
      return null;
    }
    const nombre = Number(valeur);
    return Number.isSafeInteger(nombre) ? nombre : null;
  }
  return valeur;
}

async function inserer(follower: string, following: string): Promise<boolean> {
  const sql = vibeSql();
  if (!sql || follower === following) {
    return false;
  }
  const cast = await userIdCast();
  const a = identifiant(follower, cast);
  const b = identifiant(following, cast);
  if (a === null || b === null) {
    return false;
  }
  if (cast === "uuid") {
    const lignes = await sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${a}::uuid, ${b}::uuid)
      ON CONFLICT DO NOTHING
      RETURNING follower_id
    `;
    return lignes.length > 0;
  }
  const lignes = await sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${a}, ${b})
    ON CONFLICT DO NOTHING
    RETURNING follower_id
  `;
  return lignes.length > 0;
}

async function retirer(follower: string, following: string): Promise<void> {
  const sql = vibeSql();
  if (!sql) {
    return;
  }
  const cast = await userIdCast();
  const a = identifiant(follower, cast);
  const b = identifiant(following, cast);
  if (a === null || b === null) {
    return;
  }
  if (cast === "uuid") {
    await sql`
      DELETE FROM follows
      WHERE follower_id = ${a}::uuid AND following_id = ${b}::uuid
    `;
    return;
  }
  await sql`
    DELETE FROM follows
    WHERE follower_id = ${a} AND following_id = ${b}
  `;
}

/** Insère les deux sens manquants. Ne renvoie que les lignes créées. */
export async function miroirAbonnements(
  vibeIdA: string,
  vibeIdB: string
): Promise<PaireSuivi[]> {
  if (!vibeSql() || !(await tableExists("follows"))) {
    return [];
  }
  const crees: PaireSuivi[] = [];
  if (await inserer(vibeIdA, vibeIdB)) {
    crees.push({ followerVibeId: vibeIdA, followingVibeId: vibeIdB });
  }
  if (await inserer(vibeIdB, vibeIdA)) {
    crees.push({ followerVibeId: vibeIdB, followingVibeId: vibeIdA });
  }
  return crees;
}

export async function retirerAbonnements(
  paires: readonly PaireSuivi[]
): Promise<void> {
  if (!vibeSql() || !(await tableExists("follows"))) {
    return;
  }
  for (const paire of paires) {
    await retirer(paire.followerVibeId, paire.followingVibeId);
  }
}
