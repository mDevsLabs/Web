import { describe, expect, it } from "vitest";
import { chatOwnerMatches } from "@/lib/agent/channel";
import {
  deriveSuggestedActions,
  validateDerivedActions,
} from "@/lib/agent/suggested-actions/derive";
import { categorizeToolError } from "@/lib/agent/tool-controller";

// Garde d'identité partagée (envoi, lecture, PATCH, runs) : les trois variantes
// historiques de chat.userId (id, email, username) sont reconnues comme le
// propriétaire, tout le reste est refusé. C'est la correction du bug « Salut !
// » → 403 sur une conversation visible par l'utilisateur.
describe("Garde d'identité chatOwnerMatches", () => {
  it("reconnaît l'id canonique", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "user-123",
        email: "u@mai.dev",
        userId: "user-123",
        username: "maria",
      })
    ).toBe(true);
  });

  // DURCISSEMENT : la correspondance par email/pseudo a été retirée du chemin
  // par défaut. Ces deux valeurs sont MODIFIABLES par l'utilisateur : il
  // suffisait de prendre l'ancien email/pseudo d'un autre compte pour hériter
  // de l'accès à ses conversations. Les conversations historiques doivent être
  // migrées (scripts/migrate-chat-owner-canonical.ts) ; l'ancienne tolérance
  // n'est rétablie que par CHAT_OWNER_LEGACY_MATCH=true.
  it("refuse la variante email (valeur modifiable)", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "u@mai.dev",
        email: "u@mai.dev",
        userId: "user-123",
        username: "maria",
      })
    ).toBe(false);
  });

  it("refuse la variante username (valeur modifiable)", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "maria",
        email: "u@mai.dev",
        userId: "user-123",
        username: "maria",
      })
    ).toBe(false);
  });

  it("refuse une conversation étrangère", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "quelqu-un-dautre",
        email: "u@mai.dev",
        userId: "user-123",
        username: "maria",
      })
    ).toBe(false);
  });
});

// Dérivation SuggestedActions : le serveur observe le run réel, valide par le
// registre, et n'expose jamais une action incompatible.
describe("Dérivation des SuggestedActions", () => {
  it("ne propose rien sans outil compatible", () => {
    const derived = deriveSuggestedActions({
      enabledToolCategories: ["internal"],
      hasArtifact: false,
      projectId: null,
      taskTitle: "Salut !",
    });
    expect(derived).toHaveLength(0);
  });

  it("propose la poursuite de recherche quand le web était activé", () => {
    const derived = deriveSuggestedActions({
      enabledToolCategories: ["web"],
      hasArtifact: false,
      projectId: null,
      taskTitle: "Veille IA",
    });
    expect(derived.map((action) => action.id)).toContain("continue_research");
    const validated = validateDerivedActions({
      actions: derived,
      enabledToolCategories: ["web"],
    });
    expect(validated).toHaveLength(derived.length);
  });

  it("propose rapport/export/projet seulement avec un livrable", () => {
    const derived = deriveSuggestedActions({
      enabledToolCategories: ["artifact", "files", "project"],
      hasArtifact: true,
      projectId: "3f2504e0-4f89-11d3-9a0c-0305e82c3310",
      taskTitle: "Analyse marché",
    });
    const ids = derived.map((action) => action.id);
    expect(ids).toContain("create_report");
    expect(ids).toContain("export_csv");
    expect(ids).toContain("add_result_to_project");
    expect(ids.length).toBeLessThanOrEqual(3);
  });

  it("écarte par le registre une action sans outil requis activé", () => {
    const validated = validateDerivedActions({
      actions: [
        {
          id: "create_report",
          label: "Créer un rapport",
          payload: { title: "Rapport" },
        },
      ],
      enabledToolCategories: ["internal"],
    });
    expect(validated).toHaveLength(0);
  });
});

// Catégorisation d'erreur : libellés affichables, sans détail interne.
describe("Catégorisation des erreurs d'outils", () => {
  it("classe un timeout", () => {
    expect(categorizeToolError("timeout", "Operation has timed out")).toBe(
      "timeout"
    );
  });
  it("classe une limite de débit", () => {
    expect(categorizeToolError("rate_limited", "429 Too Many Requests")).toBe(
      "rate_limit"
    );
  });
  it("classe une erreur réseau", () => {
    expect(categorizeToolError("network", "fetch failed")).toBe("network");
  });
  it("classe un refus de permission", () => {
    expect(
      categorizeToolError("permission", "403 forbidden for this resource")
    ).toBe("permission");
  });
  it("replie sur provider pour le reste", () => {
    expect(categorizeToolError("unknown", "Quelque chose d'autre")).toBe(
      "provider"
    );
  });
});
