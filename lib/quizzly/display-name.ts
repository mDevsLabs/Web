/**
 * Nom affiché lu dans Vibe, replié sur le compte mAI.
 *
 * L'écriture met à jour `profiles.display_name` et l'indicatif Blackline.
 * Le username de connexion n'est pas modifié : les mentions et l'unicité
 * du compte restent stables.
 */

import "server-only";

import type { MaiUser } from "@/lib/auth/session";
import {
  getBlacklineSettings,
  saveBlacklineSettings,
} from "@/lib/blackline/queries";
import { normaliserNomAffiche, superposerIndicatif } from "@/lib/quizzly/name";
import { vibeSql } from "@/lib/vibe/server/db";
import { resolveVibeIdentity } from "@/lib/vibe/server/identity";
import {
  columnExists,
  tableExists,
  userIdCast,
} from "@/lib/vibe/server/schema";

export type NomAffiche = {
  avatarUrl: string | null;
  displayName: string;
  username: string;
};

async function lireLigneProfil(
  sql: NonNullable<ReturnType<typeof vibeSql>>,
  userId: string,
  avecProfil: boolean,
  avecAvatar: boolean
) {
  if (avecProfil && avecAvatar) {
    return sql`
      SELECT u.username, u.avatar_url AS user_avatar,
             p.display_name, p.avatar_url AS profile_avatar
      FROM users u
      LEFT JOIN profiles p ON p.user_id::text = u.id::text
      WHERE u.id::text = ${userId}
      LIMIT 1
    `;
  }
  if (avecProfil) {
    return sql`
      SELECT u.username, NULL::text AS user_avatar,
             p.display_name, p.avatar_url AS profile_avatar
      FROM users u
      LEFT JOIN profiles p ON p.user_id::text = u.id::text
      WHERE u.id::text = ${userId}
      LIMIT 1
    `;
  }
  if (avecAvatar) {
    return sql`
      SELECT u.username, u.avatar_url AS user_avatar,
             NULL::text AS display_name, NULL::text AS profile_avatar
      FROM users u
      WHERE u.id::text = ${userId}
      LIMIT 1
    `;
  }
  return sql`
    SELECT u.username, NULL::text AS user_avatar,
           NULL::text AS display_name, NULL::text AS profile_avatar
    FROM users u
    WHERE u.id::text = ${userId}
    LIMIT 1
  `;
}

function repliCompte(
  repli: Pick<MaiUser, "avatarUrl" | "username">
): NomAffiche {
  const username = repli.username?.trim() || "";
  return {
    avatarUrl: repli.avatarUrl || null,
    displayName: username || "Élève",
    username,
  };
}

export async function lireNomAffiche(
  repli: Pick<MaiUser, "avatarUrl" | "username">
): Promise<NomAffiche> {
  const secours = repliCompte(repli);
  const sql = vibeSql();
  if (!sql) {
    return secours;
  }
  try {
    const identite = await resolveVibeIdentity();
    if (!identite) {
      return secours;
    }
    const avecProfil = await tableExists("profiles");
    const avecAvatar = await columnExists("users", "avatar_url");
    const lignes = await lireLigneProfil(
      sql,
      identite.userId,
      avecProfil,
      avecAvatar
    );
    const ligne = lignes[0] as Record<string, unknown> | undefined;
    if (!ligne) {
      return { ...secours, username: identite.username || secours.username };
    }
    const texte = (cle: string): string => {
      const brut = ligne[cle];
      return typeof brut === "string" ? brut.trim() : "";
    };
    const username = texte("username") || identite.username || secours.username;
    const avatar =
      texte("user_avatar") || texte("profile_avatar") || secours.avatarUrl;
    return {
      avatarUrl: avatar || null,
      displayName: texte("display_name") || username || "Élève",
      username,
    };
  } catch (erreur) {
    console.warn("Quizzly : lecture du nom affiché impossible", erreur);
    return secours;
  }
}

async function ecrireDisplayName(
  userId: string,
  nom: string
): Promise<boolean> {
  const sql = vibeSql();
  if (!sql || !(await tableExists("profiles"))) {
    return false;
  }
  const cast = await userIdCast();
  const avecDate = await columnExists("profiles", "updated_at");
  try {
    if (cast === "bigint") {
      const id = Number(userId);
      if (!Number.isSafeInteger(id)) {
        return false;
      }
      if (avecDate) {
        await sql`
          INSERT INTO profiles (user_id, display_name)
          VALUES (${id}, ${nom})
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = ${nom}, updated_at = NOW()
        `;
      } else {
        await sql`
          INSERT INTO profiles (user_id, display_name)
          VALUES (${id}, ${nom})
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = ${nom}
        `;
      }
      return true;
    }
    if (cast === "uuid") {
      if (avecDate) {
        await sql`
          INSERT INTO profiles (user_id, display_name)
          VALUES (${userId}::uuid, ${nom})
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = ${nom}, updated_at = NOW()
        `;
      } else {
        await sql`
          INSERT INTO profiles (user_id, display_name)
          VALUES (${userId}::uuid, ${nom})
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = ${nom}
        `;
      }
      return true;
    }
    return false;
  } catch (erreur) {
    console.error("Quizzly : écriture du nom affiché impossible", erreur);
    return false;
  }
}

export async function enregistrerNomAffiche(
  userIdHote: string,
  brut: string
): Promise<{ message: string; ok: false } | { ok: true }> {
  const nom = normaliserNomAffiche(brut);
  if (!nom) {
    return {
      message: "Le nom affiché contient entre 2 et 40 caractères.",
      ok: false,
    };
  }
  const identite = await resolveVibeIdentity();
  if (!identite) {
    return {
      message: "Le profil Vibe de ce compte est introuvable.",
      ok: false,
    };
  }
  const ecrit = await ecrireDisplayName(identite.userId, nom);
  if (!ecrit) {
    return {
      message: "Le profil Vibe n'est pas disponible sur cette instance.",
      ok: false,
    };
  }
  try {
    const reglages = await getBlacklineSettings(userIdHote);
    await saveBlacklineSettings(userIdHote, superposerIndicatif(reglages, nom));
  } catch (erreur) {
    console.error("Quizzly : indicatif Blackline non recopié", erreur);
  }
  return { ok: true };
}
