import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { shouldShowAgentHome } from "@/lib/agent/timeline-visibility";

// Garde-fous du correctif « Nouvelle discussion ne revient pas à l'accueil ».
//
// Symptôme : le clic sur « Nouvelle discussion » (components/chat/app-sidebar)
// faisait bien `resetChat()` + `router.push("/")`, mais en mode Agent l'écran
// restait figé sur la timeline de la conversation précédente.
//
// Cause : `resetChat()` (hooks/use-active-chat) ne vide que l'état Chat.
// `state.steps` appartient à l'AgentStreamProvider, monté plus bas que le
// sidebar dans l'arbre (app/(chat)/layout.tsx : AppSidebar et SidebarInset sont
// des frères, le provider est dans SidebarInset via AgentShell). Le routeur
// revenait à `/` mais `showHome` restait faux, faute de voir les étapes vidées.

const ROOT = path.resolve(import.meta.dirname, "../..");

function source(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

const AGENT_SHELL = "components/agent/agent-shell.tsx";
const ACTIVE_CHAT = "hooks/use-active-chat.tsx";

describe("L'accueil Agent exige une conversation ET une timeline vides", () => {
  it("s'affiche quand tout est vide et l'hydratation terminée", () => {
    expect(
      shouldShowAgentHome({
        isHydrating: false,
        messageCount: 0,
        stepCount: 0,
      })
    ).toBe(true);
  });

  it("ne s'affiche pas tant que des étapes de run subsistent", () => {
    // C'est exactement l'état reached par le bug : messages vidés par
    // resetChat(), étapes restées en mémoire.
    expect(
      shouldShowAgentHome({
        isHydrating: false,
        messageCount: 0,
        stepCount: 3,
      })
    ).toBe(false);
  });

  it("ne s'affiche pas tant que des messages subsistent", () => {
    expect(
      shouldShowAgentHome({
        isHydrating: false,
        messageCount: 1,
        stepCount: 0,
      })
    ).toBe(false);
  });

  it("ne s'affiche jamais pendant l'hydratation, même vide", () => {
    // Sans cette garde, un aller-retour sur une conversation enregistrée
    // afficherait un clignotement d'accueil avant le chargement.
    expect(
      shouldShowAgentHome({
        isHydrating: true,
        messageCount: 0,
        stepCount: 0,
      })
    ).toBe(false);
  });
});

describe("Le reset triggered par le sidebar atteint bien l'état Agent", () => {
  it("resetChat incrémente resetEpoch (le signal que l'Agent écoute)", () => {
    const src = source(ACTIVE_CHAT);
    expect(src).toMatch(/setResetEpoch\(\(epoch\) => epoch \+ 1\);/);
    expect(src).toMatch(/resetEpoch: number;/);
  });

  it("AgentShell vide la timeline et arrête le run sur resetEpoch", () => {
    const src = source(AGENT_SHELL);
    // L'écran Agent doit vider son état ET clore le run côté serveur, sinon le
    // flux continue d'alimenter state.steps et l'accueil ne revient jamais.
    expect(src).toContain("lastHandledResetEpochRef.current === resetEpoch");
    expect(src).toMatch(/if \(isRunning\) \{\s*\n\s*void stopRun\(\);/);
    expect(src).toMatch(/void stopRun\(\);\s*\n\s*}\s*\n\s*reset\(\);/);
  });

  it("AgentShell consomme resetEpoch depuis ActiveChatProvider", () => {
    // Sans ce câblage, le compteur existe mais personne ne le consomme : le
    // bug reviendrait sans que le typecheck ne le remarque.
    const src = source(AGENT_SHELL);
    expect(src).toMatch(
      /const \{[^}]*\bresetEpoch\b[^}]*\} =\s*\n?\s*useActiveChat\(\)/
    );
  });

  it("showHome passe par la règle pure testable", () => {
    const src = source(AGENT_SHELL);
    expect(src).toContain("shouldShowAgentHome({");
    expect(src).toContain("stepCount: state.steps.length");
  });
});
