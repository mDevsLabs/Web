import { describe, expect, it } from "vitest";
import {
  APP_CATALOG,
  APP_KEYS,
  APP_ORDER,
  appKeyFromPath,
  favoriteAppToPath,
  isAppKey,
  normalizeAppKey,
} from "@/lib/apps/catalog";

/**
 * Le catalogue des applications est la source unique du menu du logo, du
 * sélecteur d'applications du Site et de Wakies, du réglage « Menu favori » et
 * de la redirection post-login. L'ajout de Blackline le touche donc partout :
 * une clé oubliée ici produirait une entrée de menu qui mène nulle part, ou un
 * favori persisté que l'interface ne sait pas lire.
 */
describe("Blackline dans le catalogue des applications", () => {
  it("expose la clé dans les clés canoniques", () => {
    expect(APP_KEYS).toContain("blackline");
    expect(isAppKey("blackline")).toBe(true);
  });

  it("apparaît dans l'ordre d'affichage, avant le CLI", () => {
    const cles = APP_ORDER.map((entree) => entree.key);
    expect(cles).toEqual(["mai", "site", "vibe", "code", "blackline"]);
    // Le CLI n'est PAS dans APP_ORDER : c'est une entrée du « Menu favori »
    // qui ouvre le terminal local, pas une application web.
    expect(cles).not.toContain("cli");
  });

  it("pointe vers sa route et son préfixe", () => {
    expect(APP_CATALOG.blackline.path).toBe("/blackline");
    expect(APP_CATALOG.blackline.pathPrefix).toBe("/blackline");
    expect(APP_CATALOG.blackline.label).toBe("Blackline");
  });

  it("porte la description affichée dans le menu", () => {
    // La description est un texte d'interface : elle est écrite exactement,
    // et son orthographe est vérifiée par ce test.
    expect(APP_CATALOG.blackline.description).toBe(
      "Détendez-vous en attendant votre agent !"
    );
  });

  it("est reconnue par son URL", () => {
    expect(appKeyFromPath("/blackline")).toBe("blackline");
    expect(appKeyFromPath("/blackline/")).toBe("blackline");
  });

  it("reste fail-safe : une valeur illisible vaut « mai »", () => {
    expect(normalizeAppKey("blackline")).toBe("blackline");
    expect(normalizeAppKey("BLACKLINE")).toBe("mai");
    expect(normalizeAppKey("blacklinee")).toBe("mai");
    expect(normalizeAppKey(undefined)).toBe("mai");
    expect(normalizeAppKey(42)).toBe("mai");
  });

  it("est un favori valide", () => {
    expect(favoriteAppToPath("blackline")).toBe("/blackline");
    expect(favoriteAppToPath("n'importe quoi")).toBe("/");
  });

  it("ne détourne pas les autres applications", () => {
    // `/blackline` ne doit pas capter les routes des autres applications :
    // c'est le préfixe le plus long qui gagne, et `/blackline` est court.
    expect(appKeyFromPath("/site")).toBe("site");
    expect(appKeyFromPath("/vibe")).toBe("vibe");
    expect(appKeyFromPath("/coder")).toBe("code");
    expect(appKeyFromPath("/settings")).toBe("mai");
  });
});
