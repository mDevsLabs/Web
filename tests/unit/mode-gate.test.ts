import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { isTierKnownFree, resolveChatExperience } from "@/lib/agent/mode-gate";
import { resolveTierInfo } from "@/lib/auth/tier-info";

// Garde-fous du correctif « impossible de passer de Chat à Agent ».
//
// Cause racine (commits f59bc20/6eb9ebf, étendue ici) : des canaux de tier
// client traitaient l'ABSENCE de données comme « Free » — un échec réseau de
// /api/agent/flags mettait tier="free" en cache SWR, et /api/settings en échec
// produisait loaded=true avec le repli "Free". Un abonné Plus était alors
// réassigné silencieusement à l'accueil Chat. Règle désormais : un tier
// inconnu (chargement ou échec) ne verrouille JAMAIS le curseur côté client ;
// le serveur arbitre à l'envoi (plan_required).

const CHAT_SHELL = "components/chat/shell.tsx";
const USE_TIER = "hooks/use-tier.ts";
const TIER_INFO = "lib/auth/tier-info.ts";

function source(relativePath: string): string {
  return readFileSync(
    path.resolve(import.meta.dirname, "../..", relativePath),
    "utf8"
  );
}

describe("isTierKnownFree (garde de mode)", () => {
  it("ne reconnaît free que si le tier est explicitement la chaîne free", () => {
    expect(isTierKnownFree("free")).toBe(true);
    expect(isTierKnownFree("Free")).toBe(true);
    expect(isTierKnownFree(" FREE ")).toBe(true);
  });

  it("traite un tier inconnu (null, vide, exotique) comme NON free", () => {
    expect(isTierKnownFree(null)).toBe(false);
    expect(isTierKnownFree(undefined)).toBe(false);
    expect(isTierKnownFree("")).toBe(false);
    expect(isTierKnownFree("   ")).toBe(false);
    expect(isTierKnownFree("plus")).toBe(false);
  });
});

describe("resolveChatExperience (garde de mode Chat | Agent)", () => {
  it("autorise Agent pour un abonné payant connu", () => {
    expect(
      resolveChatExperience({ agentEnabled: true, mode: "agent", tier: "plus" })
    ).toEqual({ status: "agent" });
    expect(
      resolveChatExperience({ agentEnabled: true, mode: "agent", tier: "max" })
    ).toEqual({ status: "agent" });
  });

  it("bloque uniquement un tier CONNU comme free", () => {
    expect(
      resolveChatExperience({ agentEnabled: true, mode: "agent", tier: "free" })
    ).toEqual({ reason: "plan", status: "blocked" });
  });

  it("ne verrouille JAMAIS sur un tier inconnu (chargement ou échec réseau)", () => {
    expect(
      resolveChatExperience({ agentEnabled: true, mode: "agent", tier: null })
    ).toEqual({ status: "agent" });
    expect(
      resolveChatExperience({
        agentEnabled: true,
        mode: "agent",
        tier: null,
      })
    ).toEqual({ status: "agent" });
  });

  it("bloque quand le flag agent.enabled est coupé, quel que soit le tier", () => {
    expect(
      resolveChatExperience({ agentEnabled: false, mode: "agent", tier: "max" })
    ).toEqual({ reason: "disabled", status: "blocked" });
  });

  it("honore Chat pour tous les tiers", () => {
    for (const tier of ["free", "plus", null] as const) {
      expect(
        resolveChatExperience({ agentEnabled: true, mode: "chat", tier })
      ).toEqual({ status: "chat" });
    }
  });

  it("retombe sur Chat pour un mode stocké invalide, sans lever", () => {
    expect(
      resolveChatExperience({ agentEnabled: true, mode: "???", tier: "plus" })
    ).toEqual({ status: "chat" });
  });
});

describe("resolveTierInfo (tier dérivé de /api/settings)", () => {
  it("propage le tier utilisateur connu", () => {
    const info = resolveTierInfo({
      data: { user: { tier: "Plus" } },
      error: undefined,
      isLoading: false,
    });
    expect(info.loaded).toBe(true);
    expect(info.normalized).toBe("plus");
    expect(info.isFree).toBe(false);
    expect(info.isPaid).toBe(true);
  });

  it("ne considère PAS le chargement comme un tier connu", () => {
    const info = resolveTierInfo({
      data: undefined,
      error: undefined,
      isLoading: true,
    });
    expect(info.loaded).toBe(false);
  });

  it("ne considère PAS un échec réseau comme un tier connu (le repli Free ne doit pas verrouiller)", () => {
    // C'est le cœur du bug : isLoading=false + data=undefined + error présent
    // donnaient loaded=true avec raw="Free" → abonné Plus re-bloqué.
    const info = resolveTierInfo({
      data: undefined,
      error: new Error("HTTP 503"),
      isLoading: false,
    });
    expect(info.loaded).toBe(false);
  });

  it("un payload reçu mais sans champ tier reste un tier CONNU avec repli Free explicite", () => {
    const info = resolveTierInfo({
      data: {},
      error: undefined,
      isLoading: false,
    });
    expect(info.loaded).toBe(true);
    expect(info.raw).toBe("Free");
    expect(info.isFree).toBe(true);
  });

  it("propage les variantes de canal (aiUsage.tier, imagesUsage.plan, speechUsage.tier)", () => {
    expect(
      resolveTierInfo({
        data: { aiUsage: { tier: "Pro" } },
        isLoading: false,
      }).normalized
    ).toBe("pro");
    expect(
      resolveTierInfo({
        data: { imagesUsage: { plan: "Max" } },
        isLoading: false,
      }).normalized
    ).toBe("max");
    expect(
      resolveTierInfo({
        data: { speechUsage: { tier: "plus" } },
        isLoading: false,
      }).normalized
    ).toBe("plus");
  });
});

describe("Sources client du tier (garde-fous de structure)", () => {
  it("hooks/use-tier délègue à resolveTierInfo et transmet error", () => {
    const hook = source(USE_TIER);
    expect(hook).toContain("resolveTierInfo");
    expect(hook).toContain("error");
    expect(hook).not.toContain('"Free"');
  });

  it("le shell combine flagsTier puis tier settings uniquement s'il est connu", () => {
    const shell = source(CHAT_SHELL);
    expect(shell).toContain("flagsTier ??");
    expect(shell).toContain("isSettingsTierLoaded");
    expect(shell).toContain("resolveChatExperience");
  });

  it("resolveTierInfo exige data non nulle pour loaded=true", () => {
    const info = source(TIER_INFO);
    expect(info).toContain("data !== null && data !== undefined");
  });
});
