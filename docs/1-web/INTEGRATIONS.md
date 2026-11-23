# Connexions par jeton personnel aux applications externes (intégrations)

Un **connecteur** relie le compte mAI d'un utilisateur à un service externe
(GitHub, Slack, Airtable, Notion, Linear, Sentry, etc.) par **jeton personnel**
(ou clé API) chiffré côté serveur, et expose ses fonctions comme outils de l'IA.
À la différence des plugins d'[API publiques](PLUGINS.md), un connecteur lit et
modifie **les données du compte de l'utilisateur**, avec son jeton.

Tous les connecteurs intégrés utilisent le mode `authMode: "token"` et sont
enregistrés dans `lib/integrations/providers.ts` (et `lib/integrations/token-catalog.ts`).
Aucune variable d'environnement OAuth par fournisseur (`GITHUB_CLIENT_ID`, etc.)
n'est requise. Le registre est conçu pour s'étendre : ajouter un fournisseur ne
demande ni de toucher au moteur, ni de retoucher les mentions `@`, ni de
retoucher le rendu.

---

## 1. Deux couches, un seul canal de secrets

| Couche | Dossier | Rôle |
| --- | --- | --- |
| Connecteur | `lib/integrations/` | Validation du jeton contre l'API du fournisseur, identité du compte, champs associés, stockage chiffré |
| Plugin | `lib/plugins/packs/<catégorie>/<id>/` | Les outils eux-mêmes (schémas, appels d'API, sortie bornée) |

Le connecteur ne déclare aucun outil ; le plugin ne sait rien du chiffrement ni
de la table SQL. Ils se rejoignent sur un point unique, prévu par `PluginToolDeps` :
`secretResolver` (`lib/plugins/core/types.ts`), et `effect` se déclare sur chaque
outil via `lib/plugins/core/tool-effect.ts`.

```
lib/integrations/providers.ts        client-sûr : descripteur, logo, jeton de mention, authMode: "token"
lib/integrations/token-catalog.ts    client-sûr : catalogue des connecteurs à jeton et de leurs champs
lib/integrations/token-fields.ts     client-sûr : validation des champs complémentaires (ex. site Jira, région PostHog)
lib/integrations/account.ts          server-only : validation de jeton et lecture d'identité (sans OAuth)
lib/integrations/tokens.ts           server-only : lecture du jeton au repos, adaptateur secretResolver
lib/integrations/repository.ts       server-only : CRUD IntegrationConnection, format au repos
lib/integrations/status.ts           server-only : projection sans jeton pour l'interface
lib/integrations/logo.tsx            client : rendu du logo d'un outil
lib/plugins/core/oauth-state.ts      server-only : état scellé OAuth réservé aux plugins personnels (`/api/user-plugins/[id]/*`)
lib/plugins/shared/authorized-api.ts serveur : appel authentifié borné (GET, POST, PUT, PATCH, DELETE)
```

**Pourquoi ce partage** : les plugins passent par un catalogue généré
(`pnpm plugins:gen`) et sont mentionnables par `@`, installables et activables
dès le forfait Free. Recréer ces mécanismes pour les connecteurs aurait produit
une seconde interface parallèle, divergente dès le premier correctif.

---

## 2. Descripteur `IntegrationDescriptor`

Le type `IntegrationDescriptor` porte ce qu'il faut pour un fournisseur à jeton :

| Champ | Sens |
| --- | --- |
| `authMode` | `"token"` pour tous les connecteurs intégrés |
| `token` | configuration de saisie, validation (`validationUrl`, `accountField`) et en-têtes d'appel |
| `hosts` / `hostSuffixes` | liste blanche des hôtes d'API de CE fournisseur |
| `mentionToken` | jeton `@` sans espace — la grammaire de Wakies est `@([a-zA-Z0-9_.-]{3,30})` |
| `monochrome` | nature du logo : repère noir unique, ou marque multicolore |

---

## 3. Le flux, et pourquoi telle forme

```
POST /api/integration/<provider>/token       session exigée → valide et chiffre le jeton
POST /api/integration/<provider>/disconnect  session exigée → marque la ligne révoquée
GET  /api/integration                        liste sûre (aucun jeton)
GET  /api/integration/<provider>/status      état d'un connecteur
GET  /api/wakies/integrations                même projection pour le menu `@` de Wakies
```

- **Le jeton est validé avant chiffrement.** `/api/integration/[provider]/token`
  appelle `resolveAccount()` (`lib/integrations/account.ts`) contre l'endpoint
  de vérification du fournisseur ; aucun secret invalide n'est persisté.
- **L'état OAuth scellé (`lib/plugins/core/oauth-state.ts`)** reste utilisé
  uniquement par les plugins OAuth personnels créés par les utilisateurs via
  `/api/user-plugins/[id]/connect` et `/api/user-plugins/[id]/callback`.

---

## 4. Jetons au repos

`IntegrationConnection` (migration `0051`) porte une ligne par
`(userId, provider, providerAccountId)`.

- **Chiffrés** : `accessToken` (qui peut transporter les champs validés via `packCredential`).
- **En clair, volontairement** : `provider`, `providerAccountId`,
  `accountEmail`/`accountLabel`, `scopes`, `expiresAt`.
- **Déconnecter n'efface pas** : la ligne survit avec `revokedAt` et un porteur
  vidé. Un `DELETE` ferait revenir un ancien compte au gré d'un cache.
- **Multi-compte** : le schéma est prêt (`providerAccountId`, `isPrimary`), l'UX
  en v1 reste mono-primaire. Exposer N comptes ajouterait un paramètre
  `accountId` à chaque outil, un sélecteur au menu `@` et une explosion des
  candidats dans la sélection automatique de l'Agent.
- **Le jeton s'obtient à l'exécution**, jamais à la création des outils : un run
  d'Agent ne transporte pas le secret en clair dans sa définition d'outils.
- **Deux issues, un seul canal.** `secretResolver` renvoie `undefined` ⇒ aucun
  compte connecté ⇒ l'outil rend un conseil, échec **permanent**, l'Agent ne
  rejoue pas. Une levée ⇒ coffre ou réseau indisponible ⇒ échec **transitoire**
  capturé en `ToolFailure`. Le mot `refresh_token` dans une demande d'outil est
  refusé : un outil qui le détiendrait pourrait s'affranchir du consentement.

---

## 5. Où chaque outil est disponible

Le manifeste d'un plugin déclare ses permissions **pour tous ses outils**, alors
qu'un connecteur mixte lit et écrit. La distinction se fait donc par outil, avec
`effect: "read" | "write"` (`lib/plugins/core/tool-effect.ts`, règle écrite une seule
fois).

| Canal | Lecture | Écriture |
| --- | --- | --- |
| Chat | oui | non |
| Wakies | oui (mention `@` acceptée) | non |
| Planification | oui | non |
| **Agent** | oui | **oui, après approbation** |

`createPluginTools` **filtre** (il ne lève plus) ; un plugin qui lit un compte
sans `userId` dans le contexte est écarté et le dit dans les journaux.
L'approbation n'a pas été réécrite : un outil en `effect: "write"` reçoit
`impact: "external_mutation"`, que `resolveToolPermission` (`lib/agent/tools/permissions.ts`)
colle à `"ask"` quelle que soit l'autonomie, y compris `high` ; seule une
désactivation explicite l'éteint. L'`ApprovalRequest` est persistée, la timeline
affiche « Validation requise », et `components/ai-elements/tool.tsx` rend déjà
`approval-requested` / `output-denied`.

**Conséquence à connaître** : les outils d'un plugin ne figurent pas dans
`AGENT_TOOL_CATALOG`, donc ne peuvent pas être coupés un par un dans
Paramètres → Agent. Le commutateur de désinstallation du plugin est le kill
switch.

---

## 6. Mentions `@` et logos

- Chat et Agent : le plugin s'instanciant depuis `/api/plugins`, `@GitHub`,
  `@GoogleMaps` et `@YouTube` fonctionnent comme pour tout plugin. Le composer
  ne pousse que les ids de **lecture** (`readToolIds`), pour ne rien demander
  que le serveur n'instancie pas.
- Wakies : `parseMentions` n'accepte pas les espaces, d'où `mentionToken`
  (`@GitHub`, `@GoogleMaps`, `@YouTube`) affiché à côté du nom complet.
  `applyIntegrationMentions` (`lib/wakies/capabilities.ts`) applique la
  **même** revalidation que la configuration du Wakie et exige une connexion
  réelle.
- Logo : `PluginToolLogo` (message principal), la timeline d'Agent et
  `ToolResultCard` (Wakies) resolve le connecteur depuis l'identifiant d'outil.
  Le nom affiché vient du manifeste du plugin.
- Rendu : le catalogue (`PluginIcon`) et les marques monochromes passent par un
  **masque CSS + `currentColor`** (`.integration-logo`, `app/globals.css`), donc
  elles suivent le thème sans variante `dark:` — et restent utilisables telles
  quelles dans Wakies, qui n'a qu'un seul thème. Discord, seule marque encore
  déclarée en couleurs, reste un `<img>` nu.

---

## 7. Ajouter un connecteur

1. `lib/integrations/providers.ts` et `lib/integrations/token-catalog.ts` :
   ajouter le descripteur à jeton (`authMode: "token"`, `validationUrl`,
   hôtes, `mentionToken`, `monochrome`, `accessSummary`).
2. `lib/db/schema.ts` / `lib/integrations/repository.ts` : `provider` est un
   `varchar` — aucun DDL n'est nécessaire pour un nouveau fournisseur. L'échange
   de la route `/token` valide le jeton via `resolveAccount()` avant de le
   chiffrer.
3. `lib/plugins/packs/<catégorie>/<id>/{index.ts,index.json}` : les outils,
   avec `effect` sur chacun, puis enregistrer l'entrée dans `lib/plugins/index.json`
   et lancer `pnpm plugins:gen && pnpm plugins:check`.
4. `public/plugins/<id>.svg` : le logo, et le test d'inventaire doit rester vert.

Ni le moteur, ni les mentions, ni le rendu, ni l'onglet Plugins n'ont à être
modifiés : ils lisent le registre.

---

## 8. Configurer les consoles

### Google Maps et YouTube Data — clés collées par le compte

Ce ne sont pas des consentements OAuth. L'utilisateur crée une clé dans
Google Cloud, active Geocoding, Places, Directions ou YouTube Data API v3,
et la colle dans la fiche du plugin. La clé est chiffrée comme les autres
jetons. Maps n'appelle que `maps.googleapis.com`. YouTube n'appelle que
`/youtube/v3/` sur `www.googleapis.com`. Aucune variable `GOOGLE_*` n'est lue.
Les connexions Drive, Agenda et Gmail déjà enregistrées ne sont plus
proposées : les lignes restent en base, les outils ont disparu.

### GitHub — jeton personnel (PAT)

L'utilisateur crée un **Personal Access Token** sur
`github.com/settings/tokens` (classique avec `repo` / `read:user` ou fine-grained)
et le colle dans la fiche du plugin. Le jeton est validé contre `GET /user` avant
d'être chiffré ; aucune variable `GITHUB_CLIENT_ID` ou `GITHUB_CLIENT_SECRET`
n'est nécessaire. Les écritures (ouvrir une issue, commenter, créer une pull
request) ne sont exposées que dans l'Agent après approbation.

### Discord — jeton de bot collé par l'utilisateur

Le plugin ne passe plus par l'OAuth d'instance. L'utilisateur crée une
application sur le portail développeur, invite **son** bot dans les serveurs
voulus (« Voir les salons », « Lire l'historique ») et colle le jeton du bot
dans la fiche. Discord refuse `Bearer` pour un bot : les appels portent
`Authorization: Bot`. Un jeton utilisateur ne lit pas les messages d'un
serveur. Aucune variable `DISCORD_*` n'est lue.

### Notion — jeton d'intégration interne

L'utilisateur crée une intégration interne sur `notion.so/profile/integrations`
et colle son jeton secret. Les pages se partagent depuis Notion, une par une,
avec cette intégration : une page non partagée répond 404, et le message de
l'outil le dit. Tous les appels portent `Notion-Version` (constante
`NOTION_API_VERSION`). Aucune variable `NOTION_CLIENT_*` n'est lue.

### Vercel — jeton personnel, pas OAuth

L'OAuth public de Vercel ne délivre aujourd'hui que l'identité du compte : les
permissions d'accès aux projets et déploiements sont en bêta privée. Le plugin
se connecte donc par **jeton personnel** (`https://vercel.com/account/tokens`),
collé dans la fiche du plugin puis validé par `GET /v2/user` avant d'être
chiffré. Aucune variable d'environnement n'est requise. Le plugin est en
**lecture seule** : projets, déploiements, journaux. Un jeton personnel porte
souvent les droits du compte entier, et un redéploiement déclenché par erreur
ne se rattrape pas.

Les connecteurs Brave Search, Mapbox, Google Maps, YouTube, ExchangeRate-API, SonarCloud, npm,
Docker Hub, Brevo, Twilio, Asana, Jira, Upstash, Neon, Supabase, Zapier et
Make suivent le même coffre. Cinq d'entre eux demandent un renseignement en
plus du secret, validé avant chiffrement : Docker Hub (identifiant), Twilio
(Account SID), Jira (e-mail et site `*.atlassian.net`), Upstash (URL REST) et
Make (zone `eu1`, `eu2`, `us1` ou `us2`). Les écritures — e-mail, SMS, ticket,
clé Redis, branche, dépôt privé, commentaire, exécution d'un scénario — ne
sont proposées que dans l'Agent, après approbation. Brave, Mapbox,
ExchangeRate-API, npm, Supabase (API de gestion) et Zapier restent en lecture :
leur surface d'écriture publie, facture, ou n'existe pas sous forme de jeton
stable. Zapier n'a pas de jeton permanent : le jeton d'accès collé expire au
bout d'environ dix heures.

Aucune de ces clés ne se lit dans l'environnement. Le logo de chacun est
`public/plugins/<id>.svg`.

### Variables

```
MCP_ENCRYPTION_KEY                       OBLIGATOIRE — coffre des jetons ET état OAuth des plugins personnels
MAI_OAUTH_REDIRECT_BASE_URL              optionnel, derrière un proxy qui masque l'hôte (plugins personnels)
```

Aucun connecteur intégré ne requiert de couple `*_CLIENT_ID` / `*_CLIENT_SECRET`
dans l'environnement : tous les jetons sont saisis par l'utilisateur et stockés
chiffrés dans le coffre.

**`MCP_ENCRYPTION_KEY` est la variable la plus facile à oublier, et son absence
ne se voit qu'au moment de cliquer sur « Connecter ».** Elle n'est pas
négociable : sans elle, ni les jetons eux-mêmes ni l'« état » OAuth des plugins
personnels ne peuvent être chiffrés, et la connexion est refusée avec la raison
`vault_unconfigured`. Il n'existe **aucun repli** — une clé dérivée de
`DATABASE_URL` serait devinable par quiconque connaît l'URL de la base.

Deux conséquences à connaître avant un déploiement :

- **Poser la variable dans le MÊME environnement Vercel que l'application
  Next.** L'échec ne se produit qu'à la connexion, pas au démarrage.
- **Changer la clé rend les jetons existants illisibles.** Les lignes
  `IntegrationConnection` survivent (l'interface affiche encore « Connecté »),
  mais le porteur est muet : l'utilisateur doit reconnecter. Prévoyez-le dans
  la note de livraison.

L'interface expose cet état : `GET /api/integration` renvoie
`vaultConfigured` par connecteur, et la fiche du plugin affiche un encart
« Coffre de secrets non configuré sur cette instance » avec le bouton
« Connecter » désactivé — plutôt qu'un échec opaque au clic.

Ces identifiants authentifient un **connecteur externe**. Ils ne sont pas, et ne
doivent jamais devenir, une authentification mAI : la session du produit reste
l'OTP email et le cookie `mai_session_token`.

---

## 9. Risques connus

- **Rotation Google** : voir §4. Si l'écriture du nouveau `refresh_token` échoue,
  la connexion est irrécupérable et l'utilisateur doit reconnecter — le message
  d'erreur doit donc rester « reconnecter », jamais un jargon interne.
- **Identité** : `requireUser()` rend `user.id || user.email`. Si le backend
  rend un `id` là où il n'en rendait pas, le même humain devient deux `userId`,
  et ses secrets MCP, ses installations de plugins et ses connexions se scindent
  en silence. Le callback journalise `guard=connection provider=… account=…` :
  ne jamais fusionner deux lignes automatiquement.
- **Quotas** : Gmail plafonne agressivement par utilisateur et Drive répond 429
  sur les recherches larges. Pagination bornée, `Retry-After` honoré, et le
  vocabulaire des messages reste celui que `legacyPluginFailure` classe
  transitoire.
- **Marge de contexte** : les corps de mail et de document sont tronqués
  (`maxCharacters`), parce qu'une conversation entière avalerait la fenêtre.
