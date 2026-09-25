// Modèles de serveurs MCP (templates) — format aligné sur lib/plugins/types.
// Un « modèle MCP » est une configuration prête à l'emploi (transport, URL ou
// commande stdio, type d'authentification) enrichie d'instructions détaillées
// indiquant à l'utilisateur où trouver les tokens/clés/API requis.
//
// Règle absolue : aucun secret ne transite par le catalogue. Les valeurs
// sensibles sont saisies par l'utilisateur dans la fiche du serveur, chiffrées
// côté serveur (mcp_server_secret + lib/mcp/encryption) puis injectées à
// l'appel. Un modèle ne déclare donc jamais de token, de mot de passe, ni de
// chaîne de connexion dans `args` ou `env`.

export type McpTemplateTransport = "sse" | "http" | "stdio" | "websocket";

export type McpTemplateAuthType =
  | "none"
  | "bearer"
  | "basic"
  | "oauth2"
  | "custom_headers";

// Où le credential est injecté côté serveur au moment de l'appel.
export type McpTemplateCredentialKind = "env" | "auth" | "header";

/** Un modèle est activable, ou documenté mais volontairement bloqué. */
export type McpTemplateActivation =
  | "ready"
  | "requires_oauth_flow"
  | "requires_vetted_stdio";

// Champ de credential attendu par le template (ex : token d'API, paire
// utilisateur/mot de passe). Affiché dans la fiche de configuration avec son
// mode de récupération.
export type McpTemplateCredential = {
  /** Clé utilisée dans env / authConfig / headers du serveur MCP créé. */
  key: string;
  /** Nom lisible du champ (ex : "Token personnel GitHub"). */
  label: string;
  /** Destination du secret à l'appel : env stdio, authConfig, en-tête HTTP. */
  kind: McpTemplateCredentialKind;
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

  /**
   * `ready` : installable et utilisable avec un token personnel ou sans auth.
   * `requires_oauth_flow` : intégration réelle qui exige un flux OAuth interactif.
   * `requires_vetted_stdio` : intégration stdio documentée, mais volontairement
   * bloquée tant qu'un wrapper vérifié n'est pas configuré sur l'infrastructure.
   */
  activation: McpTemplateActivation;

  transport: McpTemplateTransport;
  /** URL du serveur (transports sse/http/websocket). */
  url?: string;
  /** Commande à lancer (transport stdio). */
  command?: string;
  /** Arguments de la commande stdio, sous forme de chaîne. Jamais de secret. */
  args?: string;
  /** Variables d'environnement NON sensibles par défaut (jamais un token). */
  env?: Record<string, string>;
  authType: McpTemplateAuthType;
  /** Niveau d'approbation par défaut des outils exposés. */
  requireApproval: "always_allow" | "ask_permission" | "write_only";
  /** Le serveur n'expose que des lectures (l'automatique est alors légitime). */
  readOnly: boolean;

  /** Crédentials (tokens/clés) à renseigner après installation. */
  credentials: McpTemplateCredential[];
  /** Mode d'emploi complet : où trouver chaque token, étapes détaillées. */
  setupInstructions: string[];
  /** Source officielle de l'intégration (documentation éditeur). */
  docsUrl: string;
  /** Date (AAAA-MM-JJ) de dernière vérification de l'endpoint/du paquet. */
  verifiedAt: string;
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
