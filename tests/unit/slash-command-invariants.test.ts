import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type SlashCommandAction,
  slashCommands,
} from "@/components/chat/slash-commands";
import {
  BUILT_IN_SLASH_COMMAND_TRIGGERS,
  isReservedSlashCommandTrigger,
} from "@/lib/chat/slash-command-catalog";
import { ALL_SLASH_COMMAND_ACTIONS } from "@/lib/chat/slash-command-outcomes";
import { runSlashCommand } from "@/lib/chat/slash-commands";

// `slash-command-agent.test.ts` garantit que le menu Agent n'expose que des
// commandes qui ont une issue. Le symétrique n'existait pas, et c'est ce qui a
// laissé passer le pire bug de la famille : « /taches » était au catalogue et
// au menu du Chat, et `runSlashCommand` n'avait aucun `case "tasks"`. Le
// `default: break` avalait tout : l'input se vidait, la commande disparaissait
// du champ, et rien ne se passait. Un utilisateur charitable y aurait vu un bug
// ; le test, lui, voit une action déclarée sans traitement.
//
// Ces tests verrouillent les deux moitiés du contrat :
//   1. toute action déclarée est traitée par l'interpréteur ;
//   2. toute commande déclarée occupe bien un déclencheur réservé.

const INTERPRETER_SOURCE = readFileSync(
  join(process.cwd(), "lib/chat/slash-commands.ts"),
  "utf8"
);

/** `case "image":` — le corps de la fonction, pas les unions de types. */
function treatedActions(): Set<string> {
  const matches = INTERPRETER_SOURCE.matchAll(/case\s+"([a-z-]+)":/g);
  return new Set(Array.from(matches, (match) => match[1]));
}

describe("L'interpréteur traite toute action du catalogue", () => {
  it("n'a aucune action déclarée sans traitement", () => {
    const treated = treatedActions();
    const untreated: string[] = [];

    for (const action of ALL_SLASH_COMMAND_ACTIONS) {
      // `custom` est délégué à executeCustomCommand avant le switch, et aucune
      // entrée statique du catalogue ne le déclare.
      if (action === "custom") {
        continue;
      }
      if (!treated.has(action)) {
        untreated.push(action);
      }
    }

    // Message volontairement nommant les actions : « /taches » est arrivé là
    // précisément parce qu'un simple « non vide » ne disait pas laquelle.
    expect(
      untreated,
      `Actions déclarées sans case dans runSlashCommand : ${untreated.join(", ")}`
    ).toEqual([]);
  });

  it("traite toutes les actions réellement présentes au catalogue", () => {
    const treated = treatedActions();
    for (const command of slashCommands) {
      const action = command.action as SlashCommandAction;
      if (action === "custom") {
        continue;
      }
      expect(
        treated.has(action),
        `L'entrée « /${command.name} » (${action}) n'est pas traitée`
      ).toBe(true);
    }
  });

  it("ne garde plus de silence sur une action inconnue", () => {
    // Le filet de sécurité doit être visible : un `break` muet est exactement
    // le défaut qui a masqué « /taches ».
    expect(INTERPRETER_SOURCE).toContain("default:");
    const defaultBranch = INTERPRETER_SOURCE.slice(
      INTERPRETER_SOURCE.lastIndexOf("default:")
    );
    expect(defaultBranch).toContain("toast.info");
  });
});

describe("Les déclencheurs système sont réservés", () => {
  it("réserve le nom et tous les alias de chaque commande du catalogue", () => {
    const missing: string[] = [];
    for (const command of slashCommands) {
      for (const trigger of [command.name, ...(command.aliases ?? [])]) {
        if (!BUILT_IN_SLASH_COMMAND_TRIGGERS.includes(trigger)) {
          missing.push(trigger);
        }
      }
    }
    // Sans ce test, `BUILT_IN_SLASH_COMMAND_TRIGGERS` dériverait du catalogue
    // dès qu'une commande est ajoutée, et `/nouvelle-cmd` deviendrait
    // créable en doublon du menu.
    expect(
      missing,
      `Déclencheurs absents de la liste réservée : ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("ne réserve aucun déclencheur qui n'appartient à aucune commande", () => {
    const declared = new Set(
      slashCommands.flatMap((command) => [
        command.name,
        ...(command.aliases ?? []),
      ])
    );
    const orphans = BUILT_IN_SLASH_COMMAND_TRIGGERS.filter(
      (trigger) => !declared.has(trigger)
    );
    // Un déclencheur orphelin ne bloque rien aujourd'hui, mais il interdit
    // définitivement un nom à l'utilisateur, et rien ne le signale.
    expect(
      orphans,
      `Déclencheurs réservés sans commande correspondante : ${orphans.join(", ")}`
    ).toEqual([]);
  });

  it("reconnaît un déclencheur réservé quelle que soit sa casse", () => {
    expect(isReservedSlashCommandTrigger("image")).toBe(true);
    expect(isReservedSlashCommandTrigger("IMAGE")).toBe(true);
    expect(isReservedSlashCommandTrigger("  Image  ")).toBe(true);
    expect(isReservedSlashCommandTrigger("machoirc gratuit")).toBe(false);
    expect(isReservedSlashCommandTrigger("")).toBe(false);
    expect(isReservedSlashCommandTrigger(null)).toBe(false);
  });
});

describe("« /bots » ouvre le sélecteur de bots, il ne se contente pas d'exister", () => {
  // Les tests ci-dessus prouvent que l'action est DÉCLARÉE et TRAITÉE. Pas
  // qu'elle fait quelque chose : c'est exactement le trou qui avait laissé
  // « /taches » dans le menu. On exécute donc l'interpréteur pour de vrai, avec
  // le `document` minimal dont cette commande a besoin — un sélecteur monté, ou
  // rien, pour vérifier le repli.
  const botsCommand = slashCommands.find(
    (command) => command.action === "bots"
  );

  function stubComposer({ mounted }: { mounted: boolean }) {
    const clicked: string[] = [];
    const pushed: string[] = [];
    vi.stubGlobal("document", {
      querySelector: (selector: string) =>
        mounted && selector === "[data-testid='agent-selector']"
          ? {
              click: () => {
                clicked.push(selector);
              },
            }
          : null,
    });
    return { clicked, pushed };
  }

  async function run(mounted: boolean) {
    const { clicked, pushed } = stubComposer({ mounted });
    await runSlashCommand(
      botsCommand as never,
      {
        router: {
          push: (href: string) => {
            pushed.push(href);
          },
        },
        // Toute commande système annule la commande personnalisée en attente.
        setPendingCommand: () => undefined,
      } as never
    );
    return { clicked, pushed };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clique le sélecteur monté par le composer Chat", async () => {
    const { clicked, pushed } = await run(true);
    expect(clicked).toEqual(["[data-testid='agent-selector']"]);
    expect(pushed).toEqual([]);
  });

  it("retombe sur /agents quand aucun sélecteur n'est monté", async () => {
    // Sans ce repli, `/bots` sur un compte dont le sélecteur est masqué
    // viderait l'input et ne ferait rien — le défaut exact de « /taches ».
    const { clicked, pushed } = await run(false);
    expect(clicked).toEqual([]);
    expect(pushed).toEqual(["/agents"]);
  });
});
