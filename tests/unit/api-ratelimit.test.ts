import { afterEach, describe, expect, it } from "vitest";
import { type ApiRateLimitAction, checkApiRateLimit } from "@/lib/ratelimit";

// `checkApiRateLimit` replie sur le compteur mémoire quand Redis est absent, ce
// qui est le cas des tests unitaires. On vide donc les seaux entre chaque cas.
const ACTION: ApiRateLimitAction = "memory_import";

async function drain(action: ApiRateLimitAction, userId: string, ip: string) {
  // 40 appels couvrent les politiques les plus strictes du tableau (5/h).
  for (let i = 0; i < 40; i++) {
    await checkApiRateLimit({ action, ip, userId });
  }
}

describe("Limitation des routes API coûteuses", () => {
  const ips = new Set<string>();
  const users = new Set<string>();

  function unique(prefix: string): string {
    const value = `${prefix}-${Math.random().toString(36).slice(2)}`;
    if (prefix === "ip") {
      ips.add(value);
    } else {
      users.add(value);
    }
    return value;
  }

  afterEach(async () => {
    // Purge par saturation : chaque action a ses propres seaux mémoire.
    for (const userId of users) {
      await drain(ACTION, userId, "purge");
    }
    users.clear();
    ips.clear();
  });

  it("autorise une première requête", async () => {
    const userId = unique("user");
    const result = await checkApiRateLimit({
      action: ACTION,
      ip: unique("ip"),
      userId,
    });
    expect(result.allowed).toBe(true);
  });

  it("autorise exactement le budget déclaré, puis refuse", async () => {
    const userId = unique("user");
    const ip = unique("ip");
    // Politique de l'action testée : 5 requêtes par heure et par utilisateur.
    const allowed: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const result = await checkApiRateLimit({ action: ACTION, ip, userId });
      allowed.push(result.allowed);
    }
    expect(allowed).toEqual([true, true, true, true, true, false, false]);
  });

  it("renseigne un délai de réessai croissant et borné", async () => {
    const userId = unique("user");
    const ip = unique("ip");
    let refusal: { allowed: false; retryAfterSeconds: number } | null = null;
    for (let i = 0; i < 8; i++) {
      const result = await checkApiRateLimit({ action: ACTION, ip, userId });
      if (!result.allowed) {
        refusal = result;
        break;
      }
    }
    expect(refusal).not.toBeNull();
    if (refusal) {
      expect(refusal.retryAfterSeconds).toBeGreaterThan(0);
      expect(refusal.retryAfterSeconds).toBeLessThanOrEqual(3600);
    }
  });

  it("sépare deux utilisateurs sur la même adresse IP", async () => {
    const ip = unique("ip");
    const first = unique("user");
    const second = unique("user");
    for (let i = 0; i < 7; i++) {
      await checkApiRateLimit({ action: ACTION, ip, userId: first });
    }
    // L'IP a été saturée par le premier compte ; le second ne doit pas être
    // impacté tant que le seau IP ne déborde pas lui aussi.
    const secondResult = await checkApiRateLimit({
      action: ACTION,
      ip,
      userId: second,
    });
    expect(secondResult.allowed).toBe(true);
  });

  it("n'accorde aucun accès si l'IP est saturée", async () => {
    const ip = unique("ip");
    // Seuil IP de l'action : 15/h. On sature via un compte par lots de 5.
    for (let i = 0; i < 3; i++) {
      const userId = unique("user");
      for (let j = 0; j < 6; j++) {
        await checkApiRateLimit({ action: ACTION, ip, userId });
      }
    }
    const result = await checkApiRateLimit({
      action: ACTION,
      ip,
      userId: unique("user"),
    });
    expect(result.allowed).toBe(false);
  });

  it("isole les actions entre elles", async () => {
    const userId = unique("user");
    const ip = unique("ip");
    for (let i = 0; i < 8; i++) {
      await checkApiRateLimit({ action: ACTION, ip, userId });
    }
    const saturated = await checkApiRateLimit({
      action: ACTION,
      ip,
      userId,
    });
    expect(saturated.allowed).toBe(false);

    // Une action distincte a ses propres seaux : elle n'est pas affectée.
    const other = await checkApiRateLimit({
      action: "memory_summary",
      ip,
      userId,
    });
    expect(other.allowed).toBe(true);
  });

  it("fonctionne sans utilisateur ni IP connus", async () => {
    const result = await checkApiRateLimit({ action: ACTION });
    expect(result.allowed).toBe(true);
  });

  it("ne se laisse pas tromper par un identifiant en espace", async () => {
    const userId = unique("user");
    const ip = unique("ip");
    for (let i = 0; i < 7; i++) {
      await checkApiRateLimit({ action: ACTION, ip, userId });
    }
    const padded = await checkApiRateLimit({
      action: ACTION,
      ip,
      userId: `   ${userId}   `,
    });
    expect(padded.allowed).toBe(false);
  });
});
