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
/** Une bonne réponse, à la première validation d'un quiz réussi. */
export const XP_PER_CORRECT = 1;
/** Récompense fixe d'une quête quotidienne réclamée. */
export const XP_QUETE_QUOTIDIENNE = 10;
export const GEMS_PER_QUIZ = 5;
export const STREAK_FREEZE_MAX = 2;
export const DAILY_GIFT_GEMS = 5;
export const XP_BOOST_MS = 10 * 60 * 1000;
export const XP_BOOST_CAP_MS = 30 * 60 * 1000;
export const XP_BOOST_MULTIPLIER = 2;
export const GEMMES_QUETE_HEBDOMADAIRE = [20, 40, 70] as const;

export const MESURES_QUOTIDIENNES = [
  "quiz_valide",
  "sans_faute",
  "bonnes_reponses",
] as const;

export const MESURES_HEBDOMADAIRES = [
  "quiz_valide",
  "sans_faute",
  "bonnes_reponses",
  "serie",
  "jours_actifs",
] as const;

export type MesureQuete = (typeof MESURES_HEBDOMADAIRES)[number];
export type PorteeQuete = "daily" | "weekly";
export type MonnaieQuete = "xp" | "gemmes";

export type QueteDefinition = {
  description: string;
  id: string;
  mesure: MesureQuete;
  monnaie: MonnaieQuete;
  objectif: number;
  recompense: number;
  titre: string;
};

export type NiveauQuizzly = {
  niveau: number;
  xpDansPalier: number;
  xpPalier: number;
};

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
  lastDailyGift?: string | null;
  leagueShieldWeek?: string | null;
  ownedFrames: string[];
  streakFreezes: number;
  xpBoostUntil?: Date | null;
};

export type ContexteAchat = {
  aujourdhui: string;
  maintenant: Date;
  semaine: string;
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

export function recordSerie(serie: number, record: number): number {
  const atteint = Number.isFinite(serie) ? Math.max(0, serie) : 0;
  const meilleur = Number.isFinite(record) ? Math.max(0, record) : 0;
  return Math.max(atteint, meilleur);
}

export function resteBooster(fin: Date | null, maintenant: Date): number {
  if (!fin) {
    return 0;
  }
  return Math.max(0, fin.getTime() - maintenant.getTime());
}

export function boosterActif(fin: Date | null, maintenant: Date): boolean {
  return resteBooster(fin, maintenant) > 0;
}

/** Prolonge de 10 minutes, sans dépasser 30 minutes à partir de maintenant. */
export function prolongerBooster(fin: Date | null, maintenant: Date): Date {
  const reste = resteBooster(fin, maintenant);
  const ajoute = Math.min(XP_BOOST_MS, Math.max(0, XP_BOOST_CAP_MS - reste));
  return new Date(maintenant.getTime() + reste + ajoute);
}

export function boosterProlongeable(
  fin: Date | null,
  maintenant: Date
): boolean {
  return resteBooster(fin, maintenant) < XP_BOOST_CAP_MS;
}

export function xpAvecBooster(xp: number, actif: boolean): number {
  if (xp <= 0 || !actif) {
    return Math.max(0, xp);
  }
  return xp * XP_BOOST_MULTIPLIER;
}

export function offreDuJourDisponible(
  dernierJour: string | null | undefined,
  aujourdhui: string
): boolean {
  return dernierJour !== aujourdhui;
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

/**
 * Toute tentative terminée compte pour le jour, quel que soit le score.
 * Un second quiz le même jour ne rajoute pas un jour : `avancerSerie`
 * laisse l'état en place quand le jour est déjà compté.
 */
export function serieApresTentative(
  etat: StreakState,
  aujourdhui: string
): StreakState {
  return avancerSerie(etat, aujourdhui);
}

export function quizReussi(bonnesReponses: number): boolean {
  return bonnesReponses >= PASS_CORRECT;
}

/** XP pour passer du niveau `niveau` au suivant. Le niveau 1 demande 10 XP. */
export function xpPourPalier(niveau: number): number {
  const palier = Number.isInteger(niveau) && niveau >= 1 ? niveau : 1;
  return 10 + (palier - 1) * 5;
}

/** Le niveau se lit sur l'XP totale. Il ne se stocke pas et ne débloque rien. */
export function niveauDepuisXp(xp: number): NiveauQuizzly {
  const total = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let niveau = 1;
  let reste = total;
  let xpPalier = xpPourPalier(niveau);
  while (reste >= xpPalier && niveau < 10_000) {
    reste -= xpPalier;
    niveau += 1;
    xpPalier = xpPourPalier(niveau);
  }
  return { niveau, xpDansPalier: reste, xpPalier };
}

export function recompensesPremiereValidation(bonnesReponses: number): {
  gems: number;
  xp: number;
} {
  if (!quizReussi(bonnesReponses)) {
    return { gems: 0, xp: 0 };
  }
  return {
    gems: GEMS_PER_QUIZ,
    xp: bonnesReponses * XP_PER_CORRECT,
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

function contexteAchat(contexte?: ContexteAchat): ContexteAchat {
  if (contexte) {
    return contexte;
  }
  const maintenant = new Date();
  const aujourdhui = jourParis(maintenant);
  return { aujourdhui, maintenant, semaine: semaineIso(aujourdhui) };
}

export function achatImpossible(
  article: ShopItem,
  portefeuille: Wallet,
  contexte?: ContexteAchat
): string | null {
  const moment = contexteAchat(contexte);
  if (article.kind === "daily") {
    if (!offreDuJourDisponible(portefeuille.lastDailyGift, moment.aujourdhui)) {
      return "L'offre du jour est déjà récupérée.";
    }
    return null;
  }
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
  if (
    article.kind === "boost" &&
    !boosterProlongeable(portefeuille.xpBoostUntil ?? null, moment.maintenant)
  ) {
    return "Le booster est déjà au maximum.";
  }
  if (
    article.kind === "shield" &&
    portefeuille.leagueShieldWeek === moment.semaine
  ) {
    return "Un bouclier est déjà actif cette semaine.";
  }
  return null;
}

export function appliquerAchat(
  article: ShopItem,
  portefeuille: Wallet,
  contexte?: ContexteAchat
): Wallet {
  const moment = contexteAchat(contexte);
  const suivant: Wallet = {
    gems: portefeuille.gems - article.price,
    hearts: article.kind === "hearts" ? HEARTS_MAX : portefeuille.hearts,
    lastDailyGift: portefeuille.lastDailyGift ?? null,
    leagueShieldWeek: portefeuille.leagueShieldWeek ?? null,
    ownedFrames: [...portefeuille.ownedFrames],
    streakFreezes: portefeuille.streakFreezes,
    xpBoostUntil: portefeuille.xpBoostUntil ?? null,
  };
  if (article.kind === "freeze") {
    suivant.streakFreezes += 1;
  }
  if (article.kind === "frame") {
    suivant.ownedFrames.push(article.id);
  }
  if (article.kind === "daily") {
    suivant.gems = portefeuille.gems + DAILY_GIFT_GEMS;
    suivant.lastDailyGift = moment.aujourdhui;
  }
  if (article.kind === "boost") {
    suivant.xpBoostUntil = prolongerBooster(
      portefeuille.xpBoostUntil ?? null,
      moment.maintenant
    );
  }
  if (article.kind === "shield") {
    suivant.leagueShieldWeek = moment.semaine;
  }
  return suivant;
}

export type QuestBump = {
  cle: string;
  mode: "add" | "set";
  valeur: number;
};

export type EvenementQuetes = {
  bonnesReponses: number;
  firstPass: boolean;
  nouveauJour: boolean;
  parfait: boolean;
  serie: number;
};

export function cleQuete(
  portee: PorteeQuete,
  periode: string,
  id: string
): string {
  return `${portee}:${periode}:${id}`;
}

const CLE_QUETE =
  /^(daily|weekly):(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2}):((?:qd|qh)-\d{3})$/;

export function analyserCleQuete(
  cle: string
): { id: string; periode: string; portee: PorteeQuete } | null {
  const trouve = CLE_QUETE.exec(cle);
  if (!trouve) {
    return null;
  }
  const portee = trouve[1] as PorteeQuete;
  const periode = trouve[2] ?? "";
  const id = trouve[3] ?? "";
  if (portee === "daily" && !/^\d{4}-\d{2}-\d{2}$/.test(periode)) {
    return null;
  }
  if (portee === "weekly" && !/^\d{4}-W\d{2}$/.test(periode)) {
    return null;
  }
  if (portee === "daily" && !id.startsWith("qd-")) {
    return null;
  }
  if (portee === "weekly" && !id.startsWith("qh-")) {
    return null;
  }
  return { id, periode, portee };
}

/**
 * Une quête au hasard par mesure. La graine est la clé de période
 * (`daily:AAAA-MM-JJ` ou `weekly:AAAA-Wnn`) : le tirage est le même
 * pour chaque compte, et il ne change pas tant que la période tient.
 */
export function tirerUneParMesure<T extends { id: string; mesure: string }>(
  quetes: readonly T[],
  periode: string,
  mesures: readonly string[]
): T[] {
  const suivant = aleaMulberry(grainePeriode(periode));
  const choisis: T[] = [];
  for (const mesure of mesures) {
    const seau = quetes.filter((quete) => quete.mesure === mesure);
    if (seau.length === 0) {
      continue;
    }
    const index = Math.min(
      seau.length - 1,
      Math.floor(suivant() * seau.length)
    );
    const quete = seau[index];
    if (quete) {
      choisis.push(quete);
    }
  }
  return choisis;
}

export function mouvementsQuetes(
  actives: readonly {
    id: string;
    mesure: MesureQuete;
    portee: PorteeQuete;
  }[],
  periodeJour: string,
  periodeSemaine: string,
  evenement: EvenementQuetes
): QuestBump[] {
  const mouvements: QuestBump[] = [];
  for (const quete of actives) {
    const periode = quete.portee === "daily" ? periodeJour : periodeSemaine;
    const cle = cleQuete(quete.portee, periode, quete.id);
    if (quete.mesure === "serie") {
      mouvements.push({ cle, mode: "set", valeur: evenement.serie });
      continue;
    }
    if (quete.mesure === "jours_actifs") {
      if (evenement.nouveauJour) {
        mouvements.push({ cle, mode: "add", valeur: 1 });
      }
      continue;
    }
    if (!evenement.firstPass) {
      continue;
    }
    if (quete.mesure === "quiz_valide") {
      mouvements.push({ cle, mode: "add", valeur: 1 });
    } else if (quete.mesure === "sans_faute" && evenement.parfait) {
      mouvements.push({ cle, mode: "add", valeur: 1 });
    } else if (quete.mesure === "bonnes_reponses") {
      mouvements.push({
        cle,
        mode: "add",
        valeur: evenement.bonnesReponses,
      });
    }
  }
  return mouvements;
}

function grainePeriode(periode: string): number {
  let hachage = 2_166_136_261;
  for (let index = 0; index < periode.length; index += 1) {
    hachage ^= periode.charCodeAt(index);
    hachage = Math.imul(hachage, 16_777_619);
  }
  return hachage >>> 0;
}

function aleaMulberry(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d_2b_79_f5) | 0;
    let valeur = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    valeur ^= valeur + Math.imul(valeur ^ (valeur >>> 7), 61 | valeur);
    return ((valeur ^ (valeur >>> 14)) >>> 0) / 4_294_967_296;
  };
}
