/**
 * Formatage pur des indicateurs d'XP hebdomadaire pour l'interface Quizzly.
 */

function normaliserXp(xp: number): number {
  return Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
}

export function texteXpSemaineAccueil(weeklyXp: number): {
  actif: boolean;
  libelle: string;
} {
  const valeur = normaliserXp(weeklyXp);
  if (valeur <= 0) {
    return { actif: false, libelle: "Aucun XP cette semaine" };
  }
  return { actif: true, libelle: `+${valeur} cette semaine` };
}

export function texteXpSemaineLigue(weeklyXp: number): string {
  const valeur = normaliserXp(weeklyXp);
  if (valeur <= 0) {
    return "Aucun XP cette semaine";
  }
  return `${valeur} XP cette semaine`;
}
