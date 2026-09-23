import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_OWNER_LEGACY_MATCH_ENABLED,
  chatOwnerMatches,
} from "@/lib/agent/channel";
import { composeAgentInstructions } from "@/lib/agent/runtime";
import { isCanonicalUuid, scheduleChatId } from "@/lib/agent/scheduler/chat-id";
import { resolveOnceDueAt } from "@/lib/agent/scheduler/once";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function codeOnly(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("Réorientation — les consignes atteignent réellement le modèle", () => {
  it("n'altère pas les instructions en l'absence de réorientation", () => {
    expect(composeAgentInstructions("INSTRUCTIONS", [])).toBe("INSTRUCTIONS");
  });

  it("ajoute les consignes dans l'ordre d'arrivée", () => {
    const composed = composeAgentInstructions("INSTRUCTIONS", [
      "abandonne la piste A",
      "explore plutôt la piste B",
    ]);
    expect(composed).toContain("INSTRUCTIONS");
    expect(composed.indexOf("piste A")).toBeLessThan(
      composed.indexOf("piste B")
    );
    expect(composed).toContain("RÉORIENTATION");
  });

  it("injecte les consignes dans prepareStep, pas seulement en fin d'étape", () => {
    const runtime = codeOnly("lib/agent/runtime.ts");
    // Les instructions de l'étape suivante sont construites à partir de
    // prepareStep : c'est le seul endroit où une réorientation peut encore
    // atteindre l'appel suivant.
    expect(runtime).toContain("prepareStep");
    expect(runtime).toContain("patch.instructions = composeAgentInstructions(");
    expect(runtime).toContain("injectedReorientations");
  });

  it("coupe réellement la génération quand l'utilisateur demande l'arrêt", () => {
    const runtime = codeOnly("lib/agent/runtime.ts");
    expect(runtime).toContain("internalController.abort()");
    expect(runtime).toContain("abortSignal: internalController.signal");
    // Le signal de la requête HTTP reste la source d'annulation.
    expect(runtime).toContain("params.abortSignal.addEventListener(");
  });
});

describe("Budgets cumulés entre les reprises", () => {
  it("repart du compteur persisté et compte le nombre réel d'outils", () => {
    const runtime = codeOnly("lib/agent/runtime.ts");
    expect(runtime).toContain("toolCallDelta: stepToolCalls");
    expect(runtime).toContain("startToolCallCount");
    expect(runtime).toContain("toolCallBaseline +");
    // Fin d'appels d'outils cumulée dans le garde de boucle.
    expect(runtime).toContain(
      "stepBaseline + steps.length >= params.budget.maxSteps"
    );
  });

  it("la route transmet le compteur persisté d'une reprise", () => {
    const route = codeOnly("app/(chat)/api/agent/route.ts");
    expect(route).toContain(
      "startToolCallCount: activeRun?.toolCallCount ?? 0"
    );
  });
});

describe("Modèle résolu — garde d'accès et capacités cohérentes", () => {
  it("juge l'accès avec les capacités du modèle RÉELLEMENT résolu", () => {
    const route = codeOnly("app/(chat)/api/agent/route.ts");
    expect(route).toContain("capabilitiesOverride: resolvedEntry.capabilities");
    expect(route).toContain("modelId: resolvedEntry.id");
    // L'ancienne version jugeait avec les capacités du modèle demandé.
    expect(route).not.toContain("capabilitiesOverride: requested.capabilities");
  });

  it("lit le forfait persisté (users.tier) pour les capacités affichées", () => {
    const settingsRoute = codeOnly("app/(chat)/api/agent/settings/route.ts");
    expect(settingsRoute).toContain("getPersistedTier({ userId })");
    expect(settingsRoute).not.toContain("normalizeTier(user.tier)");
  });
});

describe("Planification — once, fuseaux et conversation dédiée", () => {
  const now = new Date("2026-09-21T10:00:00Z");

  it("résout une date unique en tenant compte du fuseau IANA", () => {
    const paris = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "2026-09-22T09:00" },
      timezone: "Europe/Paris",
    });
    expect(paris.ok).toBe(true);
    if (paris.ok) {
      // 09:00 à Paris en septembre = 07:00 UTC (CEST).
      expect(paris.dueAt.toISOString()).toBe("2026-09-22T07:00:00.000Z");
    }

    const tokyo = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "2026-09-22T09:00" },
      timezone: "Asia/Tokyo",
    });
    expect(tokyo.ok).toBe(true);
    if (tokyo.ok) {
      expect(tokyo.dueAt.toISOString()).toBe("2026-09-22T00:00:00.000Z");
    }
  });

  it("traverse un changement d'heure sans dériver", () => {
    const beforeDst = resolveOnceDueAt({
      now: new Date("2026-03-20T10:00:00Z"),
      rule: { kind: "once", runAt: "2026-03-29T02:30" },
      timezone: "Europe/Paris",
    });
    // 02:30 n'existe pas ce jour-là (passage à 03:00) : la résolution reste
    // déterministe et ne produit jamais `Invalid Date`.
    expect(beforeDst.ok).toBe(true);
    if (beforeDst.ok) {
      expect(Number.isNaN(beforeDst.dueAt.getTime())).toBe(false);
    }
  });

  it("refuse les dates passées, illisibles ou inexistantes", () => {
    const past = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "2026-09-20T09:00" },
      timezone: "Europe/Paris",
    });
    expect(past.ok).toBe(false);

    const malformed = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "demain matin" },
      timezone: "Europe/Paris",
    });
    expect(malformed.ok).toBe(false);

    const impossible = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "2027-02-31T09:00" },
      timezone: "Europe/Paris",
    });
    expect(impossible.ok).toBe(false);

    const noDate = resolveOnceDueAt({
      now,
      rule: { kind: "once" },
      timezone: "Europe/Paris",
    });
    expect(noDate.ok).toBe(false);

    const badZone = resolveOnceDueAt({
      now,
      rule: { kind: "once", runAt: "2027-01-05T09:00" },
      timezone: "Mars/Olympus",
    });
    expect(badZone.ok).toBe(false);
  });

  it("donne une conversation propre à chaque tâche planifiée", () => {
    const a = scheduleChatId("11111111-1111-4111-8111-111111111111");
    const b = scheduleChatId("22222222-2222-4222-8222-222222222222");
    const projectId = "33333333-3333-4333-8333-333333333333";

    expect(a).not.toBe(b);
    expect(a).not.toBe(projectId);
    expect(a).toBe(scheduleChatId("11111111-1111-4111-8111-111111111111"));
    expect(isCanonicalUuid(a)).toBe(true);
    expect(isCanonicalUuid(b)).toBe(true);

    const execute = codeOnly("lib/agent/scheduler/execute.ts");
    expect(execute).toContain("scheduleChatId(params.schedule.id)");
    // Le projet ne doit plus servir d'identifiant de conversation.
    expect(execute).not.toContain(
      "const candidate = params.schedule.projectId"
    );
  });
});

describe("Identité de conversation — identifiant canonique uniquement", () => {
  afterEach(() => {
    delete process.env.CHAT_OWNER_LEGACY_MATCH;
    vi.resetModules();
  });

  it("accepte le propriétaire canonique", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "user-42",
        email: "marie@example.com",
        userId: "user-42",
        username: "marie",
      })
    ).toBe(true);
  });

  it("refuse une correspondance par email ou pseudonyme (valeurs modifiables)", () => {
    // Un utilisateur qui change son email/pseudo pour celui d'un autre compte
    // ne doit pas hériter de l'accès à ses conversations.
    expect(
      chatOwnerMatches({
        chatUserId: "victime@example.com",
        email: "attaquant@example.com",
        userId: "user-99",
        username: "attaquant",
      })
    ).toBe(false);
    expect(
      chatOwnerMatches({
        chatUserId: "marie",
        email: "marie@example.com",
        userId: "user-99",
        username: "marie",
      })
    ).toBe(false);
    // Adresses proches (homoglyphes, sous-domaine trompeur) : jamais un accès.
    expect(
      chatOwnerMatches({
        chatUserId: "marie@exаmple.com",
        email: "marie@example.com",
        userId: "user-99",
      })
    ).toBe(false);
  });

  it("refuse un identifiant vide", () => {
    expect(chatOwnerMatches({ chatUserId: "", userId: "user-42" })).toBe(false);
  });

  it("ne tolère l'ancien comportement que sur activation explicite", async () => {
    expect(CHAT_OWNER_LEGACY_MATCH_ENABLED).toBe(false);

    process.env.CHAT_OWNER_LEGACY_MATCH = "true";
    vi.resetModules();
    const legacy = await import("@/lib/agent/channel");
    expect(legacy.CHAT_OWNER_LEGACY_MATCH_ENABLED).toBe(true);
    expect(
      legacy.chatOwnerMatches({
        chatUserId: "marie@example.com",
        email: "marie@example.com",
        userId: "user-99",
      })
    ).toBe(true);
  });
});
