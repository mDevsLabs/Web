import { describe, expect, it } from "vitest";
import {
  applyModelConflictWrites,
  findModelConflicts,
  resolveModelConflicts,
  type SqlClient,
  type StoredSyncModel,
} from "../../scripts/openrouter-models";

function storedRow(
  overrides: Record<string, unknown> = {},
  extra: Partial<StoredSyncModel> = {}
): StoredSyncModel {
  return {
    architecture: { modality: "text->text", output_modalities: ["text"] },
    context_length: 128_000,
    description: "Description",
    fournisseur: "openrouter",
    id: "openai/gpt-test",
    max_output_tokens: 4096,
    model_number: 1,
    name: "GPT Test",
    overrides,
    pricing: {},
    provider: "openai",
    supported_parameters: [],
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
    description: "Description",
    fournisseur: "openrouter",
    id: "openai/gpt-test",
    max_output_tokens: 4096,
    name: "GPT Test",
    pricing: {},
    provider: "openai",
    supported_parameters: [],
    type: "chat",
    ...extra,
  };
}

function fakeSql() {
  const updates: { values: unknown[] }[] = [];
  const sql = (async (_strings: TemplateStringsArray, ...values: unknown[]) => {
    updates.push({ values });
    return [];
  }) as unknown as SqlClient;
  return { sql, updates };
}

describe("application des arbitrages de synchronisation", () => {
  it("transforme en surcharge une valeur structurelle conservée en base", async () => {
    const { sql, updates } = fakeSql();
    const conflicts = findModelConflicts(
      [incoming({ type: "chat" })],
      [storedRow({}, { type: "audio" })]
    );

    const changes = await applyModelConflictWrites(
      sql,
      await resolveModelConflicts(conflicts)
    );

    expect(changes.get("openai/gpt-test")).toEqual({
      keep: { type: "audio" },
      release: [],
    });
    expect(updates).toHaveLength(1);
    expect(JSON.parse(updates[0].values[1] as string)).toEqual({
      type: "audio",
    });
  });

  it("n’écrit rien quand l’amont gagne sur une valeur non surchargée", async () => {
    const { sql, updates } = fakeSql();
    const conflicts = findModelConflicts(
      [incoming({ type: "chat" })],
      [storedRow({}, { type: "audio" })]
    );

    const changes = await applyModelConflictWrites(
      sql,
      await resolveModelConflicts(conflicts, () => "upstream")
    );

    expect(changes.size).toBe(0);
    expect(updates).toHaveLength(0);
  });

  it("conserve automatiquement une surcharge métier", async () => {
    const { sql, updates } = fakeSql();
    const conflicts = findModelConflicts(
      [incoming({ name: "Nouveau nom" })],
      [storedRow({ name: "Nom maison" }, { name: "Ancien nom" })]
    );

    const changes = await applyModelConflictWrites(
      sql,
      await resolveModelConflicts(conflicts)
    );

    expect(changes.size).toBe(0);
    expect(updates).toHaveLength(0);
  });

  it("retire la surcharge métier quand l’utilisateur choisit l’amont", async () => {
    const { sql, updates } = fakeSql();
    const conflicts = findModelConflicts(
      [incoming({ name: "Nouveau nom" })],
      [storedRow({ name: "Nom maison" }, { name: "Ancien nom" })]
    );

    const changes = await applyModelConflictWrites(
      sql,
      await resolveModelConflicts(conflicts, () => "upstream")
    );

    expect(changes.get("openai/gpt-test")?.release).toEqual(["name"]);
    expect(updates).toHaveLength(1);
    expect(updates[0].values[0]).toEqual(["name"]);
  });
});
