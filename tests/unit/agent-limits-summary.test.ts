import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalParamsKey } from "@/lib/agent/db-schema";
import { evaluateDurationLimit } from "@/lib/agent/limits";
import { DEFAULT_TOOL_RETRY_POLICY, decideToolRetry } from "@/lib/agent/retry";
import { validateSuggestedProposals } from "@/lib/agent/suggested-actions/registry";
import { AgentToolError } from "@/lib/agent/tool-errors";

// Le hash d'approbation est calculé côté serveur (crypto) ; la même clé
// canonique doit produire le même hash, et un paramètre modifié un hash
// différent — c'est ce qui invalide l'approbation.
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describe("Invalidation d'approbation par hash de paramètres", () => {
  it("produit un hash stable indépendant de l'ordre des clés", () => {
    const a = canonicalParamsKey({ subject: "Bonjour", to: "x@y.z" });
    const b = canonicalParamsKey({ subject: "Bonjour", to: "x@y.z" });
    expect(sha256(a)).toBe(sha256(b));
  });

  it("produit un hash différent dès qu'un paramètre change", () => {
    const original = canonicalParamsKey({ subject: "Bonjour", to: "x@y.z" });
    const modified = canonicalParamsKey({
      subject: "Bonjour",
      to: "autre@y.z",
    });
    expect(sha256(original)).not.toBe(sha256(modified));
  });
});

describe("Limites de durée — limites Plus/Pro/Max avec horloge factice", () => {
  it("un run Plus est stoppé à 1 h d'activité cumulée", () => {
    let now = 1000;
    const checkpoint = { activeMs: 0, activeSince: now };
    now += 59 * 60 * 1000;
    const before = evaluateDurationLimit({
      checkpoint: { ...checkpoint, activeSince: now },
      clock: { now: () => now },
      tier: "plus",
    });
    expect(before.exceeded).toBe(false);
    now += 2 * 60 * 1000;
    const after = evaluateDurationLimit({
      checkpoint,
      clock: { now: () => now },
      tier: "plus",
    });
    expect(after.exceeded).toBe(true);
  });

  it("un run Pro tolère 2 h mais pas 4 h", () => {
    const twoHours = evaluateDurationLimit({
      checkpoint: { activeMs: 2 * 60 * 60 * 1000, activeSince: null },
      tier: "pro",
    });
    expect(twoHours.exceeded).toBe(false);
    const fourHours = evaluateDurationLimit({
      checkpoint: { activeMs: 4 * 60 * 60 * 1000, activeSince: null },
      tier: "pro",
    });
    expect(fourHours.exceeded).toBe(true);
  });
});

describe("Rejets serveur des entrées invalides", () => {
  it("écarte une action suggérée inconnue du registre", () => {
    const validated = validateSuggestedProposals({
      enabledToolCategories: ["artifact"],
      proposals: {
        actions: [{ id: "drop_database", label: "Tout supprimer" }],
      },
    });
    expect(validated).toHaveLength(0);
  });

  it("écarte une action valide dont les outils n'étaient pas activés", () => {
    const validated = validateSuggestedProposals({
      enabledToolCategories: ["internal"],
      proposals: {
        actions: [{ id: "create_report", label: "Créer un rapport" }],
      },
    });
    expect(validated).toHaveLength(0);
  });

  it("accepte une action du registre avec payload conforme et outil activé", () => {
    const validated = validateSuggestedProposals({
      enabledToolCategories: ["artifact"],
      proposals: {
        actions: [
          {
            id: "create_report",
            label: "Créer un rapport",
            payload: { title: "Rapport de veille" },
          },
        ],
      },
    });
    expect(validated).toHaveLength(1);
    expect(validated[0]?.id).toBe("create_report");
  });

  it("classe une erreur d'authentification comme non retentable", () => {
    const authError = new AgentToolError({
      category: "auth",
      code: "auth_required",
      message: "Credentials invalides.",
    });
    const decision = decideToolRetry({
      attempt: 1,
      error: authError,
      policy: DEFAULT_TOOL_RETRY_POLICY,
    });
    expect(decision).toEqual({ reason: "not_retryable", retry: false });
    // La forme sûre ne contient jamais les détails internes.
    expect(JSON.stringify(authError.toSafeShape())).not.toContain("internal");
  });
});
