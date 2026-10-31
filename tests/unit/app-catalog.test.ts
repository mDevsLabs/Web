import { describe, expect, it } from "vitest";
import {
  APP_CATALOG,
  APP_MENU_ORDER,
  APP_ORDER,
  appKeyFromPath,
  favoriteAppToPath,
  isAppKey,
  normalizeAppKey,
} from "@/lib/apps/catalog";

describe("catalogue des applications", () => {
  it("expose les applications dans l'ordre canonique", () => {
    expect(APP_ORDER.map((entry) => entry.key)).toEqual([
      "mai",
      "site",
      "vibe",
      "code",
      "blackline",
      "quizzly",
    ]);
  });

  it("expose le menu des applications dans son ordre d'affichage", () => {
    // Le menu n'est PAS `APP_ORDER` : il glisse le CLI entre Coder et
    // Blackline. Un seul endroit décrit cet ordre, et les trois rendus du
    // menu le consomment.
    expect(
      APP_MENU_ORDER.map((entry) =>
        entry.kind === "cli" ? "cli" : entry.entry.key
      )
    ).toEqual(["mai", "site", "vibe", "code", "cli", "blackline", "quizzly"]);
  });

  it("ne déclare le CLI qu'une seule fois dans le menu", () => {
    const cles = APP_MENU_ORDER.map((entry) =>
      entry.kind === "cli" ? "cli" : entry.entry.key
    );
    expect(cles.filter((cle) => cle === "cli")).toHaveLength(1);
  });

  it("pointe chaque application vers sa route d'entrée", () => {
    expect(APP_CATALOG.mai.path).toBe("/");
    expect(APP_CATALOG.site.path).toBe("/site");
    expect(APP_CATALOG.vibe.path).toBe("/vibe");
    expect(APP_CATALOG.code.path).toBe("/coder");
    expect(APP_CATALOG.blackline.path).toBe("/blackline");
    expect(APP_CATALOG.quizzly.path).toBe("/quizzly");
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
    expect(APP_CATALOG.blackline.description).toBe(
      "Détendez-vous en attendant votre agent !"
    );
    expect(APP_CATALOG.quizzly.description).toBe(
      "Révisez le collège et le lycée, un quiz à la fois"
    );
  });
});

describe("normalizeAppKey", () => {
  it("accepte les clés canoniques", () => {
    for (const key of [
      "mai",
      "site",
      "vibe",
      "code",
      "blackline",
      "quizzly",
    ] as const) {
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
    expect(favoriteAppToPath("blackline")).toBe("/blackline");
    expect(favoriteAppToPath("quizzly")).toBe("/quizzly");
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
    expect(appKeyFromPath("/blackline")).toBe("blackline");
    expect(appKeyFromPath("/quizzly")).toBe("quizzly");
    expect(appKeyFromPath("/quizzly/profil")).toBe("quizzly");
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
