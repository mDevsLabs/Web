import { describe, expect, it } from "vitest";
import {
  buildMePayload,
  getVibeWeekData,
  iso,
  normalizeVibeTier,
  num,
} from "@/lib/vibe/server/shape";

// Les lecteurs base de Vibe doivent produire le MÊME JSON que l'API : les
// composants comparent des alias snake_case, lisent des dates en string et des
// compteurs en number. Le driver Postgres renvoie des `Date` et des string
// pour les agrégats — sans ces mappers, l'hydratation silencieusement fausse
// l'UI (compteurs NaN, tri de dates cassés). Ces fonctions sont pures : pas de
// base, pas de fetch.

describe("iso()", () => {
  it("convertit les Date en chaînes ISO comme le ferait un JSON API", () => {
    const d = new Date("2026-10-10T12:00:00.000Z");
    expect(iso(d)).toBe("2026-10-10T12:00:00.000Z");
  });
  it("laisse les chaînes et autres valeurs telles quelles", () => {
    expect(iso("2026-10-10T12:00:00.000Z")).toBe("2026-10-10T12:00:00.000Z");
    expect(iso(null)).toBeNull();
    expect(iso(undefined)).toBeNull();
  });
});

describe("num()", () => {
  it("coerce les agrégats textuels du driver", () => {
    expect(num("42")).toBe(42);
    expect(num("7.5")).toBe(7.5);
  });
  it("retombe sur le défaut pour toute valeur illisible", () => {
    expect(num(null)).toBe(0);
    expect(num(undefined, 3)).toBe(3);
    expect(num("abc", 9)).toBe(9);
  });
});

describe("normalizeVibeTier()", () => {
  it("mappe les alias du backend, dont « gratuit »", () => {
    expect(normalizeVibeTier("gratuit")).toBe("Free");
    expect(normalizeVibeTier(" PRO ")).toBe("Pro");
    expect(normalizeVibeTier("max")).toBe("Max");
  });
  it("retombe TOUJOURS sur Free (un tier illisible ne doit rien accorder)", () => {
    expect(normalizeVibeTier(null)).toBe("Free");
    expect(normalizeVibeTier("Ultimate")).toBe("Free");
    expect(normalizeVibeTier("")).toBe("Free");
  });
});

describe("getVibeWeekData()", () => {
  it("débute la semaine en UTC (lundi) et annonce la prochaine remise à zéro", () => {
    const { nextResetIso, weekStartStr } = getVibeWeekData();
    expect(weekStartStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const start = new Date(`${weekStartStr}T00:00:00.000Z`);
    const reset = new Date(nextResetIso);
    expect(start.getUTCDay()).toBe(1);
    expect(reset.getTime() - start.getTime()).toBe(7 * 86_400_000);
  });
});

describe("buildMePayload()", () => {
  const row = {
    avatar_url: "https://cdn/a.png",
    banner_url: "https://cdn/b.png",
    bio: null,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    display_name: null,
    email: "marie@example.com",
    followers_count: 3,
    following_count: 2,
    id: 7,
    interests: null,
    is_verified: false,
    location: null,
    posts_count: 11,
    tier: "Plus",
    username: "marie",
    website: null,
  };

  it("réplique le shape camelCase de /v1/me, défauts inclus", () => {
    const payload = buildMePayload(row, "12", "1");
    expect(payload.profile).toEqual({
      avatarUrl: "https://cdn/a.png",
      bannerUrl: "https://cdn/b.png",
      bio: "",
      displayName: "marie",
      followersCount: 3,
      followingCount: 2,
      id: 7,
      interests: [],
      is_verified: false,
      location: "",
      postsCount: 11,
      username: "marie",
      website: "",
    });
    expect(payload.user.created_at).toBe("2026-01-01T00:00:00.000Z");
    expect(payload.user.is_verified).toBe(false);
  });

  it("applique les limites backend et les compteurs en number", () => {
    const payload = buildMePayload(row, "12", "1");
    expect(payload.quotas.tier).toBe("Plus");
    expect(payload.quotas.weeklyTokens).toEqual({
      limit: 20_000_000,
      percent: 0,
      used: 12,
    });
    expect(payload.quotas.dailyImages).toEqual({
      limit: 10,
      percent: 10,
      used: 1,
    });
  });

  it(" plafonne le pourcentage à 100", () => {
    const payload = buildMePayload(row, 999_000_000, 99);
    expect(payload.quotas.weeklyTokens.percent).toBe(100);
    expect(payload.quotas.dailyImages.percent).toBe(100);
  });
});
