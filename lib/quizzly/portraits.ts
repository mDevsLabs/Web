/**
 * Portraits Quizzly : le pseudo et l'avatar viennent de Vibe, la clé
 * du compte est celle de la session hôte. Le pont est l'identifiant
 * ou l'e-mail, comme pour le nom affiché.
 */

import "server-only";

import { inArray } from "drizzle-orm";
import { dbReady, getDb, getRawClient } from "@/lib/db/queries";
import { quizzlyProfile } from "@/lib/db/schema";
import { resolveUserIdByEmail } from "@/lib/db/users";
import { cleCompteAmi, normaliserPseudo } from "@/lib/quizzly/friends";
import { vibeSql } from "@/lib/vibe/server/db";
import { tableExists } from "@/lib/vibe/server/schema";

export type Portrait = {
  avatarUrl: string | null;
  displayName: string;
  username: string;
  vibeUserId: string | null;
};

export type CompteTrouve = {
  cle: string;
  portrait: Portrait;
};

type LigneVibe = {
  avatar: string | null;
  displayName: string | null;
  email: string | null;
  id: string;
  username: string | null;
};

function texte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}

async function lireVibeParPseudo(pseudo: string): Promise<LigneVibe | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const avecProfil = await tableExists("profiles");
  const lignes = avecProfil
    ? await sql`
        SELECT u.id::text AS id, u.email, u.username,
               u.avatar_url AS avatar, p.display_name AS display_name,
               p.avatar_url AS profile_avatar
        FROM users u
        LEFT JOIN profiles p ON p.user_id::text = u.id::text
        WHERE LOWER(u.username) = LOWER(${pseudo})
        LIMIT 1
      `
    : await sql`
        SELECT u.id::text AS id, u.email, u.username,
               u.avatar_url AS avatar, NULL::text AS display_name,
               NULL::text AS profile_avatar
        FROM users u
        WHERE LOWER(u.username) = LOWER(${pseudo})
        LIMIT 1
      `;
  const ligne = lignes[0] as Record<string, unknown> | undefined;
  if (!ligne) {
    return null;
  }
  const avatar = texte(ligne.avatar) || texte(ligne.profile_avatar);
  return {
    avatar: avatar || null,
    displayName: texte(ligne.display_name) || null,
    email: texte(ligne.email) || null,
    id: texte(ligne.id),
    username: texte(ligne.username) || null,
  };
}

export async function trouverCompteParPseudo(
  appelant: string,
  brut: string
): Promise<CompteTrouve | null> {
  const pseudo = normaliserPseudo(brut);
  if (!pseudo) {
    return null;
  }
  let vibe: LigneVibe | null = null;
  try {
    vibe = await lireVibeParPseudo(pseudo);
  } catch (erreur) {
    console.warn("Quizzly : recherche de pseudo impossible", erreur);
    return null;
  }
  if (!vibe?.id) {
    return null;
  }
  const cleHote =
    (await resolveUserIdByEmail(vibe.email)) ??
    (await resolveUserIdByEmail(vibe.id));
  await dbReady();
  const candidats = [vibe.id, cleHote].filter((valeur): valeur is string =>
    Boolean(valeur)
  );
  const profils = await getDb()
    .select({ userId: quizzlyProfile.userId })
    .from(quizzlyProfile)
    .where(inArray(quizzlyProfile.userId, candidats));
  const cle = cleCompteAmi({
    cleAppelant: appelant,
    cleHote,
    cleVibe: vibe.id,
    profilsExistants: profils.map((profil) => profil.userId),
  });
  return {
    cle,
    portrait: {
      avatarUrl: vibe.avatar,
      displayName: vibe.displayName || vibe.username || "Élève",
      username: vibe.username || pseudo,
      vibeUserId: vibe.id,
    },
  };
}

type LigneHote = {
  avatar: string | null;
  email: string | null;
  id: string;
  username: string | null;
};

export async function portraitsPour(
  ids: readonly string[]
): Promise<Map<string, Portrait>> {
  const uniques = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const cartes = new Map<string, Portrait>();
  for (const id of uniques) {
    cartes.set(id, {
      avatarUrl: null,
      displayName: "Élève",
      username: "",
      vibeUserId: /^\d+$/.test(id) ? id : null,
    });
  }
  if (uniques.length === 0) {
    return cartes;
  }
  await dbReady();
  const client = getRawClient();
  let hotes: LigneHote[] = [];
  if (client) {
    try {
      hotes = (await client`
        SELECT id::text AS id, email, username, avatar_url AS avatar
        FROM users
        WHERE id::text = ANY(${uniques})
      `) as unknown as LigneHote[];
    } catch (erreur) {
      console.warn("Quizzly : portraits hôte illisibles", erreur);
    }
  }
  const emailsTrouves = [
    ...new Set(
      hotes
        .map((hote) => texte(hote.email).toLowerCase())
        .filter((email) => email.length > 0)
    ),
  ];
  const emails = emailsTrouves.length > 0 ? emailsTrouves : ["__aucun__"];
  const sql = vibeSql();
  let vibes: LigneVibe[] = [];
  if (sql) {
    try {
      const avecProfil = await tableExists("profiles");
      const lignes = avecProfil
        ? await sql`
            SELECT u.id::text AS id, u.email, u.username,
                   u.avatar_url AS avatar, p.display_name AS display_name,
                   p.avatar_url AS profile_avatar
            FROM users u
            LEFT JOIN profiles p ON p.user_id::text = u.id::text
            WHERE u.id::text = ANY(${uniques})
               OR LOWER(u.email) = ANY(${emails})
          `
        : await sql`
            SELECT u.id::text AS id, u.email, u.username,
                   u.avatar_url AS avatar, NULL::text AS display_name,
                   NULL::text AS profile_avatar
            FROM users u
            WHERE u.id::text = ANY(${uniques})
               OR LOWER(u.email) = ANY(${emails})
          `;
      vibes = (lignes as Record<string, unknown>[]).map((ligne) => ({
        avatar: texte(ligne.avatar) || texte(ligne.profile_avatar) || null,
        displayName: texte(ligne.display_name) || null,
        email: texte(ligne.email).toLowerCase() || null,
        id: texte(ligne.id),
        username: texte(ligne.username) || null,
      }));
    } catch (erreur) {
      console.warn("Quizzly : portraits Vibe illisibles", erreur);
    }
  }
  const parId = new Map(vibes.map((vibe) => [vibe.id, vibe]));
  const parEmail = new Map(
    vibes
      .filter((vibe) => vibe.email)
      .map((vibe) => [vibe.email as string, vibe])
  );
  const hoteParId = new Map(hotes.map((hote) => [texte(hote.id), hote]));
  for (const id of uniques) {
    const hote = hoteParId.get(id);
    const vibe =
      parId.get(id) ??
      (hote?.email ? parEmail.get(texte(hote.email).toLowerCase()) : undefined);
    const username = vibe?.username || texte(hote?.username);
    cartes.set(id, {
      avatarUrl: vibe?.avatar || texte(hote?.avatar) || null,
      displayName: vibe?.displayName || username || "Élève",
      username,
      vibeUserId: vibe?.id ?? (/^\d+$/.test(id) ? id : null),
    });
  }
  return cartes;
}
