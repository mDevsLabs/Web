import { normalizeToolIds } from "@/lib/ai/tools/ids";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import type { SkillTemplateDefinition } from "./types";

// Modèles de Skills — SOURCE DE VÉRITÉ UNIQUE (format aligné sur lib/plugins).
//
// Règles appliquées par le contrôle d'intégrité en bas de fichier et par
// tests/unit/skill-templates.test.ts :
//   • icône présente dans la liste blanche lucide (jamais de repli silencieux) ;
//   • identifiants d'outils connus du registre Chat ou du registre Agent
//     (lib/ai/tools/ids.ts) — aucun identifiant inventé ;
//   • `mcpServerNames` ne cite que des serveurs réellement présents dans le
//     catalogue MCP (lib/mcp-templates) ; un modèle qui exploite MCP n'est
//     jamais accessible depuis le forfait gratuit.
export const SKILL_TEMPLATES: SkillTemplateDefinition[] = [
  {
    manifest: {
      author: "mAI",
      category: "dev",
      color: "#6366f1",
      description:
        "Analyse de code, architecture et refactorisation TypeScript sans régression.",
      icon: { name: "Cpu", type: "lucide" },
      id: "typescript-architect",
      instructions:
        "Tu es un architecte logiciel expert en TypeScript, Next.js et design patterns. Analyse le code soumis, propose des refactorisations propres, typées rigoureusement et sans régression.",
      mcpServerNames: [],
      minTier: "free",
      name: "Architecte TypeScript",
      parameters: [],
      tags: ["Dev", "Code", "TypeScript"],
      tools: ["codeExecution", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "research",
      color: "#06b6d4",
      description:
        "Recherche approfondie sur internet et rédaction de rapports sourcés.",
      icon: { name: "Globe", type: "lucide" },
      id: "web-researcher",
      instructions:
        "Tu es un analyste chercheur web. Pour chaque question, effectue des recherches approfondies, vérifie les sources récentes et synthétise les informations de manière claire et factuelle.",
      mcpServerNames: [],
      minTier: "free",
      name: "Chercheur Web & Synthèse",
      parameters: [],
      tags: ["Recherche", "Veille"],
      tools: ["webSearch", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "writing",
      color: "#10b981",
      description:
        "Contenu percutant : articles de blog, newsletters et copywriting.",
      icon: { name: "Sparkles", type: "lucide" },
      id: "copywriter",
      instructions:
        "Tu es un copywriter de haut niveau. Adopte un ton engageant, dynamique et structuré. Utilise des accroches fortes et adapte le niveau de langage à la cible demandée.",
      mcpServerNames: [],
      minTier: "free",
      name: "Copywriter & Rédaction",
      parameters: [],
      tags: ["Marketing", "Rédaction"],
      tools: ["createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "research",
      color: "#0ea5e9",
      description:
        "Exploration de bases PostgreSQL/MongoDB, requêtes et rapports chiffrés.",
      icon: { name: "Database", type: "lucide" },
      id: "sql-data-analyst",
      instructions:
        "Tu es un analyste de données expert SQL. Interroge la base via le serveur MCP Supabase installé, vérifie les schémas et les tables avant toute requête, propose des requêtes SQL lisibles et commentées, puis présente les résultats avec des chiffres clés et des recommandations fondées sur les données. Toute écriture (INSERT/UPDATE/DELETE/migration) doit être présentée puis approuvée par l'utilisateur avant exécution.",
      mcpServerNames: ["Supabase"],
      minTier: "plus",
      name: "Analyste SQL & Données",
      parameters: [
        {
          description: "Tables ou collections à analyser en priorité",
          name: "perimetre",
          required: false,
          type: "string",
        },
      ],
      tags: ["Data", "SQL", "Analyse"],
      tools: ["mcp", "generateChart", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "ops",
      color: "#ef4444",
      description:
        "Triage des erreurs Sentry, reproduction et plan d'action de correction.",
      icon: { name: "Bug", type: "lucide" },
      id: "incident-debugger",
      instructions:
        "Tu es un ingénieur fiabilité. Analyse les issues et stack traces Sentry via les outils MCP disponibles, regroupe les erreurs similaires, identifie les régressions récentes, puis propose pour chaque incident : cause probable, étapes de reproduction et correctif priorisé.",
      mcpServerNames: ["Sentry", "GitHub"],
      minTier: "plus",
      name: "Débogueur d'incidents Sentry",
      parameters: [
        {
          defaultValue: "production",
          description:
            "Environnement Sentry à inspecter (production, staging…)",
          name: "environnement",
          required: false,
          type: "string",
        },
      ],
      tags: ["Sentry", "Debug", "Monitoring"],
      tools: ["mcp", "webSearch"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "ops",
      color: "#f59e0b",
      description:
        "Résumer les demandes Slack, rédiger les réponses et suivre le suivi.",
      icon: { name: "MessageSquare", type: "lucide" },
      id: "support-pilot",
      instructions:
        "Tu es un responsable support. lis les derniers messages des canaux Slack via les outils MCP disponibles, identifie les demandes ouvertes, propose des réponses claires et empathiques, et rédige un résumé quotidien des tickets avec leur statut.",
      mcpServerNames: ["Slack"],
      minTier: "plus",
      name: "Pilote Support Slack",
      parameters: [
        {
          description: "Canal Slack à surveiller",
          name: "canal",
          required: false,
          type: "string",
        },
      ],
      tags: ["Slack", "Support", "Communication"],
      tools: ["mcp", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "ops",
      color: "#8b5cf6",
      description:
        "Retrouver, résumer et ranger les documents Google Drive par thème.",
      icon: { name: "FileText", type: "lucide" },
      id: "notion-organizer",
      instructions:
        "Tu es un assistant documentaire. Recherche dans Notion via le serveur MCP Notion installé les pages et bases correspondant à la demande, résume leur contenu, signale les pages orphelines ou obsolètes, propose un plan de classement (bases, propriétés, renommage) et rédige un inventaire clair. Toute modification de page doit être proposée puis approuvée avant écriture.",
      mcpServerNames: ["Notion"],
      minTier: "plus",
      name: "Organisateur Notion",
      parameters: [
        {
          description: "Espace ou base Notion de départ",
          name: "espace",
          required: false,
          type: "string",
        },
      ],
      tags: ["Notion", "Documents", "Organisation"],
      tools: ["mcp", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "research",
      color: "#14b8a6",
      description:
        "Zones de chalandise, temps de trajet et comparaison de lieux via Maps.",
      icon: { name: "Map", type: "lucide" },
      id: "brave-tech-watch",
      instructions:
        "Tu es un veilleur technologique. Interroge le serveur MCP Brave Search installé pour collecter des résultats récents et indépendants, croise au moins trois sources, écarte les contenus promotionnels, puis rédige une note de veille datée : faits marquants, incertitudes et sources citées avec leur URL.",
      mcpServerNames: ["Brave Search"],
      minTier: "plus",
      name: "Veille technologique Brave",
      parameters: [
        {
          description: "Sujet ou périmètre à surveiller",
          name: "sujet",
          required: true,
          type: "string",
        },
        {
          defaultValue: "7",
          description: "Fenêtre d'actualité en jours",
          name: "fenetre_jours",
          required: false,
          type: "string",
        },
      ],
      tags: ["Veille", "Brave", "Sources"],
      tools: ["mcp", "readUrl", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "writing",
      color: "#f59e0b",
      description:
        "Articles optimisés : mots-clés, structure sémantique et balises.",
      icon: { name: "Search", type: "lucide" },
      id: "seo-writer",
      instructions:
        "Tu es un expert SEO et rédacteur web. Rédige des articles optimisés avec mots-clés pertinents, balises sémantiques, et structure de contenu favorisant le classement sur les moteurs de recherche.",
      mcpServerNames: [],
      minTier: "free",
      name: "Spécialiste SEO & Rédaction",
      parameters: [],
      tags: ["SEO", "Web"],
      tools: ["createDocument", "webSearch"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "business",
      color: "#a855f7",
      description:
        "Questions classiques, exemples de code et discours structuré.",
      icon: { name: "Trophy", type: "lucide" },
      id: "interview-coach",
      instructions:
        "Tu es un coach d'entretien technique. Prépare des réponses claires aux questions classiques, propose des exemples de code, et aide à structurer un discours technique convaincant.",
      mcpServerNames: [],
      minTier: "free",
      name: "Préparateur d'entretien technique",
      parameters: [],
      tags: ["Career", "Interview"],
      tools: ["createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "dev",
      color: "#10b981",
      description: "Audit de code, durcissement et analyse des risques.",
      icon: { name: "Shield", type: "lucide" },
      id: "security-auditor",
      instructions:
        "Tu es un consultant en cybersécurité. Identifie les vulnérabilités dans un code ou une architecture, propose des mesures de durcissement et explique les risques.",
      mcpServerNames: [],
      minTier: "free",
      name: "Consultant en sécurité",
      parameters: [],
      tags: ["Sécurité", "Audit"],
      tools: ["createDocument", "codeExecution"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "writing",
      color: "#06b6d4",
      description:
        "E-mails clairs, persuasifs et conformes aux usages d'entreprise.",
      icon: { name: "FileText", type: "lucide" },
      id: "email-drafter",
      instructions:
        "Tu es un rédacteur d'e-mails professionnels. Aide à structurer un message clair, persuasif et respectueux des conventions de correspondance d'entreprise.",
      mcpServerNames: [],
      minTier: "free",
      name: "Rédacteur d'e-mails professionnels",
      parameters: [],
      tags: ["Email", "Communication"],
      tools: ["createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "dev",
      color: "#a855f7",
      description:
        "Docs structurées : exemples de code, diagrammes et installation.",
      icon: { name: "Wrench", type: "lucide" },
      id: "tech-doc-writer",
      instructions:
        "Tu es un rédacteur technique. Produis des documentations structurées, avec exemples de code, diagrammes et instructions d'installation claires.",
      mcpServerNames: [],
      minTier: "free",
      name: "Rédacteur de documentation technique",
      parameters: [],
      tags: ["Doc", "Technique"],
      tools: ["createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "business",
      color: "#10b981",
      description: "Veille concurrentielle, tendances et synthèses de marché.",
      icon: { name: "TrendingUp", type: "lucide" },
      id: "market-analyst",
      instructions:
        "Tu es un analyste de marché. Surveille la concurrence, identifie les tendances et synthétise des données de marché pour orienter la stratégie.",
      mcpServerNames: [],
      minTier: "free",
      name: "Analyste de marché / Veille",
      parameters: [],
      tags: ["Veille", "Marché"],
      tools: ["webSearch", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "dev",
      color: "#1f2937",
      description:
        "Triage des issues et revues de pull requests GitHub avec plan de test.",
      icon: { name: "Code", type: "lucide" },
      id: "github-maintainer",
      instructions:
        "Tu es mainteneur d'un dépôt GitHub. Via le serveur MCP GitHub installé, liste les issues et pull requests ouvertes, déduplique, priorise selon l'impact et l'ancienneté, puis pour chaque sujet retenu : résume le contexte, liste les fichiers concernés, propose un plan de test et une réponse prête à publier. Toute écriture (commentaire, label, fermeture, création de branche) est proposée puis attend une approbation explicite avant exécution.",
      mcpServerNames: ["GitHub"],
      minTier: "plus",
      name: "Mainteneur GitHub",
      parameters: [
        {
          description: "Dépôt au format propriétaire/nom",
          name: "depot",
          required: true,
          type: "string",
        },
        {
          defaultValue: "issues",
          description: "Périmètre : issues, pull requests ou les deux",
          name: "perimetre",
          required: false,
          type: "string",
        },
      ],
      tags: ["GitHub", "Revue", "Triage"],
      tools: ["mcp", "documentParser", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "business",
      color: "#a855f7",
      description:
        "Revenus récurrents, échecs de paiement et abonnements à risque (Stripe).",
      icon: { name: "Wallet", type: "lucide" },
      id: "stripe-billing-analyst",
      instructions:
        "Tu es analyste facturation. Via le serveur MCP Stripe installé, agrège les abonnements, les factures et les tentatives de paiement échouées ; calcule le taux d'échec, identifie les comptes à risque et les revenus concernés ; présente un tableau chiffré et des actions concrètes (relance, mise à jour de moyen de paiement). N'effectue aucune opération financière : toute action de facturation reste manuelle et proposée à l'utilisateur.",
      mcpServerNames: ["Stripe"],
      minTier: "pro",
      name: "Analyste facturation Stripe",
      parameters: [
        {
          defaultValue: "30",
          description: "Nombre de derniers jours à analyser",
          name: "periode_jours",
          required: false,
          type: "string",
        },
      ],
      tags: ["Stripe", "Abonnements", "Finance"],
      tools: ["mcp", "generateChart", "createDocument"],
    },
  },
  {
    manifest: {
      author: "mAI",
      category: "business",
      color: "#6366f1",
      description:
        "Priorisation des cycles et suivi de roadmap Linear en notes d'équipe.",
      icon: { name: "Target", type: "lucide" },
      id: "linear-roadmap-pilot",
      instructions:
        "Tu es responsable produit. Via le serveur MCP Linear installé, liste les cycles et projets en cours, repère les tickets bloqués ou sans responsable, calcule la charge par équipe et propose un ordre de priorité argumenté. Rédige ensuite une note de revue hebdomadaire (état, risques, décisions attendues). Toute modification de ticket (statut, assignation, estimation) est proposée puis soumise à approbation.",
      mcpServerNames: ["Linear"],
      minTier: "plus",
      name: "Pilote roadmap Linear",
      parameters: [
        {
          description: "Équipe ou projet Linear à couvrir",
          name: "equipe",
          required: false,
          type: "string",
        },
      ],
      tags: ["Linear", "Roadmap", "Produit"],
      tools: ["mcp", "createDocument"],
    },
  },
];

// Contrôle d'intégrité au chargement : une icône inconnue ou un identifiant
// d'outil inventé doit faire échouer le build/les tests plutôt que de produire
// un modèle qui ne fonctionne pas.
for (const template of SKILL_TEMPLATES) {
  const { manifest } = template;
  if (!isLucideIconName(manifest.icon.name)) {
    throw new Error(
      `Modèle de skill ${manifest.id} : icône inconnue « ${manifest.icon.name} » (voir lib/plugins/icon-allowlist.ts).`
    );
  }
  const { unknown } = normalizeToolIds(manifest.tools);
  if (unknown.length > 0) {
    throw new Error(
      `Modèle de skill ${manifest.id} : outils inconnus ${unknown.join(", ")} (voir lib/ai/tools/ids.ts).`
    );
  }
  if (manifest.mcpServerNames.length > 0 && manifest.minTier === "free") {
    throw new Error(
      `Modèle de skill ${manifest.id} : un modèle qui exploite MCP ne peut pas être accessible au forfait gratuit.`
    );
  }
}
