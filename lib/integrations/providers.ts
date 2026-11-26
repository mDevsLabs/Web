import { extraTokenProviders } from "./token-catalog";
import type { TokenFieldSpec } from "./token-fields";

/**
 * Registre des applications externes connectables par jeton personnel.
 *
 * Un descripteur = UN accès par fournisseur. L'utilisateur colle son jeton
 * (et les champs éventuels associés) dans la fiche du plugin ; le tout est
 * validé sur l'API du fournisseur puis chiffré avec `MCP_ENCRYPTION_KEY`.
 *
 * Ce module est volontairement **sûr côté client** : aucune lecture
 * d'environnement, aucun import `server-only`.
 */

export type IntegrationProviderId =
  | "airtable"
  | "asana"
  | "brave"
  | "brevo"
  | "cloudflare"
  | "discord"
  | "dockerhub"
  | "exchange-rate"
  | "github"
  | "google-maps"
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
  | "slack"
  | "sonarcloud"
  | "stripe"
  | "supabase"
  | "twilio"
  | "upstash"
  | "vercel"
  | "youtube"
  | "zapier";

export type IntegrationAuthMode = "token";

export type IntegrationHttpAuth =
  | { kind: "basic"; userField: string }
  | { kind: "bearer" }
  | { kind: "header"; name: "X-Subscription-Token" | "api-key" }
  | { kind: "none" }
  | { kind: "prefix"; prefix: "Bot" | "JWT" | "Token" }
  | { kind: "query"; name: "access_token" | "key" };

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
   * (PING Upstash, `result: success` d'ExchangeRate, `ok: true` Slack).
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

export type IntegrationTokenInput = {
  /** Renseignements exigés en plus du secret (SID, site, zone, région…). */
  fields?: readonly TokenFieldSpec[];
  helpUrl: string;
  /** Longueur bornée avant même l'appel de validation. */
  maxLength: number;
  minLength: number;
  placeholder: string;
};

export type IntegrationDescriptor = {
  /** Identité du compte vérifiée lors de l'enregistrement du jeton. */
  account: IntegrationAccountConfig;
  /** Ce que la connexion ouvre, en une phrase, pour la fiche du plugin. */
  accessSummary: string;
  authMode: IntegrationAuthMode;
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
  label: string;
  /** Le logo est-il un repère monochrome ? `true` → rendu CSS mask + currentColor. */
  monochrome: boolean;
  /** Logo servi ailleurs que `public/plugins/<id>.svg`. */
  logoPath?: string;
  /** Jeton de mention sans espace : `@([a-zA-Z0-9_.-]{3,30})`. */
  mentionToken: string;
  /** Dossier de plugin qui porte les outils de ce connecteur. */
  pluginId: string;
  /** Mode jeton : formulaire de saisie présenté dans la fiche du plugin. */
  token: IntegrationTokenInput;
};

/**
 * Version d'API Notion. Elle est exigée par TOUS les appels.
 */
export const NOTION_API_VERSION = "2026-03-11";

export const INTEGRATION_PROVIDERS: readonly IntegrationDescriptor[] = [
  {
    accessSummary:
      "Vos dépôts, privés compris, leur code, branches, commits, issues et pull requests. Les actions d'écriture passent par l'Agent après votre approbation. Le jeton personnel se révoque depuis les paramètres GitHub.",
    account: {
      emailField: "email",
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub refuse les appels sans User-Agent (403).
        "User-Agent": "mAI-Web/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      idField: "id",
      labelFields: ["login", "name"],
      method: "GET",
      url: "https://api.github.com/user",
    },
    authMode: "token",
    hosts: ["api.github.com"],
    id: "github",
    label: "GitHub",
    mentionToken: "GitHub",
    monochrome: true,
    pluginId: "github",
    token: {
      helpUrl: "https://github.com/settings/tokens?type=beta",
      maxLength: 300,
      minLength: 20,
      placeholder: "Jeton personnel GitHub (github_pat_… ou ghp_…)",
    },
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
    hosts: ["discord.com"],
    id: "discord",
    label: "Discord",
    mentionToken: "Discord",
    monochrome: false,
    pluginId: "discord",
    token: {
      helpUrl: "https://discord.com/developers/applications",
      maxLength: 200,
      minLength: 20,
      placeholder: "Jeton de bot Discord",
    },
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
    hosts: ["api.notion.com"],
    id: "notion",
    label: "Notion",
    mentionToken: "Notion",
    monochrome: true,
    pluginId: "notion",
    token: {
      helpUrl: "https://www.notion.so/profile/integrations",
      maxLength: 200,
      minLength: 20,
      placeholder: "Jeton d'intégration Notion",
    },
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
      responsePath: "user",
      url: "https://api.vercel.com/v2/user",
    },
    authMode: "token",
    hosts: ["api.vercel.com"],
    id: "vercel",
    label: "Vercel",
    mentionToken: "Vercel",
    monochrome: true,
    pluginId: "vercel",
    token: {
      helpUrl: "https://vercel.com/account/tokens",
      maxLength: 500,
      minLength: 10,
      placeholder: "Jeton personnel Vercel",
    },
  },
  tokenProvider({
    accessSummary:
      "Organisations, projets et issues Sentry (avec le dernier événement), en lecture seule. Le jeton se révoque depuis les paramètres du compte Sentry.",
    account: {
      emailField: "email",
      idField: "id",
      labelFields: ["name", "username", "email"],
      responsePath: "user",
      url: "https://sentry.io/api/0/",
    },
    helpUrl: "https://sentry.io/settings/account/api/auth-tokens/",
    hosts: ["sentry.io"],
    id: "sentry",
    label: "Sentry",
    mentionToken: "Sentry",
    placeholder: "Jeton d'authentification Sentry",
  }),
  tokenProvider({
    accessSummary:
      "Projets, feature flags et insights PostHog (US ou EU), en lecture seule. Le jeton personnel se révoque depuis les réglages du compte PostHog.",
    account: {
      emailField: "email",
      idField: "id",
      labelFallback: "Compte PostHog",
      labelFields: ["email", "first_name"],
      url: "https://{seg:region}.posthog.com/api/users/@me/",
    },
    fields: [
      {
        id: "region",
        kind: "posthog-region",
        label: "Région PostHog",
        placeholder: "us ou eu",
        secret: false,
      },
    ],
    helpUrl: "https://us.posthog.com/settings/user-api-keys",
    hosts: ["us.posthog.com", "eu.posthog.com"],
    id: "posthog",
    label: "PostHog",
    mentionToken: "PostHog",
    placeholder: "Clé personnelle PostHog",
  }),
  tokenProvider({
    accessSummary:
      "Équipes et issues Linear, avec création d'issue dans l'Agent après approbation. La clé personnelle se révoque depuis les réglages de sécurité Linear.",
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
    helpUrl: "https://linear.app/settings/account/security",
    hosts: ["api.linear.app"],
    id: "linear",
    label: "Linear",
    mentionToken: "Linear",
    placeholder: "Clé API personnelle Linear",
  }),
  tokenProvider({
    accessSummary:
      "Clients, factures, paiements et abonnements Stripe, en lecture seule. Aucune opération financière n'est exposée. La clé se révoque depuis le tableau de bord Stripe.",
    account: {
      emailField: "email",
      idField: "id",
      labelFallback: "Compte Stripe",
      labelFields: ["business_profile.name", "email"],
      url: "https://api.stripe.com/v1/account",
    },
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
    helpUrl: "https://resend.com/api-keys",
    hosts: ["api.resend.com"],
    id: "resend",
    label: "Resend",
    mentionToken: "Resend",
    placeholder: "Clé API Resend",
  }),
  tokenProvider({
    accessSummary:
      "Zones, enregistrements DNS et Workers Cloudflare, en lecture seule. Le jeton d'API se révoque depuis le profil Cloudflare.",
    account: {
      idFallback: "cloudflare",
      idField: "accountId",
      labelFallback: "Compte Cloudflare",
      labelFields: [],
      responsePath: "result",
      url: "https://api.cloudflare.com/client/v4/user/tokens/verify",
    },
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
    hostSuffixes: input.hostSuffixes,
    hosts: input.hosts,
    id: input.id,
    label: input.label,
    logoPath: input.logoPath,
    mentionToken: input.mentionToken,
    monochrome: true,
    pluginId: input.id,
    token: {
      fields: input.fields,
      helpUrl: input.helpUrl,
      maxLength: 2000,
      minLength: 8,
      placeholder: input.placeholder,
    },
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
