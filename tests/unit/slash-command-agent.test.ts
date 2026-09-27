import { describe, expect, it } from "vitest";
import {
  type SlashCommandAction,
  slashCommands,
} from "@/components/chat/slash-commands";
import {
  AGENT_EXCLUDED_SLASH_ACTIONS,
  AGENT_SUPPORTED_ACTIONS,
  ALL_SLASH_COMMAND_ACTIONS,
  resolveSlashCommandOutcome,
} from "@/lib/chat/slash-command-outcomes";

// Le mode Agent affichait le catalogue complet des commandes slash alors que
// vingt d'entre elles ne faisaient rien : le menu proposait « /notes », puis
// répondait « /notes n'est pas pris en charge dans le mode Agent ». La cause
// était une liste d'exclusions écrite à la main, forcément en retard sur les
// commandes ajoutées ensuite.
//
// Ces tests verrouillent l'invariant qui remplace cette liste : le menu Agent
// n'expose que ce qui a une issue implémentée, et l'exclusion se calcule par
// complément — donc une commande ajoutée sans traitement disparaît du menu au
// lieu d'y apparaître et d'échouer.

describe("L'inventaire des actions est exhaustif", () => {
  it("couvre exactement l'union SlashCommandAction", () => {
    // `ALL_SLASH_COMMAND_ACTIONS` est comparé à l'inventaire réel des
    // commandes déclarées. Si une action est ajoutée à l'union et oubliée ici,
    // le calcul par complément deviendrait faux.
    const declared = new Set(
      slashCommands.map((command) => command.action as SlashCommandAction)
    );
    for (const action of declared) {
      expect(ALL_SLASH_COMMAND_ACTIONS).toContain(action);
    }
  });

  it("ne déclare aucune action fantôme", () => {
    const declared = new Set(
      slashCommands.map((command) => command.action as SlashCommandAction)
    );
    for (const action of ALL_SLASH_COMMAND_ACTIONS) {
      // « custom » fait exception : aucune commande de ce type n'est déclarée
      // dans le catalogue statique, elles sont construites à l'exécution par
      // customCommandsToSlashCommands à partir des commandes de l'utilisateur.
      if (action === "custom") {
        continue;
      }
      expect(declared.has(action)).toBe(true);
    }
  });
});

describe("Le menu Agent n'expose que des commandes fonctionnelles", () => {
  it("aucune action proposée en mode Agent ne tombe dans l'exclusion", () => {
    const visibleInAgent = slashCommands.filter(
      (command) => !AGENT_EXCLUDED_SLASH_ACTIONS.has(command.action)
    );
    expect(visibleInAgent.length).toBeGreaterThan(0);

    for (const command of visibleInAgent) {
      // Le cas « custom » est délégué à executeCustomCommand, pas à
      // resolveSlashCommandOutcome : il est traité par construction.
      if (command.action === "custom") {
        continue;
      }
      const outcome = resolveSlashCommandOutcome({ action: command.action });
      expect(
        outcome.kind,
        `« /${command.name} » est visible en mode Agent mais son action ` +
          `« ${command.action} » ne produit aucune issue`
      ).not.toBe("unsupported");
    }
  });

  it("l'exclusion est bien le complément de ce qui est traité", () => {
    // C'est le cœur de la correction : pas de liste d'exclusions maintenue à la
    // main, donc plus d'action oubliable.
    for (const action of ALL_SLASH_COMMAND_ACTIONS) {
      const isSupported = AGENT_SUPPORTED_ACTIONS.has(action);
      const isExcluded = AGENT_EXCLUDED_SLASH_ACTIONS.has(action);
      expect(isExcluded).toBe(!isSupported);
    }
  });
});

describe("Les issues des commandes partagées", () => {
  it("ramène à l'accueil", () => {
    for (const action of ["new", "home", "clear"] as const) {
      expect(resolveSlashCommandOutcome({ action }).kind).toBe("reset");
    }
  });

  it("donne des routes utilisables", () => {
    expect(resolveSlashCommandOutcome({ action: "library" })).toEqual({
      href: "/library",
      kind: "navigate",
    });
    expect(resolveSlashCommandOutcome({ action: "projects" })).toEqual({
      href: "/projects",
      kind: "navigate",
    });
    expect(resolveSlashCommandOutcome({ action: "planning" })).toEqual({
      href: "/planning",
      kind: "navigate",
    });
    expect(resolveSlashCommandOutcome({ action: "usage" })).toEqual({
      href: "/settings?tab=usage",
      kind: "navigate",
    });
  });

  it("gère le thème, la recherche, le modèle et l'export", () => {
    expect(resolveSlashCommandOutcome({ action: "theme" }).kind).toBe(
      "toggle_theme"
    );
    expect(resolveSlashCommandOutcome({ action: "search" }).kind).toBe(
      "open_search"
    );
    expect(resolveSlashCommandOutcome({ action: "model" }).kind).toBe(
      "open_model_selector"
    );
    expect(resolveSlashCommandOutcome({ action: "export" }).kind).toBe(
      "export_markdown"
    );
  });

  it("préfère un message informatif à une absence d'issue", () => {
    // /rename ne fait rien ici mais n'est pas fausse : l'interface dit où agir.
    const outcome = resolveSlashCommandOutcome({ action: "rename" });
    expect(outcome.kind).toBe("notice");
  });

  it("reconnaît les commandes qui n'ont pas d'issue partagée", () => {
    for (const action of [
      "ghost",
      "quiz",
      "delete",
      "purge",
      "tool-code",
      "tool-weather",
      "tools-clear",
    ] as const) {
      expect(resolveSlashCommandOutcome({ action }).kind).toBe("unsupported");
    }
  });
});

describe("Les bascules d'outils restent propres au Chat", () => {
  // L'Agent ne provisionne pas un outil « pour le prochain message » : il en
  // choisit lui-même dans sa boucle. Lui proposer /code ou /weather n'aurait
  // aucun effet réel.
  it("exclut les outils one-shot du mode Agent", () => {
    for (const action of [
      "tool-code",
      "tool-weather",
      "tool-calc",
      "tool-doc",
      "tool-chart",
      "tool-qr",
      "tool-suggest",
      "tool-summary",
      "tool-time",
      "tool-note",
    ] as const) {
      expect(AGENT_EXCLUDED_SLASH_ACTIONS.has(action)).toBe(true);
    }
  });
});
