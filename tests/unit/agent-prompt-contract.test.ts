import { describe, expect, it } from "vitest";
import type { AgentPlan } from "@/lib/agent/types";
import { buildAgentSystemPrompt } from "@/lib/prompts/agent";
import type { PromptCapabilities } from "@/lib/prompts/capabilities";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";
import { PERSONAL_HEADER } from "@/lib/prompts/personal";

// Le prompt système ne doit annoncer QUE ce que la requête permet. Ces tests
// verrouillent les deux propriétés qui comptent : une capacité absente ne
// produit AUCUNE section, et les consignes personnelles arrivent toujours en
// dernier, délimitées.

const TASKS_TOOL = {
  description: "Structure un plan de travail réel.",
  id: "tasks",
  kind: "native" as const,
  label: "Planifier les tâches",
};
const MEMORY_TOOL = {
  description: "Gère la mémoire de l'utilisateur.",
  id: "manage_memory",
  kind: "native" as const,
  label: "Gérer la mémoire",
};
const SEARCH_TOOL = {
  description: "Recherche des informations à jour sur le Web.",
  id: "search_web",
  kind: "native" as const,
  label: "Recherche Web",
};

const PLAN = {
  items: [
    { id: "plan-1", label: "Collecter les sources", status: "pending" },
    { id: "plan-2", label: "Rédiger la synthèse", status: "pending" },
  ],
  title: "Plan de travail",
} as unknown as AgentPlan;

function caps(overrides: Partial<PromptCapabilities> = {}): PromptCapabilities {
  return {
    attachments: 0,
    memory: null,
    plan: null,
    reasoning: false,
    tools: [],
    toolsSupported: true,
    ...overrides,
  };
}

const AGENT_BASE = {
  assistantInstructions: null,
  autonomy: "standard" as const,
  capabilities: caps(),
  chatInstructions: null,
  projectInstructions: null,
  requestHints: null,
  skillInstructions: null,
  userInstructions: null,
};

describe("Agent — le prompt suit les capacités réelles", () => {
  it("n'annonce aucun outil pour un modèle qui ne sait pas les appeler", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        tools: [TASKS_TOOL, SEARCH_TOOL],
        toolsSupported: false,
      }),
    });
    expect(prompt).toContain("Tu n'as aucun outil");
    expect(prompt).not.toContain("search_web");
    expect(prompt).not.toContain("Planifier les tâches");
  });

  it("liste les outils du plateau, avec leur identifiant exact", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [SEARCH_TOOL] }),
    });
    expect(prompt).toContain("OUTILS DISPONIBLES");
    expect(prompt).toContain("search_web");
    expect(prompt).toContain(SEARCH_TOOL.description);
  });

  it("signale l'absence d'outil quand le modèle en accepte mais qu'aucun n'est activé", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [], toolsSupported: true }),
    });
    expect(prompt).toContain("Tu n'as aucun outil");
    expect(prompt).not.toContain("OUTILS DISPONIBLES");
  });

  it("n'a aucune section outil ni tâche quand le plateau est vide", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [], toolsSupported: false }),
    });
    expect(prompt).not.toContain("OUTIL DE TÂCHES");
  });

  it("explique l'outil de tâches seulement s'il est disponible", () => {
    const withTool = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [TASKS_TOOL] }),
    });
    expect(withTool).toContain("OUTIL DE TÂCHES");
    expect(withTool).toContain("Appelle `tasks` EN PREMIER");

    const withoutTool = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [SEARCH_TOOL] }),
    });
    expect(withoutTool).not.toContain("OUTIL DE TÂCHES");
  });

  it("n'annonce l'attente de la liste de tâches que si l'outil est présent", () => {
    expect(
      buildAgentSystemPrompt({
        ...AGENT_BASE,
        capabilities: caps({ tools: [TASKS_TOOL] }),
      })
    ).toContain("liste des tâches");
    expect(
      buildAgentSystemPrompt({
        ...AGENT_BASE,
        capabilities: caps({ tools: [SEARCH_TOOL] }),
      })
    ).not.toContain("liste des tâches");
  });

  it("décrit la mémoire seulement quand elle est accessible", () => {
    expect(
      buildAgentSystemPrompt({ ...AGENT_BASE, capabilities: caps() })
    ).not.toContain("MÉMOIRE —");

    const withMemory = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        memory: { block: "MÉMOIRE — 1. Prague, 2. Rust", writable: true },
        tools: [MEMORY_TOOL],
      }),
    });
    expect(withMemory).toContain("MÉMOIRE —");
    expect(withMemory).toContain("Prague");
  });

  it("interdit de promettre un enregistrement quand le quota est atteint", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        memory: { block: "MÉMOIRE — 1. Prague", writable: false },
        tools: [MEMORY_TOOL],
      }),
    });
    expect(prompt).toContain(
      "limite d'enregistrement de la mémoire est atteinte"
    );
    expect(prompt).not.toContain("compléter cette mémoire");
  });

  it("n'insiste sur l'écriture mémoire que si l'outil le permet", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        memory: { block: "MÉMOIRE — 1. Prague", writable: true },
        tools: [SEARCH_TOOL],
      }),
    });
    expect(prompt).toContain("MÉMOIRE —");
    expect(prompt).not.toContain("compléter cette mémoire");
  });

  it("injecte le plan seulement s'il existe", () => {
    const withPlan = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ plan: PLAN }),
    });
    expect(withPlan).toContain("PLAN DE TRAVAIL");
    expect(withPlan).toContain("Collecter les sources");

    expect(
      buildAgentSystemPrompt({ ...AGENT_BASE, capabilities: caps() })
    ).not.toContain("PLAN DE TRAVAIL");
  });

  it("ne parle des pièces jointes que s'il y en a", () => {
    expect(
      buildAgentSystemPrompt({
        ...AGENT_BASE,
        capabilities: caps({ attachments: 2 }),
      })
    ).toContain("2 pièces jointes");
    expect(
      buildAgentSystemPrompt({ ...AGENT_BASE, capabilities: caps() })
    ).not.toContain("PIÈCES JOINTES");
  });

  it("n'annonce ni le raisonnement ni les questions sans les outils associés", () => {
    const bare = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps(),
    });
    expect(bare).not.toContain("RAISONNEMENT —");
    expect(bare).not.toContain("QUESTIONS —");

    const full = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        reasoning: true,
        tools: [
          {
            description: "Pose une question.",
            id: "ask_user",
            kind: "native",
            label: "Question",
          },
        ],
      }),
    });
    expect(full).toContain("RAISONNEMENT —");
    expect(full).toContain("QUESTIONS —");
  });

  it("décrit les extensions quand des outils externes sont branchés", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({
        tools: [
          {
            description: "Interroge un serveur MCP.",
            id: "mcp_linearly_issues",
            kind: "mcp",
            label: "Linear",
          },
          SEARCH_TOOL,
        ],
      }),
    });
    expect(prompt).toContain("EXTENSIONS");
    expect(prompt).toContain("mcp_linearly_issues");
    // La section extensions ne doit pas doubloner la liste générale des outils.
    const extensionsAt = prompt.indexOf("EXTENSIONS");
    expect(prompt.indexOf("OUTILS DISPONIBLES")).toBeLessThan(extensionsAt);
  });

  it("n'ouvre pas de section extensions pour des outils natifs", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      capabilities: caps({ tools: [SEARCH_TOOL, TASKS_TOOL] }),
    });
    expect(prompt).not.toContain("EXTENSIONS");
  });
});

describe("Agent — les instructions personnalisées viennent après le socle", () => {
  it("ne produit aucun bloc personnalisé quand il n'y a rien à dire", () => {
    const prompt = buildAgentSystemPrompt(AGENT_BASE);
    expect(prompt).not.toContain(PERSONAL_HEADER);
  });

  it("pose le bloc délimité en dernier, jamais au milieu", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      assistantInstructions: "MARKER_ASSISTANT",
      capabilities: caps({ plan: PLAN, tools: [TASKS_TOOL] }),
      chatInstructions: "MARKER_CONVERSATION",
      projectInstructions: "MARKER_PROJET",
      skillInstructions: "MARKER_COMPETENCE",
      userInstructions: "MARKER_UTILISATEUR",
    });

    expect(prompt).toContain(PERSONAL_HEADER);
    // Le socle et les capacités précèdent le bloc.
    expect(prompt.indexOf("Tu es Agent")).toBeLessThan(
      prompt.indexOf(PERSONAL_HEADER)
    );
    expect(prompt.indexOf("OUTILS DISPONIBLES")).toBeLessThan(
      prompt.indexOf(PERSONAL_HEADER)
    );
    expect(prompt.indexOf("PLAN DE TRAVAIL")).toBeLessThan(
      prompt.indexOf(PERSONAL_HEADER)
    );
    // Toutes les consignes personnelles sont dans le bloc, et la dernière
    // section du prompt appartient encore au bloc : rien ne le suit.
    const tail = prompt.slice(prompt.indexOf(PERSONAL_HEADER));
    for (const marker of [
      "MARKER_ASSISTANT",
      "MARKER_UTILISATEUR",
      "MARKER_PROJET",
      "MARKER_CONVERSATION",
      "MARKER_COMPETENCE",
    ]) {
      expect(tail).toContain(marker);
    }
    expect(prompt.indexOf("ATTENTE VISIBLE")).toBeGreaterThan(
      prompt.indexOf("MARKER_COMPETENCE")
    );
    expect(prompt.trimEnd().endsWith("l'exécution.")).toBe(true);
  });

  it("garde un ordre stable des consignes personnelles", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      assistantInstructions: "A",
      chatInstructions: "C",
      projectInstructions: "P",
      skillInstructions: "S",
      userInstructions: "U",
    });
    const order = [
      "ASSISTANT SÉLECTIONNÉ",
      "INSTRUCTIONS DE L'UTILISATEUR",
      "PROJET SÉLECTIONNÉ",
      "CONSIGNES DE CETTE CONVERSATION",
      "COMPÉTENCE ACTIVE",
    ];
    const positions = order.map((label) => prompt.indexOf(label));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("ignore une consigne vide plutôt que de laisser un bloc creux", () => {
    const prompt = buildAgentSystemPrompt({
      ...AGENT_BASE,
      chatInstructions: "   ",
      userInstructions: "MARKER_UTILISATEUR",
    });
    expect(prompt).not.toContain("CONSIGNES DE CETTE CONVERSATION");
    expect(prompt).toContain("MARKER_UTILISATEUR");
  });
});

describe("Chat — même contrat, socle distinct", () => {
  const CHAT = {
    addendum: null,
    artifactsAvailable: false,
    capabilities: caps(),
    requestHints: null,
  };

  it("n'annonce aucun outil quand le Chat n'en a pas", () => {
    const prompt = buildChatSystemPrompt(CHAT);
    expect(prompt).toContain("Tu n'as aucun outil");
    expect(prompt).not.toContain("OUTILS DISPONIBLES");
  });

  it("n'envoie les consignes d'artefact que si le panneau est disponible", () => {
    expect(buildChatSystemPrompt(CHAT)).not.toContain("ARTEFACTS —");
    expect(
      buildChatSystemPrompt({
        ...CHAT,
        artifactsAvailable: true,
        capabilities: caps({ tools: [SEARCH_TOOL] }),
      })
    ).toContain("ARTEFACTS —");
  });

  it("pose l'addendum en dernier", () => {
    const prompt = buildChatSystemPrompt({
      ...CHAT,
      addendum: `${PERSONAL_HEADER}\n\nASSISTANT ACTIF\nMARKER_ASSISTANT`,
      capabilities: caps({ tools: [SEARCH_TOOL] }),
    });
    expect(prompt.indexOf("OUTILS DISPONIBLES")).toBeLessThan(
      prompt.indexOf(PERSONAL_HEADER)
    );
    expect(prompt.trimEnd().endsWith("MARKER_ASSISTANT")).toBe(true);
  });

  it("ne mentionne ni la mémoire ni les pièces jointes si elles sont absentes", () => {
    const prompt = buildChatSystemPrompt(CHAT);
    expect(prompt).not.toContain("MÉMOIRE —");
    expect(prompt).not.toContain("PIÈCES JOINTES");
  });
});
