/**
 * Règles d'amitié Quizzly, pures.
 *
 * Une paire n'a qu'une ligne. Si l'autre a déjà demandé, notre demande
 * accepte la sienne au lieu d'en ouvrir une seconde.
 */

export type StatutAmitie = "accepted" | "declined" | "pending";

export type LienAmi = {
  addresseeId: string;
  id: string;
  requesterId: string;
  status: StatutAmitie;
};

export type DecisionDemande =
  | { action: "accepter"; id: string }
  | { action: "attente" }
  | { action: "deja" }
  | { action: "insert" }
  | { action: "relancer"; id: string };

const PSEUDO = /^[A-Za-z0-9._-]{2,32}$/;

export function normaliserPseudo(brut: string): string | null {
  const sansArobase = brut.trim().replace(/^@+/, "");
  if (!PSEUDO.test(sansArobase)) {
    return null;
  }
  return sansArobase;
}

export function demandeAmisImpossible(
  moi: string,
  autre: string
): string | null {
  if (!moi || !autre) {
    return "Compte introuvable.";
  }
  if (moi === autre) {
    return "Vous ne pouvez pas vous ajouter.";
  }
  return null;
}

export function deciderDemande(
  lien: LienAmi | null,
  moi: string,
  autre: string
): DecisionDemande {
  if (!lien) {
    return { action: "insert" };
  }
  if (lien.status === "accepted") {
    return { action: "deja" };
  }
  if (lien.status === "pending" && lien.requesterId === moi) {
    return { action: "attente" };
  }
  if (lien.status === "pending" && lien.addresseeId === moi) {
    return { action: "accepter", id: lien.id };
  }
  return { action: "relancer", id: lien.id };
}

/**
 * La clé Quizzly est celle de la session (`user.id`, parfois l'e-mail).
 * Vibe identifie par un entier. On préfère une ligne de profil déjà
 * ouverte, puis la même forme d'identifiant que l'appelant.
 */
export function cleCompteAmi(params: {
  cleAppelant: string;
  cleHote: string | null;
  cleVibe: string;
  profilsExistants: readonly string[];
}): string {
  const candidats = [params.cleVibe, params.cleHote].filter(
    (valeur): valeur is string => Boolean(valeur)
  );
  const existants = params.profilsExistants.filter((cle) =>
    candidats.includes(cle)
  );
  if (existants.includes(params.cleAppelant)) {
    return params.cleAppelant;
  }
  const existant = existants[0];
  if (existant) {
    return existant;
  }
  const appelantUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.cleAppelant
    );
  if (appelantUuid && params.cleHote) {
    return params.cleHote;
  }
  if (/^\d+$/.test(params.cleAppelant)) {
    return params.cleVibe;
  }
  return params.cleHote ?? params.cleVibe;
}
