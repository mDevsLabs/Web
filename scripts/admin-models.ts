import type { Interface } from "node:readline/promises";
import {
  effectiveModel,
  invalidateModelCatalog,
  type ModelFournisseur,
  type ModelType,
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
  "type",
  "provider",
  "fournisseur",
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
    if (value === null) continue; // Rétablir la valeur d'origine.

    if (key === "type") {
      if (value !== "chat" && value !== "audio" && value !== "image") {
        throw new Error("type doit être 'chat', 'audio' ou 'image'.");
      }
    } else if (key === "fournisseur") {
      if (value !== "openrouter" && value !== "cometapi") {
        throw new Error("fournisseur doit être 'openrouter' ou 'cometapi'.");
      }
    } else if (key === "provider") {
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(
          "provider (laboratoire) doit être une chaîne non vide."
        );
      }
    } else if (key === "context_length" || key === "max_output_tokens") {
      if (
        !Number.isSafeInteger(value) ||
        Number(value) < 0 ||
        Number(value) > 2_147_483_647
      ) {
        throw new Error(
          "La limite de tokens doit être un entier positif ou zéro."
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
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (end < start || end - start > 1000)
        throw new Error("Plage de numéros invalide.");
      for (let n = start; n <= end; n++) {
        const m = numbers.get(String(n));
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
  query = "",
  typeFilter: "all" | ModelType = "all",
  fournisseurFilter: "all" | ModelFournisseur = "all"
): Promise<StoredModel[]> {
  let cleanQuery = query.trim();

  // Extraction éventuelle de directives inline type: et fournisseur:
  const typeMatch = cleanQuery.match(/\btype:(chat|audio|image|all)\b/i);
  let effectiveType = typeFilter;
  if (typeMatch) {
    effectiveType = typeMatch[1].toLowerCase() as any;
    cleanQuery = cleanQuery.replace(typeMatch[0], "").trim();
  }

  const fMatch = cleanQuery.match(/\bfournisseur:(openrouter|cometapi|all)\b/i);
  let effectiveFournisseur = fournisseurFilter;
  if (fMatch) {
    effectiveFournisseur = fMatch[1].toLowerCase() as any;
    cleanQuery = cleanQuery.replace(fMatch[0], "").trim();
  }

  const term = `%${cleanQuery}%`;
  const rawNum = cleanQuery.replace(/^#/, "");

  return await sqlQuerySearch(
    sql,
    term,
    rawNum,
    effectiveType,
    effectiveFournisseur
  );
}

async function sqlQuerySearch(
  sql: SqlClient,
  term: string,
  rawNum: string,
  typeFilter: string,
  fournisseurFilter: string
): Promise<StoredModel[]> {
  return await sql`
    SELECT id, model_number,
      COALESCE(NULLIF(provider, ''), split_part(id, '/', 1)) as provider,
      COALESCE(fournisseur, 'openrouter') as fournisseur,
      COALESCE(type, 'chat') as type,
      name, description, created, context_length,
      max_output_tokens, architecture, pricing, supported_parameters, upstream,
      overrides, "isActive", is_available
    FROM openrouter_models
    WHERE (
      id ILIKE ${term}
      OR COALESCE(overrides->>'name', name) ILIKE ${term}
      OR provider ILIKE ${term}
      OR model_number::text = ${rawNum}
    )
    AND (${typeFilter} = 'all' OR type = ${typeFilter})
    AND (${fournisseurFilter} = 'all' OR fournisseur = ${fournisseurFilter})
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
  const { isActive, type, provider, fournisseur, ...metadata } = patch;
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
    (type as string) ?? null,
    (provider as string) ?? null,
    (fournisseur as string) ?? null,
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
  type: string | null,
  provider: string | null,
  fournisseur: string | null,
  reset: string[],
  updates: object
) {
  return await sql`
    UPDATE openrouter_models
    SET "isActive" = COALESCE(${active}::boolean, "isActive"),
      type = COALESCE(${type}::varchar, type),
      provider = COALESCE(${provider}::text, provider),
      fournisseur = COALESCE(${fournisseur}::varchar, fournisseur),
      overrides = (overrides - ${reset}::text[]) || ${JSON.stringify(updates)}::jsonb,
      updated_at = now()
    WHERE id = ANY(${ids}::text[])
    RETURNING id, model_number, "isActive", type, provider, fournisseur, overrides
  `;
}

function displayModels(models: StoredModel[], offset = 0) {
  console.table(
    models.slice(offset, offset + 25).map((m) => {
      const e = effectiveModel(m);
      const typeIcon =
        m.type === "audio"
          ? "🎙️ audio"
          : m.type === "image"
            ? "🖼️ image"
            : "💬 chat";

      return {
        Actif: m.isActive,
        Contexte: e.maxContext ? e.maxContext.toLocaleString("fr-FR") : "-",
        Disponible: m.is_available,
        Fournisseur: m.fournisseur || "openrouter",
        ID: m.id,
        Labo: m.provider || e.owned_by,
        Nom: e.name,
        "N°": `#${m.model_number}`,
        Sortie: e.maxOutput ? e.maxOutput.toLocaleString("fr-FR") : "-",
        Type: typeIcon,
      };
    })
  );
  console.log(
    `${models.length} modèle(s) trouvé(s). Les ID sont ceux des APIs amont (OpenRouter / CometAPI).`
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
  console.log(`  Identifiant (ID): ${model.id}`);
  console.log(`  Laboratoire     : ${model.provider || eff.owned_by}`);
  console.log(`  Fournisseur     : ${model.fournisseur || "openrouter"}`);
  console.log(
    `  Type de modèle  : ${model.type === "audio" ? "🎙️ AUDIO" : model.type === "image" ? "🖼️ IMAGE (CometAPI)" : "💬 CHAT"}`
  );
  console.log(
    `  Statut actuel   : ${model.isActive ? "✅ ACTIF" : "❌ INACTIF"} (Dispo: ${model.is_available ? "Oui" : "Non"})`
  );
  console.log(
    `  Nom effectif    : ${eff.name} ${model.overrides.name ? "(surchargé)" : "(original)"}`
  );
  console.log(
    `  Contexte max    : ${eff.maxContext?.toLocaleString("fr-FR") || "N/A"} tokens`
  );
  console.log(
    `  Sortie max      : ${eff.maxOutput?.toLocaleString("fr-FR") || "N/A"} tokens`
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
    `  Surcharges      : ${ovKeys.length ? ovKeys.join(", ") : "aucune (valeurs d'origine)"}`
  );
  console.log("-------------------------------------------------------");
  console.log("👉 Que souhaitez-vous modifier ?");
  console.log("  1. 🏷️  Nom d'affichage");
  console.log("  2. 📝 Description");
  console.log(
    `  3. 🔘 Basculer Statut (${model.isActive ? "Actif ➔ INACTIF" : "Inactif ➔ ACTIF"})`
  );
  console.log(
    `  4. 🎯 Type de modèle (actuel: ${model.type} ➔ chat, audio, image)`
  );
  console.log(`  5. 🏢 Laboratoire concepteur (provider: ${model.provider})`);
  console.log(
    `  6. 🔌 Service fournisseur (fournisseur: ${model.fournisseur})`
  );
  console.log("  7. 🧠 Taille de contexte (context_length)");
  console.log("  8. 📤 Tokens de sortie max (max_output_tokens)");
  console.log("  9. ⚙️  Paramètres supportés (supported_parameters)");
  console.log("  10. 💰 Tarifs (pricing prompt / completion)");
  console.log(
    "  11. 🔄 Rétablir TOUTES les valeurs d'origine (supprimer surcharges)"
  );
  console.log("  0. ↩️  Annuler la modification");

  const action = (await rl.question("\n👉 Votre choix [0-11] : ")).trim();

  if (action === "0") return null;

  if (action === "3") {
    patch.isActive = !model.isActive;
    return patch;
  }

  if (action === "4") {
    console.log("\nChoisissez le type de modèle :");
    console.log("  1. 💬 chat  (modèle textuel, conversation, code)");
    console.log("  2. 🎙️ audio (synthèse vocale, transcription)");
    console.log("  3. 🖼️ image (génération d'images via CometAPI)");
    const tChoice = (await rl.question("👉 Votre choix [1-3] : ")).trim();
    if (tChoice === "1") patch.type = "chat";
    else if (tChoice === "2") patch.type = "audio";
    else if (tChoice === "3") patch.type = "image";
    return patch;
  }

  if (action === "5") {
    const cur = model.provider || "inconnu";
    const val = (
      await rl.question(`👉 Laboratoire concepteur [${cur}] : `)
    ).trim();
    if (val && val !== cur) patch.provider = val;
    return patch;
  }

  if (action === "6") {
    console.log("\nChoisissez le service fournisseur amont :");
    console.log("  1. openrouter");
    console.log("  2. cometapi");
    const fChoice = (await rl.question("👉 Votre choix [1-2] : ")).trim();
    if (fChoice === "1") patch.fournisseur = "openrouter";
    else if (fChoice === "2") patch.fournisseur = "cometapi";
    return patch;
  }

  if (action === "11") {
    const confirm = (
      await rl.question(
        "⚠️ Réinitialiser toutes les surcharges et rétablir les valeurs d'origine ? (o/N) : "
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

  if (action === "1") {
    const cur = String(model.overrides.name ?? eff.name ?? "");
    const val = (
      await rl.question(`👉 Nom d'affichage [${cur}] ('auto' pour reset) : `)
    ).trim();
    if (val.toLowerCase() === "auto") patch.name = null;
    else if (val && val !== cur) patch.name = val;
  }

  if (action === "2") {
    const cur = String(model.overrides.description ?? eff.description ?? "");
    const preview = cur.length > 50 ? `${cur.slice(0, 47)}…` : cur;
    const val = (
      await rl.question(`👉 Description [${preview}] ('auto' pour reset) : `)
    ).trim();
    if (val.toLowerCase() === "auto") patch.description = null;
    else if (val && val !== cur) patch.description = val;
  }

  if (action === "7") {
    const cur = Number(model.overrides.context_length ?? eff.maxContext ?? 0);
    const val = (
      await rl.question(
        `👉 Contexte max en tokens [${cur}] ('auto' pour reset) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.context_length = null;
    else if (val && !Number.isNaN(Number(val)) && Number(val) !== cur) {
      patch.context_length = Number(val);
    }
  }

  if (action === "8") {
    const cur = Number(model.overrides.max_output_tokens ?? eff.maxOutput ?? 0);
    const val = (
      await rl.question(
        `👉 Sortie max en tokens [${cur}] ('auto' pour reset) : `
      )
    ).trim();
    if (val.toLowerCase() === "auto") patch.max_output_tokens = null;
    else if (val && !Number.isNaN(Number(val)) && Number(val) !== cur) {
      patch.max_output_tokens = Number(val);
    }
  }

  if (action === "9") {
    const cur = (eff.supported_parameters || []).join(", ");
    const val = (
      await rl.question(`👉 Paramètres [${cur}] ('auto' pour reset) : `)
    ).trim();
    if (val.toLowerCase() === "auto") patch.supported_parameters = null;
    else if (val) {
      patch.supported_parameters = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (action === "10") {
    const curPricing = model.overrides.pricing ?? model.pricing ?? {};
    console.log("Tarification actuelle :", JSON.stringify(curPricing));
    console.log("Entrez les tarifs au format JSON ou 'auto' pour reset.");
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
  console.log("  3. 🎯 Définir le Type pour tous (chat, audio, image)");
  console.log(
    "  4. 🔌 Définir le Fournisseur pour tous (openrouter, cometapi)"
  );
  console.log("  5. 🔄 Rétablir les valeurs d'origine pour tous");
  console.log("  0. ↩️  Annuler");

  const choice = (await rl.question("\n👉 Votre choix [0-5] : ")).trim();
  if (choice === "0") return null;

  if (choice === "1") return { isActive: true };
  if (choice === "2") return { isActive: false };
  if (choice === "3") {
    console.log("1. chat | 2. audio | 3. image");
    const t = (await rl.question("👉 Type [1-3] : ")).trim();
    if (t === "1") return { type: "chat" };
    if (t === "2") return { type: "audio" };
    if (t === "3") return { type: "image" };
    return null;
  }
  if (choice === "4") {
    console.log("1. openrouter | 2. cometapi");
    const f = (await rl.question("👉 Fournisseur [1-2] : ")).trim();
    if (f === "1") return { fournisseur: "openrouter" };
    if (f === "2") return { fournisseur: "cometapi" };
    return null;
  }
  if (choice === "5") {
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

  return null;
}

export async function runModelManager(sql: SqlClient, rl: Interface) {
  let query = "";
  let offset = 0;
  let typeFilter: "all" | ModelType = "all";
  let fournisseurFilter: "all" | ModelFournisseur = "all";

  let models = await searchModels(sql, query, typeFilter, fournisseurFilter);

  while (true) {
    const typeLabel =
      typeFilter === "all"
        ? "TOUS"
        : typeFilter === "audio"
          ? "🎙️ AUDIO"
          : typeFilter === "image"
            ? "🖼️ IMAGE"
            : "💬 CHAT";
    const fLabel =
      fournisseurFilter === "all" ? "TOUS" : fournisseurFilter.toUpperCase();

    console.log(
      `\n🤖 CATALOGUE DE MODÈLES — Type : [${typeLabel}] | Fournisseur : [${fLabel}] | Recherche : "${query || "tous"}"`
    );
    displayModels(models, offset);

    console.log(
      "1. 🔍 Rechercher par mot-clé     2. ➡️ Page suivante      3. ⬅️ Page précédente"
    );
    console.log(
      "4. 🎯 Filtrer par Type (Chat/Audio/Image)   5. 🔌 Filtrer par Fournisseur"
    );
    console.log(
      "6. 📋 Détails complets d'un modèle         7. ✏️  Modifier un ou plusieurs modèles"
    );
    console.log(
      "8. 🔄 Lancer la synchronisation (OpenRouter & CometAPI)   0. ↩️  Retour"
    );

    const choice = (await rl.question("\n👉 Votre choix [0-8] : ")).trim();
    try {
      if (choice === "0") return;

      if (choice === "1") {
        query = (
          await rl.question(
            "👉 Recherche (nom, ID, labo, numéro - vide = tous) : "
          )
        ).trim();
        offset = 0;
        models = await searchModels(sql, query, typeFilter, fournisseurFilter);
      } else if (choice === "2") {
        if (offset + 25 < models.length) offset += 25;
      } else if (choice === "3") {
        offset = Math.max(0, offset - 25);
      } else if (choice === "4") {
        console.log("\nChoisissez le filtre par type :");
        console.log("  0. 🌐 Tous les types");
        console.log("  1. 💬 Chat uniquement");
        console.log("  2. 🎙️ Audio uniquement");
        console.log("  3. 🖼️ Image uniquement (CometAPI)");
        const tf = (await rl.question("👉 Votre choix [0-3] : ")).trim();
        if (tf === "0") typeFilter = "all";
        else if (tf === "1") typeFilter = "chat";
        else if (tf === "2") typeFilter = "audio";
        else if (tf === "3") typeFilter = "image";
        offset = 0;
        models = await searchModels(sql, query, typeFilter, fournisseurFilter);
      } else if (choice === "5") {
        console.log("\nChoisissez le filtre par fournisseur :");
        console.log("  0. 🌐 Tous les fournisseurs");
        console.log("  1. ⚡ OpenRouter");
        console.log("  2. ☄️  CometAPI");
        const ff = (await rl.question("👉 Votre choix [0-2] : ")).trim();
        if (ff === "0") fournisseurFilter = "all";
        else if (ff === "1") fournisseurFilter = "openrouter";
        else if (ff === "2") fournisseurFilter = "cometapi";
        offset = 0;
        models = await searchModels(sql, query, typeFilter, fournisseurFilter);
      } else if (choice === "6") {
        const selected = selectModels(
          await rl.question("👉 ID ou #numéro : "),
          models
        );
        for (const m of selected) {
          console.log(
            JSON.stringify(
              {
                ...effectiveModel(m),
                fournisseur: m.fournisseur,
                is_available: m.is_available,
                isActive: m.isActive,
                model_number: m.model_number,
                overrides: m.overrides,
                pricing: m.overrides.pricing ?? m.pricing,
                provider: m.provider,
                type: m.type,
                upstream: m.upstream,
              },
              null,
              2
            )
          );
        }
      } else if (choice === "7") {
        console.log("Exemples : #1 ; openai/gpt-4o ; #1,#4 ; #10-#20 ; tous.");
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
          selected.map((m) => ({
            Fournisseur: m.fournisseur,
            ID: m.id,
            "N°": `#${m.model_number}`,
            Type: m.type,
          }))
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
            `✅ ${result.length} modèle(s) mis à jour avec succès ! Prise en compte API sous 10 secondes.`
          );
          models = await searchModels(
            sql,
            query,
            typeFilter,
            fournisseurFilter
          );
        } else {
          console.log("Modification annulée.");
        }
      } else if (choice === "8") {
        console.log("⏳ Synchronisation en cours (OpenRouter & CometAPI)...");
        await updateModels(sql);
        models = await searchModels(sql, query, typeFilter, fournisseurFilter);
      } else {
        console.log("⚠️ Choix invalide.");
      }
    } catch (error) {
      console.error("❌", error instanceof Error ? error.message : error);
    }
  }
}
