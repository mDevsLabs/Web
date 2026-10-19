import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTargetApp } from "@/hooks/use-app-auto-redirect";

describe("resolveTargetApp", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Réinitialisation de l'environnement mock window
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        search: "",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("identifie coder à partir du paramètre ?app=coder", () => {
    window.location.search = "?app=coder";
    expect(resolveTargetApp()).toBe("coder");
  });

  it("identifie coder à partir de l'alias ?app=code", () => {
    window.location.search = "?app=code";
    expect(resolveTargetApp()).toBe("coder");
  });

  it("identifie vibe à partir du paramètre ?app=vibe", () => {
    window.location.search = "?app=vibe";
    expect(resolveTargetApp()).toBe("vibe");
  });

  it("identifie web à partir du paramètre ?app=web ou ?app=mai", () => {
    window.location.search = "?app=web";
    expect(resolveTargetApp()).toBe("web");

    window.location.search = "?app=mai";
    expect(resolveTargetApp()).toBe("web");
  });

  it("identifie la cible à partir de window.maiDesktop.targetApp", () => {
    window.location.search = "";
    (window as any).maiDesktop = { targetApp: "coder" };
    expect(resolveTargetApp()).toBe("coder");

    (window as any).maiDesktop = { targetApp: "vibe" };
    expect(resolveTargetApp()).toBe("vibe");

    (window as any).maiDesktop = { targetApp: "web" };
    expect(resolveTargetApp()).toBe("web");
  });

  it("identifie vibe sur mobile Capacitor via le hostname", () => {
    window.location.search = "";
    (window as any).maiDesktop = undefined;
    (window as any).Capacitor = {
      isNativePlatform: () => true,
    };
    window.location.hostname = "mai-vibe.vercel.app";

    expect(resolveTargetApp()).toBe("vibe");
  });

  it("renvoie null en l'absence de cible spécifique (comportement web classique)", () => {
    window.location.search = "";
    (window as any).maiDesktop = undefined;
    (window as any).Capacitor = undefined;
    window.location.hostname = "mai-officiel.vercel.app";

    expect(resolveTargetApp()).toBeNull();
  });
});
