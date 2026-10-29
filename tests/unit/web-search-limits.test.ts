import { describe, expect, it } from "vitest";
import { getClientIp, normalizeIp } from "@/lib/net/client-ip";
import {
  clampWebSearchCount,
  normalizeWebSearchQuery,
  webSearchBudget,
} from "../../web-search-limits";

describe("Adresse cliente — X-Forwarded-For", () => {
  function headers(values: Record<string, string>) {
    const lower = new Map(
      Object.entries(values).map(([key, value]) => [key.toLowerCase(), value])
    );
    return { get: (name: string) => lower.get(name.toLowerCase()) ?? null };
  }

  it("retient la dernière entrée, ajoutée par le proxy de bord", () => {
    expect(
      getClientIp(
        headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1, 203.0.113.9" })
      )
    ).toBe("203.0.113.9");
  });

  it("ignore une première entrée forgée : changer le début ne change rien", () => {
    const ip = "203.0.113.9";
    const forgedA = getClientIp(
      headers({ "x-forwarded-for": `6.6.6.6, ${ip}` })
    );
    const forgedB = getClientIp(
      headers({ "x-forwarded-for": `9.9.9.9, 8.8.8.8, ${ip}` })
    );
    expect(forgedA).toBe(ip);
    expect(forgedB).toBe(ip);
  });

  it("accepte IPv6, crochets et port", () => {
    expect(
      getClientIp(headers({ "x-forwarded-for": "[2001:db8::1]:443" }))
    ).toBe("2001:db8::1");
    expect(
      getClientIp(headers({ "x-forwarded-for": "198.51.100.4:8080" }))
    ).toBe("198.51.100.4");
    expect(normalizeIp("::1")).toBe("::1");
  });

  it("replie sur x-real-ip puis unknown", () => {
    expect(getClientIp(headers({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7"
    );
    expect(getClientIp(headers({}))).toBe("unknown");
    expect(getClientIp(headers({ "x-forwarded-for": "pas-une-ip" }))).toBe(
      "unknown"
    );
  });

  it("rejette les octets IPv4 hors bornes", () => {
    expect(normalizeIp("999.1.1.1")).toBeNull();
  });
});

describe("Recherche Web — bornes publiques", () => {
  it("ramène count dans [1, 10]", () => {
    expect(clampWebSearchCount(undefined)).toBe(5);
    expect(clampWebSearchCount("abc")).toBe(5);
    expect(clampWebSearchCount(-3)).toBe(1);
    expect(clampWebSearchCount(999)).toBe(10);
    expect(clampWebSearchCount("7")).toBe(7);
    expect(clampWebSearchCount(3.9)).toBe(3);
  });

  it("refuse une requête vide, non textuelle ou trop longue", () => {
    expect(normalizeWebSearchQuery("  ")).toBeNull();
    expect(normalizeWebSearchQuery(42)).toBeNull();
    expect(normalizeWebSearchQuery("a".repeat(501))).toBeNull();
    expect(normalizeWebSearchQuery("  mai  ")).toBe("mai");
    expect(normalizeWebSearchQuery("a".repeat(500))).toHaveLength(500);
  });

  it("attribue un budget distinct à l'anonyme et au compte", () => {
    const anonymous = webSearchBudget({ ip: "203.0.113.9" });
    expect(anonymous.key).toBe("web-search:ip:203.0.113.9");
    expect(anonymous.limit).toBe(30);

    const account = webSearchBudget({ ip: "203.0.113.9", userId: "u-1" });
    expect(account.key).toBe("web-search:user:u-1");
    expect(account.limit).toBe(60);
  });
});
