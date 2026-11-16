import { describe, expect, it } from "vitest";
import {
  createMaintenanceBypassToken,
  generateMaintenanceAccessCode,
  isMaintenanceBypassValid,
} from "@/lib/maintenance/maintenance-bypass";
import {
  estExempteDeMaintenance,
  MESSAGE_MAINTENANCE_API,
  PREFIXES_EXEMPTES_MAINTENANCE,
} from "@/lib/maintenance/maintenance-policy";
import { resolveMaintenancePhase } from "@/lib/maintenance/maintenance-service";

describe("Politique de maintenance — exemptions strictes", () => {
  it("contient les préfixes critiques indispensables à la page de maintenance", () => {
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/maintenance");
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/api/maintenance/status");
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/api/maintenance/bypass");
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/_next/");
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/ping");
    expect(PREFIXES_EXEMPTES_MAINTENANCE).toContain("/api/app-version");
  });

  it("autorise la page de maintenance et ses APIs de diagnostic et bypass", () => {
    expect(estExempteDeMaintenance("/maintenance")).toBe(true);
    expect(estExempteDeMaintenance("/api/maintenance/status")).toBe(true);
    expect(estExempteDeMaintenance("/api/maintenance/bypass")).toBe(true);
    expect(estExempteDeMaintenance("/api/app-version")).toBe(true);
    expect(estExempteDeMaintenance("/ping")).toBe(true);
  });

  it("autorise les assets statiques indispensables (images, css, polices)", () => {
    expect(estExempteDeMaintenance("/logo.png")).toBe(true);
    expect(estExempteDeMaintenance("/favicon.ico")).toBe(true);
    expect(estExempteDeMaintenance("/favicon.png")).toBe(true);
    expect(estExempteDeMaintenance("/_next/static/chunks/app.js")).toBe(true);
    expect(
      estExempteDeMaintenance("/_next/image?url=%2Flogo.png&w=128&q=75")
    ).toBe(true);
    expect(estExempteDeMaintenance("/fonts/font.woff2")).toBe(true);
  });

  it("bloque strictement toutes les pages de l'application", () => {
    expect(estExempteDeMaintenance("/")).toBe(false);
    expect(estExempteDeMaintenance("/chat")).toBe(false);
    expect(estExempteDeMaintenance("/chat/12345")).toBe(false);
    expect(estExempteDeMaintenance("/settings")).toBe(false);
    expect(estExempteDeMaintenance("/login")).toBe(false);
    expect(estExempteDeMaintenance("/register")).toBe(false);
    expect(estExempteDeMaintenance("/vibe")).toBe(false);
    expect(estExempteDeMaintenance("/wakies")).toBe(false);
    expect(estExempteDeMaintenance("/quizzly")).toBe(false);
    expect(estExempteDeMaintenance("/site")).toBe(false);
  });

  it("bloque strictement toutes les routes API applicatives", () => {
    expect(estExempteDeMaintenance("/api/chat")).toBe(false);
    expect(estExempteDeMaintenance("/api/agent/run")).toBe(false);
    expect(estExempteDeMaintenance("/api/site/v1/chat/completions")).toBe(
      false
    );
    expect(estExempteDeMaintenance("/api/cron/wakies")).toBe(false);
    expect(estExempteDeMaintenance("/api/vibe/posts")).toBe(false);
  });

  it("gère correctement le basePath (/demo)", () => {
    expect(estExempteDeMaintenance("/demo/maintenance", "/demo")).toBe(true);
    expect(estExempteDeMaintenance("/demo/chat", "/demo")).toBe(false);
    expect(estExempteDeMaintenance("/demo/api/chat", "/demo")).toBe(false);
  });

  it("définit le message d'erreur 503 exact demandé par l'utilisateur", () => {
    expect(MESSAGE_MAINTENANCE_API).toBe(
      "Une maintenance de nos serveurs est en cours. Nous faisons tout notre possible pour rétablir les services au plus vite."
    );
  });
});

describe("Service de maintenance — calcul des phases", () => {
  const refTime = new Date("2026-11-15T12:00:00Z");

  it("détecte une maintenance annulée", () => {
    const phase = resolveMaintenancePhase(
      {
        endAt: new Date("2026-11-15T14:00:00Z"),
        isActive: false,
        startAt: new Date("2026-11-15T10:00:00Z"),
      },
      refTime
    );
    expect(phase).toBe("cancelled");
  });

  it("détecte une maintenance planifiée dans le futur", () => {
    const phase = resolveMaintenancePhase(
      {
        endAt: new Date("2026-11-15T16:00:00Z"),
        isActive: true,
        startAt: new Date("2026-11-15T14:00:00Z"),
      },
      refTime
    );
    expect(phase).toBe("scheduled");
  });

  it("détecte une maintenance en cours", () => {
    const phase = resolveMaintenancePhase(
      {
        endAt: new Date("2026-11-15T13:00:00Z"),
        isActive: true,
        startAt: new Date("2026-11-15T11:00:00Z"),
      },
      refTime
    );
    expect(phase).toBe("in_progress");
  });

  it("détecte une maintenance terminée (date de fin dépassée)", () => {
    const phase = resolveMaintenancePhase(
      {
        endAt: new Date("2026-11-15T10:00:00Z"),
        isActive: true,
        startAt: new Date("2026-11-15T08:00:00Z"),
      },
      refTime
    );
    expect(phase).toBe("completed");
  });
});

describe("Contournement de maintenance (Bypass) — Un code = Une maintenance", () => {
  it("génère des codes d'accès conformes au format MAI-MAINT-XXXX", () => {
    const code = generateMaintenanceAccessCode();
    expect(code).toMatch(/^MAI-MAINT-[A-F0-9]{8}$/);
  });

  it("valide un jeton valide pour une maintenance et son code exact", () => {
    const maintId = "maint-12345";
    const accessCode = "MAI-MAINT-ABCD1234";

    const token = createMaintenanceBypassToken(maintId, accessCode);
    expect(isMaintenanceBypassValid(token, maintId, accessCode)).toBe(true);
    // Insensible à la casse de saisie
    expect(
      isMaintenanceBypassValid(token, maintId, accessCode.toLowerCase())
    ).toBe(true);
  });

  it("invalide le jeton si la maintenance change (règle un code = une maintenance)", () => {
    const maint1 = "maint-1";
    const maint2 = "maint-2";
    const code = "MAI-MAINT-ABCD1234";

    const tokenMaint1 = createMaintenanceBypassToken(maint1, code);
    expect(isMaintenanceBypassValid(tokenMaint1, maint1, code)).toBe(true);
    // Tentative d'utiliser le token de maint-1 sur maint-2 : refus strict
    expect(isMaintenanceBypassValid(tokenMaint1, maint2, code)).toBe(false);
  });

  it("invalide le jeton si le code de la maintenance change", () => {
    const maintId = "maint-12345";
    const code1 = "MAI-MAINT-CODE1";
    const code2 = "MAI-MAINT-CODE2";

    const token = createMaintenanceBypassToken(maintId, code1);
    expect(isMaintenanceBypassValid(token, maintId, code2)).toBe(false);
  });

  it("refuse tout jeton falsifié ou corrompu", () => {
    const maintId = "maint-12345";
    const code = "MAI-MAINT-SECRET";

    expect(isMaintenanceBypassValid(null, maintId, code)).toBe(false);
    expect(isMaintenanceBypassValid("", maintId, code)).toBe(false);
    expect(
      isMaintenanceBypassValid("invalid-token-format", maintId, code)
    ).toBe(false);
    expect(isMaintenanceBypassValid(`${maintId}.tampered`, maintId, code)).toBe(
      false
    );
  });
});
