import { describe, expect, it } from "vitest";
import { getMcpTemplate, MCP_TEMPLATE_LIST } from "@/lib/mcp-templates/catalog";
import {
  getSkillTemplate,
  SKILL_TEMPLATE_LIST,
} from "@/lib/skill-templates/catalog";

// Contrat des fiches de détail (même modèle d'expérience que les Plugins) :
// une fiche doit exister pour chaque identifiant du catalogue et exposer les
// informations minimales attendues sur la page serveur. Les pages réelles
// (app/(chat)/tools/mcp/[templateId], .../skills/[skillId]) résolvent le
// manifeste par ces mêmes fonctions : un identifiant résolu = une fiche
// rendue, jamais une redirection vers un écran vide.

describe("Fiches de détail MCP — contrat", () => {
  it("chaque identifiant du catalogue résout une fiche", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      const resolved = getMcpTemplate(template.id);
      expect(resolved).toBeDefined();
      expect(resolved!.id).toBe(template.id);
    }
  });

  it("une fiche MCP à token expose identité, auth documentée et risques", () => {
    const notion = getMcpTemplate("notion");
    expect(notion).toBeDefined();
    expect(notion!.description.length).toBeGreaterThan(10);
    expect(notion!.author.length).toBeGreaterThan(0);
    // Exigences d'authentification : token documenté avec l'URL de création —
    // le champ sécurisé de la fiche s'appuie dessus.
    expect(notion!.credentials.length).toBeGreaterThan(0);
    expect(notion!.credentials[0]!.docsUrl).toMatch(/^https:/);
    expect(notion!.credentials[0]!.required).toBe(true);
    // Mode d'emploi pas à pas présent (au-delà des simples instructions).
    expect(notion!.setupInstructions.length).toBeGreaterThan(0);
    // Permissions et risques affichés.
    expect(["always_allow", "ask_permission", "write_only"]).toContain(
      notion!.requireApproval
    );
    expect(typeof notion!.readOnly).toBe("boolean");
    // Niveau d'abonnement affiché.
    expect(["free", "plus", "pro", "max"]).toContain(notion!.minTier);
  });

  it("la fiche Sentry est explicite : OAuth requis, installation refusée, pas de faux champ", () => {
    const sentry = getMcpTemplate("sentry");
    expect(sentry).toBeDefined();
    // Le point d'accès officiel n'accepte pas de token personnel : le
    // manifeste l'assume (requires_oauth_flow) au lieu d'afficher un champ
    // de token voué à l'échec.
    expect(sentry!.activation).toBe("requires_oauth_flow");
    expect(sentry!.authType).toBe("oauth2");
    // Aucun faux champ de token : l'utilisateur n'est jamais invité à saisir
    // une valeur que le serveur rejetterait.
    expect(sentry!.credentials).toHaveLength(0);
    // L'état est expliqué sur la fiche (instructions server-side).
    expect(sentry!.setupInstructions.join(" ")).toContain("OAuth");
  });

  it("un identifiant inconnu ne résout rien (page 404 dédiée, pas de redirection muette)", () => {
    expect(getMcpTemplate("service-inexistant")).toBeUndefined();
  });
});

describe("Fiches de détail Skills — contrat", () => {
  it("chaque identifiant du catalogue résout une fiche", () => {
    for (const template of SKILL_TEMPLATE_LIST) {
      const resolved = getSkillTemplate(template.id);
      expect(resolved).toBeDefined();
      expect(resolved!.id).toBe(template.id);
    }
  });

  it("une fiche Skill expose instructions, outils, paramètres et forfait", () => {
    const skill = getSkillTemplate("incident-debugger");
    expect(skill).toBeDefined();
    expect(skill!.instructions.length).toBeGreaterThan(10);
    expect(Array.isArray(skill!.tools)).toBe(true);
    expect(Array.isArray(skill!.parameters)).toBe(true);
    expect(["free", "plus", "pro", "max"]).toContain(skill!.minTier);
  });

  it("un identifiant inconnu ne résout rien", () => {
    expect(getSkillTemplate("skill-inexistant")).toBeUndefined();
  });
});
