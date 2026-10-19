import { describe, expect, it } from "vitest";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
import {
  extraitContexteMention,
  extraitPersonaPublique,
  normaliserHandle,
} from "@/lib/wakies/queries";
import { parseMentions, parseSlashCommand } from "@/lib/wakies/slash";

describe("profils sociaux Wakies", () => {
  it("normalise les pseudos publics", () => {
    expect(normaliserHandle("@Mon_Wakie")).toBe("mon_wakie");
    expect(normaliserHandle("ab")).toBeNull();
    expect(normaliserHandle("pseudo invalide!")).toBeNull();
    expect(normaliserHandle("")).toBeNull();
  });

  it("n'expose jamais les instructions privées d'un autre compte", () => {
    // Le cas qui compte : un Wakie AMI rendu public. Sa persona publiée peut
    // sortir, ses instructions privées jamais — même quand la persona est vide
    // (repli sur la bio, puis rien).
    expect(
      extraitContexteMention({
        bio: "Je trie les idées.",
        instructions: "SECRET_INSTRUCTIONS_du_proprietaire",
        mien: false,
        publicPersona: "Je publie des notes courtes.",
      })
    ).toBe("Je publie des notes courtes.");
    expect(
      extraitContexteMention({
        bio: "Je trie les idées.",
        instructions: "SECRET_INSTRUCTIONS_du_proprietaire",
        mien: false,
        publicPersona: "",
      })
    ).toBe("Je trie les idées.");
    expect(
      extraitContexteMention({
        bio: "",
        instructions: "SECRET_INSTRUCTIONS_du_proprietaire",
        mien: false,
        publicPersona: "",
      })
    ).toBe("");
  });

  it("un Wakie possédé peut s'appuyer sur ses propres instructions", () => {
    expect(
      extraitContexteMention({
        bio: "",
        instructions: "Mon prompt privé, à moi.",
        mien: true,
        publicPersona: "",
      })
    ).toBe("Mon prompt privé, à moi.");
  });

  it("borne l'extrait de persona publiée", () => {
    expect(extraitPersonaPublique({ publicPersona: "abc" }, 2)).toBe("ab");
    expect(extraitPersonaPublique({ publicPersona: "  x  " })).toBe("x");
    expect(extraitPersonaPublique({})).toBe("");
  });

  it("borne la galerie par forfait (10/50/illimité)", () => {
    expect(getWakiesQuota("plus", "wakieProfileImages")).toBe(10);
    expect(getWakiesQuota("pro", "wakieProfileImages")).toBe(50);
    expect(getWakiesQuota("max", "wakieProfileImages")).toBeNull();
    expect(getWakiesQuota("free", "wakieProfileImages")).toBe(0);
    expect(getWakiesQuota("inconnu", "wakieProfileImages")).toBe(0);
  });

  it("détecte les /slash en tête de message", () => {
    expect(parseSlashCommand("/recherche un article")).toEqual({
      commande: "recherche",
      reste: "un article",
    });
    expect(parseSlashCommand("  /aide")).toEqual({
      commande: "aide",
      reste: "",
    });
    expect(parseSlashCommand("bonjour /aide")).toBeNull();
    expect(parseSlashCommand("simple texte")).toBeNull();
  });

  it("extrait les @mentions (max 5)", () => {
    expect(parseMentions("bonjour @marie et @paul_92")).toEqual([
      "marie",
      "paul_92",
    ]);
    expect(parseMentions('@"Mon Wakie" aide-moi')).toEqual(["mon wakie"]);
    expect(parseMentions("sans mention")).toEqual([]);
  });
});
