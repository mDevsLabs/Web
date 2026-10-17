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
  "reasoning",
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

async function askSingleModelInteractivePatch(
  model: StoredModel,
  rl: Interface
): Promise<ModelPatch | null> {
  const eff = effectiveModel(model);
  const patch: ModelPatch = {};

  console.log("\n=======================================================");
  console.log(
    `🛠️  MODIFICATION DU MODÈLE : #${model.model_number} — ${eff.name}`
  );
  console.log("=======================================================");
  console.log(`  ID OpenRouter   : ${model.id}`);
  console.log(`  Fournisseur     : ${eff.owned_by}`);
  console.log(
    `  Statut actuel   : ${model.isActive ? "✅ ACTIF" : "❌ INACTIF"} (Dispo: ${model.is_available ? "Oui" : "Non"})`
  );
  console.log(
    `  Nom effectif    : ${eff.name} ${model.overrides.name ? "(surchargé)" : "(OpenRouter)"}`
  );
  console.log(
    `  Contexte max    : ${eff.maxContext?.toLocaleString("fr-FR")} tokens`
  );
  console.log(
    `  Sortie max      : ${eff.maxOutput?.toLocaleString("fr-FR")} tokens`
  );
  if (eff.description) {
    const descShort =
      eff.description.length > 90
        ? `${eff.description.slice(0, 87)}…`
        : eff.description;
    console.log(`  Description     : ${descShort}`);
  }
  const ovKeys = Object.keys(model.overrides || {});
  console.log(
    `  Surcharges      : ${ovKeys.length ? ovKeys.join(", ") : "aucune (valeurs OpenRouter d'origine)"}`
  );
  console.log("-------------------------------------------------------");
  console.log("👉 Que souhaitez-vous modifier ?");
  console.log("  1. 🏷️  Nom d'affichage");
  console.log("  2. 📝 Description");
  console.log(
    `  3. 🔘 Basculer Statut (${model.isActive ? "Actif ➔ INACTIF" : "Inactif ➔ ACTIF"})`
  );
  console.log("  4. 🧠 Taille de contexte (context_length)");
  console.log("  5. 📤 Tokens de sortie max (max_output_tokens)");
  console.log("  6. ⚙️  Paramètres supportés (supported_parameters)");
  console.log("  7. 💰 Tarifs (pricing prompt / completion)");
  console.log(
    "  8. 🔄 Rétablir TOUTES les valeurs d'origine OpenRouter (supprimer surcharges)"
  );
  console.log("  9. 🚀 Parcours guidé pas-à-pas (champs clés un par un)");
  console.log("  0. ↩️  Annuler la modification");

  const action = (await rl.question("\n👉 Votre choix [0-9] : ")).trim();

  if (action === "0") return null;

  if (action === "3") {
    // Bascule rapide 1 clic
    patch.isActive = !model.isActive;
    return patch;
  }

  if (action === "8") {
    const confirm = (
      await rl.question(
        "⚠️ Réinitialiser toutes les surcharges et rétablir les valeurs OpenRouter ? (o/N) : "
      )
    )
      .trim()
      .toLowerCase();
    if (confirm === "o" || confirm === "oui" || confirm === "y") {
      patch.name = null;
      patch.description = null;
      patch.context_length = null;
      patch.max_output_tokens = null;
      patch.supported_parameters = null;
      patch.architecture = null;
      patch.pricing = null;
      return patch;
    }
    return null;
  }

  if (action === "1" || action === "9") {
    const cur = String(model.overrides.name ?? eff.name ?? "");
    const val = (
      await rl.question(
        `👉 Nom d'affichage [${cur}] ('auto' pour OpenRouter) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.name = null;
    else if (val && val !== cur) patch.name = val;
  }

  if (action === "2" || action === "9") {
    const cur = String(model.overrides.description ?? eff.description ?? "");
    const preview = cur.length > 50 ? `${cur.slice(0, 47)}…` : cur;
    const val = (
      await rl.question(
        `👉 Description [${preview}] ('auto' pour OpenRouter) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.description = null;
    else if (val && val !== cur) patch.description = val;
  }

  if (action === "9") {
    const curActive = model.isActive ? "o" : "n";
    const val = (await rl.question(`👉 Modèle actif ? (o/n) [${curActive}] : `))
      .trim()
      .toLowerCase();
    if (val === "o" || val === "oui" || val === "true") patch.isActive = true;
    else if (val === "n" || val === "non" || val === "false")
      patch.isActive = false;
  }

  if (action === "4" || action === "9") {
    const cur = Number(model.overrides.context_length ?? eff.maxContext ?? 0);
    const val = (
      await rl.question(
        `👉 Contexte max en tokens [${cur}] ('auto' pour OpenRouter) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.context_length = null;
    else if (val && !Number.isNaN(Number(val)) && Number(val) !== cur) {
      patch.context_length = Number(val);
    }
  }

  if (action === "5" || action === "9") {
    const cur = Number(model.overrides.max_output_tokens ?? eff.maxOutput ?? 0);
    const val = (
      await rl.question(
        `👉 Sortie max en tokens [${cur}] ('auto' pour OpenRouter) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.max_output_tokens = null;
    else if (val && !Number.isNaN(Number(val)) && Number(val) !== cur) {
      patch.max_output_tokens = Number(val);
    }
  }

  if (action === "6") {
    const cur = (eff.supported_parameters || []).join(", ");
    const val = (
      await rl.question(`👉 Paramètres [${cur}] ('auto' pour OpenRouter) : `)
    ).trim();
    if (val.toLowerCase() === "auto") patch.supported_parameters = null;
    else if (val) {
      patch.supported_parameters = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (action === "7") {
    const curPricing = model.overrides.pricing ?? model.pricing ?? {};
    console.log("Tarification actuelle :", JSON.stringify(curPricing));
    console.log("Entrez les tarifs au format JSON ou 'auto' pour OpenRouter.");
    const val = (
      await rl.question(`👉 JSON pricing ('auto' pour reset) : `)
    ).trim();
    if (val.toLowerCase() === "auto") patch.pricing = null;
    else if (val) {
      try {
        patch.pricing = JSON.parse(val);
      } catch {
        throw new Error("Format JSON de tarification invalide.");
      }
    }
  }

  if (!Object.keys(patch).length) {
    console.log("ℹ️ Aucune modification apportée.");
    return null;
  }

  validateModelPatch(patch);
  return patch;
}

async function askBatchModelPatch(
  selected: StoredModel[],
  rl: Interface
): Promise<ModelPatch | null> {
  console.log("\n=======================================================");
  console.log(`⚡ MODIFICATION PAR LOT DE ${selected.length} MODÈLE(S)`);
  console.log("=======================================================");
  console.log("  1. ✅ Activer tous les modèles sélectionnés");
  console.log("  2. ❌ Désactiver tous les modèles sélectionnés");
  console.log("  3. 🔄 Rétablir les valeurs OpenRouter (auto) pour tous");
  console.log(
    "  4. 🛠️  Appliquer une surcharge spécifique (nom, contexte, etc.)"
  );
  console.log("  0. ↩️  Annuler");

  const choice = (await rl.question("\n👉 Votre choix [0-4] : ")).trim();
  if (choice === "0") return null;

  if (choice === "1") return { isActive: true };
  if (choice === "2") return { isActive: false };
  if (choice === "3") {
    return {
      architecture: null,
      context_length: null,
      description: null,
      max_output_tokens: null,
      name: null,
      pricing: null,
      supported_parameters: null,
    };
  }

  if (choice === "4") {
    return await askPatch(rl);
  }

  return null;
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
          "Exemples : #1 ; openai/gpt-4 ; #1,#4 ; #10-#20 ; tous (tous les résultats affichés)."
        );
        const selected = selectModels(
          await rl.question("👉 Sélection : "),
          models
        );

        let patch: ModelPatch | null = null;
        if (selected.length === 1) {
          patch = await askSingleModelInteractivePatch(selected[0], rl);
        } else {
          patch = await askBatchModelPatch(selected, rl);
        }

        if (!patch || !Object.keys(patch).length) {
          console.log("ℹ️ Aucune modification à enregistrer.");
          continue;
        }

        console.table(
          selected.map((m) => ({ ID: m.id, "N°": `#${m.model_number}` }))
        );
        console.log(
          "Modifications à appliquer :",
          JSON.stringify(patch, null, 2)
        );
        const confirm = (
          await rl.question(
            `👉 Confirmer l'application à ${selected.length} modèle(s) ? (O/n) : `
          )
        )
          .trim()
          .toLowerCase();

        if (confirm !== "n" && confirm !== "non") {
          const result = await applyModelPatch(
            sql,
            selected.map((m) => m.id),
            patch
          );
          console.log(
            "✅ " +
              result.length +
              " modèle(s) mis à jour avec succès ! Prise en compte API sous 10 secondes."
          );
          models = await searchModels(sql, query);
        } else {
          console.log("Modification annulée.");
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
