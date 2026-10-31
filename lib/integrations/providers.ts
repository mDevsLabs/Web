import { extraTokenProviders } from "./token-catalog";
import type { TokenFieldSpec } from "./token-fields";

/**
 * Registre des applications externes connectables par OAuth ou par jeton.
 *
 * Un descripteur = UN accès, donc UN client chez le fournisseur et UN écran de
 * consentement. Google en regroupe trois (Drive, Agenda, Gmail) sous une seule
 * connexion : leurs portées sont demandées d'un coup et se déconnecter de
 * Google coupe les trois d'un seul geste. GitHub reste un descripteur à part,
 * parce qu'un client GitHub n'est pas un client Google. Discord, Notion et
 * Vercel suivent la même règle : un fournisseur, une connexion.
 *
 * Ce module est volontairement **sûr côté client** : aucune lecture
 * d'environnement, aucun import `server-only`. La fiche plugin, le menu `@` et
 * le rendu des logos partagent ainsi le même descripteur que les routes ; les
 * secrets (`<prefix>_CLIENT_ID`, `<prefix>_CLIENT_SECRET`) sont relus côté
 * serveur par `lib/integrations/oauth.ts`.
 *
 * Deux modes d'authentification coexistent :
 *
 *  - `oauth` : le compte est relié par consentement. C'est le cas de Google
 *    et de GitHub.
 *  - `token` : l'utilisateur colle un jeton personnel. C'est le cas de Vercel
 *    (son OAuth public ne donne que l'identité), de Discord (jeton de bot) et
 *    de Notion (intégration interne). Le jeton est chiffré et stocké comme un
 *    jeton OAuth ; il n'apparaît jamais côté client.
 *
 * Ajouter une application = ajouter un descripteur ici, un dossier de plugin
 * dans `lib/plugins/`, un logo dans `public/plugins/`, puis régénérer le
 * catalogue. Le moteur, les mentions et le rendu n'ont pas à savoir de quel
 * fournisseur vient un outil.
 */

export type IntegrationProviderId =
  | "asana"
  | "brave"
  | "brevo"
  | "cloudflare"
  | "discord"
  | "dockerhub"
  | "exchange-rate"
  | "github"
  | "google"
  | "jira"
  | "linear"
  | "make"
  | "mapbox"
  | "neon"
  | "notion"
  | "npm"
  | "posthog"
  | "resend"
  | "sentry"
  | "sonarcloud"
  | "stripe"
  | "supabase"
  | "twilio"
  | "upstash"
  | "vercel"
  | "zapier";

export type IntegrationAuthMode = "oauth" | "token";

export type IntegrationRefreshPolicy =
  | {
      /** Marge avant expiration à laquelle on rafraîchit : Google coupe à 3600 s. */
      policy: "oauth_refresh";
      refreshLeadMs: number;
      /** Google/Discord font tourner le `refresh_token` : l'ancien meurt. */
      rotatesRefreshToken: boolean;
    }
  | {
      /** GitHub/Vercel délivrent un jeton non expirant : une révocation l'éteint. */
      detectRevocation: true;
      policy: "static";
    };

export type IntegrationRevokeMode =
  /** GitHub : endpoint d'app, Basic auth + corps JSON. */
  | "oauth_app_grant"
  /** Google et Vercel : le jeton passe en query string ou en formulaire. */
  | "token_query"
  /** Discord : formulaire, identifiants du client dans le corps. */
  | "token_form_credentials"
  /** Notion : Basic auth + JSON, avec en-têtes propres au fournisseur. */
  | "token_json_basic";

export type IntegrationRevoke = {
  endpoint: string;
  /** En-têtes supplémentaires exigés par l'endpoint de révocation. */
  headers?: Record<string, string>;
  mode: IntegrationRevokeMode;
};

/**
 * Identité du compte, lue sur une API après l'échange de token.
 *
 * Les fournisseurs ne nomment pas leurs champs de la même manière : GitHub rend
 * `login`, Discord `global_name`/`username`, Vercel `username`. Cette
 * configuration évite un `if (provider === …)` dans chaque route.
 */
/**
 * Comment le jeton est présenté à l'API. Les noms d'en-tête et de paramètre
 * sont bornés dans `request-auth.ts` : le descripteur ne peut pas inventer
 * un en-tête `Cookie` ou un paramètre arbitraire.
 */
export type IntegrationHttpAuth =
  | { kind: "basic"; userField: string }
  | { kind: "bearer" }
  | { kind: "header"; name: "X-Subscription-Token" | "api-key" }
  | { kind: "none" }
  | { kind: "prefix"; prefix: "Bot" | "JWT" | "Token" }
  | { kind: "query"; name: "access_token" };

export type IntegrationAccountConfig = {
  emailField?: string;
  headers?: Record<string, string>;
  idField: string;
  labelFields: readonly string[];
  /** Présentation du jeton. Défaut : Bearer. */
  auth?: IntegrationHttpAuth;
  /** Corps d'une identité qui ne s'obtient qu'en POST (Linear, Upstash). */
  body?: string;
  /**
   * La réponse n'est une identité que si ce champ vaut exactement `equals`
   * (PING Upstash, `result: success` d'ExchangeRate).
   */
  expect?: { equals: string; path: string };
  /**
   * Échange préalable (Docker Hub) : le jeton collé est un mot de passe, l'API
   * parle ensuite avec le JWT renvoyé.
   */
  login?: {
    auth: IntegrationHttpAuth;
    tokenPath: string;
    url: string;
    usernameField: string;
  };
  /**
   * Identifiant de repli quand l'API ne nomme pas le compte (Resend, Cloudflare).
   * Un seul repli par fournisseur : reconnecter met à jour la même ligne.
   */
  idFallback?: string;
  /** Libellé affiché quand aucun champ de nom n'est présent. */
  labelFallback?: string;
  method?: "GET" | "POST";
  /** Objet utile dans la réponse (Vercel enveloppe le compte dans `user`). */
  responsePath?: string;
  url: string;
};

/**
 * Identité déjà présente dans la réponse du token (Notion) : inutile d'appeler
 * une API supplémentaire, et l'`id_token` n'existe pas.
 */
export type IntegrationTokenIdentity = {
  emailPath?: string;
  idField: string;
  labelField: string;
};

export type IntegrationTokenInput = {
  /** Renseignements exigés en plus du secret (SID, site, zone…). */
  fields?: readonly TokenFieldSpec[];
  helpUrl: string;
  /** Longueur bornée avant même l'appel de validation. */
  maxLength: number;
  minLength: number;
  placeholder: string;
};

export type IntegrationDescriptor = {
  /** Identité du compte, ou `null` quand l'`id_token` / le token suffit. */
  account: IntegrationAccountConfig | null;
  /** Ce que la connexion ouvre, en une phrase, pour la fiche du plugin. */
  accessSummary: string;
  authMode: IntegrationAuthMode;
  /** Paramètres ajoutés à l'URL d'autorisation (Google, Notion). */
  authorizeParams?: Record<string, string>;
  authorizeUrl: string | null;
  /** Préfixe des variables d'environnement : `<prefix>_CLIENT_ID`, `<prefix>_CLIENT_SECRET`. */
  envPrefix:
    | "ASANA"
    | "BRAVE"
    | "BREVO"
    | "CLOUDFLARE"
    | "DISCORD"
    | "DOCKERHUB"
    | "EXCHANGE_RATE"
    | "GITHUB"
    | "GOOGLE"
    | "JIRA"
    | "LINEAR"
    | "MAKE"
    | "MAPBOX"
    | "NEON"
    | "NOTION"
    | "NPM"
    | "POSTHOG"
    | "RESEND"
    | "SENTRY"
    | "SONARCLOUD"
    | "STRIPE"
    | "SUPABASE"
    | "TWILIO"
    | "UPSTASH"
    | "VERCEL"
    | "ZAPIER";
  /**
   * Logo servi ailleurs que `public/plugins/<id>.svg`. Absent : le fichier
   * porte le même nom que l'identifiant du connecteur.
   */
  logoPath?: string;
  /**
   * Variables qui ne conditionnent pas la connexion mais une capacité.
   * Leur absence est un avertissement, jamais un blocage du consentement.
   */
  extraEnv?: readonly string[];
  /**
   * Hôtes d'API autorisés pour CE fournisseur. Liste blanche dure, dans la
   * discipline de `lib/plugins/shared/public-api.ts` : un outil ne suit jamais
   * une URL que le modèle a fabriquée.
   */
  hosts: readonly string[];
  /**
   * Suffixe d'hôte à une seule étiquette, pour un hôte choisi à la connexion
   * (Jira, Upstash). Le modèle ne le fournit pas.
   */
  hostSuffixes?: readonly string[];
  id: IntegrationProviderId;
  /** Identité déjà présente dans la réponse du token (Notion). */
  identityFromToken?: IntegrationTokenIdentity;
  label: string;
  /** Le logo est-il un repère monochrome ? `true` → rendu CSS mask + currentColor. */
  monochrome: boolean;
  /** Jeton de mention sans espace : `@([a-zA-Z0-9_.-]{3,30})` est la grammaire de Wakies. */
  mentionToken: string;
  /** Dossier de plugin qui porte les outils de ce connecteur. */
  pluginId: string;
  /** Aucun des fournisseurs de ce lot ne demande PKCE. */
  pkce: false;
  refresh: IntegrationRefreshPolicy;
  revoke: IntegrationRevoke | null;
  /** Toutes les portées demandées d'un coup : un seul écran de consentement. */
  scopes: readonly string[];
  /** Mode jeton : formulaire de saisie présenté dans la fiche du plugin. */
  token?: IntegrationTokenInput;
  /** Placement des identifiants du client à l'échange de token. */
  tokenAuth: "basic" | "body";
  /** Encodage du corps de l'échange de token. */
  tokenEncoding: "form" | "json";
  /** En-têtes supplémentaires exigés par l'endpoint de token (Notion). */
  tokenHeaders?: Record<string, string>;
  tokenUrl: string | null;
  /**
   * Portées sans lesquelles AUCUNE écriture n'est possible, vérifiées en bloc
   * pour l'affichage de la fiche. Un outil d'écriture compare la sienne — si
   * le fournisseur n'utilise pas de portées (Notion), la liste reste vide et
   * c'est la capacité configurée chez lui qui tranche.
   */
  writeScopes: readonly string[];
};

const GOOGLE_OAUTH = "https://accounts.google.com";
const GOOGLE_APIS = "https://www.googleapis.com";

/**
 * Version d'API Notion. Elle est exigée par TOUS les appels, y compris
 * l'échange et la révocation de token : sans elle, Notion répond 400.
 */
export const NOTION_API_VERSION = "2026-03-11";

/**
 * Portées Google, nommées : les outils d'écriture les citent une par une plutôt
 * que de recopier des URI en texte libre dans quatre fichiers.
 */
export const GOOGLE_SCOPES = {
  calendarEvents: `${GOOGLE_APIS}/auth/calendar.events`,
  calendarRead: `${GOOGLE_APIS}/auth/calendar.readonly`,
  driveRead: `${GOOGLE_APIS}/auth/drive.readonly`,
  /** Non sensibles : elles livrent `sub` et l'email dans l'`id_token`. */
  identity: ["openid", "email"] as const,
  mailRead: `${GOOGLE_APIS}/auth/gmail.readonly`,
  mailSend: `${GOOGLE_APIS}/auth/gmail.send`,
} as const;

export const INTEGRATION_PROVIDERS: readonly IntegrationDescriptor[] = [
  {
    accessSummary:
      "Drive, Agenda et Gmail sont accordés ensemble, en une seule connexion.",
    account: null,
    authMode: "oauth",
    authorizeParams: {
      // Sans `prompt=consent`, Google ne renvoie un `refresh_token` que lors du
      // tout premier consentement : au suivant, la connexion meurt à l'heure.
      access_type: "offline",
      prompt: "consent",
    },
    authorizeUrl: `${GOOGLE_OAUTH}/o/oauth2/v2/auth`,
    envPrefix: "GOOGLE",
    hosts: [
      "www.googleapis.com",
      "gmail.googleapis.com",
      "content.googleapis.com",
    ],
    id: "google",
    label: "Google",
    mentionToken: "Google",
    // Le logo Google est multicolore : en `<img>` nu, sans inversion qui
    // détruirait ses quatre couleurs en thème sombre.
    monochrome: false,
    pkce: false,
    pluginId: "google",
    refresh: {
      policy: "oauth_refresh",
      refreshLeadMs: 5 * 60 * 1000,
      rotatesRefreshToken: true,
    },
    revoke: {
      endpoint: "https://oauth2.googleapis.com/revoke",
      mode: "token_query",
    },
    scopes: [
      ...GOOGLE_SCOPES.identity,
      GOOGLE_SCOPES.driveRead,
      GOOGLE_SCOPES.calendarRead,
      GOOGLE_SCOPES.calendarEvents,
      GOOGLE_SCOPES.mailRead,
      GOOGLE_SCOPES.mailSend,
    ],
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: "https://oauth2.googleapis.com/token",
    writeScopes: [GOOGLE_SCOPES.calendarEvents, GOOGLE_SCOPES.mailSend],
  },
  {
    accessSummary:
      "Vos dépôts, privés compris, avec leurs issues et leurs pull requests.",
    // L'échange de code ne rend ni `sub` ni email : `GET /user` est la seule
    // source d'identité, et elle porte l'identifiant numérique qui déduplique.
    account: {
      emailField: "email",
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub refuse les appels sans User-Agent (403), y compris GET /user
        // qui identifie le compte au retour du consentement.
        "User-Agent": "mAI-Web/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      idField: "id",
      labelFields: ["login", "name"],
      method: "GET",
      url: "https://api.github.com/user",
    },
    authMode: "oauth",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    envPrefix: "GITHUB",
    hosts: ["api.github.com"],
    id: "github",
    label: "GitHub",
    mentionToken: "GitHub",
    // Le Octocat officiel n'existe qu'en monochrome : en `<img>` nu, il
    // disparaît sur un fond sombre.
    monochrome: true,
    pkce: false,
    pluginId: "github",
    refresh: { detectRevocation: true, policy: "static" },
    revoke: {
      endpoint: "https://api.github.com/applications/:clientId/grant",
      mode: "oauth_app_grant",
    },
    scopes: ["repo", "public_repo", "read:user"],
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: "https://github.com/login/oauth/access_token",
    writeScopes: ["repo"],
  },
  {
    accessSummary:
      "Les serveurs où votre bot Discord est invité : profil, salons, messages, et envoi d'un message dans l'Agent après votre accord. Le jeton se révoque depuis le portail développeur.",
    account: {
      auth: { kind: "prefix", prefix: "Bot" },
      headers: {
        Accept: "application/json",
        "User-Agent": "mAI (https://mai.example, 1.0)",
      },
      idField: "id",
      labelFields: ["global_name", "username"],
      method: "GET",
      url: "https://discord.com/api/v10/users/@me",
    },
    authMode: "token",
    authorizeUrl: null,
    envPrefix: "DISCORD",
    hosts: ["discord.com"],
    id: "discord",
    label: "Discord",
    mentionToken: "Discord",
    // La marque Discord est blurple : elle reste lisible sur les deux thèmes.
    monochrome: false,
    pkce: false,
    pluginId: "discord",
    refresh: { detectRevocation: true, policy: "static" },
    revoke: null,
    scopes: [],
    token: {
      helpUrl: "https://discord.com/developers/applications",
      maxLength: 200,
      minLength: 20,
      placeholder: "Jeton de bot Discord",
    },
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: null,
    writeScopes: [],
  },
  {
    accessSummary:
      "Les pages et bases partagées avec votre intégration Notion : recherche, lecture, création de pages et ajout de blocs. Le jeton se révoque depuis les réglages de l'intégration.",
    account: {
      headers: {
        Accept: "application/json",
        "Notion-Version": NOTION_API_VERSION,
      },
      idField: "id",
      labelFallback: "Notion",
      labelFields: ["name", "bot.workspace_name"],
      method: "GET",
      url: "https://api.notion.com/v1/users/me",
    },
    authMode: "token",
    authorizeUrl: null,
    envPrefix: "NOTION",
    hosts: ["api.notion.com"],
    id: "notion",
    label: "Notion",
    mentionToken: "Notion",
    monochrome: true,
    pkce: false,
    pluginId: "notion",
    refresh: { detectRevocation: true, policy: "static" },
    revoke: null,
    scopes: [],
    token: {
      helpUrl: "https://www.notion.so/profile/integrations",
      maxLength: 200,
      minLength: 20,
      placeholder: "Jeton d'intégration Notion",
    },
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: null,
    writeScopes: [],
  },
  {
    accessSummary:
      "Vos projets, déploiements et journaux Vercel, en lecture seule. Le jeton personnel reste chez Vercel et peut y être révoqué à tout moment.",
    account: {
      emailField: "email",
      headers: { Accept: "application/json" },
      idField: "id",
      labelFields: ["username", "name"],
      method: "GET",
      // `GET /v2/user` enveloppe le compte dans `user`.
      responsePath: "user",
      url: "https://api.vercel.com/v2/user",
    },
    authMode: "token",
    authorizeUrl: null,
    envPrefix: "VERCEL",
    hosts: ["api.vercel.com"],
    id: "vercel",
    label: "Vercel",
    mentionToken: "Vercel",
    monochrome: true,
    pkce: false,
    pluginId: "vercel",
    refresh: { detectRevocation: true, policy: "static" },
    revoke: null,
    scopes: [],
    token: {
      helpUrl: "https://vercel.com/account/tokens",
      maxLength: 500,
      minLength: 10,
      placeholder: "Jeton personnel Vercel",
    },
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: null,
    writeScopes: [],
  },
  tokenProvider({
    accessSummary:
      "Organisations, projets et issues Sentry, en lecture seule. Le jeton se révoque depuis les paramètres du compte Sentry.",
    account: {
      emailField: "email",
      idField: "id",
      labelFields: ["name", "username", "email"],
      responsePath: "user",
      url: "https://sentry.io/api/0/",
    },
    envPrefix: "SENTRY",
    helpUrl: "https://sentry.io/settings/account/api/auth-tokens/",
    hosts: ["sentry.io"],
    id: "sentry",
    label: "Sentry",
    mentionToken: "Sentry",
    placeholder: "Jeton d'authentification Sentry",
  }),
  tokenProvider({
    accessSummary:
      "Projets et feature flags PostHog (hôte US), en lecture seule. Le jeton personnel se révoque depuis les réglages du compte PostHog.",
    account: {
      emailField: "email",
      idField: "id",
      labelFallback: "Compte PostHog",
      labelFields: ["email", "first_name"],
      url: "https://us.posthog.com/api/users/@me/",
    },
    envPrefix: "POSTHOG",
    helpUrl: "https://us.posthog.com/settings/user-api-keys",
    hosts: ["us.posthog.com"],
    id: "posthog",
    label: "PostHog",
    mentionToken: "PostHog",
    placeholder: "Clé personnelle PostHog",
  }),
  tokenProvider({
    accessSummary:
      "Équipes et issues Linear, en lecture seule. La clé personnelle se révoque depuis les réglages de sécurité Linear.",
    account: {
      body: JSON.stringify({
        query: "{ viewer { id name email } }",
      }),
      emailField: "email",
      headers: { "Content-Type": "application/json" },
      idField: "id",
      labelFields: ["name", "email"],
      method: "POST",
      responsePath: "data.viewer",
      url: "https://api.linear.app/graphql",
    },
    envPrefix: "LINEAR",
    helpUrl: "https://linear.app/settings/account/security",
    hosts: ["api.linear.app"],
    id: "linear",
    label: "Linear",
    mentionToken: "Linear",
    placeholder: "Clé API personnelle Linear",
  }),
  tokenProvider({
    accessSummary:
      "Clients, paiements et abonnements Stripe, en lecture seule. Aucune opération financière n'est exposée. La clé se révoque depuis le tableau de bord Stripe.",
    account: {
      emailField: "email",
      idField: "id",
      labelFallback: "Compte Stripe",
      labelFields: ["business_profile.name", "email"],
      url: "https://api.stripe.com/v1/account",
    },
    envPrefix: "STRIPE",
    helpUrl: "https://dashboard.stripe.com/apikeys",
    hosts: ["api.stripe.com"],
    id: "stripe",
    label: "Stripe",
    mentionToken: "Stripe",
    placeholder: "Clé secrète Stripe (sk_ ou rk_)",
  }),
  tokenProvider({
    accessSummary:
      "Domaines et e-mails envoyés via Resend, en lecture seule. La clé API se révoque depuis le tableau de bord Resend.",
    account: {
      idFallback: "resend",
      idField: "id",
      labelFallback: "Compte Resend",
      labelFields: [],
      url: "https://api.resend.com/domains",
    },
    envPrefix: "RESEND",
    helpUrl: "https://resend.com/api-keys",
    hosts: ["api.resend.com"],
    id: "resend",
    label: "Resend",
    mentionToken: "Resend",
    placeholder: "Clé API Resend",
  }),
  tokenProvider({
    accessSummary:
      "Zones et enregistrements DNS Cloudflare, en lecture seule. Le jeton d'API se révoque depuis le profil Cloudflare.",
    account: {
      idFallback: "cloudflare",
      idField: "accountId",
      labelFallback: "Compte Cloudflare",
      labelFields: [],
      responsePath: "result",
      url: "https://api.cloudflare.com/client/v4/user/tokens/verify",
    },
    envPrefix: "CLOUDFLARE",
    helpUrl: "https://dash.cloudflare.com/profile/api-tokens",
    hosts: ["api.cloudflare.com"],
    id: "cloudflare",
    label: "Cloudflare",
    mentionToken: "Cloudflare",
    placeholder: "Jeton d'API Cloudflare",
  }),
  ...extraTokenProviders(tokenProvider),
];

function tokenProvider(
  input: Pick<
    IntegrationDescriptor,
    | "accessSummary"
    | "account"
    | "envPrefix"
    | "hostSuffixes"
    | "hosts"
    | "id"
    | "label"
    | "logoPath"
    | "mentionToken"
  > & {
    fields?: readonly TokenFieldSpec[];
    helpUrl: string;
    placeholder: string;
  }
): IntegrationDescriptor {
  return {
    accessSummary: input.accessSummary,
    account: input.account,
    authMode: "token",
    authorizeUrl: null,
    envPrefix: input.envPrefix,
    hostSuffixes: input.hostSuffixes,
    hosts: input.hosts,
    id: input.id,
    label: input.label,
    logoPath: input.logoPath,
    mentionToken: input.mentionToken,
    monochrome: true,
    pkce: false,
    pluginId: input.id,
    refresh: { detectRevocation: true, policy: "static" },
    revoke: null,
    scopes: [],
    token: {
      fields: input.fields,
      helpUrl: input.helpUrl,
      maxLength: 2000,
      minLength: 8,
      placeholder: input.placeholder,
    },
    tokenAuth: "body",
    tokenEncoding: "form",
    tokenUrl: null,
    writeScopes: [],
  };
}

const PROVIDERS_BY_ID: ReadonlyMap<string, IntegrationDescriptor> = new Map(
  INTEGRATION_PROVIDERS.map((descriptor) => [descriptor.id, descriptor])
);

const PROVIDERS_BY_PLUGIN_ID: ReadonlyMap<string, IntegrationDescriptor> =
  new Map(
    INTEGRATION_PROVIDERS.map((descriptor) => [descriptor.pluginId, descriptor])
  );

export function getIntegrationProvider(
  id: string
): IntegrationDescriptor | undefined {
  return PROVIDERS_BY_ID.get(id);
}

export function getIntegrationByPluginId(
  pluginId: string
): IntegrationDescriptor | undefined {
  return PROVIDERS_BY_PLUGIN_ID.get(pluginId);
}

export function splitGrantedScopes(grantedScopes: string): Set<string> {
  // Google sépare par des espaces, GitHub par des virgules.
  return new Set(grantedScopes.split(/[\s,]+/).filter(Boolean));
}

/** Le consentement accordé laisse-t-il passer TOUTES les écritures du connecteur ? */
export function hasWriteScope(
  descriptor: IntegrationDescriptor,
  grantedScopes: string
): boolean {
  if (descriptor.writeScopes.length === 0) {
    return true;
  }
  const granted = splitGrantedScopes(grantedScopes);
  return descriptor.writeScopes.every((scope) => granted.has(scope));
}
