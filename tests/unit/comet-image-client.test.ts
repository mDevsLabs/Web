import { describe, expect, it, vi } from "vitest";
import {
  CometImageError,
  fluxCallCandidates,
  generateCometImage,
  isFluxModelId,
  nearestGptImageSize,
} from "@/lib/ai/catalog/comet-image-client";
import {
  buildCometImageCatalog,
  isCallableCometImageModel,
} from "@/lib/ai/catalog/media-models-pure";
import type { StoredModel } from "@/openrouter-models";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function makeCometModel(
  id: string,
  upstream: Record<string, unknown> = {}
): StoredModel {
  return {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_750_000_000,
    description: "",
    fournisseur: "cometapi",
    id,
    is_available: true,
    isActive: true,
    max_output_tokens: 1,
    model_number: 1,
    name: id,
    overrides: {},
    pricing: {},
    provider: id.split("/")[0] || "cometapi",
    reasoning: null,
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream,
  };
}

describe("Client d'images CometAPI (lib/ai/catalog/comet-image-client.ts)", () => {
  it("reconnaît tous les formats d'identifiants FLUX (namespacés ou courts)", () => {
    expect(isFluxModelId("black-forest-labs/flux-1.1-pro")).toBe(true);
    expect(isFluxModelId("custom/flux-pro-1.1")).toBe(true);
    expect(isFluxModelId("cometapi/flux-2-pro")).toBe(true);
    expect(isFluxModelId("flux-dev")).toBe(true);
    expect(isFluxModelId("openai/gpt-image-1")).toBe(false);
    expect(isFluxModelId("dall-e-3")).toBe(false);
  });

  it("priorise l'alias flux-pro-1.1 pour black-forest-labs/flux-1.1-pro sans doublon", () => {
    expect(fluxCallCandidates("black-forest-labs/flux-1.1-pro")).toEqual([
      "flux-pro-1.1",
      "flux-1.1-pro",
      "black-forest-labs/flux-1.1-pro",
    ]);
    expect(fluxCallCandidates("custom/flux-1.1-pro")).toEqual([
      "flux-pro-1.1",
      "flux-1.1-pro",
      "custom/flux-1.1-pro",
    ]);
  });

  it("adapte les dimensions gpt-image aux trois formats acceptés", () => {
    expect(nearestGptImageSize(1024, 1024)).toBe("1024x1024");
    expect(nearestGptImageSize(1344, 768)).toBe("1536x1024");
    expect(nearestGptImageSize(768, 1344)).toBe("1024x1536");
  });

  it("appelle /flux/v1/flux-pro-1.1 et interroge /flux/v1/get_result jusqu'à Ready", async () => {
    const calls: Array<{ body?: string; method?: string; url: string }> = [];
    let pollCount = 0;

    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({
          body: typeof init?.body === "string" ? init.body : undefined,
          method: init?.method,
          url,
        });

        if (url.endsWith("/flux/v1/flux-pro-1.1")) {
          return jsonResponse({ id: "task-flux-42", status: "Pending" });
        }
        if (url.includes("/flux/v1/get_result?id=task-flux-42")) {
          pollCount += 1;
          if (pollCount === 1) {
            return jsonResponse({ id: "task-flux-42", status: "Generating" });
          }
          return jsonResponse({
            id: "task-flux-42",
            result: { sample: "https://cdn.example/flux.jpg" },
            status: "Ready",
          });
        }
        return jsonResponse({ error: "unexpected" }, 404);
      }
    ) as unknown as typeof fetch;

    const result = await generateCometImage({
      apiKey: "sk-comet-test",
      fetcher,
      height: 1024,
      modelId: "black-forest-labs/flux-1.1-pro",
      pollIntervalMs: 1,
      prompt: "une pomme rouge",
      width: 1024,
    });

    expect(result).toEqual({ url: "https://cdn.example/flux.jpg" });
    expect(calls[0]?.url).toBe("https://api.cometapi.com/flux/v1/flux-pro-1.1");
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
      height: 1024,
      prompt: "une pomme rouge",
      width: 1024,
    });
    expect(pollCount).toBe(2);
  });

  it("bascule vers le candidat suivant si le premier nom FLUX renvoie 404 ou 503", async () => {
    const urls: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/flux/v1/flux-pro-1.1")) {
        return jsonResponse({ error: { code: "model_not_found" } }, 503);
      }
      if (url.endsWith("/flux/v1/flux-1.1-pro")) {
        return jsonResponse({ id: "task-fallback" });
      }
      if (url.includes("/flux/v1/get_result?id=task-fallback")) {
        return jsonResponse({
          id: "task-fallback",
          result: { sample: "https://cdn.example/fallback.png" },
          status: "Ready",
        });
      }
      return jsonResponse({}, 404);
    }) as unknown as typeof fetch;

    const result = await generateCometImage({
      apiKey: "sk-comet-test",
      fetcher,
      height: 1024,
      modelId: "black-forest-labs/flux-1.1-pro",
      pollIntervalMs: 1,
      prompt: "un phare",
      width: 1024,
    });

    expect(result.url).toBe("https://cdn.example/fallback.png");
    expect(urls[0]).toBe("https://api.cometapi.com/flux/v1/flux-pro-1.1");
    expect(urls[1]).toBe("https://api.cometapi.com/flux/v1/flux-1.1-pro");
  });

  it("appelle /v1/images/generations sans préfixe synthétique pour gpt-image et renvoie b64_json", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        bodies.push(JSON.parse(String(init?.body ?? "{}")));
        return jsonResponse({ data: [{ b64_json: "iVBORw0KGgo=" }] });
      }
    ) as unknown as typeof fetch;

    const result = await generateCometImage({
      apiKey: "sk-comet-test",
      fetcher,
      height: 768,
      modelId: "openai/gpt-image-1-mini",
      prompt: "un chat",
      width: 1344,
    });

    expect(result).toEqual({ b64_json: "iVBORw0KGgo=", url: undefined });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({
      model: "gpt-image-1-mini",
      n: 1,
      prompt: "un chat",
      size: "1536x1024",
    });
  });

  it("lève CometImageError quand une tâche FLUX échoue côté modération", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/flux/v1/flux-dev")) {
        return jsonResponse({ id: "task-mod" });
      }
      return jsonResponse({ id: "task-mod", status: "Content Moderated" });
    }) as unknown as typeof fetch;

    await expect(
      generateCometImage({
        apiKey: "sk-comet-test",
        fetcher,
        height: 1024,
        modelId: "black-forest-labs/flux-dev",
        pollIntervalMs: 1,
        prompt: "test",
        width: 1024,
      })
    ).rejects.toBeInstanceOf(CometImageError);
  });
});

describe("Filtrage du catalogue images CometAPI (media-models-pure)", () => {
  it("exclut les tâches non appelables (mj_*, kling_*, dola-*, finetune) et garde Flux / GPT Image", () => {
    const models = [
      makeCometModel("black-forest-labs/flux-1.1-pro", {
        supported_endpoint_types: ["image-generation", "openai"],
      }),
      makeCometModel("openai/gpt-image-1", {
        supported_endpoint_types: ["image-generation", "openai"],
      }),
      makeCometModel("custom/mj_fast_imagine", {
        supported_endpoint_types: ["openai"],
      }),
      makeCometModel("custom/kling_video", {
        supported_endpoint_types: ["openai"],
      }),
      makeCometModel("custom/dola-seedream-5-5-261028", {
        supported_endpoint_types: ["openai"],
      }),
      makeCometModel("custom/flux-finetune", {
        supported_endpoint_types: ["image-generation", "openai"],
      }),
    ];

    expect(isCallableCometImageModel(models[0])).toBe(true);
    expect(isCallableCometImageModel(models[2])).toBe(false);
    expect(isCallableCometImageModel(models[3])).toBe(false);
    expect(isCallableCometImageModel(models[4])).toBe(false);
    expect(isCallableCometImageModel(models[5])).toBe(false);

    const catalog = buildCometImageCatalog(models);
    expect(catalog.map((m) => m.id)).toEqual([
      "black-forest-labs/flux-1.1-pro",
      "openai/gpt-image-1",
    ]);
  });
});
