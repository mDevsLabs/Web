import { describe, expect, it } from "vitest";
import type { ChatModel } from "@/lib/ai/models";
import {
  getMemoizedCapabilities,
  resetCapabilitiesCache,
  resolveReasoningEffort,
} from "@/lib/ai/registry/capabilities";
import {
  REASONING_LEVELS,
  resolveReasoningProviderOptions,
} from "@/lib/ai/registry/reasoning";

// La liste des niveaux d'effort n'est écrite nulle part dans l'application :
// elle est lue dans le catalogue (GET /v1/models → reasoning.supported_efforts).
// Ces tests figent le comportement face à des formes réelles du catalogue, pour
// qu'un changement d'API soit visible ici plutôt que dans l'interface.

// Formes relevées sur GET https://openrouter.ai/api/v1/models (458 modèles).
const SPACE_BUNNY = {
  id: "stealth/space-bunny-alpha",
  name: "Space Bunny Alpha",
  provider: "stealth",
  reasoning: {
    default_effort: "max",
    mandatory: true,
    supported_efforts: ["max", "xhigh", "high", "medium", "low"],
  },
  supported_parameters: ["include_reasoning", "reasoning", "reasoning_effort"],
} as unknown as ChatModel;

// Alias mAI-2 : trois niveaux, dont deux qu'aucun autre modèle ne propose.
const MAI_2 = {
  id: "mai-2",
  name: "mAI-2",
  provider: "mDevsLabs",
  reasoning: {
    default_effort: "high",
    default_enabled: true,
    mandatory: false,
    supported_efforts: ["max", "high", "low"],
  },
  supported_parameters: ["reasoning"],
} as unknown as ChatModel;

// Alias mAI-2-Mini : raisonne, mais n'expose AUCUN niveau. C'est le cas qui
// justifie de ne jamais garnir une liste de niveaux par défaut.
const MAI_2_MINI = {
  id: "mai-2-mini",
  name: "mAI-2-Mini",
  provider: "mDevsLabs",
  reasoning: { mandatory: false },
  supported_parameters: ["reasoning"],
} as unknown as ChatModel;

const PLAIN = {
  id: "google/gemini-2.5-flash:free",
  name: "Gemini 2.5 Flash",
  provider: "google",
  reasoning: null,
  supported_parameters: ["temperature", "tools"],
} as unknown as ChatModel;

function capabilitiesOf(model: ChatModel) {
  resetCapabilitiesCache();
  return getMemoizedCapabilities(model);
}

describe("Les niveaux d'effort viennent du catalogue, jamais d'une liste en dur", () => {
  it("expose exactement les niveaux déclarés par le fournisseur", () => {
    expect(capabilitiesOf(SPACE_BUNNY).reasoningLevels).toEqual([
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
    ]);
    expect(capabilitiesOf(MAI_2).reasoningLevels).toEqual([
      "max",
      "high",
      "low",
    ]);
  });

  it("laisse la liste vide quand le modèle raisonne sans exposer de niveaux", () => {
    const caps = capabilitiesOf(MAI_2_MINI);
    // Le modèle raisonne bel et bien…
    expect(caps.reasoning).toBe(true);
    // …mais inventer des niveaux le ferait échouer à chaque requête.
    expect(caps.reasoningLevels).toEqual([]);
    expect(caps.reasoningDefault).toBeNull();
  });

  it("ignore les niveaux que le vocabulaire partagé ne connaît pas", () => {
    // Si un fournisseur ajoute un niveau inattendu, il ne doit pas fuiter dans
    // l'interface : le provider AI SDK le refuserait dans la requête.
    const caps = capabilitiesOf({
      ...MAI_2,
      reasoning: { supported_efforts: ["high", "turbo", "low"] },
    } as unknown as ChatModel);
    expect(caps.reasoningLevels).toEqual(["high", "low"]);
  });

  it("reporte le caractère obligatoire et le niveau par défaut", () => {
    const bunny = capabilitiesOf(SPACE_BUNNY);
    expect(bunny.reasoningMandatory).toBe(true);
    expect(bunny.reasoningDefault).toBe("max");

    const mai2 = capabilitiesOf(MAI_2);
    expect(mai2.reasoningMandatory).toBe(false);
    expect(mai2.reasoningDefault).toBe("high");
  });

  it("ne déclare aucune réflexion pour un modèle qui n'en a pas", () => {
    const caps = capabilitiesOf(PLAIN);
    expect(caps.reasoning).toBe(false);
    expect(caps.reasoningLevels).toEqual([]);
  });

  it("reconnaît la réflexion déclarée par supported_parameters seul", () => {
    // Repli pour les entrées de catalogue qui ne portent pas encore l'objet
    // `reasoning` : `reasoning_effort` et `include_reasoning` comptent aussi.
    const caps = capabilitiesOf({
      id: "vendor/legacy-reasoner",
      name: "Legacy",
      provider: "vendor",
      supported_parameters: ["reasoning_effort"],
    } as unknown as ChatModel);
    expect(caps.reasoning).toBe(true);
  });

  it("invalide le cache quand les niveaux d'un même modèle changent", () => {
    // Sans `reasoning` dans la clé de cache, un modèle qui gagne un niveau
    // garderait ses anciennes capacités jusqu'au redémarrage du process.
    const before = getMemoizedCapabilities({
      id: "vendor/shifting",
      name: "Shifting",
      provider: "vendor",
      reasoning: { supported_efforts: ["low"] },
    } as unknown as ChatModel);
    const after = getMemoizedCapabilities({
      id: "vendor/shifting",
      name: "Shifting",
      provider: "vendor",
      reasoning: { supported_efforts: ["max", "high", "low"] },
    } as unknown as ChatModel);

    expect(before.reasoningLevels).toEqual(["low"]);
    expect(after.reasoningLevels).toEqual(["max", "high", "low"]);
  });
});

describe("Une préférence se recale sur ce que le modèle sait faire", () => {
  const bunny = capabilitiesOf(SPACE_BUNNY);
  const mai2 = capabilitiesOf(MAI_2);
  const mini = capabilitiesOf(MAI_2_MINI);
  const plain = capabilitiesOf(PLAIN);

  it("honore la préférence quand le modèle l'accepte", () => {
    expect(
      resolveReasoningEffort({ capabilities: bunny, preferred: "high" })
    ).toEqual({ effort: "high", exact: true, reason: "exact" });
  });

  it("retombe sur le niveau du fournisseur si la préférence n'existe pas", () => {
    // « xhigh » et « medium » n'existent pas sur mAI-2 (max/high/low).
    const resolution = resolveReasoningEffort({
      capabilities: mai2,
      preferred: "xhigh",
    });
    expect(resolution.effort).toBe("high");
    expect(resolution.exact).toBe(false);
    expect(resolution.reason).toBe("not_supported");
  });

  it("ne propose rien sur un modèle qui raisonne sans niveaux", () => {
    expect(
      resolveReasoningEffort({ capabilities: mini, preferred: "high" })
    ).toEqual({ effort: null, exact: false, reason: "no_levels" });
  });

  it("ne propose rien sur un modèle sans réflexion", () => {
    expect(
      resolveReasoningEffort({ capabilities: plain, preferred: "high" })
    ).toEqual({ effort: null, exact: false, reason: "capability_unknown" });
  });

  it("suit le niveau par défaut du fournisseur quand la préférence manque", () => {
    // « xhigh » et « medium » n'existent pas sur mAI-2 (max/high/low). Le
    // fournisseur déclare `high` comme son propre défaut : c'est son jugement
    // sur l'équilibre de ce modèle, donc plus fiable que notre heuristique.
    // Relevé sur le catalogue réel : les 186 modèles qui exposent
    // `supported_efforts` exposent tous un `default_effort`, et il appartient
    // toujours à leur propre liste. Cette branche est donc la seule atteinte
    // en production.
    for (const preferred of ["xhigh", "medium"]) {
      const resolution = resolveReasoningEffort({
        capabilities: mai2,
        preferred,
      });
      expect(resolution.effort).toBe("high");
      expect(resolution.exact).toBe(false);
      expect(resolution.reason).toBe("not_supported");
    }
  });

  it("retombe sur le niveau inférieur le plus proche si le fournisseur n'en indique pas", () => {
    // Branche défensive : aucun modèle du catalogue n'est dans ce cas, mais un
    // fournisseur qui omet `default_effort` ne doit pas se retrouver sans
    // niveau. On descend d'un cran plutôt que de monter — élever le niveau
    // gonflerait la facture de l'utilisateur sans qu'il l'ait demandé.
    const sansDefaut = capabilitiesOf({
      ...MAI_2,
      reasoning: { supported_efforts: ["max", "high", "low"] },
    } as unknown as ChatModel);

    expect(
      resolveReasoningEffort({ capabilities: sansDefaut, preferred: "medium" })
        .effort
    ).toBe("low");
    expect(
      resolveReasoningEffort({ capabilities: sansDefaut, preferred: "xhigh" })
        .effort
    ).toBe("high");
  });

  it("sait remonter quand il n'existe rien en dessous", () => {
    const sansDefaut = capabilitiesOf({
      ...MAI_2,
      reasoning: { supported_efforts: ["max", "high", "low"] },
    } as unknown as ChatModel);

    // « minimal » et « none » n'ont rien en dessous dans la liste du modèle. Le
    // repli doit alors être le niveau le MOINS cher (« low »), pas le premier
    // de la liste qui vaut « max » : depuis « minimal », atterrir sur « max »
    // triplerait la facture de l'utilisateur.
    expect(
      resolveReasoningEffort({ capabilities: sansDefaut, preferred: "minimal" })
        .effort
    ).toBe("low");
    expect(
      resolveReasoningEffort({ capabilities: sansDefaut, preferred: "none" })
        .effort
    ).toBe("low");
  });

  it("ignore une préférence corrompue et suit le défaut du fournisseur", () => {
    for (const preferred of [undefined, null, "", "turbo", 42, {}]) {
      expect(
        resolveReasoningEffort({ capabilities: bunny, preferred }).effort
      ).toBe("max");
    }
  });

  it("donne le même effort final pour une même intention, quel que soit le modèle", () => {
    // Le cas d'usage central : l'utilisateur a choisi « élevée », il change de
    // modèle, la requête doit rester aussi forte que le modèle le permet.
    const surBunny = resolveReasoningEffort({
      capabilities: bunny,
      preferred: "high",
    });
    const surMai2 = resolveReasoningEffort({
      capabilities: mai2,
      preferred: "high",
    });
    expect(surBunny.effort).toBe("high");
    expect(surMai2.effort).toBe("high");
  });
});

describe("L'effort transmis au fournisseur", () => {
  it("couvre les sept niveaux de l'API unifiée", () => {
    // L'API OpenRouter accepte exactement ces valeurs, ni plus ni moins.
    expect(REASONING_LEVELS).toEqual([
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
      "minimal",
      "none",
    ]);
  });

  it("passe par reasoningEffort, que le proxy traduira en reasoning.effort", () => {
    for (const level of REASONING_LEVELS) {
      expect(resolveReasoningProviderOptions(level)).toEqual({
        openai: { reasoningEffort: level },
      });
    }
  });
});
