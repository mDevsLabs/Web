import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentFlags } from "@/lib/agent/flags";
import {
  AGENT_PLAN_REQUIRED_MESSAGE,
  agentTierFailureResponse,
  checkAgentAccess,
  resolveAgentReasoning,
} from "@/lib/agent/gate";
import type { AgentModelEntry, ModelCapabilities } from "@/lib/ai/registry";
import type { MaiUser } from "@/lib/auth/session";

// Mock de la résolution DB : le gate lui-même lit le tier déjà résolu dans
// ChatAuth (auth.maiUser.tier) — la provenance users.tier est testée dans
// db-users.test.ts et chat-auth.test.ts.
// vi.mock est hissé en tête de fichier : les valeurs référencées dans la
// factory doivent elles-mêmes être hissées (vi.hoisted).
const FLAG_VALUES = vi.hoisted(() => ({
  "agent.approvals": true,
  "agent.artifacts": true,
  "agent.enabled": true,
  "agent.files": true,
  "agent.mcp": false,
  "agent.plugins": true,
  "agent.projects": true,
  "agent.reasoning": false,
  "agent.skills": false,
  "agent.webSearch": true,
}));

vi.mock("@/lib/agent/flags", () => ({
  DEFAULT_AGENT_FLAGS: FLAG_VALUES,
  getAgentFlags: () => FLAG_VALUES,
}));

// Seul l'accès au modèle est simulé (le tier est résolu en base). Le reste du
// registre est réel : resolveAgentReasoning s'appuie sur resolveReasoningEffort
// et normalizeReasoningLevel, qu'un mock factories aurait bouchés — le test
// vérifierait alors le mock et non le comportement.
vi.mock("@/lib/ai/registry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/registry")>()),
  getModelEntry: (
    id: string,
    models?: Array<{
      id: string;
      name?: string;
      supported_parameters?: string[];
    }>
  ) => {
    const found = models?.find((model) => model.id === id);
    const tools = found
      ? (found.supported_parameters ?? []).includes("tools")
      : id !== "poolside/laguna-xs-2.1:free";
    return {
      agentCompatibility: {
        continuationAfterToolResult: tools,
        structuredToolCalls: tools,
        toolDefinitions: tools,
      },
      capabilities: { tools },
      id,
      name: found?.name ?? id,
    };
  },
  isAgentCompatible: (entry: { agentCompatibility: Record<string, boolean> }) =>
    Object.values(entry.agentCompatibility).every(Boolean),
  isModelAllowedForUser: (modelId: string, tier: string) =>
    !(modelId === "premium-model" && tier === "plus"),
}));

function makeAuth(tier: string) {
  const maiUser: MaiUser = {
    email: "user@example.com",
    id: "u-1",
    limit: 1_000_000,
    tier,
    tokensUsed: 0,
    username: "user",
  };
  return { isFreeUser: false, maiUser, sessionToken: "tok", userId: "u-1" };
}

async function responseCode(response: Response): Promise<string> {
  const body = (await response.json()) as { code?: string };
  return body.code ?? "";
}

describe("checkAgentAccess (bug Plus : accès Agent)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("AGENT_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("autorise un utilisateur Plus (le bug historique : Plus refusé)", () => {
    const access = checkAgentAccess(makeAuth("plus"));
    expect(access.allowed).toBe(true);
    if (access.allowed) {
      expect(access.tier).toBe("plus");
    }
  });

  it("autorise Pro et Max", () => {
    expect(checkAgentAccess(makeAuth("pro")).allowed).toBe(true);
    expect(checkAgentAccess(makeAuth("max")).allowed).toBe(true);
  });

  it("tolère la casse de la base (Plus, PRO) car users.tier est déjà canonisé", () => {
    expect(checkAgentAccess(makeAuth("Plus")).allowed).toBe(true);
  });

  it("refuse Free avec plan_required — et non access_denied", async () => {
    const access = checkAgentAccess(makeAuth("free"));
    expect(access.allowed).toBe(false);
    if (!access.allowed) {
      expect(access.response.status).toBe(403);
      const body = (await access.response.json()) as {
        code?: string;
        message?: string;
      };
      expect(body.code).toBe("plan_required");
      expect(body.message).toContain(AGENT_PLAN_REQUIRED_MESSAGE);
    }
  });

  it("refuse le dépassement de quota avec quota_exceeded", async () => {
    const auth = makeAuth("plus");
    auth.maiUser.tokensUsed = auth.maiUser.limit;

    const access = checkAgentAccess(auth);
    expect(access.allowed).toBe(false);
    if (!access.allowed) {
      expect(await responseCode(access.response)).toBe("quota_exceeded");
    }
  });
});

describe("agentTierFailureResponse (tier inexistant/invalide/base)", () => {
  it("produit un plan_required explicite, jamais un privilège implicite", async () => {
    for (const reason of ["missing", "invalid", "unavailable"] as const) {
      const response = agentTierFailureResponse(reason);
      expect(response.status).toBe(403);
      expect(await responseCode(response)).toBe("plan_required");
    }
  });
});

describe("checkAgentModelAccess", () => {
  it("renvoie une erreur (modèle non couvert par le forfait) et non plan_required", async () => {
    const { DEFAULT_AGENT_FLAGS } = await import("@/lib/agent/flags");
    const { checkAgentModelAccess } = await import("@/lib/agent/gate");

    const result = checkAgentModelAccess({
      flags: DEFAULT_AGENT_FLAGS,
      modelId: "premium-model",
      tier: "plus",
    });
    expect(result.error).toBeTruthy();
    expect(result.model).toBe("premium-model");
  });

  it("laisse passer un modèle couvert", async () => {
    const { DEFAULT_AGENT_FLAGS } = await import("@/lib/agent/flags");
    const { checkAgentModelAccess } = await import("@/lib/agent/gate");

    const ok = checkAgentModelAccess({
      flags: DEFAULT_AGENT_FLAGS,
      modelId: "standard-model",
      tier: "plus",
    });
    expect(ok.error).toBeUndefined();
  });

  it("conserve les métadonnées Laguna fournies par le catalogue utilisateur", async () => {
    const { DEFAULT_AGENT_FLAGS } = await import("@/lib/agent/flags");
    const { checkAgentModelAccess } = await import("@/lib/agent/gate");

    const laguna = {
      agentCompatibility: {
        continuationAfterToolResult: true,
        structuredToolCalls: true,
        toolDefinitions: true,
      },
      capabilities: {
        audio: false,
        contextWindow: 32_000,
        documents: false,
        file: false,
        image: false,
        images: false,
        maxFiles: 0,
        reasoning: false,
        reasoningDefault: null,
        reasoningLevels: [],
        reasoningMandatory: false,
        tools: true,
        vision: false,
      },
      description: "Modèle Laguna",
      id: "poolside/laguna-xs-2.1:free",
      isFree: true,
      name: "Laguna XS 2.1 (Free)",
      provider: "poolside",
      reasoningLevels: [],
      tierAccess: { minimumTier: "free" },
    } as unknown as AgentModelEntry;

    const result = checkAgentModelAccess({
      entry: laguna,
      flags: DEFAULT_AGENT_FLAGS,
      modelId: laguna.id,
      tier: "plus",
    });

    expect(result.error).toBeUndefined();
    expect(result.model).toBe("poolside/laguna-xs-2.1:free");
    expect(result.capabilities.tools).toBe(true);
  });

  it("utilise le catalogue transmis quand l'entrée complète n'est pas encore fournie", async () => {
    const { DEFAULT_AGENT_FLAGS } = await import("@/lib/agent/flags");
    const { checkAgentModelAccess } = await import("@/lib/agent/gate");

    const result = checkAgentModelAccess({
      flags: DEFAULT_AGENT_FLAGS,
      modelId: "poolside/laguna-xs-2.1:free",
      models: [
        {
          description: "Laguna XS 2.1",
          id: "poolside/laguna-xs-2.1:free",
          isFree: true,
          name: "Laguna XS 2.1",
          provider: "poolside",
          supported_parameters: ["tools"],
        },
      ],
      tier: "plus",
    });

    expect(result.error).toBeUndefined();
  });
});
describe("L'effort transmis à l'Agent", () => {
  const SPACE_BUNNY = {
    audio: false,
    contextWindow: 1_000_000,
    documents: false,
    file: false,
    image: false,
    images: false,
    maxFiles: 0,
    reasoning: true,
    reasoningDefault: "max",
    reasoningLevels: ["max", "xhigh", "high", "medium", "low"],
    reasoningMandatory: true,
    tools: true,
    vision: false,
  } as unknown as ModelCapabilities;

  const MAI_2 = {
    ...SPACE_BUNNY,
    reasoningDefault: "high",
    reasoningLevels: ["max", "high", "low"],
    reasoningMandatory: false,
  } as unknown as ModelCapabilities;

  // mAI-2-Mini : raisonne mais n'expose aucun niveau.
  const MAI_2_MINI = {
    ...SPACE_BUNNY,
    reasoningDefault: null,
    reasoningLevels: [],
  } as unknown as ModelCapabilities;

  const enabledFlags = { "agent.reasoning": true } as AgentFlags;
  const disabledFlags = { "agent.reasoning": false } as AgentFlags;

  it("enregistre l'intention et transmet le niveau demandé", () => {
    const result = resolveAgentReasoning({
      capabilities: SPACE_BUNNY,
      fallback: "medium",
      flags: enabledFlags,
      requested: "high",
    });
    expect(result.requested).toBe("high");
    expect(result.effort).toBe("high");
  });

  it("accepte les sept niveaux, pas seulement le triplet historique", () => {
    for (const level of [
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
      "minimal",
      "none",
    ] as const) {
      const result = resolveAgentReasoning({
        capabilities: {
          ...SPACE_BUNNY,
          reasoningLevels: [level],
        } as unknown as ModelCapabilities,
        fallback: "medium",
        flags: enabledFlags,
        requested: level,
      });
      expect(result.effort).toBe(level);
    }
  });

  it("enregistre l'intention mais recale l'effort sur les niveaux du modèle", () => {
    // L'utilisateur a choisi « xhigh » ; mAI-2 ne le propose pas.
    const result = resolveAgentReasoning({
      capabilities: MAI_2,
      fallback: "medium",
      flags: enabledFlags,
      requested: "xhigh",
    });
    // L'intention reste celle de l'utilisateur, c'est elle qu'on affiche.
    expect(result.requested).toBe("xhigh");
    // L'effort transmis est un niveau que mAI-2 accepte.
    expect(result.effort).toBe("high");
  });

  it("n'envoie rien sur un modèle qui n'expose aucun niveau", () => {
    const result = resolveAgentReasoning({
      capabilities: MAI_2_MINI,
      fallback: "medium",
      flags: enabledFlags,
      requested: "high",
    });
    expect(result.requested).toBe("high");
    expect(result.effort).toBeNull();
  });

  it("n'envoie rien quand le sélecteur est coupé, sans perdre l'intention", () => {
    // Le flag coupe la molette, il ne doit pas réécrire ce que l'utilisateur a
    // choisi : le réglage doit survivre à une réactivation du flag.
    const result = resolveAgentReasoning({
      capabilities: SPACE_BUNNY,
      fallback: "medium",
      flags: disabledFlags,
      requested: "max",
    });
    expect(result.effort).toBeNull();
    expect(result.requested).toBe("max");
  });

  it("retombe sur le réglage Agent quand la requête n'en porte pas", () => {
    const result = resolveAgentReasoning({
      capabilities: SPACE_BUNNY,
      fallback: "low",
      flags: enabledFlags,
      requested: undefined,
    });
    expect(result.effort).toBe("low");
  });

  it("ne laisse passer ni valeur illisible ni niveau hors nomenclature", () => {
    for (const requested of ["turbo", "", 42, null, {}]) {
      const result = resolveAgentReasoning({
        capabilities: SPACE_BUNNY,
        fallback: "medium",
        flags: enabledFlags,
        requested,
      });
      expect(result.requested).toBe("medium");
    }
  });
});
