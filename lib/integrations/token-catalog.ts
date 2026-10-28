import type {
  IntegrationAccountConfig,
  IntegrationDescriptor,
  IntegrationProviderId,
} from "./providers";
import type { TokenFieldSpec } from "./token-fields";

/**
 * Quinze connecteurs à jeton. Le registre OAuth les étale ; les outils vivent
 * dans `lib/plugins/<id>`.
 */

type TokenFactory = (input: {
  accessSummary: string;
  account: IntegrationAccountConfig;
  envPrefix: IntegrationDescriptor["envPrefix"];
  fields?: readonly TokenFieldSpec[];
  helpUrl: string;
  hostSuffixes?: readonly string[];
  hosts: readonly string[];
  id: IntegrationProviderId;
  label: string;
  mentionToken: string;
  placeholder: string;
}) => IntegrationDescriptor;

export function extraTokenProviders(
  tokenProvider: TokenFactory
): IntegrationDescriptor[] {
  return [
    tokenProvider({
      accessSummary:
        "Recherche web et actualités Brave. L'API est consultative : aucun contenu n'est publié. Le jeton se révoque depuis le tableau Brave Search.",
      account: {
        auth: { kind: "header", name: "X-Subscription-Token" },
        idFallback: "brave",
        idField: "type",
        labelFallback: "Brave Search",
        labelFields: [],
        url: "https://api.search.brave.com/res/v1/web/search?q=ping&count=1",
      },
      envPrefix: "BRAVE",
      helpUrl: "https://api-dashboard.search.brave.com/app/keys",
      hosts: ["api.search.brave.com"],
      id: "brave",
      label: "Brave Search",
      mentionToken: "Brave",
      placeholder: "Jeton d'abonnement Brave Search",
    }),
    tokenProvider({
      accessSummary:
        "Géocodage et itinéraires Mapbox, en lecture. Le jeton se révoque depuis le compte Mapbox.",
      account: {
        auth: { kind: "query", name: "access_token" },
        idFallback: "mapbox",
        idField: "id",
        labelFallback: "Compte Mapbox",
        labelFields: [],
        url: "https://api.mapbox.com/search/geocode/v6/forward?q=Paris&limit=1",
      },
      envPrefix: "MAPBOX",
      helpUrl: "https://account.mapbox.com/access-tokens/",
      hosts: ["api.mapbox.com"],
      id: "mapbox",
      label: "Mapbox",
      mentionToken: "Mapbox",
      placeholder: "Jeton d'accès Mapbox",
    }),
    tokenProvider({
      accessSummary:
        "Taux de change ExchangeRate-API, en lecture. La clé se révoque depuis le tableau du fournisseur.",
      account: {
        auth: { kind: "none" },
        expect: { equals: "success", path: "result" },
        idFallback: "exchange-rate",
        idField: "result",
        labelFallback: "ExchangeRate-API",
        labelFields: [],
        url: "https://v6.exchangerate-api.com/v6/{token}/latest/EUR",
      },
      envPrefix: "EXCHANGE_RATE",
      helpUrl: "https://www.exchangerate-api.com/docs/overview",
      hosts: ["v6.exchangerate-api.com"],
      id: "exchange-rate",
      label: "ExchangeRate-API",
      mentionToken: "ExchangeRate",
      placeholder: "Clé API ExchangeRate",
    }),
    tokenProvider({
      accessSummary:
        "Projets et issues SonarCloud. Un commentaire sur une issue n'est envoyé que dans l'Agent, après approbation. Le jeton se révoque depuis la sécurité du compte.",
      account: {
        emailField: "email",
        idField: "login",
        labelFields: ["name", "login"],
        url: "https://sonarcloud.io/api/users/current",
      },
      envPrefix: "SONARCLOUD",
      helpUrl: "https://sonarcloud.io/account/security",
      hosts: ["sonarcloud.io"],
      id: "sonarcloud",
      label: "SonarCloud",
      mentionToken: "SonarCloud",
      placeholder: "Jeton utilisateur SonarCloud",
    }),
    tokenProvider({
      accessSummary:
        "Profil et paquets npm, en lecture. La publication d'un paquet n'est pas exposée. Le jeton se révoque depuis les réglages npm.",
      account: {
        idField: "username",
        labelFields: ["username"],
        url: "https://registry.npmjs.org/-/whoami",
      },
      envPrefix: "NPM",
      helpUrl: "https://www.npmjs.com/settings/~/tokens",
      hosts: ["registry.npmjs.org"],
      id: "npm",
      label: "npm",
      mentionToken: "npm",
      placeholder: "Jeton d'accès npm",
    }),
    tokenProvider({
      accessSummary:
        "Dépôts Docker Hub du compte. La création d'un dépôt privé n'a lieu que dans l'Agent, après approbation. Le jeton se révoque depuis les jetons d'accès Docker.",
      account: {
        idField: "id",
        labelFields: ["username", "full_name"],
        login: {
          auth: { kind: "prefix", prefix: "JWT" },
          tokenPath: "token",
          url: "https://hub.docker.com/v2/users/login/",
          usernameField: "username",
        },
        url: "https://hub.docker.com/v2/users/{seg:username}/",
      },
      envPrefix: "DOCKERHUB",
      fields: [
        {
          id: "username",
          kind: "docker-username",
          label: "Identifiant Docker Hub",
          placeholder: "mon-utilisateur",
          secret: false,
        },
      ],
      helpUrl: "https://app.docker.com/settings/personal-access-tokens",
      hosts: ["hub.docker.com"],
      id: "dockerhub",
      label: "Docker Hub",
      mentionToken: "DockerHub",
      placeholder: "Jeton d'accès personnel Docker Hub",
    }),
    tokenProvider({
      accessSummary:
        "Contacts et listes Brevo. L'envoi d'un e-mail n'a lieu que dans l'Agent, après approbation, et vers un seul destinataire. La clé se révoque depuis les clés API Brevo.",
      account: {
        auth: { kind: "header", name: "api-key" },
        emailField: "email",
        idField: "email",
        labelFields: ["companyName", "email"],
        url: "https://api.brevo.com/v3/account",
      },
      envPrefix: "BREVO",
      helpUrl: "https://app.brevo.com/settings/keys/api",
      hosts: ["api.brevo.com"],
      id: "brevo",
      label: "Brevo",
      mentionToken: "Brevo",
      placeholder: "Clé API Brevo",
    }),
    tokenProvider({
      accessSummary:
        "Numéros et messages Twilio. L'envoi d'un SMS n'a lieu que dans l'Agent, après approbation. Le jeton se régénère depuis la console Twilio.",
      account: {
        auth: { kind: "basic", userField: "accountSid" },
        idField: "sid",
        labelFields: ["friendly_name"],
        url: "https://api.twilio.com/2010-04-01/Accounts/{seg:accountSid}.json",
      },
      envPrefix: "TWILIO",
      fields: [
        {
          id: "accountSid",
          kind: "twilio-sid",
          label: "Account SID",
          placeholder: "AC…",
          secret: false,
        },
      ],
      helpUrl: "https://console.twilio.com/",
      hosts: ["api.twilio.com"],
      id: "twilio",
      label: "Twilio",
      mentionToken: "Twilio",
      placeholder: "Auth Token Twilio",
    }),
    tokenProvider({
      accessSummary:
        "Espaces de travail et tâches Asana. La création d'une tâche n'a lieu que dans l'Agent, après approbation. Le jeton se révoque depuis les applications du compte Asana.",
      account: {
        emailField: "email",
        idField: "gid",
        labelFields: ["name", "email"],
        responsePath: "data",
        url: "https://app.asana.com/api/1.0/users/me",
      },
      envPrefix: "ASANA",
      helpUrl: "https://app.asana.com/0/my-apps",
      hosts: ["app.asana.com"],
      id: "asana",
      label: "Asana",
      mentionToken: "Asana",
      placeholder: "Jeton d'accès personnel Asana",
    }),
    tokenProvider({
      accessSummary:
        "Projets et tickets Jira Cloud. La création d'un ticket n'a lieu que dans l'Agent, après approbation. Le jeton se révoque depuis la sécurité du compte Atlassian.",
      account: {
        auth: { kind: "basic", userField: "email" },
        emailField: "emailAddress",
        idField: "accountId",
        labelFields: ["displayName", "emailAddress"],
        url: "https://{seg:site}/rest/api/3/myself",
      },
      envPrefix: "JIRA",
      fields: [
        {
          id: "email",
          kind: "email",
          label: "Adresse e-mail Atlassian",
          placeholder: "vous@exemple.com",
          secret: false,
        },
        {
          id: "site",
          kind: "jira-site",
          label: "Site Jira",
          placeholder: "exemple.atlassian.net",
          secret: false,
        },
      ],
      helpUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
      hostSuffixes: [".atlassian.net"],
      hosts: [],
      id: "jira",
      label: "Jira",
      mentionToken: "Jira",
      placeholder: "Jeton d'API Atlassian",
    }),
    tokenProvider({
      accessSummary:
        "Lecture et écriture de clés Redis Upstash. L'écriture n'a lieu que dans l'Agent, après approbation, et peut écraser une clé existante. Le jeton se révoque depuis la console Upstash.",
      account: {
        body: '["PING"]',
        expect: { equals: "PONG", path: "result" },
        headers: { "Content-Type": "application/json" },
        idFallback: "upstash",
        idField: "result",
        labelFallback: "Upstash Redis",
        labelFields: [],
        method: "POST",
        url: "{origin:restOrigin}/",
      },
      envPrefix: "UPSTASH",
      fields: [
        {
          id: "restOrigin",
          kind: "upstash-origin",
          label: "URL REST",
          placeholder: "https://exemple.upstash.io",
          secret: false,
        },
      ],
      helpUrl: "https://console.upstash.com/",
      hostSuffixes: [".upstash.io"],
      hosts: [],
      id: "upstash",
      label: "Upstash",
      mentionToken: "Upstash",
      placeholder: "Jeton REST Upstash",
    }),
    tokenProvider({
      accessSummary:
        "Projets et branches Neon. La création d'une branche n'a lieu que dans l'Agent, après approbation, et peut consommer du calcul. La clé se révoque depuis les clés API Neon.",
      account: {
        emailField: "email",
        idField: "id",
        labelFields: ["name", "email"],
        url: "https://console.neon.tech/api/v2/users/me",
      },
      envPrefix: "NEON",
      helpUrl: "https://console.neon.tech/app/settings/api-keys",
      hosts: ["console.neon.tech"],
      id: "neon",
      label: "Neon",
      mentionToken: "Neon",
      placeholder: "Clé API Neon",
    }),
    tokenProvider({
      accessSummary:
        "Organisations et projets Supabase, via l'API de gestion. La création d'un projet n'est pas exposée : elle facture le compte et exige un mot de passe de base. Le jeton se révoque depuis les jetons du compte.",
      account: {
        emailField: "primary_email",
        idField: "gotrue_id",
        labelFields: ["username", "primary_email"],
        url: "https://api.supabase.com/v1/profile",
      },
      envPrefix: "SUPABASE",
      helpUrl: "https://supabase.com/dashboard/account/tokens",
      hosts: ["api.supabase.com"],
      id: "supabase",
      label: "Supabase",
      mentionToken: "Supabase",
      placeholder: "Jeton d'accès personnel Supabase",
    }),
    tokenProvider({
      accessSummary:
        "Liste des Zaps accessibles avec un jeton d'accès Zapier. Ce jeton expire (environ dix heures) : il faudra le recoller. Aucune activation de Zap n'est exposée.",
      account: {
        idFallback: "zapier",
        idField: "id",
        labelFallback: "Compte Zapier",
        labelFields: [],
        url: "https://api.zapier.com/v2/zaps?limit=1",
      },
      envPrefix: "ZAPIER",
      helpUrl:
        "https://docs.zapier.com/powered-by-zapier/authentication/methods/user-access-token",
      hosts: ["api.zapier.com"],
      id: "zapier",
      label: "Zapier",
      mentionToken: "Zapier",
      placeholder: "Jeton d'accès Zapier",
    }),
    tokenProvider({
      accessSummary:
        "Organisations et scénarios Make. L'exécution d'un scénario déjà actif n'a lieu que dans l'Agent, après approbation. Le jeton se révoque depuis le profil Make.",
      account: {
        auth: { kind: "prefix", prefix: "Token" },
        emailField: "email",
        idFallback: "make",
        idField: "id",
        labelFields: ["name", "email"],
        url: "https://{seg:zone}.make.com/api/v2/users/me",
      },
      envPrefix: "MAKE",
      fields: [
        {
          id: "zone",
          kind: "make-zone",
          label: "Zone",
          placeholder: "eu1, eu2, us1 ou us2",
          secret: false,
        },
      ],
      helpUrl: "https://developers.make.com/api-documentation/authentication",
      hosts: ["eu1.make.com", "eu2.make.com", "us1.make.com", "us2.make.com"],
      id: "make",
      label: "Make",
      mentionToken: "Make",
      placeholder: "Jeton d'API Make",
    }),
  ];
}
