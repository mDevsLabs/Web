// Issue #36 — le masquage d'e-mail doit couvrir les parties locales courtes,
// et les envois ne doivent plus journaliser l'adresse complète.
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  maskEmail,
  sendSupportTicketCreatedEmail,
  sendVerificationEmail,
} from "@/lib/site/email";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

describe("maskEmail", () => {
  it("masque les parties locales d'un ou deux caractères", () => {
    // La regex historique laissait passer « a@x.fr » en clair.
    expect(maskEmail("a@x.fr")).toBe("***@x.fr");
    expect(maskEmail("ab@x.fr")).toBe("***@x.fr");
    expect(maskEmail("a@x.fr")).not.toContain("a@x.fr");
    expect(maskEmail("ab@x.fr")).not.toContain("ab@x.fr");
  });

  it("conserve les deux premiers caractères au-delà, comme avant", () => {
    expect(maskEmail("abc@x.fr")).toBe("ab***@x.fr");
    expect(maskEmail("prenom.nom@domaine.fr")).toBe("pr***@domaine.fr");
  });

  it("ne révèle rien sans arobase ou avec une partie locale vide", () => {
    expect(maskEmail("")).toBe("***");
    expect(maskEmail("sans-arobase")).toBe("***");
    expect(maskEmail("@x.fr")).toBe("***");
  });
});

describe("lib/site/email.ts — aucun littéral d'adresse", () => {
  it("ne contient plus d'adresse e-mail en dur", () => {
    const source = readFileSync(path.join(ROOT, "lib/site/email.ts"), "utf8");
    const litteraux = source.match(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
    );
    expect(litteraux ?? []).toEqual([]);
  });
});

describe("journalisation des envois", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function captureConsole() {
    const lines: string[] = [];
    const record = (...args: unknown[]) => {
      lines.push(args.map((a) => String(a)).join(" "));
    };
    vi.spyOn(console, "info").mockImplementation(record);
    vi.spyOn(console, "log").mockImplementation(record);
    vi.spyOn(console, "warn").mockImplementation(record);
    vi.spyOn(console, "error").mockImplementation(record);
    return lines;
  }

  it("un envoi réussi n'écrit jamais l'adresse complète sur la sortie standard", async () => {
    vi.stubEnv("GOOGLE_SCRIPTS_URL", "https://script.example.test/exec");
    vi.stubEnv("GOOGLE_SCRIPTS_SECRET", "secret-de-test");
    vi.stubEnv("MAI_LOG_LEVEL", "info");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ success: true }),
        ok: true,
      }))
    );
    const lines = captureConsole();

    const ok = await sendVerificationEmail("ab@x.fr", "123456", "register");
    expect(ok).toBe(true);

    const sortie = lines.join("\n");
    expect(sortie).not.toContain("ab@x.fr");
    expect(sortie).toContain("***@x.fr");
  });

  it("la copie administration est sautée sans SUPPORT_ADMIN_EMAIL", async () => {
    vi.stubEnv("SUPPORT_ADMIN_EMAIL", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const lines = captureConsole();

    const ok = await sendSupportTicketCreatedEmail({
      ticket: {
        category: "Compte",
        description: "Description de test",
        id: "ticket-1",
        priority: "high",
        project: "mAI",
        status: "open",
        title: "Titre de test",
        user_email: "ab@x.fr",
        user_id: "u1",
        user_name: "Testeur",
      },
    });
    expect(ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lines.join("\n")).not.toContain("ab@x.fr");
  });

  it("la copie administration utilise l'adresse configurée, jamais un littéral", async () => {
    vi.stubEnv("SUPPORT_ADMIN_EMAIL", "support@x.fr");
    vi.stubEnv("GOOGLE_SCRIPTS_URL", "https://script.example.test/exec");
    vi.stubEnv("GOOGLE_SCRIPTS_SECRET", "secret-de-test");
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { to?: string };
      expect(body.to).toBe("support@x.fr");
      return { json: async () => ({ success: true }), ok: true };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const ok = await sendSupportTicketCreatedEmail({
      ticket: {
        category: "Compte",
        description: "Description de test",
        id: "ticket-1",
        priority: "high",
        project: "mAI",
        status: "open",
        title: "Titre de test",
        user_email: "ab@x.fr",
        user_id: "u1",
        user_name: "Testeur",
      },
    });
    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
