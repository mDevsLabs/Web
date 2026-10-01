import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import type { McpTemplateDefinition } from "./types";

// Catalogue des modèles MCP — SOURCE DE VÉRITÉ UNIQUE.
//
// Chaque entrée correspond à une intégration réellement documentée par son
// éditeur (voir `docsUrl`) et vérifiée à la date `verifiedAt`. Les règles
// suivantes sont contrôlées par `scripts/validate-mcp-templates.ts` :
//   • aucune URL d'exemple (*.example.com) ni hôte de test ;
//   • aucun secret dans `args` ni dans `env` (les tokens se saisissent dans la
//     fiche du serveur, sont chiffrés puis injectés à l'appel) ;
//   • aucune commande d'exécution dangereuse (shell, docker, kubectl, aws…) ;
//   • chaque credential déclare sa destination (`kind`) et sa documentation.
//
// `activation: "requires_oauth_flow"` et
// `activation: "requires_vetted_stdio"` marquent une intégration réelle mais
// volontairement non installable tant que le flux OAuth ou le wrapper stdio
// vérifié n'est pas disponible : le serveur refuse l'installation au lieu de
// laisser un bouton inerte.
export const MCP_TEMPLATES: McpTemplateDefinition[] = [
  {
    manifest: {
      activation: "requires_vetted_stdio",
      args: "-y @modelcontextprotocol/server-brave-search",
      author: "mAI",
      authType: "bearer",
      category: "web",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://api-dashboard.search.brave.com/api-keys",
          instructions:
            "Inscrivez-vous sur le tableau de bord Brave Search, choisissez l'offre « Data for Search » (palier gratuit disponible), puis « API Keys » → « Create Key » et copiez la clé. Renseignez-la dans le champ « Clé API Brave Search » de la fiche du serveur : elle est chiffrée côté serveur et injectée uniquement au moment de l'appel.",
          key: "BRAVE_API_KEY",
          kind: "env",
          label: "Clé API Brave Search",
          required: true,
        },
      ],
      description:
        "Recherche web indépendante et privée (titres, extraits, citations) via l'API Brave Search.",
      docsUrl: "https://api-dashboard.search.brave.com/app/documentation",
      icon: { name: "Search", type: "lucide" },
      id: "brave-search",
      minTier: "plus",
      name: "Brave Search",
      readOnly: true,
      requireApproval: "always_allow",
      setupInstructions: [
        "1. Créez un compte sur https://api-dashboard.search.brave.com (palier gratuit disponible).",
        "2. Menu « API Keys » → « Create Key », nommez la clé (ex : mAI Web).",
        "3. Copiez la valeur affichée : elle ne sera plus visible ensuite.",
        "4. Installez ce modèle, puis renseignez la clé dans la fiche du serveur (champ « Clé API Brave Search »).",
        "5. La clé est chiffrée côté serveur (AES-256-GCM) et n'est jamais exposée au navigateur.",
      ],
      tags: ["Recherche", "Web", "Brave"],
      transport: "stdio",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "ready",
      author: "mAI",
      authType: "bearer",
      category: "devtools",
      credentials: [
        {
          docsUrl: "https://github.com/settings/personal-access-tokens/new",
          instructions:
            "GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → « Generate new token ». Limitez le token aux dépôts concernés, puis accordez en lecture (et écriture si nécessaire) les permissions « Contents », « Issues » et « Pull requests ». Collez le token (github_pat_…) dans le champ « Token personnel GitHub » de la fiche du serveur.",
          key: "token",
          kind: "auth",
          label: "Token personnel GitHub (fine-grained)",
          required: true,
        },
      ],
      description:
        "Dépôts, issues, pull requests et code hébergés sur GitHub, via le serveur MCP distant officiel de GitHub.",
      docsUrl:
        "https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server",
      icon: { name: "Terminal", type: "lucide" },
      id: "github",
      minTier: "plus",
      name: "GitHub",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://github.com/settings/personal-access-tokens/new pour créer un token fine-grained.",
        "2. Nommez le token, choisissez une expiration courte (30 à 90 jours).",
        "3. « Repository access » : sélectionnez uniquement les dépôts à exposer.",
        "4. Permissions : Contents / Issues / Pull requests en Read and Write, Metadata en Read-only.",
        "5. Installez ce modèle puis collez le token (github_pat_…) dans la fiche du serveur — jamais dans une variable d'environnement du service.",
        "6. Les lectures sont automatiques ; toute écriture (création d'issue, de branche, de PR) demande votre approbation dans la conversation.",
      ],
      tags: ["GitHub", "Code", "DevOps"],
      transport: "http",
      url: "https://api.githubcopilot.com/mcp/",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "ready",
      author: "mAI",
      authType: "bearer",
      category: "devtools",
      credentials: [
        {
          docsUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
          instructions:
            "GitLab → User settings → Personal access tokens → Create personal access token. Donnez une expiration courte, limitez les projets et les scopes aux opérations nécessaires (notamment read_api et api si vous autorisez des écritures). Copiez le jeton dans le champ « Token d'accès personnel GitLab » de la fiche MCP ; il sera chiffré côté serveur et ne sera pas renvoyé au navigateur.",
          key: "token",
          kind: "auth",
          label: "Token d'accès personnel GitLab",
          required: true,
        },
      ],
      description:
        "Projets, issues, merge requests, dépôts et pipelines GitLab via le serveur MCP distant officiel.",
      docsUrl:
        "https://docs.gitlab.com/user/model_context_protocol/mcp_server/",
      icon: { name: "Code", type: "lucide" },
      id: "gitlab",
      minTier: "plus",
      name: "GitLab",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Vérifiez que l'accès au serveur MCP est autorisé pour votre groupe ou instance GitLab.",
        "2. Créez un token personnel depuis https://gitlab.com/-/user_settings/personal_access_tokens avec une expiration courte.",
        "3. Limitez les projets et les permissions aux ressources nécessaires ; le scope api est requis pour les opérations d'écriture.",
        "4. Installez ce modèle puis renseignez le token dans la fiche du serveur.",
        "5. Les lectures sont automatiques ; les créations et modifications GitLab demandent une approbation dans la conversation.",
      ],
      tags: ["GitLab", "Code", "DevOps", "CI/CD"],
      transport: "http",
      url: "https://gitlab.com/api/v4/mcp",
      verifiedAt: "2026-09-25",
    },
  },
  {
    manifest: {
      activation: "ready",
      author: "mAI",
      authType: "bearer",
      category: "data",
      credentials: [
        {
          docsUrl: "https://airtable.com/create/tokens",
          instructions:
            "Créez un Personal Access Token Airtable depuis https://airtable.com/create/tokens, limitez-le aux bases accessibles et aux scopes data.records:read, data.records:write et schema.bases:read (ajoutez les scopes nécessaires aux commentaires ou au schéma). Copiez le jeton Bearer dans le champ « Jeton d'accès Airtable » de la fiche MCP ; il est chiffré côté serveur et n'est jamais renvoyé au navigateur.",
          key: "token",
          kind: "auth",
          label: "Jeton d'accès Airtable (Bearer)",
          required: true,
        },
      ],
      description:
        "Bases, tables, champs et enregistrements Airtable en lecture et en écriture via le serveur MCP Airtable.",
      docsUrl: "https://airtable.com/developers/web/api/",
      icon: { name: "Database", type: "lucide" },
      id: "airtable",
      minTier: "plus",
      name: "Airtable",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Créez un Personal Access Token depuis https://airtable.com/create/tokens.",
        "2. Sélectionnez uniquement les bases et permissions nécessaires ; ajoutez data.records:write pour les créations et modifications.",
        "3. Installez ce modèle puis collez le jeton Bearer dans la fiche du serveur.",
        "4. Le serveur utilise le point d'accès officiel https://mcp.airtable.com/mcp ; le jeton reste dans le stockage chiffré MCP.",
        "5. Les lectures sont automatiques ; toute création, mise à jour ou suppression est soumise à approbation.",
      ],
      tags: ["Airtable", "Données", "No-code", "API"],
      transport: "http",
      url: "https://mcp.airtable.com/mcp",
      verifiedAt: "2026-09-25",
    },
  },
  {
    manifest: {
      activation: "requires_oauth_flow",
      author: "mAI",
      authType: "oauth2",
      category: "collab",
      credentials: [],
      description:
        "Rechercher dans Slack, lire les canaux et envoyer des messages via le serveur MCP distant officiel de Slack.",
      docsUrl: "https://docs.slack.dev/ai/slack-mcp-server",
      icon: { name: "MessageSquare", type: "lucide" },
      id: "slack",
      minTier: "plus",
      name: "Slack",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Le serveur MCP officiel de Slack (https://mcp.slack.com/mcp) authentifie les clients via OAuth 2.0, avec validation par un administrateur de l'espace de travail.",
        "2. mAI Web n'implémente pas encore de flux OAuth interactif : ce modèle est documenté mais son installation est refusée pour le moment.",
        "3. En attendant, utilisez les serveurs MCP de votre choix via l'écran avancé /mcp, ou les Skills et plugins natifs.",
      ],
      tags: ["Slack", "Messages", "Équipe"],
      transport: "http",
      url: "https://mcp.slack.com/mcp",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "requires_oauth_flow",
      author: "mAI",
      authType: "oauth2",
      category: "collab",
      credentials: [],
      description:
        "Issues, cycles et projets Linear pour le suivi de roadmap, via le serveur MCP authentifié de Linear.",
      docsUrl: "https://linear.app/docs/mcp",
      icon: { name: "Target", type: "lucide" },
      id: "linear",
      minTier: "plus",
      name: "Linear",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Linear expose un serveur MCP distant authentifié (https://mcp.linear.app/mcp), documenté sur https://linear.app/docs/mcp.",
        "2. L'accès requiert l'authentification OAuth côté client Linear : le flux interactif n'est pas encore pris en charge par mAI Web, l'installation est donc refusée.",
        "3. Aucun token personnel n'est demandé ici : ne collez jamais une clé API Linear dans un champ non vérifié.",
      ],
      tags: ["Linear", "Projets", "Tickets"],
      transport: "http",
      url: "https://mcp.linear.app/mcp",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "requires_vetted_stdio",
      args: "-y @notionhq/notion-mcp-server",
      author: "mAI",
      authType: "bearer",
      category: "collab",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://www.notion.so/profile/integrations",
          instructions:
            "Sur notion.so/profile/integrations, cliquez « New integration », choisissez le type « Internal », sélectionnez l'espace de travail, puis copiez le « Internal Integration Secret » (ntn_…) dans le champ « Token d'intégration Notion » de la fiche du serveur. Pensez ensuite à partager les pages concernées avec l'intégration (page → « ••• » → « Connections »).",
          key: "NOTION_TOKEN",
          kind: "env",
          label: "Token d'intégration Notion",
          required: true,
        },
      ],
      description:
        "Rechercher, lire et mettre à jour les pages et bases de données Notion via le serveur MCP officiel de Notion.",
      docsUrl: "https://developers.notion.com/docs/mcp",
      icon: { name: "FileText", type: "lucide" },
      id: "notion",
      minTier: "plus",
      name: "Notion",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://www.notion.so/profile/integrations → « New integration » → type « Internal ».",
        "2. Onglet « Secrets » → copiez le jeton d'intégration (ntn_…).",
        "3. Installez ce modèle, puis renseignez le jeton dans la fiche du serveur (champ « Token d'intégration Notion »).",
        "4. Partagez les pages/bases à exposer avec l'intégration (page → « ••• » → « Connections »).",
        "5. Les lectures sont automatiques ; toute modification de contenu vous est présentée pour approbation.",
      ],
      tags: ["Notion", "Docs", "Collaboration"],
      transport: "stdio",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "requires_oauth_flow",
      author: "mAI",
      authType: "oauth2",
      category: "devtools",
      credentials: [],
      description:
        "Consulter les erreurs, issues et traces Sentry pour déboguer plus vite, via le serveur MCP distant officiel de Sentry.",
      docsUrl: "https://mcp.sentry.dev/",
      icon: { name: "Bug", type: "lucide" },
      id: "sentry",
      minTier: "plus",
      name: "Sentry",
      readOnly: true,
      requireApproval: "always_allow",
      setupInstructions: [
        "1. Sentry héberge son serveur MCP sur https://mcp.sentry.dev/mcp (OAuth 2.0 uniquement).",
        "2. Ce point d'accès n'accepte pas d'authentification par token personnel : l'installation est donc refusée tant que le flux OAuth interactif n'est pas disponible dans mAI Web.",
        "3. Pour un usage local, l'équipe Sentry documente aussi une exécution via son CLI (voir la documentation officielle).",
      ],
      tags: ["Sentry", "Erreurs", "Monitoring"],
      transport: "http",
      url: "https://mcp.sentry.dev/mcp",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "requires_vetted_stdio",
      args: "-y @stripe/mcp",
      author: "mAI",
      authType: "bearer",
      category: "web",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://dashboard.stripe.com/apikeys",
          instructions:
            "Dashboard Stripe → « Developers » → « API keys ». Copiez la clé secrète (sk_test_… ou sk_live_…) — ou, mieux, créez une « Restricted API key » limitée aux ressources nécessaires — puis renseignez-la dans le champ « Clé secrète Stripe » de la fiche du serveur.",
          key: "STRIPE_SECRET_KEY",
          kind: "env",
          label: "Clé secrète Stripe (restricted recommandée)",
          required: true,
        },
      ],
      description:
        "Clients, paiements, abonnements et factures Stripe, via l'outil officiel Stripe Agent Toolkit.",
      docsUrl: "https://docs.stripe.com/mcp",
      icon: { name: "Wallet", type: "lucide" },
      id: "stripe",
      minTier: "pro",
      name: "Stripe",
      readOnly: false,
      requireApproval: "ask_permission",
      setupInstructions: [
        "1. Ouvrez https://dashboard.stripe.com/apikeys (mode test de préférence pour commencer).",
        "2. Créez une clé restreinte (« + Create restricted key ») limitée aux ressources utiles (Customers, PaymentIntents, Invoices).",
        "3. Installez ce modèle, puis renseignez la clé dans la fiche du serveur : la variable STRIPE_SECRET_KEY est injectée côté serveur, chiffrée au repos.",
        "4. Toute opération financière demande votre approbation explicite dans la conversation (politique « ask_permission »).",
        "5. Ne recopiez jamais cette clé ailleurs : elle ne transite jamais par le navigateur après la saisie.",
      ],
      tags: ["Stripe", "Paiements", "Finance"],
      transport: "stdio",
      verifiedAt: "2026-09-14",
    },
  },
  {
    manifest: {
      activation: "ready",
      author: "mAI",
      authType: "bearer",
      category: "data",
      credentials: [
        {
          docsUrl: "https://supabase.com/dashboard/account/tokens",
          instructions:
            "Compte Supabase → « Account » → « Access Tokens » → « Generate new token », nommez-le (ex : mAI Web) et copiez la valeur (sbp_…). Renseignez-la dans le champ « Token d'accès Supabase » de la fiche du serveur. Pour limiter la portée, préférez un token d'organisation dédié à la lecture.",
          key: "token",
          kind: "auth",
          label: "Token d'accès personnel Supabase",
          required: true,
        },
      ],
      description:
        "Projets Supabase : schéma PostgreSQL, migrations et journaux, via le serveur MCP distant officiel de Supabase.",
      docsUrl: "https://supabase.com/docs/guides/ai-tools/mcp",
      icon: { name: "Database", type: "lucide" },
      id: "supabase",
      minTier: "pro",
      name: "Supabase",
      readOnly: false,
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://supabase.com/docs/guides/ai-tools/mcp et lisez les recommandations de sécurité officielles.",
        "2. Créez un token d'accès personnel : https://supabase.com/dashboard/account/tokens.",
        "3. Installez ce modèle, puis renseignez le token dans la fiche du serveur.",
        "4. Indiquez à l'IA la référence du projet (20 caractères, visible dans l'URL du tableau de bord).",
        "5. Les requêtes en lecture sont automatiques ; les écritures (SQL, migrations) demandent une approbation.",
      ],
      tags: ["Supabase", "PostgreSQL", "BaaS"],
      transport: "http",
      url: "https://mcp.supabase.com/mcp",
      verifiedAt: "2026-09-14",
    },
  },
];

// Contrôle d'intégrité au chargement : une icône inconnue retomberait
// silencieusement sur une icône de repli dans l'interface.
for (const template of MCP_TEMPLATES) {
  if (!isLucideIconName(template.manifest.icon.name)) {
    throw new Error(
      `Modèle MCP ${template.manifest.id} : icône inconnue « ${template.manifest.icon.name} » (voir lib/plugins/icon-allowlist.ts).`
    );
  }
}
