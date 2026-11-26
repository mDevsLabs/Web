/**
 * Masquage des journaux des ticks exécutés hors Vercel.
 *
 * Le dépôt est public : les journaux GitHub Actions le sont aussi. GitHub ne
 * masque que les valeurs EXACTES des secrets ; tout ce qui en dérive (URL de
 * base reconstruite, jeton renvoyé par un fournisseur) et les données
 * personnelles (e-mails, identifiants) passeraient en clair. Chaque ligne
 * console du runner direct passe donc par `masquer` avant d'être écrite.
 *
 * Module pur, sans effet de bord : testable sans lancer de tick.
 */

const MOTIFS_SENSIBLES: ReadonlyArray<readonly [RegExp, string]> = [
  [/postgres(?:ql)?:\/\/\S+/gi, "<db-url>"],
  [/\bBearer\s+\S+/gi, "Bearer <secret>"],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]*/g, "<jwt>"],
  [/\b(?:sk|pk|rk)-[\w-]{10,}/g, "<cle>"],
  [/\bgh[pousr]_\w{20,}/g, "<cle>"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "<email>"],
  [
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "<id>",
  ],
];

export function masquer(texte: string): string {
  let resultat = texte;
  for (const [motif, remplacement] of MOTIFS_SENSIBLES) {
    resultat = resultat.replace(motif, remplacement);
  }
  return resultat;
}
