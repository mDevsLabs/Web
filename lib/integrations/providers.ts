/**
 * Registre des applications externes connectables par OAuth.
 *
 * Un descripteur = UN accès, donc UN client chez le fournisseur et UN écran de
 * consentement. Google en regroupe trois (Drive, Agenda, Gmail) sous une seule
 * connexion : leurs portées sont demandées d'un coup et se déconnecter de
 * Google coupe les trois d'un seul geste. GitHub reste un descripteur à part,
 * parce qu'un client GitHub n'est pas un client Google.
 *
 * Ce module est volontairement **sûr côté client** : aucune lecture
 * d'environnement, aucun import `server-only`. La fiche plugin, le menu `@` et
 * le rendu des logos partagent ainsi le même descripteur que les routes ; les
 * secrets (`<prefix>_CLIENT_ID`, `<prefix>_CLIENT_SECRET`) sont relus côté
 * serveur par `lib/integrations/oauth.ts`.
 *
 * Ajouter une application = ajouter un descripteur ici et un dossier de plugin
 * dans `lib/plugins/`. Le moteur, les mentions et le rendu n'ont pas à savoir de
 * quel fournisseur vient un outil.
 */

export type IntegrationProviderId = "github" | "google";

export type IntegrationRefreshPolicy =
  | {
      /** Marge avant expiration à laquelle on rafraîchit : Google coupe à 3600 s. */
      policy: "oauth_refresh";
      refreshLeadMs: number;
      /** Google fait tourner le `refresh_token` : l'ancien meurt ~10 min après. */
      rotatesRefreshToken: boolean;
    }
  | {
      /** GitHub délivre un jeton non expirant : seule une révocation l'éteint. */
      detectRevocation: true;
      policy: "static";
    };

export type IntegrationRevoke = {
  endpoint: string;
  /** Google : le jeton passe en query string. GitHub : endpoint d'app, Basic auth + corps. */
  mode: "oauth_app_grant" | "token_query";
};

export type IntegrationDescriptor = {
  /** Endpoint renvoyant l'identité du compte, ou `null` quand l'`id_token` du swap suffit. */
  accountUrl: string | null;
  /** Ce que la connexion ouvre, en une phrase, pour la fiche du plugin. */
  accessSummary: string;
  authorizeUrl: string;
  /** Préfixe des variables d'environnement : `<prefix>_CLIENT_ID`, `<prefix>_CLIENT_SECRET`. */
  envPrefix: "GOOGLE" | "GITHUB";
  /**
   * Hôtes d'API autorisés pour CE fournisseur. Liste blanche dure, dans la
   * discipline de `lib/plugins/shared/public-api.ts` : un outil ne suit jamais
   * une URL que le modèle a fabriquée. Chaque famille d'outils (Drive, Agenda,
   * Gmail) porte sa propre base dans son plugin ; ce champ n'est que le
   * garde-fou.
   */
  hosts: readonly string[];
  id: IntegrationProviderId;
  label: string;
  /** Le logo est-il un repère monochrome ? `true` → rendu CSS mask + currentColor. */
  monochrome: boolean;
  /** Jeton de mention sans espace : `@([a-zA-Z0-9_.-]{3,30})` est la grammaire de Wakies. */
  mentionToken: string;
  /** Dossier de plugin qui porte les outils de ce connecteur. */
  pluginId: string;
  /** Ni Google ni GitHub (OAuth App classique) n'en requièrent ici. */
  pkce: false;
  refresh: IntegrationRefreshPolicy;
  revoke: IntegrationRevoke | null;
  /** Toutes les portées demandées d'un coup : un seul écran de consentement. */
  scopes: readonly string[];
  tokenUrl: string;
  /**
   * Portées sans lesquelles AUCUNE écriture n'est possible, vérifiées en bloc
   * pour l'affichage de la fiche. Un outil d'écriture compare la sienne —
   * constante exportée ci-dessous — aux portées réellement accordées.
   */
  writeScopes: readonly string[];
};

const GOOGLE_OAUTH = "https://accounts.google.com";
const GOOGLE_APIS = "https://www.googleapis.com";

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
    accountUrl: null,
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
    tokenUrl: "https://oauth2.googleapis.com/token",
    writeScopes: [GOOGLE_SCOPES.calendarEvents, GOOGLE_SCOPES.mailSend],
  },
  {
    accessSummary:
      "Vos dépôts, privés compris, avec leurs issues et leurs pull requests.",
    // L'échange de code ne rend ni `sub` ni email : `GET /user` est la seule
    // source d'identité, et elle porte l'identifiant numérique qui déduplique.
    accountUrl: "https://api.github.com/user",
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
    tokenUrl: "https://github.com/login/oauth/access_token",
    writeScopes: ["repo"],
  },
];

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
