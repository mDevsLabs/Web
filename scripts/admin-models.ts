import type { Interface } from "node:readline/promises";
import {
  effectiveModel,
  invalidateModelCatalog,
  type SqlClient,
  type StoredModel,
} from "./openrouter-models.ts";
import { updateModels } from "./updateModels.ts";

const fields = [
  "name",
  "description",
  "context_length",
  "max_output_tokens",
  "supported_parameters",
  "architecture",
  "pricing",
] as const;
type Field = (typeof fields)[number];
export type ModelPatch = Partial<Record<Field, unknown>> & {
  isActive?: boolean;
};

export function validateModelPatch(patch: ModelPatch): void {
  if (!Object.keys(patch).length)
    throw new Error("Aucune modification sélectionnée.");
  for (const [key, value] of Object.entries(patch)) {
    if (key === "isActive") {
      if (typeof value !== "boolean")
        throw new Error("isActive doit être TRUE ou FALSE.");
      continue;
    }
    if (!fields.includes(key as Field))
      throw new Error(`Champ non modifiable : ${key}`);
    if (value === null) continue; // Rétablir la valeur OpenRouter.
    if (key === "context_length" || key === "max_output_tokens") {
      if (
        !Number.isSafeInteger(value) ||
        Number(value) <= 0 ||
        Number(value) > 2_147_483_647
      ) {
        throw new Error(
          "La limite de tokens doit être un entier strictement positif."
        );
      }
    } else if (key === "name" || key === "description") {
      if (typeof value !== "string" || (key === "name" && !value.trim())) {
        throw new Error(`Le champ ${key} doit être du texte.`);
      }
    } else if (key === "supported_parameters") {
      if (
        !Array.isArray(value) ||
        value.some((v) => typeof v !== "string" || !v.trim())
      ) {
        throw new Error(
          "Les paramètres doivent être une liste de noms non vides."
        );
      }
    } else if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Le champ ${key} doit être un objet JSON.`);
    } else if (key === "architecture") {
      const a = value as Record<string, unknown>;
      for (const modality of ["input_modalities", "output_modalities"]) {
        if (
          a[modality] !== undefined &&
          (!Array.isArray(a[modality]) ||
            (a[modality] as unknown[]).some((v) => typeof v !== "string"))
        ) {
          throw new Error(`${modality} doit être une liste de chaînes.`);
        }
      }
      if (a.modality !== undefined && typeof a.modality !== "string") {
        throw new Error("modality doit être une chaîne.");
      }
    }
  }
}

export function selectModels(
  input: string,
  models: StoredModel[]
): StoredModel[] {
  const selected = new Map<string, StoredModel>();
  if (input.trim().toLowerCase() === "tous") return models;
  const numbers = new Map(models.map((m) => [String(m.model_number), m]));
  const ids = new Map(models.map((m) => [m.id, m]));
  for (const item of input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const range = item.match(/^#(\d+)-#?(\d+)$/);
    if (range) {
      const start = Number(range[1]),
        end = Number(range[2]);
      if (end < start || end - start > 1000)
        throw new Error("Plage de numéros invalide.");
      for (let n = start; n <= end; n++) {
        const m = numbers.get(String(n));
        // Les séquences SQL peuvent avoir des trous après un UPSERT.
        if (m) selected.set(m.id, m);
      }
      continue;
    }
    const m = item.startsWith("#") ? numbers.get(item.slice(1)) : ids.get(item);
    if (!m) throw new Error(`Modèle introuvable dans les résultats : ${item}`);
    selected.set(m.id, m);
  }
  if (!selected.size) throw new Error("Aucun modèle sélectionné.");
  return [...selected.values()];
}

export async function searchModels(
  sql: SqlClient,
  query = ""
): Promise<StoredModel[]> {
  const term = `%${query.trim()}%`;
  return await sqlQuerySearch(sql, term);
}

async function sqlQuerySearch(
  sql: SqlClient,
  term: string
): Promise<StoredModel[]> {
  return await sql`
    SELECT * FROM openrouter_models WHERE id ILIKE ${term}
      OR COALESCE(overrides->>'name', name) ILIKE ${term}
      OR model_number::text = ${term.slice(1, -1).replace(/^#/, "")}
    ORDER BY model_number
  `;
}

export async function applyModelPatch(
  sql: SqlClient,
  ids: string[],
  patch: ModelPatch
) {
  validateModelPatch(patch);
  if (!ids.length) throw new Error("Sélection vide.");
  const { isActive, ...metadata } = patch;
  const reset = Object.entries(metadata)
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  const updates = Object.fromEntries(
    Object.entries(metadata).filter(([, v]) => v !== null)
  );
  const rows = await sqlUpdatePatch(
    sql,
    [...new Set(ids)],
    isActive ?? null,
    reset,
    updates
  );
  invalidateModelCatalog(sql);
  return rows;
}

async function sqlUpdatePatch(
  sql: SqlClient,
  ids: string[],
  active: boolean | null,
  reset: string[],
  updates: object
) {
  return await sql`
    UPDATE openrouter_models
    SET "isActive" = COALESCE(${active}::boolean, "isActive"),
      overrides = (overrides - ${reset}::text[]) || ${JSON.stringify(updates)}::jsonb,
      updated_at = now()
    WHERE id = ANY(${ids}::text[])
    RETURNING id, model_number, "isActive", overrides
  `;
}

function displayModels(models: StoredModel[], offset = 0) {
  console.table(
    models.slice(offset, offset + 25).map((m) => {
      const e = effectiveModel(m);
      return {
        Actif: m.isActive,
        Contexte: e.maxContext,
        Disponible: m.is_available,
        ID: m.id,
        Nom: e.name,
        "N°": `#${m.model_number}`,
        Sortie: e.maxOutput,
      };
    })
  );
  console.log(
    models.length +
      " modèle(s). Les numéros sont permanents, les ID sont ceux d'OpenRouter."
  );
}

async function askPatch(rl: Interface): Promise<ModelPatch> {
  console.log(
    "Champs : active, name, description, context_length, max_output_tokens, supported_parameters, architecture, pricing."
  );
  console.log(
    "Séparez les champs par des virgules. Valeur « auto » : reprendre la valeur OpenRouter."
  );
  const selected = (await rl.question("👉 Champs à modifier : "))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const patch: ModelPatch = {};
  for (const field of [...new Set(selected)]) {
    const value = (await rl.question(`👉 ${field} : `)).trim();
    if (field === "active") {
      if (!/^(true|false)$/i.test(value))
        throw new Error("Utilisez TRUE ou FALSE.");
      patch.isActive = value.toLowerCase() === "true";
    } else if (!fields.includes(field as Field)) {
      throw new Error(`Champ inconnu : ${field}`);
    } else if (value === "auto") {
      patch[field as Field] = null;
    } else if (field === "context_length" || field === "max_output_tokens") {
      patch[field] = Number(value);
    } else if (field === "supported_parameters") {
      patch[field] = value
        ? [...new Set(value.split(",").map((s) => s.trim()))]
        : [];
    } else if (field === "architecture" || field === "pricing") {
      patch[field] = JSON.parse(value);
    } else {
      patch[field as Field] = value;
    }
  }
  validateModelPatch(patch);
  return patch;
}

export async function runModelManager(sql: SqlClient, rl: Interface) {
  let models = await searchModels(sql);
  let query = "",
    offset = 0;
  while (true) {
    console.log(`\n🤖 MODÈLES OPENROUTER — recherche : ${query || "tous"}`);
    displayModels(models, offset);
    console.log(
      "1. Rechercher par nom / ID / numéro  2. Page suivante  3. Page précédente"
    );
    console.log(
      "4. Détails par ID / #numéro  5. Modifier un ou plusieurs modèles"
    );
    console.log("6. Synchroniser OpenRouter maintenant  0. Retour");
    const choice = (await rl.question("👉 Choix [0-6] : ")).trim();
    try {
      if (choice === "0") return;
      if (choice === "1") {
        query = (await rl.question("👉 Recherche (vide = tous) : ")).trim();
        models = await searchModels(sql, query);
        offset = 0;
      } else if (choice === "2") {
        if (offset + 25 < models.length) offset += 25;
      } else if (choice === "3") {
        offset = Math.max(0, offset - 25);
      } else if (choice === "4") {
        const selected = selectModels(
          await rl.question("👉 ID ou #numéro : "),
          models
        );
        for (const m of selected) {
          console.log(
            JSON.stringify(
              {
                ...effectiveModel(m),
                is_available: m.is_available,
                isActive: m.isActive,
                model_number: m.model_number,
                overrides: m.overrides,
                pricing: m.overrides.pricing ?? m.pricing,
                upstream: m.upstream,
              },
              null,
              2
            )
          );
        }
      } else if (choice === "5") {
        console.log(
          "Exemples : #1,#4,openai/gpt-4 ; #10-#20 ; tous (tous les résultats de recherche)."
        );
        const selected = selectModels(
          await rl.question("👉 Sélection : "),
          models
        );
        const patch = await askPatch(rl);
        console.table(
          selected.map((m) => ({ ID: m.id, "N°": `#${m.model_number}` }))
        );
        console.log("Modifications :", JSON.stringify(patch, null, 2));
        const confirm = (
          await rl.question(
            `Appliquer à ${selected.length} modèle(s) ? (o/N) : `
          )
        ).trim();
        if (/^(o|oui|y|yes)$/i.test(confirm)) {
          const result = await applyModelPatch(
            sql,
            selected.map((m) => m.id),
            patch
          );
          console.log(
            "✅ " +
              result.length +
              " modèle(s) mis à jour. Prise en compte API sous 10 secondes."
          );
          models = await searchModels(sql, query);
        }
      } else if (choice === "6") {
        await updateModels(sql);
        models = await searchModels(sql, query);
      } else {
        console.log("⚠️ Choix invalide.");
      }
    } catch (error) {
      console.error("❌", error instanceof Error ? error.message : error);
    }
  }
}
