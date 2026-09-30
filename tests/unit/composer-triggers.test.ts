import { describe, expect, it } from "vitest";
import {
  deactivateMentionToken,
  detectTrigger,
  findMentionTokenAtCursor,
} from "@/components/chat/input/mention-utils";
import { getFilteredMentionItems } from "@/components/chat/mention-menu";
import { getFilteredSlashCommands } from "@/components/chat/slash-commands";

describe("Déclencheurs du composer partagé", () => {
  it("détecte les commandes slash et mentions Unicode sans ouvrir dans les URLs/emails", () => {
    expect(detectTrigger("/mod", 4)).toEqual({
      query: "mod",
      start: 0,
      type: "slash",
    });
    expect(detectTrigger("voir @équipe", "voir @équipe".length)).toEqual({
      query: "équipe",
      start: 5,
      type: "mention",
    });
    expect(detectTrigger("contact@example", 15)).toBeNull();
    expect(detectTrigger("https://example.test", 19)).toBeNull();
  });

  it("retrouve et supprime atomiquement un token multi-mots", () => {
    const text = "Analyse @Open Food Facts ";
    const match = findMentionTokenAtCursor(text, text.length, [
      "Open Food Facts",
    ]);

    expect(match).toEqual({
      end: text.length - 1,
      start: text.indexOf("@"),
      token: "@Open Food Facts",
    });
  });

  it("aligne la liste visible des mentions et exclut les entrées désactivées", () => {
    const items = getFilteredMentionItems(
      "",
      [],
      [],
      [
        { id: "mcp-off", isEnabled: false, name: "MCP désactivé" },
        { id: "mcp-on", isEnabled: true, name: "MCP actif" },
      ] as never,
      [],
      [
        { enabled: false, id: "cmd-off", name: "Commande off", trigger: "off" },
      ] as never,
      []
    );

    // Trois mentions système : web, library, planning. « Notes » a été
    // retirée au profit de « Library », qui menait déjà au même endroit.
    expect(items.filter((item) => item.kind === "system")).toHaveLength(3);
    expect(items.some((item) => item.id === "mcp-off")).toBe(false);
    expect(items.some((item) => item.id === "mcp-on")).toBe(true);
    expect(items.some((item) => item.id === "cmd-off")).toBe(false);
  });

  it("ne casse pas quand un cache SWR contient autre chose qu'un tableau", () => {
    // Enveloppe d'erreur 401 renvoyée par une route BFF : ni `undefined`, donc
    // le `= []` par défaut de SWR ne rattrape rien. C'était ce cas qui faisait
    // lever `filteredSkills.map is not a function` à l'ouverture du menu @.
    const apiErrorPayload = {
      code: "unauthorized",
      message: "Session expirée",
      status: 401,
    };

    const items = getFilteredMentionItems(
      "",
      apiErrorPayload,
      apiErrorPayload,
      null,
      undefined,
      apiErrorPayload,
      apiErrorPayload
    );

    // Le menu reste utilisable : la mémoire et les trois entrées système
    // subsistent, toutes les autres sections sont vides.
    expect(items).toHaveLength(4);
    expect(items.filter((item) => item.kind === "memory")).toHaveLength(1);
    expect(items.filter((item) => item.kind === "system")).toHaveLength(3);
  });

  it("filtre toujours sur une liste valide même avec une requête nonempty", () => {
    const items = getFilteredMentionItems(
      "synth",
      [],
      { code: "internal_error", message: "oups", status: 500 },
      [],
      [],
      [],
      []
    );

    expect(items).toHaveLength(0);
  });

  it("utilise le même filtrage de mode pour les commandes slash Agent", () => {
    const agentCommands = getFilteredSlashCommands(
      "",
      { isHome: true, mode: "agent" },
      []
    );
    const chatCommands = getFilteredSlashCommands(
      "",
      { isHome: true, mode: "chat" },
      []
    );

    // `/model` est désormais traité en mode Agent : le composer Agent a son
    // propre sélecteur, la commande ouvre ce sélecteur.
    expect(agentCommands.some((command) => command.action === "model")).toBe(
      true
    );
    expect(chatCommands.some((command) => command.action === "model")).toBe(
      true
    );

    // En revanche les bascules d'outils one-shot restent propres au Chat :
    // l'Agent choisit lui-même ses outils dans sa boucle.
    for (const action of ["tool-code", "ghost", "quiz"] as const) {
      expect(
        agentCommands.some((command) => command.action === action),
        `${action} ne doit pas être proposé en mode Agent`
      ).toBe(false);
      expect(chatCommands.some((command) => command.action === action)).toBe(
        true
      );
    }
  });

  it("désactive les effets d'un token multi-mots avec la casse insensible", () => {
    const toggled: string[] = [];
    const cleared: string[] = [];

    deactivateMentionToken({
      activeAgent: null,
      activeSkill: null,
      clearActiveAgent: () => cleared.push("agent"),
      clearActiveSkill: () => cleared.push("skill"),
      clearPendingProject: () => cleared.push("project"),
      pendingProject: null,
      pendingTools: ["getOpenFoodProduct"],
      plugins: [
        {
          id: "open-food",
          name: "Open Food Facts",
          tools: [{ id: "getOpenFoodProduct" }],
        } as never,
      ],
      togglePendingTool: (toolId) => toggled.push(toolId),
      token: "@open food facts",
      userMcpServers: [],
    });

    expect(toggled).toEqual(["getOpenFoodProduct"]);
    expect(cleared).toEqual([]);
  });
});
