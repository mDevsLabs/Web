import { describe, expect, it } from "vitest";
import {
  detectOpenRouterModelType,
  type StoredModel,
  selectAudioModels,
} from "../../scripts/openrouter-models";

function model(id: string, overrides: Partial<StoredModel> = {}): StoredModel {
  return {
    architecture: {
      modality: "text->speech",
      output_modalities: ["speech"],
    },
    context_length: 4096,
    created: 1_700_000_000,
    description: "",
    fournisseur: "openrouter",
    id,
    is_available: true,
    isActive: true,
    max_output_tokens: 4096,
    model_number: 1,
    name: id,
    overrides: {},
    pricing: {},
    provider: id.split("/")[0],
    reasoning: null,
    supported_parameters: [],
    type: "audio",
    upstream: {},
    ...overrides,
  };
}

// Modèles réels issus de l'API Speech d'OpenRouter (?output_modalities=speech).
const PAID_CATALOG = [
  model("deepgram/flux-tts"),
  model("fish-audio/s2.1-pro"),
  model("elevenlabs/eleven-multilingual-v2"),
  model("google/gemini-3.8-flash-tts"),
  model("mistralai/voxtral-mini-tts-2603"),
];

describe("catalogue audio", () => {
  it("expose tous les modèles de la base à un forfait payant", () => {
    expect(
      selectAudioModels(PAID_CATALOG, true).map((item) => item.id)
    ).toEqual(PAID_CATALOG.map((item) => item.id));
  });

  it("ne garde que les modèles :free pour un forfait Free", () => {
    const freeModel = model("fish-audio/s2.1-pro-free:free");
    expect(
      selectAudioModels([...PAID_CATALOG, freeModel], false).map(
        (item) => item.id
      )
    ).toEqual([freeModel.id]);
  });

  it("exclut les modèles inactifs, indisponibles ou non audio", () => {
    const catalog = [
      ...PAID_CATALOG,
      model("deepgram/flux-tts-inactive", { isActive: false }),
      model("fish-audio/s2.1-pro-unavail", { is_available: false }),
      model("openai/gpt-4o", {
        architecture: { modality: "text->text", output_modalities: ["text"] },
        type: "chat",
      }),
      model("openai/gpt-audio", {
        architecture: {
          modality: "text+audio->text+audio",
          output_modalities: ["text", "audio"],
        },
        type: "chat",
      }),
    ];
    expect(selectAudioModels(catalog, true)).toHaveLength(PAID_CATALOG.length);
  });
});

describe("détection du type de modèle OpenRouter pour l'audio", () => {
  it("classe comme audio uniquement les modèles speech ou TTS", () => {
    expect(
      detectOpenRouterModelType({
        architecture: {
          modality: "text->speech",
          output_modalities: ["speech"],
        },
        id: "deepgram/flux-tts",
      })
    ).toBe("audio");

    expect(
      detectOpenRouterModelType({
        architecture: {
          modality: "text->speech",
          output_modalities: ["speech"],
        },
        id: "fish-audio/s2.1-pro",
      })
    ).toBe("audio");

    expect(
      detectOpenRouterModelType({
        architecture: { modality: "text->audio", output_modalities: ["audio"] },
        id: "suno/bark",
      })
    ).toBe("audio");
  });

  it("ne classe pas comme audio les modèles purement audio (non speech)", () => {
    expect(
      detectOpenRouterModelType({
        architecture: {
          modality: "text+audio->text+audio",
          output_modalities: ["text", "audio"],
        },
        id: "openai/gpt-audio",
      })
    ).toBe("chat");

    expect(
      detectOpenRouterModelType({
        architecture: {
          modality: "text+image->text+audio",
          output_modalities: ["text", "audio"],
        },
        id: "google/lyria-3-clip-preview",
      })
    ).toBe("chat");

    expect(
      detectOpenRouterModelType({
        architecture: {
          modality: "text+file+audio->text",
          output_modalities: ["text"],
        },
        id: "mistralai/voxtral-small-24b-2507",
      })
    ).toBe("chat");
  });
});
