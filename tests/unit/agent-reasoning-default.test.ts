import { describe, expect, it } from "vitest";
import { agentRequestBodySchema } from "@/app/(chat)/api/agent/schema";
import { DEFAULT_AGENT_FLAGS } from "@/lib/agent/flags";
import { resolveAgentReasoning } from "@/lib/agent/gate";
import type { ChatModel } from "@/lib/ai/models";
import { deriveModelCapabilities } from "@/lib/ai/registry/capabilities";

// Régression : le niveau de réflexion du compte n'était jamais lu.
//
// Le serveur était correct — `requested ?? fallback` — mais le composer
// envoyait toujours une valeur, en dur à « medium ». Le repli sur
// `AgentSettings.reasoningLevel` était donc du code mort : régler « Réflexion »
// dans /settings/agent n'avait aucun effet sur les runs Agent.
//
// Ces tests verrouillent le contrat de bout en bout : ce qui compte n'est pas
// que `resolveAgentReasoning` sache lire un repli (il le savait déjà), mais que
// le corps d'une requête sans choix explicite arrive jusqu'à lui SANS niveau.

const base = {
  id: "0f9a1a5e-3a1f-4a1e-9a1e-1a1e1a1e1a1e",
  message: {
    id: "1a1e1a1e-3a1f-4a1e-9a1e-1a1e1a1e1a1e",
    parts: [{ text: "Fais un plan de lancement", type: "text" }],
    role: "user",
  },
  modelId: "stealth/space-bunny-alpha",
};

// Les capacités sont dérivées d'un modèle du catalogue plutôt qu'écrites à la
// main : la forme du vrai payload est alors la seule mise en œuvre possible, et
// un champ ajouté à `ModelCapabilities` ne peut pas casser ce test.
function capabilitiesOf(supportedEfforts: string[], defaultEffort: string) {
  return deriveModelCapabilities({
    id: "stealth/space-bunny-alpha",
    name: "Space Bunny Alpha",
    provider: "stealth",
    reasoning: {
      default_effort: defaultEffort,
      supported_efforts: supportedEfforts,
    },
    supported_parameters: ["reasoning_effort"],
  } as unknown as ChatModel);
}

const FIVE_LEVELS = capabilitiesOf(
  ["max", "xhigh", "high", "medium", "low"],
  "max"
);
const THREE_LEVELS = capabilitiesOf(["max", "high", "low"], "");

describe("Le niveau de réflexion du compte atteint le modèle", () => {
  it("accepte un corps sans niveau — c'est le chemin normal", () => {
    const parsed = agentRequestBodySchema.parse(base);
    expect(parsed.reasoningLevel).toBeUndefined();

    // Et ce corps sans niveau est bien recadé sur le réglage du compte.
    const result = resolveAgentReasoning({
      capabilities: FIVE_LEVELS,
      fallback: "low",
      flags: DEFAULT_AGENT_FLAGS,
      requested: parsed.reasoningLevel,
    });
    expect(result.requested).toBe("low");
    expect(result.effort).toBe("low");
  });

  it("refuse `null` plutôt que de retomber en silence sur un défaut", () => {
    // `JSON.stringify` supprime une clé `undefined` mais conserve un `null` :
    // c'est ce contrat qui rend l'omission de la clé signifiante. Un `null`
    // renvoyé par erreur doit échouer bruyamment, pas être pris pour « aucun
    // choix ».
    expect(() =>
      agentRequestBodySchema.parse({ ...base, reasoningLevel: null })
    ).toThrow();
  });

  it("conserve le choix explicite de la session quand il y en a un", () => {
    const parsed = agentRequestBodySchema.parse({
      ...base,
      reasoningLevel: "max",
    });
    expect(parsed.reasoningLevel).toBe("max");

    const result = resolveAgentReasoning({
      capabilities: FIVE_LEVELS,
      // Le compte est sur « low » : un choix de session doit l'emporter.
      fallback: "low",
      flags: DEFAULT_AGENT_FLAGS,
      requested: parsed.reasoningLevel,
    });
    expect(result.requested).toBe("max");
    expect(result.effort).toBe("max");
  });

  it("recadre le niveau du compte sur ce que le modèle sait faire", () => {
    // Le compte demande « xhigh », le modèle n'en connaît que trois : le
    // recadrage doit rester visible, et ne jamais inventer un niveau absent.
    const result = resolveAgentReasoning({
      capabilities: THREE_LEVELS,
      fallback: "xhigh",
      flags: DEFAULT_AGENT_FLAGS,
      requested: undefined,
    });
    expect(result.requested).toBe("xhigh");
    expect(result.effort).toBe("high");
  });
});
