import { describe, expect, it } from "vitest";
import {
  type StoredModel,
  selectAudioModels,
} from "../../scripts/openrouter-models";

function model(id: string, overrides: Partial<StoredModel> = {}): StoredModel {
  return {
    architecture: {
      modality: "text->audio",
      output_modalities: ["audio"],
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

// Les cinq modèles réellement présents dans `openrouter_models` au moment du
// correctif : aucun ne porte le suffixe `:free`.
const PAID_CATALOG = [
  model("google/lyria-3-clip-preview"),
  model("google/lyria-3-pro-preview"),
  model("mistralai/voxtral-small-24b-2507", {
    architecture: { modality: "text+audio->text", output_modalities: ["text"] },
  }),
  model("openai/gpt-audio"),
  model("openai/gpt-audio-mini"),
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
      model("openai/gpt-audio", { isActive: false }),
      model("openai/gpt-audio-mini", { is_available: false }),
      model("openai/gpt-4o", {
        architecture: { modality: "text->text", output_modalities: ["text"] },
        type: "chat",
      }),
    ];
    expect(selectAudioModels(catalog, true)).toHaveLength(PAID_CATALOG.length);
  });
});
