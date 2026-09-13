import type { McpTemplateDefinition } from "./types";

// Modèles MCP configurés (format aligné sur lib/plugins). Chaque template
// embarque des instructions détaillées pour trouver les tokens / clés d'API.
export const MCP_TEMPLATES: McpTemplateDefinition[] = [
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-gdrive",
      author: "mAI",
      authType: "oauth2",
      category: "cloud",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://console.cloud.google.com/apis/credentials",
          instructions:
            "Google Cloud Console → APIs & Services → Identifiants → « Créer des identifiants » → « ID client OAuth ». Type d'application : « Application de bureau ». Ajoutez https://developers.google.com/drive comme URI de redirection autorisée si demandé.",
          key: "GOOGLE_CLIENT_ID",
          label: "ID client OAuth 2.0",
          required: true,
        },
        {
          docsUrl: "https://console.cloud.google.com/apis/credentials",
          instructions:
            "Sur la même page Google Cloud Console, copiez le secret du client OAuth créé à l'étape précédente (bouton « Afficher »).",
          key: "GOOGLE_CLIENT_SECRET",
          label: "Secret client OAuth 2.0",
          required: true,
        },
      ],
      description:
        "Rechercher, lire et modifier les fichiers et dossiers Google Drive de l'utilisateur.",
      env: {
        GOOGLE_CLIENT_ID: "votre-client-id.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "votre-secret-oauth",
      },
      icon: { name: "Folder", type: "lucide" },
      id: "google-drive",
      minTier: "plus",
      name: "Google Drive",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://console.cloud.google.com et créez (ou sélectionnez) un projet.",
        "2. Dans « APIs & Services → Bibliothèque », activez l'API « Google Drive API ».",
        "3. Dans « Identifiants », créez un ID client OAuth de type « Application de bureau ».",
        "4. Activez l'écran de consentement OAuth (mode « Interne » ou « Test » suffit).",
        "5. Collez l'ID client et le secret dans les variables d'environnement du serveur : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET.",
        "6. Installez, puis synchronisez les outils : la première recherche de fichiers ouvrira l'écran d'autorisation Google.",
      ],
      tags: ["Google", "Drive", "Fichiers", "Cloud"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y slack-mcp-server@latest --transport stdio",
      author: "mAI",
      authType: "bearer",
      category: "collab",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://api.slack.com/apps",
          instructions:
            "Sur api.slack.com, créez une application (option « From scratch »), puis dans « OAuth & Permissions » faites défiler jusqu'à « Bot Token Scopes » : ajoutez chat:write, channels:history, channels:read et im:history. Cliquez ensuite sur « Install to Workspace » : le token xoxb… s'affiche sur la page « OAuth & Permissions ».",
          key: "SLACK_BOT_TOKEN",
          label: "Token Bot (xoxb…)",
          required: true,
        },
      ],
      description:
        "Lire, envoyer et organiser les messages des canaux Slack de votre espace de travail.",
      env: { SLACK_BOT_TOKEN: "xoxb-votre-token-bot" },
      icon: { name: "MessageSquare", type: "lucide" },
      id: "slack",
      minTier: "plus",
      name: "Slack",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://api.slack.com/apps → « Create New App » → « From scratch », choisissez votre espace de travail.",
        "2. Onglet « OAuth & Permissions » → section « Bot Token Scopes » → « Add an OAuth Scope » : chat:write, channels:history, channels:read, im:history.",
        "3. Cliquez « Install to Workspace » (ou « Reinstall » si l'app existait).",
        "4. Copiez le « Bot User OAuth Token » (commence par xoxb-) affiché juste après l'installation.",
        "5. Collez-le dans la variable d'environnement SLACK_BOT_TOKEN du serveur.",
        "6. Invitez le bot dans les canaux concernés : /invite @VotreApp dans chaque canal.",
      ],
      tags: ["Slack", "Messages", "Équipe"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-postgres postgresql://utilisateur:motdepasse@hote:5432/base",
      author: "mAI",
      authType: "none",
      category: "data",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://neon.com/docs/introduction/connect-neon",
          instructions:
            "Format : postgresql://user:password@host:5432/dbname. Chez Neon : tableau de bord du projet → « Connection string ». Chez Supabase : Settings → Database → « Connection string (URI) ». En local : pgAdmin ou psql « conninfo ». Remplacez les accolades <…> de l'argument par vos valeurs réelles après installation.",
          key: "connectionString",
          label: "Chaîne de connexion PostgreSQL",
          required: true,
        },
      ],
      description:
        "Interroger et analyser une base PostgreSQL en lecture (requêtes SQL sécurisées).",
      icon: { name: "Database", type: "lucide" },
      id: "postgresql",
      minTier: "plus",
      name: "PostgreSQL",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Créez un utilisateur PostgreSQL dédié en lecture seule : CREATE USER mai_reader WITH PASSWORD '…'; GRANT CONNECT ON DATABASE mabase TO mai_reader;",
        "2. Récupérez la chaîne de connexion chez votre hébergeur (Neon, Supabase, Railway) ou dans pgAdmin pour un serveur local.",
        "3. Si votre mot de passe contient des caractères spéciaux, encodez-les en URL (ex : @ → %40).",
        "4. Remplacez l'argument du template par votre chaîne réelle après installation (bouton Modifier).",
        "5. Pour Supabase, préférez le « Pooler » (port 6543) afin d'éviter d'épuiser les connexions.",
      ],
      tags: ["SQL", "Base de données", "PostgreSQL"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y @sentry/mcp-server@latest",
      author: "mAI",
      authType: "bearer",
      category: "devtools",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://sentry.io/settings/account/api/auth-tokens/",
          instructions:
            "Connectez-vous sur sentry.io → icône profil en bas à gauche → « Settings » → « Auth Tokens » (ou directement Settings → Organization → Auth Tokens pour un token d'organisation). Cliquez « Create New Token », choisissez les portées « org:read », « project:read », « event:read », « event:write », puis copiez le token affiché (commence par sntrys_).",
          key: "SENTRY_AUTH_TOKEN",
          label: "Token d'authentification Sentry",
          required: true,
        },
      ],
      description:
        "Consulter les erreurs, issues et releases Sentry pour déboguer plus vite.",
      env: { SENTRY_AUTH_TOKEN: "sntrys_votre-token" },
      icon: { name: "Bug", type: "lucide" },
      id: "sentry",
      minTier: "plus",
      name: "Sentry",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Connectez-vous à https://sentry.io puis ouvrez Settings → Auth Tokens (token utilisateur) ou Settings → [Votre organisation] → Auth Tokens (token d'organisation, recommandé).",
        "2. « Create New Token » avec les portées org:read, project:read, event:read et event:write.",
        "3. Copiez immédiatement le token (sntrys_…) : il ne sera plus affiché ensuite.",
        "4. Collez-le dans la variable d'environnement SENTRY_AUTH_TOKEN du serveur.",
        "5. Indiquez ensuite à l'IA votre organisation et vos projets Sentry pour cibler les requêtes.",
      ],
      tags: ["Sentry", "Erreurs", "Monitoring"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-redis redis://default:motdepasse@hote:6379",
      author: "mAI",
      authType: "none",
      category: "data",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://console.upstash.com",
          instructions:
            "Format : redis://[:motdepasse@]hote:port (ou rediss:// en TLS). Redis Cloud : base → « Connection » → endpoint et mot de passe par défaut de l'utilisateur « default ». Upstash : console → votre base → « REST & Redis » → copiez « Redis URL ». AWS ElastiCache : utilisez le endpoint primaire et activez AUTH. Remplacez l'argument du template par votre URL réelle après installation.",
          key: "connectionUrl",
          label: "URL de connexion Redis",
          required: true,
        },
      ],
      description:
        "Inspecter et manipuler les clés, listes et structures de données Redis.",
      icon: { name: "Zap", type: "lucide" },
      id: "redis",
      minTier: "plus",
      name: "Redis",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Récupérez l'URL de connexion de votre instance Redis (Redis Cloud, Upstash, ElastiCache ou local).",
        "2. En TLS (Upstash, Redis Cloud), utilisez le préfixe rediss:// au lieu de redis://.",
        "3. Encodez le mot de passe en URL s'il contient des caractères spéciaux (ex : # → %23).",
        "4. Remplacez l'argument du template par votre URL réelle après installation (bouton Modifier).",
        "5. Limitez l'utilisateur Redis aux commandes nécessaires (ACL Redis) pour un périmètre minimal.",
      ],
      tags: ["Redis", "Cache", "Base de données"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-google-maps",
      author: "mAI",
      authType: "custom_headers",
      category: "maps",
      command: "npx",
      credentials: [
        {
          docsUrl:
            "https://console.cloud.google.com/google/maps-apis/credentials",
          instructions:
            "Google Cloud Console → « APIs & Services » → « Identifiants » → « Créer des identifiants » → « Clé API ». Activez ensuite les API nécessaires dans la bibliothèque : Geocoding API, Directions API, Places API et Distance Matrix API. Restreignez la clé à ces API depuis « Restrictions d'API ».",
          key: "GOOGLE_MAPS_API_KEY",
          label: "Clé API Maps Platform",
          required: true,
        },
      ],
      description:
        "Géocodage, itinéraires, lieux et calcul de distances via l'API Google Maps.",
      env: { GOOGLE_MAPS_API_KEY: "votre-cle-api" },
      icon: { name: "Map", type: "lucide" },
      id: "google-maps",
      minTier: "plus",
      name: "Google Maps",
      requireApproval: "always_allow",
      setupInstructions: [
        "1. Dans Google Cloud Console, activez « Maps Platform » pour votre projet (https://console.cloud.google.com/google/maps-apis).",
        "2. Ouvrez « APIs & Services → Bibliothèque » et activez : Geocoding API, Directions API, Places API, Distance Matrix API.",
        "3. Dans « Identifiants », créez une « Clé API » et copiez-la.",
        "4. Recommandé : appliquez une restriction d'API sur la clé (uniquement les API Maps citées).",
        "5. Collez la clé dans la variable d'environnement GOOGLE_MAPS_API_KEY du serveur.",
      ],
      tags: ["Maps", "Géolocalisation", "Google"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      author: "mAI",
      authType: "bearer",
      category: "devtools",
      credentials: [
        {
          docsUrl: "https://github.com/settings/personal-access-tokens/new",
          instructions:
            "GitHub → paramètres → « Developer settings » (en bas de la page des paramètres) → « Personal access tokens » → « Fine-grained tokens » → « Generate new token ». Sélectionnez le ou les dépôts, puis les permissions Repository : Contents, Issues, Pull requests en Read/Write. Copiez le token (github_pat_…) : il ne sera plus affiché.",
          key: "token",
          label: "Token d'accès personnel (PAT)",
          required: true,
        },
      ],
      description:
        "Dépôts, issues, pull requests et commits GitHub directement depuis le chat.",
      icon: { name: "Github", type: "lucide" },
      id: "github",
      minTier: "plus",
      name: "GitHub",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://github.com/settings/personal-access-tokens/new (Fine-grained PAT).",
        "2. Nommez le token, définissez une expiration courte (30-90 jours).",
        "3. « Repository access » : sélectionnez les dépôts à exposer (évitez « All repositories »).",
        "4. Permissions : Contents / Issues / Pull requests en Read and Write, Metadata en Read-only.",
        "5. Générez, copiez le token (github_pat_…) et collez-le dans le champ Token Bearer du serveur.",
      ],
      tags: ["GitHub", "DevOps", "Code"],
      transport: "sse",
      url: "https://api.githubcopilot.com/mcp/",
    },
  },
  {
    manifest: {
      args: "-y @notionhq/notion-mcp-server",
      author: "mAI",
      authType: "bearer",
      category: "collab",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://www.notion.so/profile/integrations",
          instructions:
            "Sur notion.so/profile/integrations (ou Settings → Connections → « Develop or manage integrations »), cliquez « New integration », type « Internal », sélectionnez l'espace de travail, puis dans l'onglet « Secrets » copiez le token (ntn_…). N'oubliez pas de connecter ensuite les pages concernées à l'intégration (bouton « ••• » sur la page → Connexions).",
          key: "NOTION_TOKEN",
          label: "Token d'intégration interne",
          required: true,
        },
      ],
      description:
        "Rechercher, lire et mettre à jour les pages et bases de données Notion.",
      env: { NOTION_TOKEN: "ntn_votre-token-integration" },
      icon: { name: "FileText", type: "lucide" },
      id: "notion",
      minTier: "plus",
      name: "Notion",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://www.notion.so/profile/integrations → « New integration ».",
        "2. Choisissez le type « Internal » et l'espace de travail, créez l'intégration.",
        "3. Onglet « Secrets » → copiez le « Internal Integration Secret » (ntn_…).",
        "4. Dans l'onglet « Capabilities », gardez « Read content », « Update content » (et « Insert content » si besoin).",
        "5. Collez le token dans la variable d'environnement NOTION_TOKEN du serveur.",
        "6. Partagez les pages/bases visées avec l'intégration : page → « ••• » → « Connections » → votre intégration.",
      ],
      tags: ["Notion", "Wiki", "Docs"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      author: "mAI",
      authType: "bearer",
      category: "web",
      credentials: [
        {
          docsUrl: "https://dashboard.stripe.com/apikeys",
          instructions:
            "Dashboard Stripe → « Developers » → « API keys » (dashboard.stripe.com/apikeys). Copiez la « Secret key » de test (sk_test_…) ou de production (sk_live_…). Pour un périmètre réduit, créez plutôt une « Restricted API key » avec seulement les accès Customers, Payments et Invoices en lecture/écriture.",
          key: "token",
          label: "Clé secrète Stripe",
          required: true,
        },
      ],
      description:
        "Clients, paiements, abonnements et factures Stripe pour vos opérations.",
      icon: { name: "CreditCard", type: "lucide" },
      id: "stripe",
      minTier: "plus",
      name: "Stripe",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://dashboard.stripe.com/apikeys (mode test ou production selon le besoin).",
        "2. Copiez la « Secret key » (sk_test_… / sk_live_…) — elle ne s'affiche qu'une fois par session.",
        "3. Recommandé : « + Create restricted key » et limitez-la aux ressources nécessaires (Customers, PaymentIntents, Invoices).",
        "4. Collez la clé dans le champ Token Bearer du serveur MCP.",
        "5. Ne commitez jamais la clé : elle est stockée chiffrée dans mAI, mais évitez de la recopier ailleurs.",
      ],
      tags: ["Stripe", "Paiements", "Finance"],
      transport: "http",
      url: "https://mcp.stripe.com",
    },
  },
  {
    manifest: {
      author: "mAI",
      authType: "oauth2",
      category: "data",
      credentials: [
        {
          docsUrl: "https://supabase.com/dashboard/account/tokens",
          instructions:
            "Compte Supabase → « Account » → « Access Tokens » (supabase.com/dashboard/account/tokens) → « Generate new token », donnez un nom (ex : mAI) et copiez le token (sbp_…). Alternative OAuth : laissez le champ vide et connectez-vous via la fenêtre d'autorisation Supabase au premier appel.",
          key: "token",
          label: "Token d'accès personnel Supabase",
          required: false,
        },
      ],
      description:
        "Projets Supabase : bases PostgreSQL, auth, storage et edge functions.",
      icon: { name: "Database", type: "lucide" },
      id: "supabase",
      minTier: "plus",
      name: "Supabase",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez https://supabase.com/dashboard/account/tokens.",
        "2. « Generate new token », nommez-le (ex : mAI MCP) et copiez la valeur (sbp_…).",
        "3. Collez le token dans le champ Token du serveur, ou laissez vide pour l'OAuth interactif.",
        "4. Au premier appel, une fenêtre d'autorisation Supabase peut s'ouvrir : validez le projet concerné.",
        "5. Précisez ensuite à l'IA l'ID du projet Supabase (réf. à 20 caractères, visible dans l'URL du dashboard).",
      ],
      tags: ["Supabase", "PostgreSQL", "BaaS"],
      transport: "http",
      url: "https://mcp.supabase.com/mcp",
    },
  },
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-mongodb mongodb+srv://utilisateur:motdepasse@cluster.mongodb.net/base",
      author: "mAI",
      authType: "none",
      category: "data",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://www.mongodb.com/docs/atlas/connect-from-your-app/",
          instructions:
            "Atlas : onglet « Database » → « Connect » → « Drivers » → copiez la chaîne mongodb+srv://… et remplacez <password> par votre mot de passe. Créez l'utilisateur dans « Database Access » avec le rôle read (ou readWrite si nécessaire) et ajoutez votre IP dans « Network Access ». En local : mongodb://localhost:27017/mabase.",
          key: "connectionString",
          label: "Chaîne de connexion MongoDB",
          required: true,
        },
      ],
      description:
        "Interroger collections et documents MongoDB (agrégations, lectures, écritures).",
      icon: { name: "Database", type: "lucide" },
      id: "mongodb",
      minTier: "plus",
      name: "MongoDB",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Atlas → « Database Access » → « Add New Database User » avec le rôle read (lecture seule recommandé).",
        "2. Atlas → « Network Access » → ajoutez votre adresse IP (ou 0.0.0.0/0 en test uniquement).",
        "3. Onglet « Database » → « Connect » → « Drivers » → copiez la chaîne mongodb+srv://.",
        "4. Remplacez <password> par le mot de passe (encodé en URL si caractères spéciaux).",
        "5. Remplacez l'argument du template par votre chaîne réelle après installation (bouton Modifier).",
      ],
      tags: ["MongoDB", "NoSQL", "Base de données"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      args: "-y @modelcontextprotocol/server-brave-search",
      author: "mAI",
      authType: "bearer",
      category: "web",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://api-dashboard.search.brave.com/api-keys",
          instructions:
            "Inscrivez-vous sur https://api-dashboard.search.brave.com, choisissez le plan « Data for Search » (offre gratuite : 2 000 requêtes/mois), ouvrez « API Keys » → « Create Key », nommez-la et copiez la clé affichée. Elle ne sera plus visible ensuite : conservez-la immédiatement.",
          key: "BRAVE_API_KEY",
          label: "Clé API Brave Search",
          required: true,
        },
      ],
      description:
        "Recherche web indépendante et privée avec citations (sans tracker publicitaire).",
      env: { BRAVE_API_KEY: "votre-cle-api" },
      icon: { name: "Search", type: "lucide" },
      id: "brave-search",
      minTier: "plus",
      name: "Brave Search",
      requireApproval: "always_allow",
      setupInstructions: [
        "1. Créez un compte sur https://api-dashboard.search.brave.com (plan gratuit disponible).",
        "2. Menu « API Keys » → « Create Key », donnez un nom explicite.",
        "3. Copiez la clé affichée (elle ne sera plus visible).",
        "4. Collez-la dans la variable d'environnement BRAVE_API_KEY du serveur.",
      ],
      tags: ["Recherche", "Web", "Brave"],
      transport: "stdio",
    },
  },
  {
    manifest: {
      author: "mAI",
      authType: "oauth2",
      category: "collab",
      credentials: [
        {
          docsUrl: "https://linear.app/settings/security-access",
          instructions:
            "Linear → Paramètres (icône engrenage) → « Security & access » → section « Personal API keys » → « New API key », donnez un label (ex : mAI) et copiez la clé (lin_api_…). Alternative OAuth : laissez le champ vide et validez la fenêtre d'autorisation Linear au premier appel.",
          key: "token",
          label: "Clé API Linear",
          required: false,
        },
      ],
      description:
        "Issues, cycles et projets Linear pour le suivi de votre roadmap produit.",
      icon: { name: "Trophy", type: "lucide" },
      id: "linear",
      minTier: "plus",
      name: "Linear",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Ouvrez Linear → Paramètres → « Security & access » (https://linear.app/settings/security-access).",
        "2. Section « Personal API keys » → « New API key ».",
        "3. Copiez la clé (lin_api_…) immédiatement : elle n'est plus affichée ensuite.",
        "4. Collez-la dans le champ Token du serveur, ou laissez vide pour l'OAuth interactif.",
        "5. Au premier appel, validez la fenêtre d'autorisation OAuth Linear si elle s'ouvre.",
      ],
      tags: ["Linear", "Tickets", "Gestion de projet"],
      transport: "http",
      url: "https://mcp.linear.app/mcp",
    },
  },
  {
    manifest: {
      args: "-y gcal-mcp",
      author: "mAI",
      authType: "oauth2",
      category: "cloud",
      command: "npx",
      credentials: [
        {
          docsUrl: "https://console.cloud.google.com/apis/credentials",
          instructions:
            "Google Cloud Console → APIs & Services → Identifiants → « Créer des identifiants » → « ID client OAuth », type « Application de bureau ». Activez au préalable l'API « Google Calendar API » dans la bibliothèque.",
          key: "GOOGLE_CLIENT_ID",
          label: "ID client OAuth 2.0",
          required: true,
        },
        {
          docsUrl: "https://console.cloud.google.com/apis/credentials",
          instructions:
            "Copiez le secret du client OAuth créé (bouton « Afficher » dans la liste des identifiants OAuth de Google Cloud Console).",
          key: "GOOGLE_CLIENT_SECRET",
          label: "Secret client OAuth 2.0",
          required: true,
        },
      ],
      description:
        "Consulter, créer et modifier les événements de vos agendas Google Calendar.",
      env: {
        GOOGLE_CLIENT_ID: "votre-client-id.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "votre-secret-oauth",
      },
      icon: { name: "Calendar", type: "lucide" },
      id: "google-calendar",
      minTier: "plus",
      name: "Google Calendar",
      requireApproval: "write_only",
      setupInstructions: [
        "1. Google Cloud Console : activez « Google Calendar API » (APIs & Services → Bibliothèque).",
        "2. Créez un ID client OAuth « Application de bureau » dans Identifiants.",
        "3. Configurez l'écran de consentement (scope calendar requis).",
        "4. Collez l'ID client et le secret dans GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET du serveur.",
        "5. Au premier appel, l'écran d'autorisation Google s'ouvre pour accepter l'accès à l'agenda.",
      ],
      tags: ["Google", "Agenda", "Calendar"],
      transport: "stdio",
    },
  },
];
