/**
 * Mentions `@` et `@@` d'un message Wakies — analyse PUR, testable.
 *
 * CE QUE CE MODULE NE FAIT PAS
 *
 * Il ne décide AUCUNE famille et n'autorise RIEN : il sort des jetons. La
 * résolution (quel plugin, quel serveur MCP, quelle page, et si CE compte y a
 * droit) reste serveur, dans `lib/wakies/mentions.ts`. C'est la règle du port :
 * le navigateur n'envoie que du texte, et le serveur reconstruit l'état réel.
 *
 * POURQUOI UN SECOND ANALYSEUR, ALORS QUE `parseMentions` EXISTE DÉJÀ
 *
 * `parseMentions` (`lib/wakies/slash.ts`) lit `@pseudo` pour désigner des
 * MEMBRES du fil et porte `@all`. Y glisser le préfixe `@@` reviendrait à
 * mélanger deux choses qui n'ont rien à voir : « qui est nommé » et « quel
 * réglage on pose ». Le présent analyseur lit les DEUX préfixes ; `parseMentions`
 * continue de ne lire que le simple `@`, et son refus de `@@` est explicitement
 * testé pour qu'aucun des deux chemins ne dérive vers l'autre.
 *
 * POURQUOI `@` ET `@@` NE VEULENT PAS DIRE LA MÊME CHOSE
 *
 * `@jeton` = pour CE tour seulement. `@@jeton` = réglage persistant du fil.
 * La différence tient en un caractère, et son effet dure ou meurt avec le
 * message : c'est la raison pour laquelle le nombre de préfixes est porté
 * jusque dans la structure de retour, et jamais perdu au passage.
 */

/** Jetons ignorés : ils ont un sens ailleurs, ce ne sont pas des capacités. */
export const JETONS_NON_CAPACITES = new Set(["all", "tous"]);

/** Au-delà, le prompt enfle sans que personne ne relise ce qu'il a invoqué. */
export const MENTIONS_MAX_PAR_MESSAGE = 5;

export type AnalyseMentions = {
  /** Jetons posant un réglage durable (`@@`), en minuscules, sans `@`. */
  persistants: string[];
  /** Jetons valant pour ce seul tour (`@`), en minuscules, sans `@`. */
  tourCourant: string[];
  /** Mentions citées `@"Nom à espaces"`, préfixe inclus, conservées telles quelles. */
  citations: string[];
  /** Mentions abandonnées faute de place — pour le dire, pas les taire. */
  depassements: number;
};

/**
 * Un jeton : `@` ou `@@`, puis soit un mot court, soit une forme citée.
 *
 * La borne d'après le jeton (`\s`, fin de chaîne, ponctuation) est ce qui
 * empêche `@gmail.` d'être lu « gmail. » — et `email@example.com` d'être lu
 * comme une mention : le préfixe doit suivre un espace ou le début du texte.
 */
const MENTION =
  /(?:^|\s)@(@?)((?:[a-zA-Z0-9_.-]{2,40})|"[^"\n]{1,60})(?=$|\s|[.,;:!?)"'’])/g;

export function analyserMentions(texte: string): AnalyseMentions {
  const tourCourant = new Set<string>();
  const persistants = new Set<string>();
  const citations: string[] = [];
  let vus = 0;
  let depassements = 0;

  for (const groupe of texte.matchAll(MENTION)) {
    const brut = groupe[2] ?? "";
    const cite = brut.startsWith('"');
    // La classe de caractères du jeton accepte `.` et `-` (des identifiants en
    // ont), donc la ponctuation qui CLÔTURE une phrase se retrouve attrapée :
    // « avec @gmail. » donnait le jeton « gmail. ». On rogne les signes de fin.
    const jeton = (
      cite ? brut.replace(/^"|"$/g, "") : brut.replace(/[._-]+$/g, "")
    )
      .trim()
      .toLowerCase();
    if (!jeton || JETONS_NON_CAPACITES.has(jeton)) continue;

    vus += 1;
    if (vus > MENTIONS_MAX_PAR_MESSAGE) {
      depassements += 1;
      continue;
    }
    if (cite) citations.push(`@"${jeton}"`);
    if (groupe[1] === "@") persistants.add(jeton);
    else tourCourant.add(jeton);
  }

  return {
    citations,
    depassements,
    persistants: [...persistants],
    tourCourant: [...tourCourant],
  };
}
