import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesCall,
  wakiesCapture,
  wakiesChatTurn,
  wakiesConversation,
  wakiesFriend,
  wakiesMemory,
  wakiesMessage,
  wakiesMessageReaction,
  wakiesNotification,
  wakiesPage,
  wakiesPageConversation,
  wakiesPageReview,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskConversation,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
  wakiesWakieImage,
  wakiesWakieProfile,
  wakiesWakieSpace,
} from "@/lib/db/schema";
import type { PageSettings } from "@/lib/wakies/pages";
import { preserveGoalMarker } from "@/lib/wakies/shared/goals";
import { apercuMessage } from "@/lib/wakies/shared/messages";
import {
  prochaineExecution,
  STATUT_TACHE,
  TACHE_BAIL_MS,
  TACHE_MAX_TENTATIVES,
  tentativesEpuisees,
} from "@/lib/wakies/task-lease";
import { ownedConversationIds } from "./messages";
import type {
  SetupStatus,
  WakieCallRow,
  WakieConversationRow,
  WakieMemoryRow,
  WakiePageRow,
  WakieRow,
  WakieSettingsRow,
  WakieSpaceRow,
  WakieTaskEventRow,
  WakieTaskRow,
  WakieTaskRunRow,
  WakieWithSpaces,
} from "./types";
import { createWakie, findWakie, hashCompte, listWakies } from "./wakies";

// ─── Profils sociaux, galerie et amis ─────────────────────────────────────────

/**
 * Pseudo public d'un Wakie (`@pseudo`).
 * Minuscules, chiffres, `_`, `-` et `.`, 3 à 30 caractères : même règle que
 * les pseudos Vibe, pour une recherche globale prévisible.
 */
export function normaliserHandle(handle?: string | null): string | null {
  if (!handle) return null;
  const nettoye = handle.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_.-]{3,30}$/.test(nettoye)) return null;
  return nettoye;
}

export type WakieProfilRow = typeof wakiesWakieProfile.$inferSelect;
export type WakieImageRow = typeof wakiesWakieImage.$inferSelect;
export type WakieAmiRow = typeof wakiesFriend.$inferSelect;

/**
 * Extrait affichable d'une persona PUBLIÉE. Ne lit JAMAIS `instructions`.
 *
 * Repli assumé sur la bio : un propriétaire qui a rempli sa bio mais pas sa
 * persona publie quand même quelque chose de volontaire — l'ordre est donc
 * persona publiée, puis bio, jamais le prompt privé. Vide est un résultat
 * légitime : un Wakie public peut n'avoir rien publié.
 */
export function extraitPersonaPublique(
  source: { bio?: string | null; publicPersona?: string | null },
  max = 600
): string {
  const publiee = (source.publicPersona ?? "").trim();
  if (publiee) return publiee.slice(0, max);
  return (source.bio ?? "").trim().slice(0, max);
}

/**
 * Extrait de contexte pour une mention `@`.
 *
 * L'extrait d'un Wakie POSSÉDÉ peut être ses instructions : c'est le même
 * compte, il n'y a rien à protéger. L'extrait d'un Wakie d'un AUTRE compte
 * (ami) passe par la persona publiée, sans exception — c'est exactement la
 * fuite que cette fonction rend impossible à réintroduire par inadvertance.
 */
export function extraitContexteMention(source: {
  bio?: string | null;
  instructions?: string | null;
  mien: boolean;
  publicPersona?: string | null;
}): string {
  if (source.mien) return (source.instructions ?? "").trim().slice(0, 600);
  return extraitPersonaPublique(source);
}

/** Profil social, créé à la lecture : un Wakie a toujours une fiche affichable. */
export async function ensureProfilWakie(
  userIdOrWakieId: string,
  maybeWakieId?: string
): Promise<WakieProfilRow> {
  const wakieId = maybeWakieId ?? userIdOrWakieId;
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(wakiesWakieProfile)
    .values({ wakieId })
    .onConflictDoNothing({ target: wakiesWakieProfile.wakieId })
    .returning();
  if (row) return row;
  const [existant] = await db
    .select()
    .from(wakiesWakieProfile)
    .where(eq(wakiesWakieProfile.wakieId, wakieId))
    .limit(1);
  return existant!;
}

/** Profil public d'un Wakie (annuaire et fiche) : jamais de `userId` en sortie. */
export async function lireProfilPublic(
  wakieId: string
): Promise<WakieProfilRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesWakieProfile)
    .where(eq(wakiesWakieProfile.wakieId, wakieId))
    .limit(1);
  return row ?? null;
}

export async function mettreAJourProfilWakie(
  userId: string,
  wakieId: string,
  patch: {
    avatarPath?: string | null;
    bannerPath?: string | null;
    bio?: string;
    handle?: string | null;
    isPublic?: boolean;
    links?: string[];
    /** Persona PUBLIÉE : le seul texte exposé aux autres comptes. */
    publicPersona?: string;
  }
): Promise<WakieRow> {
  await dbReady();
  const db = getDb();
  const [wakieExistant] = await db
    .select()
    .from(wakiesWakie)
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
    .limit(1);
  if (!wakieExistant) {
    throw new Error("Wakie introuvable sur ce compte.");
  }

  let wakieMaj = wakieExistant;
  if (
    patch.handle !== undefined ||
    patch.isPublic !== undefined ||
    patch.publicPersona !== undefined
  ) {
    const handleVal =
      patch.handle === undefined
        ? wakieExistant.handle
        : patch.handle === null
          ? null
          : normaliserHandle(patch.handle);
    const [maj] = await db
      .update(wakiesWakie)
      .set({
        ...(patch.handle === undefined ? {} : { handle: handleVal }),
        ...(patch.isPublic === undefined ? {} : { isPublic: patch.isPublic }),
        ...(patch.publicPersona === undefined
          ? {}
          : { publicPersona: patch.publicPersona.slice(0, 2000) }),
      })
      .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
      .returning();
    if (maj) wakieMaj = maj;
  }

  if (
    patch.bio !== undefined ||
    patch.avatarPath !== undefined ||
    patch.bannerPath !== undefined ||
    patch.links !== undefined
  ) {
    await ensureProfilWakie(userId, wakieId);
    await db
      .update(wakiesWakieProfile)
      .set({
        ...(patch.bio === undefined ? {} : { bio: patch.bio }),
        ...(patch.avatarPath === undefined
          ? {}
          : { avatarPath: patch.avatarPath }),
        ...(patch.bannerPath === undefined
          ? {}
          : { bannerPath: patch.bannerPath }),
        ...(patch.links === undefined ? {} : { links: patch.links }),
        updatedAt: new Date(),
      })
      .where(eq(wakiesWakieProfile.wakieId, wakieId));
  }
  return wakieMaj;
}

/** Images de la galerie, dans l'ordre d'affichage (`position`, puis création). */
export async function listerImagesWakie(
  wakieId: string,
  options?: { userId?: string; publicSeulement?: boolean }
): Promise<WakieImageRow[]> {
  await dbReady();
  if (options?.publicSeulement) {
    const pub = await trouverWakiePublic(wakieId);
    if (!pub) return [];
  } else if (options?.userId) {
    const mien = await findWakie(options.userId, wakieId);
    if (!mien) return [];
  }
  return getDb()
    .select()
    .from(wakiesWakieImage)
    .where(eq(wakiesWakieImage.wakieId, wakieId))
    .orderBy(asc(wakiesWakieImage.position), asc(wakiesWakieImage.createdAt));
}

export class WakiesImageQuotaError extends Error {
  readonly limite: number;
  readonly utilise: number;
  constructor(limite: number, utilise: number) {
    super(`Limite d'images de profil atteinte (${utilise}/${limite}).`);
    this.name = "WakiesImageQuotaError";
    this.limite = limite;
    this.utilise = utilise;
  }
}

/**
 * Ajoute une image à la galerie en respectant le quota du forfait, sous verrou.
 * Même patron que `createWakie` : le comptage et l'insertion sont atomiques.
 */
export async function ajouterImageWakie(
  userId: string,
  wakieId: string,
  dataOrBlobPathname: string | { blobPathname: string; alt?: string },
  altOrLimite?: string | number | null,
  maybeLimite?: number | null
): Promise<WakieImageRow> {
  let blobPathname: string;
  let alt = "";
  let limite: number | null = null;
  if (typeof dataOrBlobPathname === "object") {
    blobPathname = dataOrBlobPathname.blobPathname;
    alt = dataOrBlobPathname.alt ?? "";
    limite =
      typeof altOrLimite === "number" || altOrLimite === null
        ? altOrLimite
        : null;
  } else {
    blobPathname = dataOrBlobPathname;
    alt = typeof altOrLimite === "string" ? altOrLimite : "";
    limite = maybeLimite === undefined ? null : maybeLimite;
  }
  if (limite === 0) throw new WakiesImageQuotaError(0, 0);
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${hashCompte(`${userId}:${wakieId}`)})`
    );
    const compte = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(wakiesWakieImage)
      .where(eq(wakiesWakieImage.wakieId, wakieId));
    const utilise = compte[0]?.n ?? 0;
    if (limite !== null && utilise >= limite) {
      throw new WakiesImageQuotaError(limite, utilise);
    }
    const [row] = await tx
      .insert(wakiesWakieImage)
      .values({ alt, blobPathname, wakieId })
      .returning();
    return row;
  });
}

export async function supprimerImageWakie(
  userId: string,
  imageIdOrWakieId: string,
  maybeImageId?: string
): Promise<boolean> {
  const imageId = maybeImageId ?? imageIdOrWakieId;
  const wakieId = maybeImageId ? imageIdOrWakieId : undefined;
  await dbReady();
  const conditions = [eq(wakiesWakieImage.id, imageId)];
  if (wakieId) {
    conditions.push(eq(wakiesWakieImage.wakieId, wakieId));
  }
  const [row] = await getDb()
    .delete(wakiesWakieImage)
    .where(and(...conditions))
    .returning({ id: wakiesWakieImage.id });
  return Boolean(row);
}

/** Wakie public par identifiant, sans exposer le propriétaire ni son prompt. */
export async function trouverWakiePublic(wakieId: string) {
  await dbReady();
  const [row] = await getDb()
    .select({
      accent: wakiesWakie.accent,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.isPublic, true)))
    .limit(1);
  return row ?? null;
}

/**
 * Recherche globale des Wakies publics (annuaire d'amis).
 * ILIKE borné à 20 lignes, triée par nouveauté : pas de recherche plein texte
 * en V1, un index partiel suffit. Ne sélectionne QUE du contenu publié :
 * `publicPersona` et la bio, jamais `instructions`.
 */
export async function chercherWakiesPublics(q: string, limite = 20) {
  const nettoye = q.trim().toLowerCase().replace(/^@/, "").slice(0, 40);
  if (!nettoye) return [];
  await dbReady();
  return getDb()
    .select({
      accent: wakiesWakie.accent,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(
      and(
        eq(wakiesWakie.isPublic, true),
        or(
          ilike(wakiesWakie.handle, `%${nettoye}%`),
          ilike(wakiesWakie.name, `%${nettoye}%`),
          ilike(wakiesWakieProfile.bio, `%${nettoye}%`)
        )
      )
    )
    .orderBy(desc(wakiesWakie.createdAt))
    .limit(Math.min(Math.max(limite, 1), 50));
}

export async function estAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ wakieId: wakiesFriend.wakieId })
    .from(wakiesFriend)
    .where(
      and(
        eq(wakiesFriend.subscriberUserId, userId),
        eq(wakiesFriend.wakieId, wakieId)
      )
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Wakies suivis par compte, avec ce qu'une liste d'amis doit afficher :
 * mascotte, accent, bio publiée et persona — jamais les instructions.
 * Un ami retiré de l'annuaire (redevenu privé) reste suivi : la liste est un
 * fait du compte, pas une conséquence de la visibilité de la cible.
 */
export async function listerAmis(userId: string) {
  await dbReady();
  const lignes = await getDb()
    .select({
      accent: wakiesWakie.accent,
      amiDepuis: wakiesFriend.createdAt,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      id: wakiesWakie.id,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
    })
    .from(wakiesFriend)
    .innerJoin(wakiesWakie, eq(wakiesWakie.id, wakiesFriend.wakieId))
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(eq(wakiesFriend.subscriberUserId, userId))
    .orderBy(asc(wakiesWakie.name));
  return lignes.map((ligne) => ({
    accent: ligne.accent,
    amiDepuis: ligne.amiDepuis,
    avatar: ligne.avatar,
    bio: (ligne.bio ?? "").trim().slice(0, 280),
    handle: ligne.handle,
    id: ligne.id,
    name: ligne.name,
    personaPubliee: extraitPersonaPublique(ligne, 280),
  }));
}

export async function ajouterAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .insert(wakiesFriend)
    .values({ ownerUserId: userId, subscriberUserId: userId, wakieId })
    .onConflictDoNothing({
      target: [wakiesFriend.subscriberUserId, wakiesFriend.wakieId],
    })
    .returning({ wakieId: wakiesFriend.wakieId });
  return Boolean(row);
}

export async function retirerAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .delete(wakiesFriend)
    .where(
      and(
        eq(wakiesFriend.subscriberUserId, userId),
        eq(wakiesFriend.wakieId, wakieId)
      )
    )
    .returning({ wakieId: wakiesFriend.wakieId });
  return Boolean(row);
}

/**
 * Clone un Wakie PUBLIC dans le compte courant.
 *
 * L'AMI EST UNE VITRINE : le clone est un Wakie qui M'APPARTIENT — il
 * consomme mon quota et mes jetons, et je peux le modifier sans jamais
 * toucher au profil de son auteur.
 *
 * CE QUI EST COPIÉ : la persona PUBLIÉE (jamais `instructions`, que ce
 * module ne lit même pas ici), le nom, la mascotte et l'accent — des clés de
 * catalogue, pas des fichiers —, puis la bio et les liens du profil social.
 *
 * CE QUI N'EST PAS COPIÉ, ET POURQUOI :
 *   - les images (galerie, avatar, bannière) : ce sont des blobs du compte
 *     de l'auteur ; un clone ne peut pas en devenir propriétaire, et
 *     dupliquer le fichier serait un autre produit ;
 *   - les capacités (MCP, skills, plugins, outils, modèle) : elles sont
 *     accordées par le compte de l'auteur, sous son quota et sa
 *     responsabilité. Le clone part des valeurs par défaut de l'hôte.
 *
 * Lève une erreur lisible quand la source n'est pas publique, ou quand elle
 * n'a rien publié : un clone vide serait un Wakie muet, pas un clone.
 */
export async function clonerWakiePublic(
  userId: string,
  sourceWakieId: string,
  input: { name?: string; spaceId: string },
  quota: number | null = null
): Promise<WakieWithSpaces> {
  const source = await trouverWakiePublic(sourceWakieId);
  if (!source) {
    throw new Error("Ce Wakie n'est pas public.");
  }
  const profil = await lireProfilPublic(sourceWakieId);
  const persona = extraitPersonaPublique(
    { bio: profil?.bio, publicPersona: source.publicPersona },
    2000
  );
  if (!persona) {
    throw new Error(
      "Ce Wakie n'a rien publié : il n'y a pas de persona à cloner."
    );
  }
  const nom = (input.name ?? source.name).trim().slice(0, 40) || "Wakie";
  const wakie = await createWakie(
    userId,
    {
      accent: source.accent ?? null,
      avatar: source.avatar ?? null,
      clonedFromWakieId: sourceWakieId,
      instructions: persona,
      memoryAllowed: true,
      name: nom,
      researchAllowed: true,
      spaceId: input.spaceId,
    },
    quota
  );
  if (profil) {
    await ensureProfilWakie(userId, wakie.id);
    await getDb()
      .update(wakiesWakieProfile)
      .set({ bio: profil.bio, links: profil.links, updatedAt: new Date() })
      .where(eq(wakiesWakieProfile.wakieId, wakie.id));
  }
  return wakie;
}

/**
 * Propriétaire d'un Wakie PUBLIC. USAGE SERVEUR UNIQUEMENT.
 *
 * Ne sort jamais d'une réponse : il sert à signer les blobs publics (le
 * préfixe `uploads/<propriétaire>/` est la seule façon de les lire) sans
 * pour autant rendre l'identifiant du compte lisible côté client.
 */
export async function proprietaireWakiePublic(
  wakieId: string
): Promise<string | null> {
  await dbReady();
  const [row] = await getDb()
    .select({ ownerUserId: wakiesWakie.userId })
    .from(wakiesWakie)
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.isPublic, true)))
    .limit(1);
  return row?.ownerUserId ?? null;
}

/**
 * Annuaire : résultats publics enrichis pour UN compte.
 *
 * `estMien` évite de proposer « Ajouter » sur son propre Wakie, `estAmi`
 * affiche l'état réel, et `nombreImages` alimente la carte sans requête par
 * ligne. Aucun `userId` ne sort.
 */
export async function listerAnnuaire(
  userId: string,
  q: string,
  limite = 20
): Promise<
  Array<{
    accent: string | null;
    avatar: string | null;
    bio: string;
    estAmi: boolean;
    estMien: boolean;
    handle: string | null;
    name: string;
    nombreImages: number;
    personaPubliee: string;
    wakieId: string;
  }>
> {
  const bruts = await chercherWakiesPublics(q, limite);
  if (bruts.length === 0) return [];
  await dbReady();
  const db = getDb();
  const ids = bruts.map((row) => row.wakieId);
  const [miens, amis, comptes] = await Promise.all([
    db
      .select({ wakieId: wakiesWakie.id })
      .from(wakiesWakie)
      .where(and(eq(wakiesWakie.userId, userId), inArray(wakiesWakie.id, ids))),
    db
      .select({ wakieId: wakiesFriend.wakieId })
      .from(wakiesFriend)
      .where(
        and(
          eq(wakiesFriend.subscriberUserId, userId),
          inArray(wakiesFriend.wakieId, ids)
        )
      ),
    db
      .select({
        n: sql<number>`count(*)::int`,
        wakieId: wakiesWakieImage.wakieId,
      })
      .from(wakiesWakieImage)
      .where(inArray(wakiesWakieImage.wakieId, ids))
      .groupBy(wakiesWakieImage.wakieId),
  ]);
  const mesIds = new Set(miens.map((row) => row.wakieId));
  const idsAmis = new Set(amis.map((row) => row.wakieId));
  const images = new Map(comptes.map((row) => [row.wakieId, row.n]));
  return bruts.map((row) => ({
    accent: row.accent,
    avatar: row.avatar,
    bio: (row.bio ?? "").trim().slice(0, 280),
    estAmi: idsAmis.has(row.wakieId),
    estMien: mesIds.has(row.wakieId),
    handle: row.handle,
    name: row.name,
    nombreImages: images.get(row.wakieId) ?? 0,
    personaPubliee: extraitPersonaPublique(row, 280),
    wakieId: row.wakieId,
  }));
}

/**
 * Résout des mentions `@pseudo` / `@Nom` vers des Wakies accessibles :
 * possédés + amis publics. Lecture seule, 5 maximum, sans exposer de
 * `userId`.
 *
 * L'extrait d'un Wakie AMI est sa persona PUBLIÉE (repli : bio) : les
 * instructions privées d'un autre compte ne traversent jamais cette
 * frontière. Ceux sans rien de publié sont écartés — une mention qui
 * n'apporterait aucun contexte vaut mieux absente qu'annoncée vide.
 */
export async function resoudreMentions(
  userId: string,
  noms: readonly string[]
): Promise<Array<{ name: string; extrait: string }>> {
  const demandes = [
    ...new Set(
      noms
        .map((nom) => nom.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    ),
  ].slice(0, 5);
  if (demandes.length === 0) return [];
  await dbReady();
  const lignes = await getDb()
    .select({
      bio: wakiesWakieProfile.bio,
      instructions: wakiesWakie.instructions,
      name: wakiesWakie.name,
      ownerUserId: wakiesWakie.userId,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(
      and(
        or(
          eq(wakiesWakie.userId, userId),
          inArray(
            wakiesWakie.id,
            getDb()
              .select({ wakieId: wakiesFriend.wakieId })
              .from(wakiesFriend)
              .where(eq(wakiesFriend.subscriberUserId, userId))
          )
        ),
        demandes.length === 1
          ? or(
              ilike(wakiesWakie.handle, `%${demandes[0]}%`),
              ilike(wakiesWakie.name, `%${demandes[0]}%`)
            )
          : or(
              ...demandes.flatMap((d) => [
                ilike(wakiesWakie.handle, `%${d}%`),
                ilike(wakiesWakie.name, `%${d}%`),
              ])
            )
      )
    )
    .limit(5);
  return lignes
    .map((ligne) => ({
      extrait: extraitContexteMention({
        bio: ligne.bio,
        instructions: ligne.instructions,
        mien: ligne.ownerUserId === userId,
        publicPersona: ligne.publicPersona,
      }),
      name: ligne.name,
    }))
    .filter((mention) => mention.extrait.length > 0);
}

export async function listerEpingles(
  userId: string,
  conversationId: string,
  limite = 20
) {
  await dbReady();
  return getDb()
    .select({
      conversationId: wakiesMessage.conversationId,
      createdAt: wakiesMessage.createdAt,
      id: wakiesMessage.id,
      parts: wakiesMessage.parts,
      pinned: wakiesMessage.pinned,
      pinnedAt: wakiesMessage.pinnedAt,
      role: wakiesMessage.role,
      seq: wakiesMessage.seq,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.conversationId, conversationId),
        eq(wakiesMessage.pinned, true),
        eq(wakiesConversation.userId, userId)
      )
    )
    .orderBy(desc(wakiesMessage.pinnedAt))
    .limit(Math.min(Math.max(limite, 1), 50));
}

/** Épingle ou désépingle un message après contrôle de propriété. */
export async function definirEpingle(
  userId: string,
  messageId: string,
  pinned: boolean
): Promise<{ id: string; pinned: boolean } | null> {
  await dbReady();
  const db = getDb();
  const [msg] = await db
    .select({ id: wakiesMessage.id })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);

  if (!msg) return null;

  const [maj] = await db
    .update(wakiesMessage)
    .set({
      pinned,
      pinnedAt: pinned ? new Date() : null,
    })
    .where(eq(wakiesMessage.id, messageId))
    .returning({ id: wakiesMessage.id, pinned: wakiesMessage.pinned });

  return maj ?? null;
}

// ─── Réactions ───────────────────────────────────────────────────────────────

/** Palette FIXE : le serveur la valide, jamais le client. */
export const PALETTE_REACTIONS = ["👍", "❤️", "💡", "🔥", "😂", "😮"] as const;

export function estReactionValide(emoji: unknown): emoji is string {
  return (
    typeof emoji === "string" &&
    (PALETTE_REACTIONS as readonly string[]).includes(emoji)
  );
}

/**
 * Pose une réaction. La clé (message, émoji, auteur) rend l'opération
 * idempotente : poser deux fois ne crée qu'une ligne.
 * `byWakieId` = NULL quand c'est le compte qui réagit depuis l'interface.
 */
export async function poserReaction(
  userId: string,
  messageId: string,
  emoji: string,
  byWakieId: string | null
): Promise<boolean> {
  if (!estReactionValide(emoji)) return false;
  if (byWakieId !== null && !(await findWakie(userId, byWakieId))) return false;
  await dbReady();
  const [message] = await getDb()
    .select({
      conversationId: wakiesMessage.conversationId,
      role: wakiesMessage.role,
    })
    .from(wakiesMessage)
    .where(eq(wakiesMessage.id, messageId))
    .limit(1);
  if (!message) return false;
  // Le compte ne réagit pas à SON message (l'IA, elle, peut réagir à ceux de
  // l'utilisateur : `byWakieId` distingue les deux auteurs).
  if (message.role === "user" && byWakieId === null) return false;
  const autorise = await ownedConversationIds(userId, [message.conversationId]);
  if (!autorise.has(message.conversationId)) return false;
  const [row] = await getDb()
    .insert(wakiesMessageReaction)
    .values({ byWakieId, emoji, messageId })
    .onConflictDoNothing({
      target: [
        wakiesMessageReaction.messageId,
        wakiesMessageReaction.emoji,
        wakiesMessageReaction.actorKey,
      ],
    })
    .returning({ messageId: wakiesMessageReaction.messageId });
  return Boolean(row);
}

export async function retirerReaction(
  userId: string,
  messageId: string,
  emoji: string,
  byWakieId: string | null
): Promise<boolean> {
  await dbReady();
  const [message] = await getDb()
    .select({ conversationId: wakiesMessage.conversationId })
    .from(wakiesMessage)
    .where(eq(wakiesMessage.id, messageId))
    .limit(1);
  if (!message) return false;
  const autorise = await ownedConversationIds(userId, [message.conversationId]);
  if (!autorise.has(message.conversationId)) return false;
  const [row] = await getDb()
    .delete(wakiesMessageReaction)
    .where(
      and(
        eq(wakiesMessageReaction.messageId, messageId),
        eq(wakiesMessageReaction.emoji, emoji),
        byWakieId === null
          ? isNull(wakiesMessageReaction.byWakieId)
          : eq(wakiesMessageReaction.byWakieId, byWakieId)
      )
    )
    .returning({ messageId: wakiesMessageReaction.messageId });
  return Boolean(row);
}

/** Réactions indexées par message, pour l'affichage du fil. */
export async function listerReactions(
  userId: string,
  messageIds: readonly string[]
): Promise<
  Map<
    string,
    Array<{ byWakieId: string | null; createdAt: Date; emoji: string }>
  >
> {
  const ids = [...new Set(messageIds)].slice(0, 200);
  const sortie = new Map<
    string,
    Array<{ byWakieId: string | null; createdAt: Date; emoji: string }>
  >();
  if (ids.length === 0) return sortie;
  await dbReady();
  const lignes = await getDb()
    .select({
      byWakieId: wakiesMessageReaction.byWakieId,
      createdAt: wakiesMessageReaction.createdAt,
      emoji: wakiesMessageReaction.emoji,
      messageId: wakiesMessageReaction.messageId,
    })
    .from(wakiesMessageReaction)
    .innerJoin(
      wakiesMessage,
      eq(wakiesMessage.id, wakiesMessageReaction.messageId)
    )
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        inArray(wakiesMessageReaction.messageId, ids)
      )
    )
    .orderBy(asc(wakiesMessageReaction.createdAt));
  for (const ligne of lignes) {
    const groupe = sortie.get(ligne.messageId) ?? [];
    groupe.push({
      byWakieId: ligne.byWakieId,
      createdAt: ligne.createdAt,
      emoji: ligne.emoji,
    });
    sortie.set(ligne.messageId, groupe);
  }
  return sortie;
}

export const listerWakies = listWakies;
