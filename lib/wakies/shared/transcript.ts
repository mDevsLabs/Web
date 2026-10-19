/**
 * Décisions PURES du fil de conversation Wakies.
 *
 * Pourquoi ce module : les règles du transcript — quelle citation afficher,
 * quelle provenance de transfert, où tombent les séparateurs de jour — étaient
 * écrites dans le composant de rendu, donc seulement lisibles à l'œil. Elles
 * sont ici sans React, sans `UIMessage`, vérifiables par un test unitaire.
 *
 * Aucune de ces fonctions n'invente une donnée : quand le message cité n'est
 * pas dans la page chargée, la citation le DIT (`extrait: ""`) au lieu de
 * fabriquer un texte plausible.
 */

/**
 * Message minimal dont dépendent ces règles — structurel, pas `UIMessage`.
 *
 * `metadata` est typé `unknown` PARCE QUE c'est le cas dans l'AI SDK : la
 * métadonnée est transportée sans forme imposée, donc on la narrowed ici une
 * fois (`metaDe`) au lieu de supposer sa forme à chaque appel.
 */
export type MessageFil = {
  id: string;
  metadata?: unknown;
  parts?: readonly unknown[];
  role?: string;
};

/** Métadonnées qu'un message de `WakiesMessage` peut porter. */
export type MetaFil = {
  authorWakieId?: string | null;
  createdAt?: number | null;
  replyToId?: string | null;
  seq?: number | null;
};

/** Métadonnées d'un message, ou objet vide : jamais de lecture spéculative. */
export function metaDe(message: MessageFil): MetaFil {
  const valeur = message.metadata;
  if (!valeur || typeof valeur !== "object") return {};
  return valeur as MetaFil;
}

/** Citation affichable : auteur nommé, extrait borné, cible cliquable. */
export type CitationFil = {
  auteur: string;
  extrait: string;
  id: string;
};

/** Texte d'un message : concaténation des parts `text`. */
export function texteDe(message: MessageFil): string {
  return (message.parts ?? [])
    .map((partie) =>
      typeof partie === "object" &&
      partie !== null &&
      (partie as { type?: unknown }).type === "text" &&
      typeof (partie as { text?: unknown }).text === "string"
        ? (partie as { text: string }).text
        : ""
    )
    .join("");
}

/**
 * Nom de l'auteur d'un message, tel que l'interface peut l'affirmer.
 *
 * « Vous » pour le compte, le nom réel du Wakie quand on le connaît (annuaire
 * du fil), « Wakie » sinon : un nom inventé serait une attribution fausse.
 */
export function auteurDe(
  message: MessageFil,
  noms?: Map<string, string>
): string {
  if (message.role === "user") return "Vous";
  const wakieId = metaDe(message).authorWakieId;
  if (wakieId && noms?.has(wakieId)) return noms.get(wakieId) as string;
  return "Wakie";
}

/**
 * Citation d'une réponse.
 *
 * `null` quand le message ne répond à rien, ou quand la cible n'est pas
 * joignable : le fil ne prétend jamais afficher une citation qu'il n'a pas.
 * Un extrait vide est possible — c'est le cas d'un message cité fait de pièces
 * jointes — et l'interface le rend alors sans texte.
 */
export function citationDe(
  messages: readonly MessageFil[],
  replyToId: string | null | undefined,
  noms?: Map<string, string>,
  max = 160
): CitationFil | null {
  if (!replyToId) return null;
  const cible = messages.find((message) => message.id === replyToId);
  if (!cible) return null;
  return {
    auteur: auteurDe(cible, noms),
    extrait: texteDe(cible).replace(/\s+/g, " ").trim().slice(0, max),
    id: cible.id,
  };
}

/**
 * Provenance d'un message TRANSFÉRÉ.
 *
 * Elle vient d'une part `data-wakies-forward` écrite par le serveur au moment
 * du transfert : c'est un fait du message, pas une phrase que le modèle
 * aurait pu produire. `null` pour un message ordinaire — l'absence d'une part
 * n'est pas un titre vide.
 */
export function provenanceTransfert(
  message: MessageFil
): { titre: string } | null {
  for (const partie of message.parts ?? []) {
    if (typeof partie !== "object" || partie === null) continue;
    if ((partie as { type?: unknown }).type !== "data-wakies-forward") continue;
    const donnees = (partie as { data?: { conversationTitre?: unknown } }).data;
    const titre = donnees?.conversationTitre;
    return { titre: typeof titre === "string" ? titre : "" };
  }
  return null;
}

/** Deux horodatages tombent-ils le même jour LOCAL ? */
function memeJour(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Libellé d'un séparateur de jour.
 *
 * « Aujourd'hui » et « Hier » se calculent dans le fuseau du NAVIGATEUR : un
 * fil consulté à minuit doit dire « Aujourd'hui » des messages que
 * l'utilisateur vient d'envoyer, pas de ceux du serveur en UTC.
 */
export function jourLisible(
  horodatage: number,
  maintenant = Date.now()
): string {
  const date = new Date(horodatage);
  const reference = new Date(maintenant);
  if (memeJour(date, reference)) return "Aujourd'hui";
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (memeJour(date, hier)) return "Hier";
  return date.toLocaleDateString("fr", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Élément de fil : un message, ou le séparateur qui le précède. */
export type ElementFil<T extends MessageFil = MessageFil> =
  | { cle: string; label: string; type: "jour" }
  | { message: T; type: "message" };

/**
 * Intercale les séparateurs de jour entre les messages.
 *
 * Un message sans horodatage n'ouvre pas de section : il se range dans la
 * précédente, et s'il est le premier, la section ne s'affiche pas du tout —
 * un titre de jour sans date serait un mensonge d'interface.
 */
export function elementsDeJour<T extends MessageFil>(
  messages: readonly T[],
  maintenant = Date.now()
): ElementFil<T>[] {
  const elements: ElementFil<T>[] = [];
  let jourCourant: string | null = null;
  for (const message of messages) {
    const horodatage = metaDe(message).createdAt;
    if (typeof horodatage === "number" && Number.isFinite(horodatage)) {
      const jour = jourLisible(horodatage, maintenant);
      if (jour !== jourCourant) {
        elements.push({
          cle: `${jour}-${message.id}`,
          label: jour,
          type: "jour",
        });
        jourCourant = jour;
      }
    }
    elements.push({ message, type: "message" });
  }
  return elements;
}

/**
 * Dernier `seq` visible.
 *
 * C'est le curseur de lecture envoyé au serveur : marquer lu se fait sur un
 * `seq` réellement affiché, jamais sur « maintenant » — la conversation peut
 * avoir reçu des messages que cette page n'a pas chargés.
 */
export function dernierSeq(messages: readonly MessageFil[]): number | null {
  let maximum: number | null = null;
  for (const message of messages) {
    const seq = metaDe(message).seq;
    if (typeof seq === "number" && Number.isFinite(seq)) {
      maximum = maximum === null ? seq : Math.max(maximum, seq);
    }
  }
  return maximum;
}
