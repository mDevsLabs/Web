/**
 * ============================================================================
 * VIBE — PROFIL DE L'UTILISATEUR, LU POUR WAKIES (lib/vibe/server/profil.ts)
 * ============================================================================
 *
 * Deux consommateurs, une seule lecture :
 *
 *   1. `GET /api/wakies/me/profile` — la carte « Mon profil » de Wakies ;
 *   2. le prompt d'un tour de conversation : le Wakie connaît la personne à qui
 *      il parle (nom public, bio, ville, site) sans qu'on lui raconte une
 *      histoire.
 *
 * VIBE FAIT FOI, WAKIES LIT. Aucune écriture ici : la politique DDL du module
 * `db.ts` s'applique telle quelle (lecture seule, aucune réparation de schéma),
 * et une table absente donne `null` — jamais une exception qui remonterait
 * dans une route ou dans un stream.
 *
 * Ce que la lecture NE ramène pas : l'email, le forfait, les jetons, les
 * compteurs privés. Un profil est une vitrine, pas un dossier.
 */
import "server-only";
import { vibeSql } from "./db";
import { resolveVibeIdentity } from "./identity";
import { tableExists } from "./schema";

export type ProfilVibeUtilisateur = {
  /** URL de l'avatar Vibe (déjà publique côté Vibe). */
  avatarUrl: string | null;
  bio: string;
  displayName: string;
  localisation: string;
  site: string;
  username: string;
};

/**
 * Profil Vibe du compte de la session, ou `null`.
 *
 * `null` couvre tous les cas d'indisponibilité — pas de session, pas de table
 * Vibe, pas de profil — et c'est volontaire : l'appelant n'a rien à décider
 * selon la cause, il n'affiche simplement pas de profil.
 */
export async function lireProfilVibe(): Promise<ProfilVibeUtilisateur | null> {
  const sql = vibeSql();
  if (!sql) return null;
  const identite = await resolveVibeIdentity();
  if (!identite) return null;
  try {
    const id = identite.userId;
    // L'identifiant a DÉJÀ été résolu par une comparaison castée (identity.ts),
    // donc on le compare ici en texte : une seconde résolution par id numérique
    // ne servirait à rien. Le coût est un parcours de `users` — une ligne par
    // compte, sur une lecture par tour de conversation.
    //
    // La table `profiles` est créée par le backend Vibe : tant qu'elle n'existe
    // pas, le profil public se réduit au compte (`users.username`). Le DDL de
    // l'hôte n'y touche pas.
    const avecProfil = await tableExists("profiles");
    const requete = avecProfil
      ? sql`
          SELECT u.username, p.display_name, p.bio, p.avatar_url,
                 p.location, p.website
          FROM users u
          LEFT JOIN profiles p ON p.user_id = u.id
          WHERE u.id::text = ${id}
          LIMIT 1
        `
      : sql`
          SELECT u.username,
                 NULL::text AS display_name, NULL::text AS bio,
                 NULL::text AS avatar_url, NULL::text AS location,
                 NULL::text AS website
          FROM users u
          WHERE u.id::text = ${id}
          LIMIT 1
        `;
    const rows = await requete;
    const ligne = rows[0];
    if (!ligne) return null;
    const valeur = (cle: string): string => {
      const brut = (ligne as Record<string, unknown>)[cle];
      return typeof brut === "string" ? brut.trim() : "";
    };
    const avatarUrl = valeur("avatar_url");
    return {
      avatarUrl: avatarUrl || null,
      bio: valeur("bio"),
      displayName: valeur("display_name") || valeur("username"),
      localisation: valeur("location"),
      site: valeur("website"),
      username: valeur("username"),
    };
  } catch (erreur) {
    console.warn("[vibe-server] lecture du profil impossible:", erreur);
    return null;
  }
}

/**
 * Délai maximal d'une lecture de CONFORT.
 *
 * Sans cette borne, un profil lent rendrait lente la CONVERSATION : la lecture
 * a lieu avant le premier token, donc une base distante qui traîne retarderait
 * chaque tour. Au-delà du délai, on continue sans profil — le Wakie ne connaît
 * pas la bio du compte, ce qui n'empêche aucune réponse. La promesse de lecture
 * n'est pas annulée : elle se termine dans le vide si la base répond après.
 */
const DELAI_LECTURE_MS = 800;

/** Lecture du profil bornée dans le temps : jamais un blocage de tour. */
export async function lireProfilVibeBref(): Promise<ProfilVibeUtilisateur | null> {
  return Promise.race([
    lireProfilVibe(),
    new Promise<null>((resoudre) => {
      setTimeout(() => resoudre(null), DELAI_LECTURE_MS);
    }),
  ]);
}

/**
 * Résumé du profil pour un prompt système.
 *
 * `null` quand il n'y a RIEN à dire : un bloc de prompt qui ne contient que le
 * pseudo n'apprend rien au modèle et consomme du contexte. Le texte est borné
 * ici, pas chez l'appelant, et il est présenté comme une DONNÉE (le contrat
 * anti-injection de `lib/wakies/prompt.ts` s'applique au-dessus).
 */
export function resumeProfilPourPrompt(
  profil: ProfilVibeUtilisateur | null,
  max = 700
): string | null {
  if (!profil) return null;
  const morceaux: string[] = [];
  if (profil.displayName) {
    morceaux.push(
      profil.username && profil.username !== profil.displayName
        ? `${profil.displayName} (@${profil.username})`
        : profil.displayName
    );
  } else if (profil.username) {
    morceaux.push(`@${profil.username}`);
  }
  const details: string[] = [];
  if (profil.bio) details.push(profil.bio);
  if (profil.localisation) details.push(`Basé à ${profil.localisation}.`);
  if (profil.site) details.push(`Site : ${profil.site}`);
  if (details.length === 0) {
    // Rien qu'un pseudo : le modèle n'apprend rien, donc on n'ajoute pas de
    // section. C'est la seule raison pour laquelle la fonction peut refuser.
    return null;
  }
  return `${morceaux.join(" — ")}\n${details.join(" ")}`.slice(0, max);
}
