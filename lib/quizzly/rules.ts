/**
 * Règles de jeu de Quizzly, pures et testables.
 *
 * Le serveur les applique ; l'interface ne les recalcule pas pour décider
 * d'une récompense. Les dates de série sont des jours civils `AAAA-MM-JJ`
 * déjà ramenés au fuseau Europe/Paris par l'appelant.
 */

import type { ShopItem } from "@/lib/quizzly/shop";

export const HEARTS_MAX = 5;
export const HEART_REGEN_MS = 30 * 60 * 1000;
export const PASS_CORRECT = 8;
export const QUESTIONS_PER_QUIZ = 10;
export const XP_PER_CORRECT = 10;
export const XP_PERFECT_BONUS = 20;
export const GEMS_PER_QUIZ = 5;
export const STREAK_FREEZE_MAX = 2;

export const QUEST_TARGETS = {
  perfect: 1,
  quiz: 1,
  quizzes: 5,
  streak: 3,
  xp: 50,
} as const;

export const QUEST_REWARDS = {
  perfect: 15,
  quiz: 10,
  quizzes: 40,
  streak: 30,
  xp: 20,
} as const;

export type QuestId = keyof typeof QUEST_TARGETS;

export type StreakState = {
  streakCount: number;
  streakFreezes: number;
  streakLastDay: string | null;
};

export type Cosmetics = {
  equippedFrame: string | null;
  ownedFrames: string[];
};

export type Wallet = {
  gems: number;
  hearts: number;
  ownedFrames: string[];
  streakFreezes: number;
};

const JOUR_MS = 86_400_000;

export function jourParis(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Paris",
    year: "numeric",
  }).format(instant);
}

/** Semaine ISO du jour civil déjà exprimé en `AAAA-MM-JJ`. */
export function semaineIso(jour: string): string {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, quantieme));
  const jourSemaine = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - jourSemaine);
  const debutAnnee = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const semaine = Math.ceil(
    ((date.getTime() - debutAnnee.getTime()) / JOUR_MS + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(semaine).padStart(2, "0")}`;
}

export function joursEntre(debut: string, fin: string): number {
  const a = Date.parse(`${debut}T00:00:00Z`);
  const b = Date.parse(`${fin}T00:00:00Z`);
  return Math.round((b - a) / JOUR_MS);
}

/**
 * Délai avant le prochain cœur, ou `null` si le plafond est déjà atteint
 * à l'écran. Un intervalle d'une seconde réveillerait React pour un
 * compteur qui ne bouge que toutes les 30 minutes.
 */
export function delaiProchainCoeur(
  hearts: number,
  updatedAtMs: number,
  nowMs: number
): number | null {
  if (hearts >= HEARTS_MAX) {
    return null;
  }
  if (!Number.isFinite(updatedAtMs) || !Number.isFinite(nowMs)) {
    return null;
  }
  const ecoule = Math.max(0, nowMs - updatedAtMs);
  const gagnes = Math.floor(ecoule / HEART_REGEN_MS);
  if (hearts + gagnes >= HEARTS_MAX) {
    return null;
  }
  const reste = ecoule % HEART_REGEN_MS;
  return reste === 0 ? HEART_REGEN_MS : HEART_REGEN_MS - reste;
}

export function regeneratedHearts(
  hearts: number,
  updatedAt: Date,
  now: Date
): { changed: boolean; hearts: number; heartsUpdatedAt: Date } {
  if (hearts >= HEARTS_MAX) {
    return { changed: false, hearts: HEARTS_MAX, heartsUpdatedAt: updatedAt };
  }
  const ecoule = now.getTime() - updatedAt.getTime();
  if (ecoule < HEART_REGEN_MS) {
    return { changed: false, hearts, heartsUpdatedAt: updatedAt };
  }
  const gagnes = Math.floor(ecoule / HEART_REGEN_MS);
  const suivants = Math.min(HEARTS_MAX, hearts + gagnes);
  const horodatage =
    suivants >= HEARTS_MAX
      ? now
      : new Date(updatedAt.getTime() + gagnes * HEART_REGEN_MS);
  return { changed: true, hearts: suivants, heartsUpdatedAt: horodatage };
}

/**
 * Un jour manqué consomme un gel. Deux jours manqués, ou aucun gel,
 * ramènent la série à 1 : le quiz du jour compte, l'historique non.
 */
export function avancerSerie(
  etat: StreakState,
  aujourdhui: string
): StreakState {
  if (etat.streakLastDay === aujourdhui) {
    return etat;
  }
  if (!etat.streakLastDay || etat.streakLastDay > aujourdhui) {
    return {
      streakCount: 1,
      streakFreezes: etat.streakFreezes,
      streakLastDay: aujourdhui,
    };
  }
  const ecart = joursEntre(etat.streakLastDay, aujourdhui);
  if (ecart === 1) {
    return {
      streakCount: etat.streakCount + 1,
      streakFreezes: etat.streakFreezes,
      streakLastDay: aujourdhui,
    };
  }
  if (ecart === 2 && etat.streakFreezes > 0) {
    return {
      streakCount: etat.streakCount + 1,
      streakFreezes: etat.streakFreezes - 1,
      streakLastDay: aujourdhui,
    };
  }
  return {
    streakCount: 1,
    streakFreezes: etat.streakFreezes,
    streakLastDay: aujourdhui,
  };
}

export function quizReussi(bonnesReponses: number): boolean {
  return bonnesReponses >= PASS_CORRECT;
}

export function recompensesPremiereValidation(bonnesReponses: number): {
  gems: number;
  xp: number;
} {
  if (!quizReussi(bonnesReponses)) {
    return { gems: 0, xp: 0 };
  }
  const bonus = bonnesReponses === QUESTIONS_PER_QUIZ ? XP_PERFECT_BONUS : 0;
  return {
    gems: GEMS_PER_QUIZ,
    xp: bonnesReponses * XP_PER_CORRECT + bonus,
  };
}

/** Le premier quiz d'une matière est ouvert. Les suivants exigent le précédent validé. */
export function idsDebloques(
  ids: readonly string[],
  passes: ReadonlySet<string>
): Set<string> {
  const ouverts = new Set<string>();
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (!id) {
      continue;
    }
    const precedent = index === 0 ? null : ids[index - 1];
    if (
      precedent === null ||
      (precedent !== undefined && passes.has(precedent))
    ) {
      ouverts.add(id);
    }
  }
  return ouverts;
}

export function normaliserCosmetiques(valeur: unknown): Cosmetics {
  if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) {
    return { equippedFrame: null, ownedFrames: [] };
  }
  const source = valeur as Record<string, unknown>;
  const bruts = Array.isArray(source.ownedFrames) ? source.ownedFrames : [];
  const ownedFrames = [
    ...new Set(
      bruts.filter(
        (entree): entree is string =>
          typeof entree === "string" && entree.length > 0 && entree.length <= 40
      )
    ),
  ];
  const equipe =
    typeof source.equippedFrame === "string" ? source.equippedFrame : null;
  return {
    equippedFrame: equipe && ownedFrames.includes(equipe) ? equipe : null,
    ownedFrames,
  };
}

export function achatImpossible(
  article: ShopItem,
  portefeuille: Wallet
): string | null {
  if (portefeuille.gems < article.price) {
    return "Pas assez de gemmes.";
  }
  if (
    article.kind === "freeze" &&
    portefeuille.streakFreezes >= STREAK_FREEZE_MAX
  ) {
    return "Vous avez déjà le nombre maximal de gels.";
  }
  if (
    article.kind === "frame" &&
    portefeuille.ownedFrames.includes(article.id)
  ) {
    return "Vous possédez déjà ce cadre.";
  }
  if (article.kind === "hearts" && portefeuille.hearts >= HEARTS_MAX) {
    return "Vos cœurs sont déjà au complet.";
  }
  return null;
}

export function appliquerAchat(
  article: ShopItem,
  portefeuille: Wallet
): Wallet {
  const suivant: Wallet = {
    gems: portefeuille.gems - article.price,
    hearts: article.kind === "hearts" ? HEARTS_MAX : portefeuille.hearts,
    ownedFrames: [...portefeuille.ownedFrames],
    streakFreezes: portefeuille.streakFreezes,
  };
  if (article.kind === "freeze") {
    suivant.streakFreezes += 1;
  }
  if (article.kind === "frame") {
    suivant.ownedFrames.push(article.id);
  }
  return suivant;
}

export type QuestBump = {
  cle: string;
  mode: "add" | "set";
  valeur: number;
};

export function incrementsQuetes(entree: {
  firstPass: boolean;
  parfait: boolean;
  periodeJour: string;
  periodeSemaine: string;
  serie: number;
  xp: number;
}): QuestBump[] {
  const mouvements: QuestBump[] = [
    {
      cle: `weekly:${entree.periodeSemaine}:streak`,
      mode: "set",
      valeur: entree.serie,
    },
  ];
  if (entree.firstPass) {
    mouvements.push(
      {
        cle: `daily:${entree.periodeJour}:quiz`,
        mode: "add",
        valeur: 1,
      },
      {
        cle: `daily:${entree.periodeJour}:xp`,
        mode: "add",
        valeur: entree.xp,
      },
      {
        cle: `weekly:${entree.periodeSemaine}:quizzes`,
        mode: "add",
        valeur: 1,
      }
    );
    if (entree.parfait) {
      mouvements.push({
        cle: `daily:${entree.periodeJour}:perfect`,
        mode: "add",
        valeur: 1,
      });
    }
  }
  return mouvements;
}

const CLE_QUETE =
  /^(?:daily:(\d{4}-\d{2}-\d{2})|weekly:(\d{4}-W\d{2})):(perfect|quiz|quizzes|streak|xp)$/;

export function analyserCleQuete(
  cle: string
): { id: QuestId; periode: string } | null {
  const trouve = CLE_QUETE.exec(cle);
  if (!trouve) {
    return null;
  }
  const id = trouve[3] as QuestId;
  return { id, periode: trouve[1] ?? trouve[2] ?? "" };
}

export function libelleQuete(id: QuestId): string {
  switch (id) {
    case "perfect":
      return "Réussir un sans-faute";
    case "quiz":
      return "Valider un quiz";
    case "quizzes":
      return "Valider 5 quiz";
    case "streak":
      return "Tenir une série de 3 jours";
    case "xp":
      return "Gagner 50 XP";
    default:
      return id;
  }
}
