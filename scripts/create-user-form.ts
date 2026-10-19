/**
 * Script d'administration pour créer et gérer des formulaires en base de données.
 *
 * Utilisation :
 *   pnpm tsx scripts/create-user-form.ts --sample
 *   pnpm tsx scripts/create-user-form.ts --list
 */

import { neon } from "@neondatabase/serverless";
import { loadLocalEnv } from "./cli-env";

loadLocalEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Erreur : DATABASE_URL est introuvable.");
  process.exit(1);
}

const sql = neon(dbUrl);

export type SampleQuestion = {
  id: string;
  title: string;
  description?: string;
  type: "text" | "single_choice" | "multi_choice" | "rating";
  options?: string[];
  required?: boolean;
};

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    description: "Notez de 1 (faible) à 5 (excellent)",
    id: "general_satisfaction",
    required: true,
    title: "Comment évaluez-vous votre expérience générale avec mAI ?",
    type: "rating",
  },
  {
    id: "favorite_product",
    options: ["Chat mAI", "Coder", "Wakies", "Génération d'images", "Vibe"],
    required: true,
    title: "Quel produit ou outil utilisez-vous le plus fréquemment ?",
    type: "single_choice",
  },
  {
    id: "requested_improvements",
    options: [
      "Mode Agent plus rapide",
      "Recherche globale multi-sources",
      "Synthèse vocale temps réel",
      "Intégrations MCP et plugins",
      "Performances mobiles",
    ],
    required: false,
    title: "Quelles améliorations aimeriez-vous voir en priorité ?",
    type: "multi_choice",
  },
  {
    description: "Tout retour, idée ou signalement de bug est le bienvenu.",
    id: "free_feedback",
    required: false,
    title: "Avez-vous des suggestions ou remarques supplémentaires ?",
    type: "text",
  },
];

async function listForms() {
  console.log("\n📋 Liste des formulaires enregistrés en base :");
  const rows = await sql`
    SELECT id, name, "startDate", "endDate", "isActive", 
           jsonb_array_length(questions) as "questionCount", "createdAt"
    FROM "UserForm"
    ORDER BY "createdAt" DESC;
  `;

  if (rows.length === 0) {
    console.log("   (Aucun formulaire trouvé en base)");
    return;
  }

  console.table(
    rows.map((r) => ({
      Actif: r.isActive ? "Oui" : "Non",
      Début: new Date(r.startDate).toLocaleDateString("fr-FR"),
      Fin: r.endDate
        ? new Date(r.endDate).toLocaleDateString("fr-FR")
        : "Illimité",
      ID: r.id,
      Nom: r.name,
      Questions: r.questionCount,
    }))
  );
}

async function insertSampleForm() {
  console.log("\n🚀 Création d'un formulaire d'exemple en base...");

  const name = "Enquête de satisfaction Printemps 2026";
  const description =
    "Partagez votre avis sur mAI, Coder, Wakies et Vibe pour nous aider à améliorer la plateforme. En échange, bénéficiez de la réinitialisation immédiate de l'une de vos limites !";
  const startDate = new Date().toISOString();
  // Valable 60 jours
  const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const questionsJson = JSON.stringify(SAMPLE_QUESTIONS);
  const optionsJson = JSON.stringify({ category: "satisfaction_2026" });

  const result = await sql`
    INSERT INTO "UserForm" ("name", "description", "startDate", "endDate", "questions", "options", "isActive")
    VALUES (${name}, ${description}, ${startDate}, ${endDate}, ${questionsJson}::jsonb, ${optionsJson}::jsonb, true)
    RETURNING id, name, "startDate", "endDate";
  `;

  const created = result[0];
  console.log("✅ Formulaire créé avec succès !");
  console.log(`   ID : ${created.id}`);
  console.log(`   Nom : ${created.name}`);
  console.log(`   Début : ${created.startDate}`);
  console.log(`   Fin : ${created.endDate}`);
  console.log(
    "\n💡 Les utilisateurs connectés peuvent désormais y répondre dans /settings?tab=forms !"
  );
}

async function main() {
  const arg = process.argv[2];

  if (arg === "--list") {
    await listForms();
  } else if (arg === "--sample" || !arg) {
    await insertSampleForm();
    await listForms();
  } else {
    console.log("Usage :");
    console.log(
      "  pnpm tsx scripts/create-user-form.ts --sample   # Insère un formulaire d'exemple"
    );
    console.log(
      "  pnpm tsx scripts/create-user-form.ts --list     # Affiche les formulaires existants"
    );
  }
}

main().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
