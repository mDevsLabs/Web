import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Garde-fous d'emplacement du sélecteur Chat | Agent.
//
// L'accueil Chat et l'accueil Agent doivent rendre le MÊME contrôle, au MÊME
// endroit : une seule construction du composant partagé, aucun second curseur,
// aucune position divergente. Ces assertions lisent les sources des shells et
// des piles d'accueil : une régression (réintroduire le sélecteur dans l'en-tête
// Agent, par exemple) casse immédiatement la suite.

const ROOT = path.resolve(import.meta.dirname, "../..");

function source(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

const SHARED_SWITCHER = "components/chat/home-mode-switcher.tsx";
const AGENT_SHELL = "components/agent/agent-shell.tsx";
const AGENT_HOME = "components/agent/agent-home.tsx";
const CHAT_SHELL = "components/chat/shell.tsx";
const CHAT_MESSAGES = "components/chat/messages.tsx";

describe("Emplacement unique du sélecteur Chat | Agent", () => {
  it("ne construit le sélecteur que dans le composant partagé d'accueil", () => {
    const shared = source(SHARED_SWITCHER);
    expect(shared).toContain("<AgentModeSwitcher");
    expect(shared).toContain('data-testid="home-mode-switcher"');

    // Aucun shell ni aucune pile d'accueil ne reconstruit le contrôle.
    for (const file of [AGENT_SHELL, AGENT_HOME, CHAT_SHELL, CHAT_MESSAGES]) {
      expect(source(file), `${file} reconstruit le sélecteur`).not.toContain(
        "<AgentModeSwitcher"
      );
    }
  });

  it("a retiré le sélecteur de l'en-tête Agent", () => {
    const agentShell = source(AGENT_SHELL);
    expect(agentShell).not.toContain("AgentModeSwitcher");
    expect(agentShell).toContain("<HomeModeSwitcher");
    expect(agentShell).toContain("<header");
  });

  it("branche le sélecteur partagé sur les deux accueils", () => {
    expect(source(CHAT_SHELL)).toContain("modeSwitcher=");
    expect(source(AGENT_SHELL)).toContain("modeSwitcher=");
    expect(source(AGENT_HOME)).toContain("modeSwitcher");
    expect(source(CHAT_MESSAGES)).toContain("modeSwitcher");
  });

  it("conserve un écart identique (32 px) entre le sélecteur et le titre", () => {
    // Accueil Chat : la pile n'utilise pas de gap → marge explicite mb-8 (32 px).
    expect(source(CHAT_MESSAGES)).toContain("mb-8");
    // Accueil Agent : la pile utilise gap-6 (24 px) → marge mb-2 (8 px) en plus,
    // soit le même total de 32 px avant le titre.
    const agentHome = source(AGENT_HOME);
    expect(agentHome).toContain("gap-6");
    expect(agentHome).toContain("mb-2");
    const GAP_PX = 6 * 4;
    const EXTRA_PX = 2 * 4;
    const CHAT_MARGIN_PX = 8 * 4;
    expect(GAP_PX + EXTRA_PX).toBe(CHAT_MARGIN_PX);
  });

  it("partage la même largeur de pile d'accueil entre Chat et Agent", () => {
    expect(source(CHAT_MESSAGES)).toContain("max-w-3xl");
    expect(source(AGENT_HOME)).toContain("max-w-3xl");
  });

  it("garde la barre de message du Chat alignée sur celle d'Agent", () => {
    const chatShell = source(CHAT_SHELL);
    expect(chatShell).toContain("sticky bottom-0");
    expect(chatShell).toContain("max-w-3xl");
  });

  it("n'affiche le sélecteur que sur l'accueil (aucune conversation)", () => {
    // Chat : le sélecteur est passé seulement quand la conversation est vide.
    expect(source(CHAT_SHELL)).toContain("messages.length === 0 && !isLoading");
    // Agent : AgentHome n'est rendu que sur l'accueil.
    expect(source(AGENT_SHELL)).toContain("showHome ?");
  });
});
