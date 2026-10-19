import { describe, expect, it } from "vitest";

import { modelsData } from "@/lib/models-data";
import { maiModelsList } from "@/lib/mai-models";

/**
 * Le dépôt a longtemps possédé quatre catalogues de modèles concurrents
 * (`lib/models-data.ts`, `lib/mai-models.ts`, `app/models/page.tsx` et un fichier
 * `maiModels.ts` racine hors Git). Ils ont divergé au point d'afficher des
 * caractéristiques contradictoires. Ces tests verrouillent les deux sources
 * canoniques entre elles.
 */

const modelCard = (id: string) => {
  const card = modelsData.find((model) => model.id === id);
  if (!card) throw new Error(`Modèle absent de modelsData : ${id}`);
  return card;
};

const apiModel = (id: string) => {
  const entry = maiModelsList.find((model) => model.id === id);
  if (!entry) throw new Error(`Modèle absent de maiModelsList : ${id}`);
  return entry;
};

describe("model catalogue coherence", () => {
  it("publishes a unique id for every model", () => {
    const ids = modelsData.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every public model in the API catalogue", () => {
    const apiIds = new Set(maiModelsList.map((model) => model.id));
    const missing = modelsData
      .map((model) => model.id)
      .filter((id) => !apiIds.has(id));
    expect(missing).toEqual([]);
  });

  it("agrees on the vision capability of every model", () => {
    const disagreements = modelsData
      .filter((model) => model.vision !== apiModel(model.id).vision)
      .map((model) => `${model.id}: card=${model.vision} api=${apiModel(model.id).vision}`);

    expect(disagreements).toEqual([]);
  });

  it("never advertises vision in the badge when the model has none", () => {
    const contradictions = modelsData
      .filter((model) => !model.vision && /vision/i.test(model.badge))
      .map((model) => `${model.id}: ${model.badge}`);

    expect(contradictions).toEqual([]);
  });

  it("keeps the parameter count consistent between both catalogues", () => {
    const disagreements = modelsData
      .filter((model) => model.parameters && apiModel(model.id).parameters !== model.parameters)
      .map((model) => `${model.id}: card=${model.parameters} api=${apiModel(model.id).parameters}`);

    expect(disagreements).toEqual([]);
  });

  it("exposes a Hugging Face tag distinct from the Ollama tag", () => {
    // `hf download <ollamaTag>` pointait sur le dépôt Ollama : les deux doivent differer.
    const suspicious = maiModelsList
      .filter((model) => model.ollamaTag && model.huggingFaceTag === model.ollamaTag)
      .map((model) => model.id);

    expect(suspicious).toEqual([]);
  });

  it("requires media assets for every model", () => {
    const incomplete = modelsData
      .filter((model) => !model.bannerImage || !model.squareImage)
      .map((model) => model.id);

    expect(incomplete).toEqual([]);
  });

  it("keeps the generation mAI-2 flagged as a cloud model with a YouTube presentation", () => {
    for (const id of ["mai-2", "mai-2-mini"]) {
      const model = modelCard(id);
      expect(model.cloud).toBe(true);
      // Identifiant YouTube (11 caractères), pas un chemin vers un fichier local :
      // les présentations sont désormais lues via un iframe d'embed.
      expect(model.introVideoId).toMatch(/^[\w-]{11}$/);
    }
  });

  it("does not attach a presentation video to legacy local models", () => {
    const withVideo = modelsData
      .filter((model) => model.introVideoId)
      .map((model) => model.id);

    expect(withVideo.sort()).toEqual(["mai-2", "mai-2-mini"]);
  });
});
