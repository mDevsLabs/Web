// Modèles de serveurs MCP (templates) — format aligné sur lib/plugins/types.
// Un "modèle MCP" est une configuration prête à l'emploi (transport, URL ou
// commande stdio, type d'authentification) enrichie d'instructions détaillées
// indiquant à l'utilisateur où trouver les tokens/clés/API requis.

export type McpTemplateTransport = "sse" | "http" | "stdio" | "websocket";

export type McpTemplateAuthType =
  | "none"
  | "bearer"
  | "basic"
  | "oauth2"
  | "custom_headers";

// Champ de credential attendu par le template (ex : token d'API, paire
// utilisateur/mot de passe). Affiché dans la fiche de configuration avec son
// mode de récupération.
export type McpTemplateCredential = {
  /** Clé utilisée dans authConfig/env du serveur MCP créé. */
  key: string;
  /** Nom lisible du champ (ex : "Token personnel GitHub"). */
  label: string;
  /** Indique où récupérer la valeur (étapes concrètes + URL directe). */
  instructions: string;
  /** URL exacte de la page de création/gestion du token. */
  docsUrl: string;
  /** Le champ est-il indispensable pour que le serveur fonctionne ? */
  required: boolean;
};

export type McpTemplateCategory = {
  id: string;
  label: string;
  icon: string;
};

export type McpTemplateManifest = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  /** Icône lucide-react (même mécanique que les plugins). */
  icon: { type: "lucide"; name: string };
  minTier: "free" | "plus" | "pro" | "max";

  transport: McpTemplateTransport;
  /** URL du serveur (transports sse/http/websocket). */
  url?: string;
  /** Commande à lancer (transport stdio). */
  command?: string;
  /** Arguments de la commande stdio, sous forme de chaîne. */
  args?: string;
  /** Variables d'environnement à passer au process stdio. */
  env?: Record<string, string>;
  authType: McpTemplateAuthType;
  /** Niveau d'approbation par défaut des outils exposés. */
  requireApproval: "always_allow" | "ask_permission" | "write_only";

  /** Crédentials (tokens/clés) à renseigner après installation. */
  credentials: McpTemplateCredential[];
  /** Mode d'emploi complet : où trouver chaque token, étapes détaillées. */
  setupInstructions: string[];
};

export type McpTemplateDefinition = {
  manifest: McpTemplateManifest;
};

// Vue client : manifeste + état d'installation pour l'utilisateur courant.
export type McpTemplateCatalogEntry = McpTemplateManifest & {
  installed: boolean;
  enabled: boolean;
  /** Identifiant du serveur MCP installé à partir de ce template. */
  installedServerId: string | null;
};

export type { McpTemplateCategory as McpCategory };
