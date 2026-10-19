import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mentions `@` d'applications connectées dans Wakies.
 *
 * Le cas qui compte n'est pas « la mention fonctionne », c'est « la mention ne
 * fait pas croire » : mentionner Gmail sans compte relié doit produire une
 * raison lisible, pas un appel à l'API qui retomberait en 401 en plein tour.
 */

const store = vi.hoisted(() => ({
  getMcpServersByUserId: vi.fn(),
  getPluginInstallationsByUserId: vi.fn(),
  listActiveConnections: vi.fn(),
  prepareSkillsContext: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  dbReady: vi.fn(async () => undefined),
  getMcpServersByUserId: store.getMcpServersByUserId,
  getPluginInstallationsByUserId: store.getPluginInstallationsByUserId,
}));

vi.mock("@/lib/integrations/repository", () => ({
  listActiveConnections: store.listActiveConnections,
}));

vi.mock("@/lib/chat/skills", () => ({
  prepareSkillsContext: store.prepareSkillsContext,
}));

const { applyIntegrationMentions } = await import("@/lib/wakies/capabilities");

const installation = (pluginId: string, isEnabled = true) => ({
  isEnabled,
  pluginId,
});

async function mentionner(
  noms: string[],
  params: {
    connections?: string[];
    installations?: ReturnType<typeof installation>[];
  } = {}
) {
  store.getPluginInstallationsByUserId.mockResolvedValue(
    params.installations ?? []
  );
  store.listActiveConnections.mockResolvedValue(
    (params.connections ?? []).map((provider) => ({ provider }))
  );
  return await applyIntegrationMentions({
    nomsMentionnes: noms,
    tier: "max",
    userId: "user-1",
  });
}

beforeEach(() => {
  for (const mock of Object.values(store)) {
    mock.mockReset();
  }
  store.getMcpServersByUserId.mockResolvedValue([]);
  store.prepareSkillsContext.mockResolvedValue({
    instructions: "",
    mcpServerIds: [],
    mcpToolFilter: {},
    skillIds: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyIntegrationMentions", () => {
  it("ignore une mention qui n'est pas un connecteur", async () => {
    // Un `@pseudo` de membre Wakie passe par `resoudreMentions`, pas ici :
    // rien ne doit être ajouté au plateau ni signalé.
    const result = await mentionner(["mathias", "wakie-radar"]);
    expect(result).toEqual({ issues: [], pluginIds: [] });
    expect(store.listActiveConnections).not.toHaveBeenCalled();
  });

  it("ajoute le plugin du connecteur connecté et installé", async () => {
    const result = await mentionner(["Google"], {
      connections: ["google"],
      installations: [installation("google")],
    });
    expect(result.pluginIds).toEqual(["google"]);
    expect(result.issues).toEqual([]);
  });

  it("accepte le nom complet comme le jeton de mention, quelle que soit la casse", async () => {
    for (const nom of ["github", "GitHub", "GiThUb"]) {
      const result = await mentionner([nom], {
        connections: ["github"],
        installations: [installation("github")],
      });
      expect(result.pluginIds).toEqual(["github"]);
    }
  });

  it("ignore un libellé qui n'est plus un fournisseur", async () => {
    // `gmail` a été fondu dans le connecteur Google : le mentionner n'est pas
    // demander une application, c'est un mot du message.
    const result = await mentionner(["gmail", "Gmail"], {
      connections: [],
      installations: [installation("google")],
    });
    expect(result).toEqual({ issues: [], pluginIds: [] });
  });

  it("exige une connexion en plus d'une installation", async () => {
    const result = await mentionner(["Google", "@Google"], {
      connections: [],
      installations: [installation("google")],
    });
    expect(result.pluginIds).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.raison).toContain(
      "Connectez Google depuis l'onglet Plugins"
    );
  });

  it("ne demande rien au fournisseur si le plugin n'est pas installé", async () => {
    const result = await mentionner(["GitHub"], {
      connections: ["github"],
      installations: [],
    });
    expect(result.pluginIds).toEqual([]);
    expect(result.issues[0]?.raison).toContain("n'est pas installée");
  });

  it("signale une extension désactivée plutôt que de l'activer en cachette", async () => {
    const result = await mentionner(["GitHub"], {
      connections: ["github"],
      installations: [installation("github", false)],
    });
    expect(result.pluginIds).toEqual([]);
    expect(result.issues[0]?.raison).toContain("désactivée");
  });

  it("déduplique deux mentions du même connecteur dans un même message", async () => {
    const result = await mentionner(["Google", "google", "GOOGLE"], {
      connections: ["google"],
      installations: [installation("google")],
    });
    expect(result.pluginIds).toEqual(["google"]);
  });
});
