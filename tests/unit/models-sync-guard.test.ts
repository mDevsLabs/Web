import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SqlClient } from "../../scripts/openrouter-models";

interface UpdateModelsModule {
  fetchCometImageModels: (
    apiKey?: string,
    fetcher?: typeof fetch
  ) => Promise<unknown[]>;
  updateModels: (
    sql?: SqlClient,
    options?: {
      cometApiKey?: string;
      fetcher?: typeof fetch;
    }
  ) => Promise<unknown>;
}

// Import dynamique par variable : `scripts/updateModels.ts` est exclu de
// `tsconfig.json` car il reste compatible Deno/Val Town (`Deno.env`, `npm:`).
async function loadUpdateModels(): Promise<UpdateModelsModule> {
  const modulePath = ["..", "..", "scripts", "updateModels"].join("/");
  return (await import(modulePath)) as UpdateModelsModule;
}

describe("Garde-fous de synchronisation des modèles (updateModels)", () => {
  const originalCometKey = process.env.COMET_API_KEY;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    delete process.env.COMET_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    if (originalCometKey === undefined) {
      delete process.env.COMET_API_KEY;
    } else {
      process.env.COMET_API_KEY = originalCometKey;
    }
    if (originalOpenRouterKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    }
  });

  it("refuse de retomber sur FALLBACK_COMET_IMAGE_MODELS quand COMET_API_KEY est absente", async () => {
    const { fetchCometImageModels } = await loadUpdateModels();
    await expect(fetchCometImageModels()).rejects.toThrow(/COMET_API_KEY/i);
    await expect(fetchCometImageModels("   ")).rejects.toThrow(
      /COMET_API_KEY/i
    );
  });

  it("échoue explicitement si sync_openrouter_models renvoie upserted = 0 sans skip", async () => {
    const { updateModels } = await loadUpdateModels();
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("openrouter.ai")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                architecture: {
                  input_modalities: ["text"],
                  modality: "text->text",
                  output_modalities: ["text"],
                },
                context_length: 128_000,
                created: 1_750_000_000,
                description: "Test",
                id: "baidu/ernie-5.5-flash-preview:free",
                name: "Baidu: ERNIE-5.5-Flash-Preview (free)",
                pricing: { completion: "0", prompt: "0" },
                supported_parameters: ["temperature"],
                top_provider: { max_completion_tokens: 8192 },
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          data: [
            {
              created: 1_750_000_000,
              id: "black-forest-labs/flux-1.1-pro",
              owned_by: "replicate",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }) as unknown as typeof fetch;

    const sql = vi.fn(async (strings: TemplateStringsArray) => {
      const query = strings.join(" ");
      if (query.includes("SELECT * FROM sync_openrouter_models")) {
        return [{ retired: 0, skipped: false, upserted: 0 }];
      }
      return [];
    }) as unknown as SqlClient;

    await expect(
      updateModels(sql, {
        cometApiKey: "sk-comet-test",
        fetcher,
      })
    ).rejects.toThrow(/upserted = 0/i);
  });

  it("supprime la synchronisation automatique GitHub Actions au profit de scripts/admin.ts", () => {
    expect(
      existsSync(join(process.cwd(), ".github", "workflows", "models-sync.yml"))
    ).toBe(false);
  });
});
