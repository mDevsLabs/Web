import type { Interface } from "node:readline/promises";
import type { SqlClient } from "./openrouter-models.ts";

// Styles & Palette ANSI
const c = {
  bold: "\x1b[1m",
  brightCyan: "\x1b[96m",
  brightGreen: "\x1b[92m",
  brightMagenta: "\x1b[95m",
  brightYellow: "\x1b[93m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  underline: "\x1b[4m",
};

export type AdminQuestion = {
  id: string;
  title: string;
  description?: string;
  type: "text" | "single_choice" | "multi_choice" | "rating";
  options?: string[];
  required?: boolean;
};

// Modèles prédéfinis intelligents
const TEMPLATES: Record<
  string,
  { name: string; description: string; questions: AdminQuestion[] }
> = {
  "1": {
    description:
      "Recueillez l'avis général de vos utilisateurs sur la plateforme, les performances et les fonctionnalités prioritaires.",
    name: "Enquête de satisfaction globale & retours 2026",
    questions: [
      {
        description: "Note globale de 1 (faible) à 5 (excellent)",
        id: "satisfaction_globale",
        required: true,
        title: "Comment évaluez-vous votre expérience globale sur mAI ?",
        type: "rating",
      },
      {
        id: "outil_prefere",
        options: [
          "Chat & Modèles mAI",
          "Mode Agent autonome",
          "Coder (Studio de dev)",
          "Wakies (Assistant & Espaces)",
          "Génération d'images",
          "Vibe (Réseau social IA)",
        ],
        required: true,
        title: "Quel produit ou outil utilisez-vous le plus fréquemment ?",
        type: "single_choice",
      },
      {
        id: "fonctionnalites_a_ameliorer",
        options: [
          "Vitesse et réactivité des réponses",
          "Recherche globale unifiée",
          "Synthèse vocale audio",
          "Intégrations & Plugins MCP",
          "Interface et design mobile",
        ],
        required: false,
        title: "Quels aspects aimeriez-vous voir améliorés en priorité ?",
        type: "multi_choice",
      },
      {
        description:
          "Exprimez-vous librement sur ce qui pourrait être amélioré.",
        id: "remarques_libres",
        required: false,
        title:
          "Avez-vous des suggestions, idées ou remarques supplémentaires ?",
        type: "text",
      },
    ],
  },
  "2": {
    description:
      "Évaluez l'efficacité et la clarté du mode Agent et des intégrations MCP.",
    name: "Évaluation du Mode Agent Bêta & Outils",
    questions: [
      {
        description: "Note de 1 à 5",
        id: "agent_utilite",
        required: true,
        title:
          "Quelle est l'utilité des tâches autonomes du mode Agent pour vos besoins ?",
        type: "rating",
      },
      {
        id: "agent_capacite",
        options: [
          "Recherche d'informations",
          "Exécution de code & analyses",
          "Gestion des fichiers & projets",
          "Appels d'outils externes (MCP)",
        ],
        required: true,
        title: "Quelle capacité de l'Agent utilisez-vous le plus ?",
        type: "single_choice",
      },
      {
        id: "agent_feedback",
        required: false,
        title:
          "Quelles missions aimeriez-vous pouvoir confier à l'Agent à l'avenir ?",
        type: "text",
      },
    ],
  },
  "3": {
    description:
      "Identifiez les bugs rencontrés et les points de friction dans l'interface.",
    name: "Signalement d'ergonomie et traque de bugs",
    questions: [
      {
        id: "bugs_frequence",
        options: ["Jamais", "Rarement", "Parfois", "Régulièrement"],
        required: true,
        title: "Avez-vous rencontré des lenteurs ou des blocages récemment ?",
        type: "single_choice",
      },
      {
        id: "zones_sensibles",
        options: ["Chat", "Paramètres", "Recherche", "Coder", "Wakies", "Vibe"],
        required: false,
        title: "Dans quelle section avez-vous noté des anomalies ?",
        type: "multi_choice",
      },
      {
        id: "description_probleme",
        required: true,
        title: "Décrivez précisément le comportement attendu versus observé :",
        type: "text",
      },
    ],
  },
};

/**
 * Affiche la liste des formulaires existants
 */
export async function listAdminForms(sql: SqlClient) {
  const forms = (await sql`
    SELECT f.id, f.name, f."startDate", f."endDate", f."isActive",
           jsonb_array_length(f.questions) as "questionCount",
           f."createdAt",
           COUNT(r.id)::int as "responseCount"
    FROM "UserForm" f
    LEFT JOIN "UserFormResponse" r ON r."formId" = f.id
    GROUP BY f.id
    ORDER BY f."createdAt" DESC;
  `) as unknown as {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    questionCount: number;
    createdAt: string;
    responseCount: number;
  }[];

  if (!forms.length) {
    console.log(
      `\n  ${c.dim}ℹ Aucun formulaire enregistré en base pour le moment.${c.reset}`
    );
    return [];
  }

  console.log(
    `\n📋 ${c.bold}FORMULAIRES ENREGISTRÉS (${forms.length}) :${c.reset}`
  );
  console.table(
    forms.map((f, i) => ({
      Actif: f.isActive ? "✅ Oui" : "❌ Non",
      Début: new Date(f.startDate).toLocaleDateString("fr-FR"),
      Fin: f.endDate
        ? new Date(f.endDate).toLocaleDateString("fr-FR")
        : "Illimité",
      ID: `${f.id.slice(0, 8)}…`,
      Index: i + 1,
      Nom: f.name.length > 35 ? `${f.name.slice(0, 32)}…` : f.name,
      Questions: f.questionCount,
      Réponses: f.responseCount,
    }))
  );

  return forms;
}

/**
 * Création intelligente d'un formulaire (interactive ou assistée)
 */
export async function createFormIntelligently(sql: SqlClient, rl: Interface) {
  console.log(`\n${c.bold}✨ CRÉATION INTELLIGENTE D'UN FORMULAIRE${c.reset}`);
  console.log(
    "  1. 🎯 Utiliser un modèle intelligent pré-configuré (Recommandé)"
  );
  console.log("  2. 🛠️  Composer un formulaire personnalisé pas-à-pas");
  console.log("  0. ↩️ Annuler");

  const mode =
    (await rl.question("\n👉 Votre choix [0-2] (défaut: 1) : ")).trim() || "1";
  if (mode === "0") return;

  let formName = "";
  let formDescription = "";
  let questions: AdminQuestion[] = [];

  if (mode === "1") {
    console.log(`\n${c.bold}MODÈLES PRÉ-CONFIGURÉS DISPONIBLES :${c.reset}`);
    console.log(
      "  1. 🌟 Enquête de satisfaction globale & retours (4 questions)"
    );
    console.log("  2. 🤖 Évaluation du Mode Agent Bêta & Outils (3 questions)");
    console.log(
      `  3. 🐛 Signalement d'ergonomie et traque de bugs (3 questions)`
    );

    const tmplChoice =
      (await rl.question("👉 Choisissez un modèle [1-3] : ")).trim() || "1";
    const selectedTmpl = TEMPLATES[tmplChoice] || TEMPLATES["1"];

    console.log(
      `\nModèle sélectionné : ${c.brightCyan}${selectedTmpl.name}${c.reset}`
    );
    const customName = (
      await rl.question(`👉 Titre du formulaire [${selectedTmpl.name}] : `)
    ).trim();
    formName = customName || selectedTmpl.name;

    const customDesc = (
      await rl.question(
        `👉 Description [${selectedTmpl.description.slice(0, 50)}…] : `
      )
    ).trim();
    formDescription = customDesc || selectedTmpl.description;

    questions = [...selectedTmpl.questions];
  } else {
    // Mode sur mesure pas-à-pas
    while (!formName) {
      formName = (await rl.question("👉 Nom du formulaire : ")).trim();
      if (!formName) console.log(`${c.red}Le nom est obligatoire.${c.reset}`);
    }

    formDescription = (
      await rl.question("👉 Description (optionnel) : ")
    ).trim();

    console.log(
      `\n${c.bold}AJOUT DES QUESTIONS (Tapez fin pour terminer) :${c.reset}`
    );
    let adding = true;
    let qIndex = 1;

    while (adding) {
      console.log(`\n--- Question #${qIndex} ---`);
      const qTitle = (
        await rl.question(
          `👉 Intitulé de la question (ou 'fin' pour terminer) : `
        )
      ).trim();

      if (!qTitle || qTitle.toLowerCase() === "fin") {
        if (questions.length === 0) {
          console.log(`${c.red}Au moins une question est requise.${c.reset}`);
          continue;
        }
        adding = false;
        break;
      }

      console.log(
        "Types supportés : 1: rating (note 1-5) | 2: single_choice | 3: multi_choice | 4: text"
      );
      const typeChoice =
        (await rl.question("👉 Type [1-4] (défaut: 4) : ")).trim() || "4";
      let qType: AdminQuestion["type"] = "text";
      if (typeChoice === "1") qType = "rating";
      else if (typeChoice === "2") qType = "single_choice";
      else if (typeChoice === "3") qType = "multi_choice";

      let options: string[] | undefined;
      if (qType === "single_choice" || qType === "multi_choice") {
        const optsRaw = await rl.question(
          "👉 Options séparées par des virgules (ex: Oui, Non, Peut-être) : "
        );
        options = optsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!options.length) {
          options = ["Option 1", "Option 2"];
        }
      }

      const isReq = (await rl.question("👉 Question obligatoire ? (O/n) : "))
        .trim()
        .toLowerCase();
      const required = isReq !== "n" && isReq !== "non";

      questions.push({
        id: `q_${Date.now()}_${qIndex}`,
        options,
        required,
        title: qTitle,
        type: qType,
      });

      qIndex++;
    }
  }

  // Configuration des dates
  console.log(`\n${c.bold}PLANIFICATION & VALIDITÉ :${c.reset}`);
  const daysRaw = (
    await rl.question(`👉 Durée de validité en jours [60] (ou 'illimité') : `)
  ).trim();

  const startDate = new Date().toISOString();
  let endDate: string | null = null;

  if (
    daysRaw.toLowerCase() !== "illimité" &&
    daysRaw.toLowerCase() !== "illimite"
  ) {
    const days = Number.parseInt(daysRaw, 10) || 60;
    endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  // Aperçu avant confirmation
  console.log(`\n${c.bold}RÉCAPITULATIF DU FORMULAIRE :${c.reset}`);
  console.log(`  Nom         : ${c.brightCyan}${formName}${c.reset}`);
  console.log(`  Description : ${formDescription || "(aucune)"}`);
  console.log(
    `  Questions   : ${c.brightGreen}${questions.length} question(s)${c.reset}`
  );
  console.log(
    `  Date début  : ${new Date(startDate).toLocaleDateString("fr-FR")}`
  );
  console.log(
    `  Date fin    : ${endDate ? new Date(endDate).toLocaleDateString("fr-FR") : "Illimité"}`
  );

  const confirm = (
    await rl.question(
      "\n👉 Enregistrer ce formulaire en base de données ? (O/n) : "
    )
  )
    .trim()
    .toLowerCase();

  if (confirm === "n" || confirm === "non") {
    console.log("❌ Création annulée.");
    return;
  }

  const result = await sql`
    INSERT INTO "UserForm" (
      "name",
      "description",
      "startDate",
      "endDate",
      "questions",
      "options",
      "isActive"
    ) VALUES (
      ${formName},
      ${formDescription},
      ${startDate},
      ${endDate},
      ${JSON.stringify(questions)}::jsonb,
      '{}'::jsonb,
      true
    )
    RETURNING id, name;
  `;

  const created = result[0];
  console.log(
    `\n${c.brightGreen}✔ Formulaire enregistré avec succès !${c.reset} ID: ${created.id}`
  );
  console.log(
    `💡 Il est dès à présent disponible pour les utilisateurs dans ${c.underline}/settings?tab=forms${c.reset}`
  );
}

/**
 * Basculer l'activation d'un formulaire
 */
async function toggleFormActive(sql: SqlClient, rl: Interface) {
  const forms = await listAdminForms(sql);
  if (!forms.length) return;

  const inputIdx = (
    await rl.question("\n👉 Numéro ou ID du formulaire à basculer : ")
  ).trim();

  let targetId: string | null = null;
  const num = Number.parseInt(inputIdx, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= forms.length) {
    targetId = forms[num - 1].id;
  } else {
    const found = forms.find((f) => f.id.startsWith(inputIdx));
    if (found) targetId = found.id;
  }

  if (!targetId) {
    console.log(`${c.red}Formulaire introuvable.${c.reset}`);
    return;
  }

  const updated = await sql`
    UPDATE "UserForm"
    SET "isActive" = NOT "isActive", "updatedAt" = NOW()
    WHERE id = ${targetId}
    RETURNING id, name, "isActive";
  `;

  if (updated.length > 0) {
    const f = updated[0];
    console.log(
      `${c.brightGreen}✔ Statut mis à jour :${c.reset} « ${f.name} » est maintenant ${f.isActive ? "✅ ACTIF" : "❌ INACTIF"}.`
    );
  }
}

/**
 * Supprimer un formulaire
 */
async function deleteForm(sql: SqlClient, rl: Interface) {
  const forms = await listAdminForms(sql);
  if (!forms.length) return;

  const inputIdx = (
    await rl.question("\n👉 Numéro ou ID du formulaire à SUPPRIMER : ")
  ).trim();

  let target: (typeof forms)[0] | undefined;
  const num = Number.parseInt(inputIdx, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= forms.length) {
    target = forms[num - 1];
  } else {
    target = forms.find((f) => f.id.startsWith(inputIdx));
  }

  if (!target) {
    console.log(`${c.red}Formulaire introuvable.${c.reset}`);
    return;
  }

  const confirm = (
    await rl.question(
      `⚠️ Confirmer la suppression définitive de « ${target.name} » et de ses ${target.responseCount} réponse(s) ? (o/N) : `
    )
  )
    .trim()
    .toLowerCase();

  if (confirm !== "o" && confirm !== "oui" && confirm !== "y") {
    console.log("Suppression annulée.");
    return;
  }

  await sql`DELETE FROM "UserForm" WHERE id = ${target.id}`;
  console.log(`${c.brightGreen}✔ Formulaire supprimé avec succès.${c.reset}`);
}

/**
 * Menu principal du gestionnaire de formulaires
 */
export async function runFormManager(sql: SqlClient, rl: Interface) {
  let running = true;
  while (running) {
    console.log("\n=======================================================");
    console.log(
      `📝  ${c.bold}GESTIONNAIRE DE FORMULAIRES & SONDAGES mAI${c.reset}`
    );
    console.log("=======================================================");
    console.log(
      "  1. ✨ Créer un formulaire intelligemment (Interactif / Modèles)"
    );
    console.log("  2. 📋 Lister tous les formulaires & voir les statistiques");
    console.log("  3. 🔄 Activer / Désactiver un formulaire");
    console.log("  4. 🗑️ Supprimer un formulaire");
    console.log("  0. ↩️ Retour au menu principal");

    const choice = (await rl.question("\n👉 Votre choix [0-4] : ")).trim();
    switch (choice) {
      case "1":
        await createFormIntelligently(sql, rl);
        break;
      case "2":
        await listAdminForms(sql);
        break;
      case "3":
        await toggleFormActive(sql, rl);
        break;
      case "4":
        await deleteForm(sql, rl);
        break;
      case "0":
      case "exit":
      case "quit":
        running = false;
        break;
      default:
        console.log("⚠️ Option invalide.");
    }
  }
}
