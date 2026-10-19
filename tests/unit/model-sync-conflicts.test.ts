import { describe, expect, it } from "vitest";
import {
  effectiveFournisseur,
  effectiveModel,
  effectiveProvider,
  effectiveType,
  findModelConflicts,
  isPublicAudioModel,
  planModelConflictWrites,
  resolveModelConflicts,
  type StoredModel,
  type StoredSyncModel,
} from "../../scripts/openrouter-models";

function stored(
  overrides: Record<string, unknown> = {},
  extra: Partial<StoredSyncModel> = {}
): StoredSyncModel {
  return {
    architecture: { modality: "text->text", output_modalities: ["text"] },
    context_length: 128_000,
    description: "Description amont",
    fournisseur: "openrouter",
    id: "openai/gpt-test",
    max_output_tokens: 4096,
    model_number: 12,
    name: "Nom amont",
    overrides,
    pricing: { prompt: "0.000001" },
    provider: "openai",
    supported_parameters: ["temperature"],
    type: "chat",
    upstream: {
      architecture: { modality: "text->text", output_modalities: ["text"] },
      id: "openai/gpt-test",
    },
    ...extra,
  };
}

function incoming(extra: Record<string, unknown> = {}) {
  return {
    architecture: { modality: "text->text", output_modalities: ["text"] },
    context_length: 128_000,
    description: "Description amont",
    fournisseur: "openrouter",
    id: "openai/gpt-test",
    max_output_tokens: 4096,
    name: "Nom amont",
    pricing: { prompt: "0.000001" },
    provider: "openai",
    supported_parameters: ["temperature"],
    type: "chat",
    ...extra,
  };
}

describe("conflits de synchronisation du catalogue", () => {
  it("détecte une surcharge admin quand l’amont a changé", () => {
    const conflicts = findModelConflicts(
      [incoming({ name: "Nom amont" })],
      [stored({ name: "Nom maison" }, { name: "Ancien nom amont" })]
    );

    expect(conflicts).toEqual([
      expect.objectContaining({
        databaseValue: "Nom maison",
        field: "name",
        id: "openai/gpt-test",
        modelNumber: 12,
        origin: "override",
        upstreamValue: "Nom amont",
      }),
    ]);
  });

  it("ignore une surcharge stable tant que l’amont ne change pas", () => {
    const conflicts = findModelConflicts(
      [incoming()],
      [stored({ name: "Nom maison" })]
    );

    expect(conflicts).toEqual([]);
  });

  it("compare les objets sans dépendre de l’ordre des clés", () => {
    const conflicts = findModelConflicts(
      [incoming()],
      [
        stored(
          {},
          {
            architecture: {
              modality: "text->text",
              output_modalities: ["text"],
            },
          }
        ),
      ]
    );

    expect(conflicts).toEqual([]);
  });

  it("arbitre une surcharge structurelle quand l’amont change", () => {
    const conflicts = findModelConflicts(
      [incoming({ type: "image" })],
      [stored({ type: "audio" }, { type: "chat" })]
    );

    expect(conflicts).toEqual([
      expect.objectContaining({
        databaseValue: "audio",
        field: "type",
        origin: "override",
        upstreamValue: "image",
      }),
    ]);
  });

  it("laisse évoluer un type structurel non modifié", () => {
    const conflicts = findModelConflicts(
      [incoming({ type: "audio" })],
      [stored()]
    );

    expect(conflicts).toEqual([]);
  });

  it("signale un type modifié directement en base", () => {
    const conflicts = findModelConflicts(
      [incoming({ type: "chat" })],
      [stored({}, { type: "audio" })]
    );

    expect(conflicts).toEqual([
      expect.objectContaining({
        databaseValue: "audio",
        field: "type",
        origin: "database",
        upstreamValue: "chat",
      }),
    ]);
  });

  it("prend la base par défaut et l’amont sur demande explicite", async () => {
    const conflicts = findModelConflicts(
      [incoming({ type: "chat" })],
      [stored({}, { type: "audio" })]
    );

    expect(
      (await resolveModelConflicts(conflicts)).map((item) => item.choice)
    ).toEqual(["database"]);

    expect(
      (await resolveModelConflicts(conflicts, () => "upstream")).map(
        (item) => item.choice
      )
    ).toEqual(["upstream"]);
  });

  it("conserve une valeur structurelle en base en la transformant en surcharge", async () => {
    const conflicts = findModelConflicts(
      [incoming({ type: "chat" })],
      [stored({}, { type: "audio" })]
    );
    const writes = planModelConflictWrites(
      await resolveModelConflicts(conflicts)
    );

    expect(writes.get("openai/gpt-test")).toEqual({
      keep: { type: "audio" },
      release: [],
    });
  });

  it("retire la surcharge quand l’amont est choisi", async () => {
    const conflicts = findModelConflicts(
      [incoming({ name: "Nom amont" })],
      [stored({ name: "Nom maison" }, { name: "Ancien nom amont" })]
    );
    const writes = planModelConflictWrites(
      await resolveModelConflicts(conflicts, () => "upstream")
    );

    expect(writes.get("openai/gpt-test")).toEqual({
      keep: {},
      release: ["name"],
    });
  });
});

describe("valeurs effectives des champs structurels", () => {
  function model(overrides: Record<string, unknown>): StoredModel {
    return {
      architecture: { modality: "text->text" },
      context_length: 128_000,
      created: 1,
      description: "",
      fournisseur: "openrouter",
      id: "openai/gpt-test",
      is_available: true,
      isActive: true,
      max_output_tokens: 4096,
      model_number: 12,
      name: "Nom amont",
      overrides,
      pricing: {},
      provider: "openai",
      supported_parameters: [],
      type: "chat",
      upstream: {},
    };
  }

  it("fait primer les surcharges sur les colonnes amont", () => {
    const value = model({
      fournisseur: "cometapi",
      provider: "maison",
      type: "audio",
    });

    expect(effectiveType(value)).toBe("audio");
    expect(effectiveProvider(value)).toBe("maison");
    expect(effectiveFournisseur(value)).toBe("cometapi");
    expect(effectiveModel(value)).toMatchObject({
      fournisseur: "cometapi",
      provider: "maison",
      type: "audio",
    });
  });

  it("retombe sur les colonnes quand aucune surcharge n’existe", () => {
    const value = model({});

    expect(effectiveType(value)).toBe("chat");
    expect(effectiveProvider(value)).toBe("openai");
    expect(effectiveFournisseur(value)).toBe("openrouter");
  });

  it("fait primer un type surchargé sur la modalité amont", () => {
    const value = model({ type: "chat" });
    value.type = "audio";
    value.architecture = {
      modality: "text->audio",
      output_modalities: ["audio"],
    };

    expect(isPublicAudioModel(value)).toBe(false);
  });
});
