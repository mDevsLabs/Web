import { describe, expect, it } from "vitest";
import {
  APP_CATALOG,
  APP_ORDER,
  appKeyFromPath,
  favoriteAppToPath,
  isAppKey,
  normalizeAppKey,
} from "@/lib/apps/catalog";

describe("catalogue des applications", () => {
  it("expose les quatre applications dans l'ordre canonique", () => {
    expect(APP_ORDER.map((entry) => entry.key)).toEqual([
      "mai",
      "site",
      "vibe",
      "code",
    ]);
  });

  it("pointe chaque application vers sa route d'entrée", () => {
    expect(APP_CATALOG.mai.path).toBe("/");
    expect(APP_CATALOG.site.path).toBe("/site");
    expect(APP_CATALOG.vibe.path).toBe("/vibe");
    expect(APP_CATALOG.code.path).toBe("/coder");
  });

  it("porte les descriptions affichées dans le menu du logo", () => {
    expect(APP_CATALOG.mai.description).toBe(
      "L'application de conversations et travail"
    );
    expect(APP_CATALOG.site.description).toBe(
      "Site web d'mAI avec la plateforme mAI et modèles"
    );
    expect(APP_CATALOG.vibe.description).toBe(
      "Votre plateforme de divertissement"
    );
    expect(APP_CATALOG.code.description).toBe("L'outil de codage pour IA");
  });
});

describe("normalizeAppKey", () => {
  it("accepte les quatre clés canoniques", () => {
    for (const key of ["mai", "site", "vibe", "code"] as const) {
      expect(normalizeAppKey(key)).toBe(key);
    }
  });

  it("retombe sur mAI pour toute valeur illisible (fail-safe)", () => {
    expect(normalizeAppKey(undefined)).toBe("mai");
    expect(normalizeAppKey(null)).toBe("mai");
    expect(normalizeAppKey("")).toBe("mai");
    expect(normalizeAppKey("chatgpt")).toBe("mai");
    expect(normalizeAppKey(42)).toBe("mai");
    // Un tier illisible accorde « free » ; une app illisible accorde « mai » :
    // même logique, aucune valeur fantôme persistée puis rejouée.
    expect(normalizeAppKey("MAI")).toBe("mai");
  });
});

describe("isAppKey", () => {
  it("est un garde de type exact", () => {
    expect(isAppKey("vibe")).toBe(true);
    expect(isAppKey("Vibe")).toBe(false);
    expect(isAppKey("")).toBe(false);
    expect(isAppKey(null)).toBe(false);
  });
});

describe("favoriteAppToPath", () => {
  it("renvoie le chemin d'entrée de l'application", () => {
    expect(favoriteAppToPath("mai")).toBe("/");
    expect(favoriteAppToPath("site")).toBe("/site");
    expect(favoriteAppToPath("vibe")).toBe("/vibe");
    expect(favoriteAppToPath("code")).toBe("/coder");
  });

  it("est fail-safe sur une valeur inconnue", () => {
    expect(favoriteAppToPath("n'importe quoi")).toBe("/");
  });
});

describe("appKeyFromPath", () => {
  it("identifie les applications par préfixe de route", () => {
    expect(appKeyFromPath("/site")).toBe("site");
    expect(appKeyFromPath("/site/account")).toBe("site");
    expect(appKeyFromPath("/vibe")).toBe("vibe");
    expect(appKeyFromPath("/vibe/u/pseudo")).toBe("vibe");
    expect(appKeyFromPath("/coder")).toBe("code");
  });

  it("attribue tout le reste à mAI", () => {
    expect(appKeyFromPath("/")).toBe("mai");
    expect(appKeyFromPath("/chat/abc")).toBe("mai");
    expect(appKeyFromPath("/settings")).toBe("mai");
    expect(appKeyFromPath("/")).toBe("mai");
  });

  it("est fail-safe sur un chemin absent", () => {
    expect(appKeyFromPath(null)).toBe("mai");
    expect(appKeyFromPath(undefined)).toBe("mai");
  });
});
