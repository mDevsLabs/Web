import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * La route de statut ne transforme jamais une panne en « tout va bien ».
 *
 * Le widget de la pastille affichait « Opérationnel » en permanence parce qu'il
 * (1) appelait Instatus depuis le navigateur, où la CSP le bloquait, et (2)
 * conservait sa valeur d'initialisation sur un `.catch(() => {})`. La route BFF,
 * elle, avait déjà le bon comportement — le widget ne l'utilisait pas.
 *
 * Ce test fixe la propriété du côté serveur, là où elle est vérifiable sans
 * navigateur : toute branche d'échec se lit `UNKNOWN`, et rien ne se vend comme
 * un instantané frais quand ce n'en est plus un.
 */

const CHEMIN = "@/app/(chat)/api/site/v1/status/route";
const REQUETE = () => new NextRequest("http://localhost/api/site/v1/status");

type Corps = {
  error?: string;
  page: { status: string };
  services: { status: string }[];
  source: string;
  stale: boolean;
};

describe("api/site/v1/status — un échec n'est jamais une confirmation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rend UNKNOWN en fallback quand Instatus ne répond pas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );
    const { GET } = await import(CHEMIN);
    const reponse = await GET(REQUETE());
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as Corps;
    expect(corps.page.status).toBe("UNKNOWN");
    expect(corps.source).toBe("fallback");
    expect(corps.stale).toBe(true);
    // Aucun service ne doit être rendu « UP » par défaut : c'était le mensonge,
    // et il portait sur la confiance que le visiteur accorde à un statut.
    expect(corps.services.length).toBeGreaterThan(0);
    for (const service of corps.services) {
      expect(service.status).toBe("UNKNOWN");
    }
  });

  it("rend UNKNOWN quand Instatus répond une erreur HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream down", { status: 503 }))
    );
    const { GET } = await import(CHEMIN);
    const corps = ((await (await GET(REQUETE())).json()) as Corps).page.status;
    expect(corps).toBe("UNKNOWN");
  });

  it("propage l'incident réel plutôt que de l'arrondir vers le haut", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          page: { name: "mAI", status: "MAJOR OUTAGE", url: "x" },
          services: [
            { description: "", id: "web", name: "Web", status: "DOWN" },
          ],
        })
      )
    );
    const { GET } = await import(CHEMIN);
    const corps = (await (await GET(REQUETE())).json()) as Corps;
    expect(corps.page.status).toBe("MAJOROUTAGE");
    expect(corps.services[0]?.status).toBe("MAJOROUTAGE");
  });

  it("étiquette cache + stale le dernier bon instantané servi après une panne", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          page: { name: "mAI", status: "UP", url: "x" },
          services: [],
        })
      )
      // Au-delà du TTL, la route retente Instatus : cette tentative échoue.
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", mock);
    const { GET } = await import(CHEMIN);

    const premiere = (await (await GET(REQUETE())).json()) as Corps;
    expect(premiere.stale).toBe(false);
    expect(premiere.source).toBe("instatus");

    // Le cache de la route est mesuré à `Date.now()` : le fake timer le décale
    // sans simuler le reste.
    vi.advanceTimersByTime(10 * 60_000);

    const seconde = (await (await GET(REQUETE())).json()) as Corps;
    expect(seconde.stale).toBe(true);
    expect(seconde.source).toBe("cache");
    // La donnée reste celle de l'instantané — mais elle n'affirme plus le présent.
    expect(seconde.page.status).toBe("UP");
  });
});
