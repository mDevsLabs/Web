import { describe, expect, it } from "vitest";
import { deriveSessionDerogation } from "@/lib/blackline/power";
import {
  addQuickReply,
  DEFAULT_QUICK_REPLIES,
  parseQuickReplies,
  QUICK_REPLIES_MAX,
  removeQuickReply,
} from "@/lib/vibe/services/quickReplies";

/**
 * Deux fonctions pures qui décident d'un comportement visible :
 *
 * - la dérogation Blackline : elle réduit la qualité graphique. Une règle
 *   inversée rendrait un poste fixe branché plus lent qu'un portable à 12 % ;
 * - les réponses rapides : une entrée illisible ne doit pas emporter les
 *   autres, et une réponse supprimée ne doit pas revenir.
 */

describe("dérogation de session Blackline", () => {
  it("force le mode économie sur batterie faible, et le dit", () => {
    const result = deriveSessionDerogation({
      batteryLevel: 0.12,
      charging: false,
      deviceMemoryGb: 16,
      saveData: false,
    });
    expect(result.overrides).toMatchObject({
      adaptive: true,
      batterySaver: true,
    });
    expect(result.severity).toBe("warning");
    expect(result.reason).toContain("12 %");
  });

  it("ne force rien sur un poste branché, même à 5 %", () => {
    const result = deriveSessionDerogation({
      batteryLevel: 0.05,
      charging: true,
      deviceMemoryGb: 16,
      saveData: false,
    });
    expect(result.overrides).toEqual({});
    expect(result.reason).toBeNull();
  });

  it("abaisse la qualité sous 4 Go de mémoire", () => {
    const result = deriveSessionDerogation({
      batteryLevel: null,
      charging: null,
      deviceMemoryGb: 2,
      saveData: false,
    });
    expect(result.overrides.quality).toBe("performance");
  });

  it("ne déroge pas quand aucune API n'est disponible", () => {
    const result = deriveSessionDerogation({
      batteryLevel: null,
      charging: null,
      deviceMemoryGb: null,
      saveData: false,
    });
    expect(result.overrides).toEqual({});
  });
});

describe("réponses rapides Vibe", () => {
  it("écarte une entrée illisible sans perdre les autres", () => {
    const list = parseQuickReplies(
      JSON.stringify([
        { id: "a", text: "Bonjour" },
        { id: "b" },
        { id: "c", text: "   " },
        { html: "<b>Ok</b>", id: "d", label: "Ok", text: "Ok" },
      ])
    );
    expect(list.map((item) => item.id)).toEqual(["a", "d"]);
  });

  it("déduplique sur le texte et place la plus récente en tête", () => {
    const once = addQuickReply([], { html: "Merci !", text: "Merci !" });
    const twice = addQuickReply(once, { html: "Merci !", text: "Merci !" });
    expect(twice).toHaveLength(1);
    expect(twice[0]?.id).not.toBe(once[0]?.id);
  });

  it("plafonne la liste", () => {
    let list: ReturnType<typeof addQuickReply> = [];
    for (let i = 0; i < QUICK_REPLIES_MAX + 5; i++) {
      list = addQuickReply(list, { text: `Réponse ${i}` });
    }
    expect(list).toHaveLength(QUICK_REPLIES_MAX);
  });

  it("oublie une réponse supprimée", () => {
    const list = addQuickReply([], { html: "Ok", text: "Ok" });
    expect(removeQuickReply(list, list[0]!.id)).toHaveLength(0);
  });

  it("propose des amorces dont les identifiants sont stables", () => {
    expect(DEFAULT_QUICK_REPLIES.map((item) => item.id)).toEqual([
      "default-ack",
      "default-thanks",
      "default-later",
    ]);
  });
});
