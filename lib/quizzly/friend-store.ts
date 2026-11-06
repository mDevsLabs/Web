/**
 * Amitiés Quizzly.
 *
 * La ligne hôte est la source. Le miroir Vibe est tenté après l'acceptation
 * et rejoué tant que `mirroredAt` est vide : un échec réseau ne perd pas
 * la demande, et un rejeu n'efface pas un suivi déjà choisi sur Vibe.
 */

import "server-only";

import { and, eq, or, sql } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  quizzlyFollowMirror,
  quizzlyFriendship,
  quizzlyLeagueSeat,
  quizzlyProfile,
} from "@/lib/db/schema";
import {
  deciderDemande,
  demandeAmisImpossible,
  type LienAmi,
  type StatutAmitie,
} from "@/lib/quizzly/friends";
import { ligueOuBronze } from "@/lib/quizzly/leagues";
import { portraitsPour, trouverCompteParPseudo } from "@/lib/quizzly/portraits";
import { jourParis, semaineIso } from "@/lib/quizzly/rules";
import {
  miroirAbonnements,
  retirerAbonnements,
} from "@/lib/quizzly/vibe-follows";

export type AmiVue = {
  addresseeId: string;
  avatarUrl: string | null;
  displayName: string;
  friendshipId: string;
  league: string;
  requesterId: string;
  schoolYear: string;
  status: StatutAmitie;
  username: string;
  weeklyXp: number;
};

function estStatut(valeur: string): valeur is StatutAmitie {
  return valeur === "pending" || valeur === "accepted" || valeur === "declined";
}

function versLien(ligne: {
  addresseeId: string;
  id: string;
  requesterId: string;
  status: string;
}): LienAmi | null {
  if (!estStatut(ligne.status)) {
    return null;
  }
  return {
    addresseeId: ligne.addresseeId,
    id: ligne.id,
    requesterId: ligne.requesterId,
    status: ligne.status,
  };
}

async function assurerProfilAmi(userId: string): Promise<void> {
  await dbReady();
  await getDb()
    .insert(quizzlyProfile)
    .values({ userId })
    .onConflictDoNothing({ target: quizzlyProfile.userId });
}

async function tenterMiroir(friendshipId: string): Promise<void> {
  await dbReady();
  const db = getDb();
  const [lien] = await db
    .select()
    .from(quizzlyFriendship)
    .where(eq(quizzlyFriendship.id, friendshipId))
    .limit(1);
  if (lien?.status !== "accepted" || lien?.mirroredAt) {
    return;
  }
  const portraits = await portraitsPour([lien.requesterId, lien.addresseeId]);
  const a = portraits.get(lien.requesterId)?.vibeUserId;
  const b = portraits.get(lien.addresseeId)?.vibeUserId;
  try {
    if (a && b) {
      const crees = await miroirAbonnements(a, b);
      if (crees.length > 0) {
        await db.insert(quizzlyFollowMirror).values(
          crees.map((paire) => ({
            followerVibeId: paire.followerVibeId,
            followingVibeId: paire.followingVibeId,
            friendshipId,
          }))
        );
      }
    }
    await db
      .update(quizzlyFriendship)
      .set({ mirroredAt: new Date() })
      .where(eq(quizzlyFriendship.id, friendshipId));
  } catch (erreur) {
    console.error("Quizzly : miroir Vibe non écrit", erreur);
  }
}

export async function compterDemandes(userId: string): Promise<number> {
  await dbReady();
  const [ligne] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(quizzlyFriendship)
    .where(
      and(
        eq(quizzlyFriendship.addresseeId, userId),
        eq(quizzlyFriendship.status, "pending")
      )
    );
  return Number(ligne?.total ?? 0);
}

export async function demanderAmi(
  moi: string,
  pseudo: string
): Promise<{ message: string; ok: false } | { ok: true }> {
  const trouve = await trouverCompteParPseudo(moi, pseudo);
  if (!trouve) {
    return { message: "Ce pseudo est introuvable.", ok: false };
  }
  const refus = demandeAmisImpossible(moi, trouve.cle);
  if (refus) {
    return { message: refus, ok: false };
  }
  const autre = trouve.cle;
  await dbReady();
  const decision = await getDb().transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`quizzly-friend:${[moi, autre].sort().join(":")}`}))`
    );
    const [ligne] = await tx
      .select()
      .from(quizzlyFriendship)
      .where(
        or(
          and(
            eq(quizzlyFriendship.requesterId, moi),
            eq(quizzlyFriendship.addresseeId, autre)
          ),
          and(
            eq(quizzlyFriendship.requesterId, autre),
            eq(quizzlyFriendship.addresseeId, moi)
          )
        )
      )
      .limit(1);
    const choix = deciderDemande(ligne ? versLien(ligne) : null, moi, autre);
    if (choix.action === "deja") {
      return { message: "Vous êtes déjà amis.", ok: false as const };
    }
    if (choix.action === "attente") {
      return { message: "La demande est déjà envoyée.", ok: false as const };
    }
    if (choix.action === "insert") {
      await tx.insert(quizzlyFriendship).values({
        addresseeId: autre,
        requesterId: moi,
        status: "pending",
      });
      return { ok: true as const };
    }
    if (choix.action === "relancer") {
      await tx
        .update(quizzlyFriendship)
        .set({
          addresseeId: autre,
          mirroredAt: null,
          requesterId: moi,
          respondedAt: null,
          status: "pending",
        })
        .where(eq(quizzlyFriendship.id, choix.id));
      return { ok: true as const };
    }
    await tx
      .update(quizzlyFriendship)
      .set({ respondedAt: new Date(), status: "accepted" })
      .where(eq(quizzlyFriendship.id, choix.id));
    return { id: choix.id, ok: true as const };
  });
  if (!decision.ok) {
    return decision;
  }
  if ("id" in decision && typeof decision.id === "string") {
    await assurerProfilAmi(autre);
    await tenterMiroir(decision.id);
  }
  return { ok: true };
}

export async function repondreAmi(
  moi: string,
  friendshipId: string,
  accepter: boolean
): Promise<{ message: string; ok: false } | { ok: true }> {
  await dbReady();
  const resultat = await getDb().transaction(async (tx) => {
    const [ligne] = await tx
      .select()
      .from(quizzlyFriendship)
      .where(eq(quizzlyFriendship.id, friendshipId))
      .limit(1);
    if (!ligne || ligne.addresseeId !== moi || ligne.status !== "pending") {
      return {
        message: "Cette demande n'est plus en attente.",
        ok: false as const,
      };
    }
    await tx
      .update(quizzlyFriendship)
      .set({
        respondedAt: new Date(),
        status: accepter ? "accepted" : "declined",
      })
      .where(eq(quizzlyFriendship.id, friendshipId));
    return { ok: true as const };
  });
  if (!resultat.ok) {
    return resultat;
  }
  if (accepter) {
    const [lien] = await getDb()
      .select({ requesterId: quizzlyFriendship.requesterId })
      .from(quizzlyFriendship)
      .where(eq(quizzlyFriendship.id, friendshipId))
      .limit(1);
    if (lien) {
      await assurerProfilAmi(lien.requesterId);
    }
    await tenterMiroir(friendshipId);
  }
  return { ok: true };
}

export async function retirerAmi(
  moi: string,
  friendshipId: string
): Promise<{ message: string; ok: false } | { ok: true }> {
  await dbReady();
  const db = getDb();
  const [ligne] = await db
    .select()
    .from(quizzlyFriendship)
    .where(eq(quizzlyFriendship.id, friendshipId))
    .limit(1);
  if (
    !ligne ||
    (ligne.requesterId !== moi && ligne.addresseeId !== moi) ||
    ligne.status !== "accepted"
  ) {
    return { message: "Cette amitié est introuvable.", ok: false };
  }
  const miroirs = await db
    .select({
      followerVibeId: quizzlyFollowMirror.followerVibeId,
      followingVibeId: quizzlyFollowMirror.followingVibeId,
    })
    .from(quizzlyFollowMirror)
    .where(eq(quizzlyFollowMirror.friendshipId, friendshipId));
  try {
    await retirerAbonnements(miroirs);
  } catch (erreur) {
    console.error("Quizzly : retrait du miroir Vibe impossible", erreur);
    return {
      message: "Le retrait n'a pas pu être synchronisé avec Vibe.",
      ok: false,
    };
  }
  await db
    .delete(quizzlyFriendship)
    .where(eq(quizzlyFriendship.id, friendshipId));
  return { ok: true };
}

export async function listerAmis(moi: string): Promise<{
  incoming: AmiVue[];
  outgoing: AmiVue[];
  friends: AmiVue[];
}> {
  await dbReady();
  const db = getDb();
  const lignes = await db
    .select()
    .from(quizzlyFriendship)
    .where(
      or(
        eq(quizzlyFriendship.requesterId, moi),
        eq(quizzlyFriendship.addresseeId, moi)
      )
    );
  const aRejouer = lignes.filter(
    (ligne) => ligne.status === "accepted" && !ligne.mirroredAt
  );
  for (const ligne of aRejouer) {
    await tenterMiroir(ligne.id);
  }
  const autres = lignes
    .filter((ligne) => ligne.status !== "declined")
    .map((ligne) =>
      ligne.requesterId === moi ? ligne.addresseeId : ligne.requesterId
    );
  const portraits = await portraitsPour(autres);
  const semaine = semaineIso(jourParis(new Date()));
  const profils = autres.length
    ? await db
        .select({
          league: quizzlyProfile.league,
          schoolYear: quizzlyProfile.schoolYear,
          userId: quizzlyProfile.userId,
        })
        .from(quizzlyProfile)
        .where(or(...autres.map((id) => eq(quizzlyProfile.userId, id))))
    : [];
  const parProfil = new Map(profils.map((profil) => [profil.userId, profil]));
  const sieges = autres.length
    ? await db
        .select({
          userId: quizzlyLeagueSeat.userId,
          weeklyXp: quizzlyLeagueSeat.weeklyXp,
        })
        .from(quizzlyLeagueSeat)
        .where(
          and(
            eq(quizzlyLeagueSeat.weekKey, semaine),
            or(...autres.map((id) => eq(quizzlyLeagueSeat.userId, id)))
          )
        )
    : [];
  const parXp = new Map(sieges.map((siege) => [siege.userId, siege.weeklyXp]));
  const vues: AmiVue[] = [];
  for (const ligne of lignes) {
    if (ligne.status === "declined" || !estStatut(ligne.status)) {
      continue;
    }
    const autre =
      ligne.requesterId === moi ? ligne.addresseeId : ligne.requesterId;
    const portrait = portraits.get(autre);
    const profil = parProfil.get(autre);
    vues.push({
      addresseeId: ligne.addresseeId,
      avatarUrl: portrait?.avatarUrl ?? null,
      displayName: portrait?.displayName ?? "Élève",
      friendshipId: ligne.id,
      league: ligueOuBronze(profil?.league ?? "bronze"),
      requesterId: ligne.requesterId,
      schoolYear: profil?.schoolYear ?? "6e",
      status: ligne.status,
      username: portrait?.username ?? "",
      weeklyXp: parXp.get(autre) ?? 0,
    });
  }
  return {
    friends: vues.filter((vue) => vue.status === "accepted"),
    incoming: vues.filter(
      (vue) => vue.status === "pending" && vue.addresseeId === moi
    ),
    outgoing: vues.filter(
      (vue) => vue.status === "pending" && vue.requesterId === moi
    ),
  };
}
