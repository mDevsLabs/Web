import { describe, expect, it } from "vitest";
import { storedMessages } from "@/lib/wakies/shared/messages";
import {
  citationDe,
  dernierSeq,
  elementsDeJour,
  jourLisible,
  metaDe,
  provenanceTransfert,
} from "@/lib/wakies/shared/transcript";

/**
 * Le fil de messagerie : les règles qui décident AFFICHAGE et LECTURE.
 *
 * Ces tests existent parce que ces décisions étaient prises dans le composant
 * de rendu, donc invérifiables : citation d'une réponse, provenance d'un
 * transfert, séparateurs de jour, curseur de lecture. Ils vérifient aussi
 * qu'aucune de ces règles n'invente une donnée absente.
 */

const NOMS = new Map([
  ["w-muse", "Muse"],
  ["w-goat", "Goat"],
]);

/** Message de test : les seuls champs dont les règles dépendent. */
function message(
  id: string,
  options: {
    authorWakieId?: string | null;
    createdAt?: number | null;
    parts?: unknown[];
    replyToId?: string | null;
    role?: string;
    seq?: number | null;
  } = {}
) {
  const {
    authorWakieId = null,
    createdAt,
    parts,
    replyToId,
    role = "assistant",
    seq,
  } = options;
  const metadata = {
    authorWakieId,
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(replyToId === undefined ? {} : { replyToId }),
    ...(seq === undefined ? {} : { seq }),
  };
  return {
    id,
    metadata,
    parts: parts ?? [{ text: `texte ${id}`, type: "text" }],
    role,
  };
}

describe("métadonnées d'un message stocké", () => {
  it("convertit une ligne enrichie et garde l'ordre d'écriture", () => {
    const [converti] = storedMessages([
      {
        authorWakieId: "w-muse",
        createdAt: 1_700_000_000_000,
        id: "m1",
        parts: [{ text: "bonjour", type: "text" }],
        replyToId: "m0",
        role: "assistant",
        seq: 12,
      },
    ]);
    expect(converti.metadata).toEqual({
      authorWakieId: "w-muse",
      createdAt: 1_700_000_000_000,
      replyToId: "m0",
      seq: 12,
    });
  });

  it("n'invente pas de métadonnée quand la ligne n'en porte pas", () => {
    const [converti] = storedMessages([
      { id: "m1", parts: [{ text: "x", type: "text" }], role: "user" },
    ]);
    // Un `metadata` vide ferait croire à une métadonnée présente et nulle.
    expect(converti.metadata).toBeUndefined();
    expect(metaDe(converti)).toEqual({});
  });

  it("ignore une métadonnée qui n'est pas un objet", () => {
    expect(metaDe({ id: "m", metadata: "texte" })).toEqual({});
    expect(metaDe({ id: "m", metadata: null })).toEqual({});
  });
});

describe("citation d'une réponse", () => {
  const cible = message("m1", {
    authorWakieId: "w-muse",
    parts: [{ text: "  Réponse\nlongue   à citer ", type: "text" }],
  });

  it("nomme l'auteur réel et normalise l'extrait", () => {
    expect(citationDe([cible], "m1", NOMS)).toEqual({
      auteur: "Muse",
      extrait: "Réponse longue à citer",
      id: "m1",
    });
  });

  it("dit « Vous » pour un message du compte et « Wakie » sans nom connu", () => {
    expect(
      citationDe([message("m1", { role: "user" })], "m1", NOMS)?.auteur
    ).toBe("Vous");
    expect(
      citationDe([message("m1", { authorWakieId: "w-inconnu" })], "m1", NOMS)
        ?.auteur
    ).toBe("Wakie");
  });

  it("borne l'extrait", () => {
    const long = message("m1", {
      parts: [{ text: "a".repeat(400), type: "text" }],
    });
    expect(citationDe([long], "m1", NOMS, 30)?.extrait).toHaveLength(30);
  });

  it("ne prétend rien quand la cible n'est pas chargée", () => {
    expect(citationDe([cible], "absent", NOMS)).toBeNull();
    expect(citationDe([cible], null, NOMS)).toBeNull();
  });

  it("accepte un extrait vide (message fait de pièces jointes)", () => {
    const pieces = message("m1", {
      parts: [{ mediaType: "image/png", type: "file", url: "blob:x" }],
    });
    expect(citationDe([pieces], "m1", NOMS)?.extrait).toBe("");
  });
});

describe("provenance d'un message transféré", () => {
  it("lit le titre dans la part de transfert", () => {
    const transfere = message("m2", {
      parts: [
        { data: { conversationTitre: "Veille" }, type: "data-wakies-forward" },
        { text: "contenu", type: "text" },
      ],
    });
    expect(provenanceTransfert(transfere)).toEqual({ titre: "Veille" });
  });

  it("rend null pour un message ordinaire", () => {
    expect(provenanceTransfert(message("m3"))).toBeNull();
  });

  it("accepte un titre absent sans inventer de titre", () => {
    const transfere = message("m4", {
      parts: [{ data: {}, type: "data-wakies-forward" }],
    });
    expect(provenanceTransfert(transfere)).toEqual({ titre: "" });
  });
});

describe("séparateurs de jour", () => {
  const midi = new Date("2026-10-10T12:00:00").getTime();
  const hier = new Date("2026-10-09T09:00:00").getTime();
  const avant = new Date("2026-10-01T09:00:00").getTime();

  it("dit « Aujourd'hui », « Hier », puis la date", () => {
    expect(jourLisible(midi, midi)).toBe("Aujourd'hui");
    expect(jourLisible(hier, midi)).toBe("Hier");
    expect(jourLisible(avant, midi)).toContain("2026");
  });

  it("n'ouvre une section que quand le jour change", () => {
    const elements = elementsDeJour(
      [
        message("m1", { createdAt: hier }),
        message("m2", { createdAt: midi }),
        message("m3", { createdAt: midi + 60_000 }),
      ],
      midi
    );
    expect(elements.filter((element) => element.type === "jour")).toHaveLength(
      2
    );
    expect(elements[0]).toMatchObject({ label: "Hier", type: "jour" });
    expect(elements[2]).toMatchObject({ label: "Aujourd'hui", type: "jour" });
  });

  it("ne titre pas une section pour un message sans horodatage", () => {
    const elements = elementsDeJour([message("m1")], midi);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({ type: "message" });
  });
});

describe("curseur de lecture", () => {
  it("prend le plus grand seq réellement chargé", () => {
    expect(
      dernierSeq([
        message("m1", { seq: 4 }),
        message("m2", { seq: 19 }),
        message("m3", { seq: 7 }),
      ])
    ).toBe(19);
  });

  it("rend null quand aucun message ne porte d'ordre d'écriture", () => {
    expect(dernierSeq([message("m1")])).toBeNull();
    expect(dernierSeq([])).toBeNull();
  });

  it("ignore un seq illisible plutôt que de marquer lu à sa place", () => {
    expect(
      dernierSeq([
        message("m1", { seq: 3 }),
        { id: "m2", metadata: { seq: "12" } },
        { id: "m3", metadata: { seq: Number.NaN } },
      ])
    ).toBe(3);
  });
});
