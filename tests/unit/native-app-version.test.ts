// Le déploiement est identifiable même si le numéro de release ne change pas.
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/app-version/route";

afterEach(() => vi.unstubAllEnvs());
describe("version Web pour les applications natives", () => {
  it("expose l’identifiant du déploiement sans autoriser sa mise en cache", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAI_WEB_BUILD_ID", "deploiement-2");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ buildId: "deploiement-2" });
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });
});
