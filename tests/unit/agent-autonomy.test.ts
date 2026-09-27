import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AGENT_FLAGS, getAgentFlags } from "@/lib/agent/flags";
import { loadAgentSettings, saveAgentSettings } from "@/lib/agent/settings";

// L'autonomie (« Prudente / Standard / Élevée ») a été retirée de l'interface.
// Ce que ces tests verrouillent, c'est le point délicat de ce retrait : la
// colonne est CONSERVÉE, pour l'historique des runs et des tâches planifiées.
//
// Le risque n'était donc pas une régression d'affichage, mais un compte qui
// garderait silencieusement « high » en base : l'interface ne propose plus rien,
// l'utilisateur ne peut ni le voir ni le révoquer, et l'Agent s'accorde plus de
// droits que l'interface ne dit pas.

// `getAgentSettingsRow` est simulé : on veut tester la normalisation, pas la SQL.
const rows: Record<string, Record<string, unknown>> = {};

vi.mock("@/lib/db/agent-queries", () => ({
  getAgentSettingsRow: async ({ userId }: { userId: string }) =>
    rows[userId] ?? null,
  upsertAgentSettingsRow: async ({
    patch,
    userId,
  }: {
    patch: Record<string, unknown>;
    userId: string;
  }) => {
    rows[userId] = { ...(rows[userId] ?? { userId }), ...patch };
  },
}));

function seed(userId: string, values: Record<string, unknown>) {
  rows[userId] = { userId, ...values };
}

describe("L'autonomie n'est plus un réglage", () => {
  it("relit toujours « standard », même si la ligne contient autre chose", async () => {
    for (const stored of ["careful", "high", "standard", null, undefined, 42]) {
      seed("user-high", { autonomy: stored });
      const settings = await loadAgentSettings({ userId: "user-high" });
      expect(
        settings.autonomy,
        `une ligne contenant ${String(stored)} ne doit jamais rendre plus de droits`
      ).toBe("standard");
    }
  });

  it("ne réécrit pas la colonne : l'historique reste exact", async () => {
    seed("user-history", { autonomy: "high", toolPolicies: {} });
    await saveAgentSettings({
      patch: { reasoningLevel: "max" },
      userId: "user-history",
    });

    // La valeur d'origine est intacte — un run passé reste attribuable au
    // réglage avec lequel il a réellement été exécuté.
    expect(rows["user-history"].autonomy).toBe("high");
    expect(rows["user-history"].reasoningLevel).toBe("max");
  });

  it("la valeur effective reste « standard » après enregistrement", async () => {
    seed("user-fresh", { autonomy: "careful" });
    await saveAgentSettings({
      patch: { defaultProjectId: null },
      userId: "user-fresh",
    });
    const settings = await loadAgentSettings({ userId: "user-fresh" });
    expect(settings.autonomy).toBe("standard");
  });

  it("utilise « standard » en l'absence de ligne", async () => {
    delete rows["user-absent"];
    const settings = await loadAgentSettings({ userId: "user-absent" });
    expect(settings.autonomy).toBe("standard");
  });
});

describe("Les outils Alpha sont disponibles par défaut", () => {
  // Un flag ne décide pas des droits : il borne ce que l'interface PROPOSE.
  // Sans sélection de catégories, Agent choisit lui-même dans sa boucle. Les
  // laisser à `false` faisait announce « MCP » et « Skills » comme
  // indisponibles alors que le code les supporte.
  it("MCP, Skills et réflexion sont activés", () => {
    expect(DEFAULT_AGENT_FLAGS["agent.mcp"]).toBe(true);
    expect(DEFAULT_AGENT_FLAGS["agent.skills"]).toBe(true);
    expect(DEFAULT_AGENT_FLAGS["agent.reasoning"]).toBe(true);
  });

  it("garde un interrupteur global pour couper l'espace Agent", () => {
    // `agent.enabled` à false doit rester possible : c'est le seul levier
    // d'urgence, sans redéploiement.
    expect(DEFAULT_AGENT_FLAGS["agent.enabled"]).toBe(true);
  });

  it("ne laisse activé que ce qui est utile au travail", () => {
    const disabled = Object.entries(DEFAULT_AGENT_FLAGS)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    expect(disabled.sort()).toEqual([
      "agent.activity",
      "agent.approvalPreview",
      "agent.guidedResume",
      "agent.scheduleHistory",
    ]);
  });

  it("l'environnement peut toujours surcharger un flag", () => {
    const restored = process.env.AGENT_MCP;
    process.env.AGENT_MCP = "false";
    try {
      expect(getAgentFlags()["agent.mcp"]).toBe(false);
    } finally {
      if (restored === undefined) {
        process.env.AGENT_MCP = undefined;
      } else {
        process.env.AGENT_MCP = restored;
      }
    }
  });
});
