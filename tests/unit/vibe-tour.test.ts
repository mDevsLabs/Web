import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripVibeBasePath, toVibePath } from "@/components/vibe/router";
import { TOUR_STEPS } from "@/components/vibe/tutorial/TourSteps";
import {
  clearTourFlags,
  isTourCompleted,
  markTourCompleted,
  shouldAutoStartTour,
  skipFullTour,
} from "@/lib/vibe/services/tutorialService";

// Le tour guide est fait de deux contrats fragiles, chacun déjà payé en bug :
// 1. les routes cibles sont RELATIVES à /vibe (TourSteps), mais le navigateur
//    vit sous `/vibe/...` — la comparaison doit passer par stripVibeBasePath,
//    sinon le tour navigue en boucle ;
// 2. l'auto-démarrage est piloté par deux clés localStorage (fini, rejeté) —
//    un tour fermé par l'utilisateur ne doit jamais revenir tout seul.

function installLocalStorage() {
  const store = new Map<string, string>();
  const local = {
    getItem: (k: string) => store.get(k) ?? null,
    removeItem: (k: string) => store.delete(k),
    setItem: (k: string, v: string) => store.set(k, v),
  };
  vi.stubGlobal("window", { localStorage: local });
}

beforeEach(() => {
  installLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("drapeaux localStorage du tour", () => {
  it("nouveau visiteur : le tour peut se proposer", () => {
    expect(shouldAutoStartTour()).toBe(true);
    expect(isTourCompleted()).toBe(false);
  });
  it("tour terminé : plus jamais de relance automatique", () => {
    markTourCompleted();
    expect(isTourCompleted()).toBe(true);
    expect(shouldAutoStartTour()).toBe(false);
  });
  it("tour fermé (rejet) : plus jamais de relance non plus", () => {
    skipFullTour();
    expect(shouldAutoStartTour()).toBe(false);
  });
  it("« Refaire le tutoriel » efface fini ET rejet", () => {
    markTourCompleted();
    skipFullTour();
    clearTourFlags();
    expect(shouldAutoStartTour()).toBe(true);
    expect(isTourCompleted()).toBe(false);
  });
});

describe("routes du tour sous le basePath /vibe (règle d'or n° 3)", () => {
  it("chaque route cible revient à elle après l'aller-retour hôte → Vibe", () => {
    const routes = [...new Set(TOUR_STEPS.map((s) => s.route))];
    for (const route of routes) {
      // La page réelle est `/vibe/explore` ; le tour compare en relatif.
      expect(stripVibeBasePath(toVibePath(route))).toBe(route);
    }
  });
  it("le cas racine (accueil) est bien couvert", () => {
    expect(stripVibeBasePath(toVibePath("/"))).toBe("/");
  });
});
