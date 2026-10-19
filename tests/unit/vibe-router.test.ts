import { describe, expect, it } from "vitest";
import {
  deriveVibeRouteParams,
  stripVibeBasePath,
  toVibeAbsoluteUrl,
  toVibePath,
  VIBE_BASE_PATH,
} from "@/components/vibe/router";

// Vibe a été écrit pour react-router et vit chez lui à la racine (`/explore`,
// `/@marie`, `/post/42`). Intégré sous `/vibe`, il repose entièrement sur
// l'adaptateur `components/vibe/router.tsx` : deux conversions, dans les deux
// sens, et une table de paramètres. Ces trois fonctions sont pures ; une erreur
// ici ne casse rien visiblement — elle fait afficher la mauvaise page (un
// `/u/marie` interprété comme le profil « u », un `/profile/marie` qui montre
// votre propre profil). D'où ces tests, sans routeur ni DOM.

describe("toVibePath — du chemin Vibe vers l'URL de l'hôte", () => {
  it("préfixe les chemins relatifs", () => {
    expect(toVibePath("/")).toBe("/vibe");
    expect(toVibePath("")).toBe("/vibe");
    expect(toVibePath("/explore")).toBe("/vibe/explore");
    expect(toVibePath("explore")).toBe("/vibe/explore");
    expect(toVibePath("/@marie")).toBe("/vibe/@marie");
  });

  it("conserve la requête et l'ancre", () => {
    expect(toVibePath("/explore/forYou?tab=media#haut")).toBe(
      "/vibe/explore/forYou?tab=media#haut"
    );
    expect(toVibePath("/messages?conv=7")).toBe("/vibe/messages?conv=7");
    expect(toVibePath("/post/42#commentaires")).toBe(
      "/vibe/post/42#commentaires"
    );
  });

  it("ne double jamais le préfixe — la conversion est idempotente", () => {
    const chemins = [
      "/",
      "/explore",
      "/post/42",
      "/@marie",
      "/books/join/AB3DEFG7",
    ];
    for (const chemin of chemins) {
      const uneFois = toVibePath(chemin);
      expect(toVibePath(uneFois)).toBe(uneFois);
      // La racine vaut exactement `/vibe` ; le reste vit sous `/vibe/…`.
      expect(
        uneFois === VIBE_BASE_PATH || uneFois.startsWith(`${VIBE_BASE_PATH}/`)
      ).toBe(true);
    }
    expect(toVibePath("/vibe")).toBe("/vibe");
    expect(toVibePath("/vibe?x=1")).toBe("/vibe?x=1");
  });

  it("laisse passer les URL absolues et les protocoles externes", () => {
    expect(toVibePath("https://exemple.fr/a")).toBe("https://exemple.fr/a");
    expect(toVibePath("mailto:marie@exemple.fr")).toBe(
      "mailto:marie@exemple.fr"
    );
    expect(toVibePath("//cdn.exemple.fr/image.png")).toBe(
      "//cdn.exemple.fr/image.png"
    );
  });
});

describe("stripVibeBasePath — de l'URL de l'hôte vers le chemin Vibe", () => {
  it("réduit la racine de Vibe à « / »", () => {
    // Le cas le plus fréquent de l'application : les composants comparent
    // `location.pathname === '/'`. Sans cette réduction, l'onglet d'accueil
    // n'est jamais marqué actif.
    expect(stripVibeBasePath("/vibe")).toBe("/");
    expect(stripVibeBasePath("/vibe/")).toBe("/");
  });

  it("retire le préfixe sans toucher au reste", () => {
    expect(stripVibeBasePath("/vibe/explore")).toBe("/explore");
    expect(stripVibeBasePath("/vibe/@marie")).toBe("/@marie");
    expect(stripVibeBasePath("/vibe/messages?x=1")).toBe("/messages?x=1");
  });

  it("ne coupe pas un chemin qui commence seulement par les mêmes lettres", () => {
    expect(stripVibeBasePath("/vibetruc")).toBe("/vibetruc");
    expect(stripVibeBasePath("/")).toBe("/");
  });

  it("est l'inverse de toVibePath pour les chemins de Vibe", () => {
    const chemins = ["/", "/explore", "/explore/forYou", "/post/42", "/@marie"];
    for (const chemin of chemins) {
      expect(stripVibeBasePath(toVibePath(chemin))).toBe(chemin);
    }
  });
});

describe("toVibeAbsoluteUrl — liens copiés et partagés", () => {
  // Sans `window` (ici, en test unitaire), la fonction rend le chemin seul :
  // c'est la partie qui compte, car c'est elle qui manquait.
  it("inclut le préfixe /vibe", () => {
    expect(toVibeAbsoluteUrl("/post/42")).toBe("/vibe/post/42");
    expect(toVibeAbsoluteUrl("/@marie")).toBe("/vibe/@marie");
    expect(toVibeAbsoluteUrl("/books/join/AB3DEFG7")).toBe(
      "/vibe/books/join/AB3DEFG7"
    );
  });

  it("ne double pas le préfixe d'un chemin déjà préfixé", () => {
    expect(toVibeAbsoluteUrl("/vibe/messages?conv=7&msg=12")).toBe(
      "/vibe/messages?conv=7&msg=12"
    );
  });
});

describe("deriveVibeRouteParams — forme de l'URL vers paramètres", () => {
  it("ne nomme aucun paramètre sur les pages fixes", () => {
    // Toute la table des routes générées (scripts/build-vibe-routes.mjs) : si un
    // segment fixe était pris pour un pseudo, la page afficherait un profil.
    const pagesFixes = [
      "/",
      "/explore",
      "/explore/forYou",
      "/messages",
      "/notifications",
      "/mai",
      "/settings",
      "/stats",
      "/profile",
      "/books",
      "/books/join",
    ];
    for (const chemin of pagesFixes) {
      expect(deriveVibeRouteParams(chemin)).toEqual({});
    }
  });

  it("lit le profil quel que soit le chemin employé", () => {
    // `/vibe/@marie` est l'URL de Vibe ; `/vibe/u/marie` la cible de sa
    // réécriture (next.config.ts) ; `/vibe/profile/marie` la route explicite.
    expect(deriveVibeRouteParams("/@marie")).toEqual({ username: "marie" });
    expect(deriveVibeRouteParams("/marie")).toEqual({ username: "marie" });
    expect(deriveVibeRouteParams("/u/marie")).toEqual({ username: "marie" });
    expect(deriveVibeRouteParams("/profile/marie")).toEqual({
      username: "marie",
    });
    // Le pseudo peut lui-même commencer par une arobase (lien recopié tel quel).
    expect(deriveVibeRouteParams("/u/@marie")).toEqual({ username: "marie" });
  });

  it("ne confond pas un identifiant numérique de profil avec la page « u »", () => {
    expect(deriveVibeRouteParams("/u/42")).toEqual({ username: "42" });
  });

  it("lit la publication, le livre et le code d'invitation", () => {
    expect(deriveVibeRouteParams("/post/abc-def")).toEqual({
      postId: "abc-def",
    });
    expect(deriveVibeRouteParams("/books/42")).toEqual({ bookId: "42" });
    expect(deriveVibeRouteParams("/books/join/AB3DEFG7")).toEqual({
      code: "AB3DEFG7",
    });
  });

  it("la lecture est indifférente au préfixe déjà retiré", () => {
    // `useVibeRouteParams` passe par stripVibeBasePath, mais la fonction est
    // pure : on vérifie la composition des deux, comme le fait le routeur.
    expect(deriveVibeRouteParams(stripVibeBasePath("/vibe/u/marie"))).toEqual({
      username: "marie",
    });
    expect(
      deriveVibeRouteParams(stripVibeBasePath("/vibe/books/join/AB3DEFG7"))
    ).toEqual({ code: "AB3DEFG7" });
  });
});
