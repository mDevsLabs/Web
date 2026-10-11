import { describe, expect, it } from "vitest";
import {
  analyserMentions,
  MENTIONS_MAX_PAR_MESSAGE,
} from "@/lib/wakies/shared/mentions";
import { parseMentions } from "@/lib/wakies/slash";

/**
 * Analyse des mentions `@` et `@@` du composer Wakies.
 *
 * Le garde-fou qui compte ici n'est pas « la mention est lue », c'est que
 * `@@` NE PASSE JAMAIS dans le chemin des répondants. `parseMentions` désigne
 * les membres du fil ; `analyserMentions` désigne capacités et documents. Un
 * `@@gmail` qui serait lu par le premier rendrait un plugin « nommé » comme
 * s'il était un participant — et un `@muse` qui passerait dans le second
 * activerait un outil par accident.
 */

describe("analyserMentions", () => {
  it("sépare le tour courant du réglage durable", () => {
    const analyse = analyserMentions("fais ça avec @qdrant et @@gmail");
    expect(analyse.tourCourant).toEqual(["qdrant"]);
    expect(analyse.persistants).toEqual(["gmail"]);
    expect(analyse.depassements).toBe(0);
  });

  it("lit une mention en début et en fin de message", () => {
    expect(analyserMentions("@webSearch résume").tourCourant).toEqual([
      "websearch",
    ]);
    expect(analyserMentions("ajoute @webSearch").tourCourant).toEqual([
      "websearch",
    ]);
  });

  it("ignore un `@` collé à un mot : une adresse email n'est pas une mention", () => {
    expect(analyserMentions("écris à contact@example.com").tourCourant).toEqual(
      []
    );
  });

  it("ne mange pas la ponctuation qui suit le jeton", () => {
    expect(analyserMentions("avec @gmail.").tourCourant).toEqual(["gmail"]);
    expect(analyserMentions("avec @gmail, @qdrant !").tourCourant).toEqual([
      "gmail",
      "qdrant",
    ]);
  });

  it("garde la forme citée pour les noms à espaces", () => {
    const analyse = analyserMentions('relis @"Compte rendu mensuel"');
    expect(analyse.tourCourant).toEqual(["compte rendu mensuel"]);
    expect(analyse.citations).toEqual(['@"compte rendu mensuel"']);
  });

  it("ignore @all : un fil n'a qu'un répondant", () => {
    const analyse = analyserMentions("@all réagissez");
    expect(analyse.tourCourant).toEqual([]);
    expect(analyse.persistants).toEqual([]);
  });

  it("déduit une seule fois le même jeton et borne à cinq mentions", () => {
    const cinq = "@un @deux @trois @quatre @cinq @six";
    const analyse = analyserMentions(cinq);
    expect(analyse.tourCourant).toHaveLength(MENTIONS_MAX_PAR_MESSAGE);
    expect(analyse.depassements).toBe(1);
    expect(analyserMentions("@gmail @gmail").tourCourant).toEqual(["gmail"]);
  });

  it("n'invente rien sur un texte sans mention", () => {
    expect(analyserMentions("aucune mention ici")).toEqual({
      citations: [],
      depassements: 0,
      persistants: [],
      tourCourant: [],
    });
  });
});

describe("garde de séparation avec parseMentions", () => {
  it("@@ n'atteint jamais la résolution de membres", () => {
    // Si cette assertion tombe, un réglage durable désignera un répondant.
    expect(parseMentions("@@gmail")).toEqual([]);
    expect(parseMentions("@@ muse")).toEqual([]);
  });

  it("le `@` simple garde son sens de nomination", () => {
    expect(parseMentions("interroge @muse")).toEqual(["muse"]);
    expect(analyserMentions("interroge @muse").tourCourant).toEqual(["muse"]);
  });
});
