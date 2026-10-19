# Connexions OAuth aux applications externes (intégrations)

Un **connecteur** relie le compte mAI d'un utilisateur à un service externe
(Google, GitHub) par OAuth 2.0, et expose ses fonctions comme outils de l'IA.
À la différence des plugins d'[API publiques](PLUGINS.md), un connecteur lit et
modifie **les données du compte de l'utilisateur**, avec son jeton, après son
consentement.

Deux connecteurs existent : **Google** (Drive + Agenda + Gmail, une seule
connexion) et **GitHub**. Le registre est conçu pour s'étendre : ajouter Notion,
Slack, Discord, Google Docs ou Sheets ne demande ni de toucher au moteur, ni de
retoucher les mentions `@`, ni de retoucher le rendu.

---

## 1. Deux couches, un seul canal de secrets

| Couche | Dossier | Rôle |
| --- | --- | --- |
| Connecteur | `lib/integrations/` | OAuth : URL d'autorisation, scellement de l'état, échange, rafraîchissement, identité, révocation, stockage des jetons |
| Plugin | `lib/plugins/<id>/` | Les outils eux-mêmes (schémas, appels d'API, sortie bornée) |

Le connecteur ne déclare aucun outil ; le plugin ne sait rien de l'OAuth. Ils se
rejoignent sur un point unique, déjà prévu par `PluginToolDeps` :
`secretResolver` (`lib/plugins/types.ts`).

```
lib/integrations/providers.ts   client-sûr : descripteur, portées, logo, jeton de mention
lib/integrations/oauth.ts       server-only : authorize, state, exchange, refresh, revoke
lib/integrations/tokens.ts      server-only : jeton frais, vol en groupe, adaptateur secretResolver
lib/integrations/repository.ts  server-only : CRUD IntegrationConnection, format au repos
lib/integrations/status.ts      server-only : projection sans jeton pour l'interface
lib/integrations/redirect.ts    server-only : URLs de retour du callback
lib/integrations/logo.tsx       client : rendu du logo d'un outil
lib/plugins/shared/authorized-api.ts  serveur : appel authentifié borné (GET et POST)
```

**Pourquoi ce partage** : les plugins passent par un catalogue généré
(`pnpm plugins:gen`) et sont mentionnables par `@`, verrouillés par forfait,
installables et activables. Recréer ces mécanismes pour les connecteurs aurait
produit une seconde interface parallèle, divergente dès le premier correctif.

---

## 2. Une connexion = un accès = un client

Google **regroupe Drive, Agenda et Gmail sous un seul descripteur** : un seul
client OAuth, un seul écran de consentement, un seul bouton « Déconnecter ». Les
portées des trois familles sont demandées ensemble (`GOOGLE_SCOPES`,
`providers.ts`). Les écrire séparément aurait contraint l'utilisateur à trois
consentements et à trois vérifications Google.

Le champ `IntegrationDescriptor` porte ce qu'il faut pour un nouveau
fournisseur :

| Champ | Sens |
| --- | --- |
| `envPrefix` | `<PREFIX>_CLIENT_ID` / `<PREFIX>_CLIENT_SECRET`, lus seulement côté serveur |
| `scopes` / `writeScopes` | portées demandées d'un coup ; portées sans lesquelles aucune écriture n'exécute |
| `refresh` | `oauth_refresh` (Google : jeton d'une heure, `refresh_token` **tournant**) ou `static` (GitHub : jeton non expirant, mort par révocation) |
| `hosts` | liste blanche des hôtes d'API de CE fournisseur |
| `mentionToken` | jeton `@` sans espace — la grammaire de Wakies est `@([a-zA-Z0-9_.-]{3,30})` |
| `monochrome` | nature du logo : repère noir unique, ou marque multicolore |
| `pkce` | `false` ici : ni Google ni GitHub (OAuth App classique) ne le requièrent |

---

## 3. Le flux, et pourquoi telle forme

```
GET /api/integration/<provider>/connect     session exigée → 302 vers le fournisseur
GET /api/integration/<provider>/callback    authentifié par l'« état » scellé
POST /api/integration/<provider>/disconnect session exigée → révocation + ligne marquée
GET  /api/integration                        liste sûre (aucun jeton)
GET  /api/integration/<provider>/status      état d'un connecteur
GET  /api/wakies/integrations                même projection pour le menu `@` de Wakies
```

- **L'état porte l'identité.** `{n: nonce, p: provider, r: returnTo, u: userId,
  x: exp+5min}` est chiffré par le coffre AES-256-GCM (`lib/mcp/encryption.ts`).
  Un état forgé produit un `decrypt()` en `""` : tag GCM oblige, jamais une
  donnée partielle. Le compte n'est pas relu au retour, parce que l'utilisateur
  peut rester une heure sur l'écran de consentement — au-delà de l'`exp` de sa
  session.
- **`proxy.ts` laisse passer le seul callback.** Il est self-authentifié par son
  état, et un 401 JSON affiché en pleine navigation est inexploitable. `connect`,
  `disconnect` et `status` restent protégés.
- **Le callback ne rend rien, il redirige.** `?integration=connected&account=…`
  ou `?integration=error&reason=…`, vers `state.r` par défaut
  `/tools/plugins/<pluginId>`. Le toast est émis côté client puis l'URL est
  raturée : sinon un rafraîchissement rejouerait l'annonce.
- **Ne pas réécrire `export const dynamic = "force-dynamic"`.** Ces routes
  lisent `cookies()`, `params` et `request.url` : elles sont dynamiques par
  nature. Et sous `cacheComponents`, Next 16.0.0 a **supprimé** les options de
  segment `dynamic`, `dynamicParams`, `revalidate` et `fetchCache` — les écrire
  fait échouer le build (« Ecmascript file had an error » sur la ligne de
  l'export), comme `node_modules/next/dist/docs/.../route-segment-config/index.md`
  le consigne.
- **`returnTo` est validé** (`sanitizeReturnTo`) : seulement une route interne,
  ni `//hôte` ni `/\hôte`. C'est ce qui empêche le callback de devenir un
  ouvre-boîte de redirection ouverte.
- **Nonce en double-submit**, un cookie `httpOnly` par fournisseur. Risque assumé
  et écrit : le nonce n'est pas persisté côté serveur, donc un replay depuis le
  *même* navigateur reste possible dix minutes. Le strict single-use demanderait
  une table d'états ; le jeton qu'il protège est court et l'identité accordée
  est celle de l'appelant lui-même.
- **`redirect_uri` est dérivée de la requête** aux deux extrémités, en acceptant
  les terminaisons `connect` et `callback` : le fournisseur compare les deux
  chaînes octet à octet, et `basePath` (`/demo`) sort de `request.url`, pas d'une
  variable.

---

## 4. Jetons au repos, et rafraîchissement

`IntegrationConnection` (migration `0051`) porte une ligne par
`(userId, provider, providerAccountId)`.

- **Chiffrés** : `accessToken`, `refreshToken`.
- **En clair, volontairement** : `provider`, `providerAccountId`,
  `accountEmail`/`accountLabel`, `scopes`, `expiresAt`. La décision de
  rafraîchir se prend à chaque appel d'outil ; chiffrer ces colonnes ferait du
  coffre un chemin chaud et empêcherait d'afficher la carte « Connecté » et de
  dédupliquer sans tout déchiffrer.
- **Déconnecter n'efface pas** : la ligne survit avec `revokedAt` et un porteur
  vidé. Un `DELETE` ferait revenir un ancien compte au gré d'un cache.
- **Multi-compte** : le schéma est prêt (`providerAccountId`, `isPrimary`), l'UX
  en v1 reste mono-primaire. Exposer N comptes ajouterait un paramètre
  `accountId` à chaque outil, un sélecteur au menu `@` et une explosion des
  candidats dans la sélection automatique de l'Agent.
- **Google fait tourner le `refresh_token`.** D'où deux gardes : une seule
  requête de rafraîchissement par connexion (`tokens.ts`, vol en groupe) et une
  écriture conditionnée au jeton stocké (`persistRefreshedTokens`). Sans elles,
  deux appels concurrents écrivent deux paires différentes et l'une est perdue
  — la connexion meurt sans que rien ne le dise.
- **Le jeton s'obtient à l'exécution**, jamais à la création des outils : un run
  d'Agent de quarante minutes ne doit pas voyager avec un jeton d'une heure.
- **Deux issues, un seul canal.** `secretResolver` renvoie `undefined` ⇒ aucun
  compte connecté ⇒ l'outil rend un conseil, échec **permanent**, l'Agent ne
  rejoue pas. Une levée ⇒ coffre ou réseau indisponible ⇒ échec **transitoire**
  capturé en `ToolFailure`. Le mot `refresh_token` dans une demande d'outil est
  refusé : un outil qui le détiendrait pourrait s'affranchir du consentement.

---

## 5. Où chaque outil est disponible

Le manifeste d'un plugin déclare ses permissions **pour tous ses outils**, alors
qu'un connecteur mixte lit et écrit. La distinction se fait donc par outil, avec
`effect: "read" | "write"` (`lib/plugins/tool-effect.ts`, règle écrite une seule
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

- Chat et Agent : le plugin s'instanciant depuis `/api/plugins`, `@Google` et
  `@GitHub` fonctionnent comme pour tout plugin. Le composer ne pousse que les
  ids de **lecture** (`readToolIds`), pour ne rien demander que le serveur
  n'instancie pas.
- Wakies : `parseMentions` n'accepte pas les espaces, d'où `mentionToken`
  (`@Google`, `@GitHub`) affiché à côté du nom complet. `applyIntegrationMentions`
  (`lib/wakies/capabilities.ts`) applique la **même** revalidation que la
  configuration du Wakie et exige une connexion réelle.
- Logo : `PluginToolLogo` (message principal), la timeline d'Agent et
  `ToolResultCard` (Wakies) resolve le connecteur depuis l'identifiant d'outil.
  Le nom affiché vient du manifeste du plugin : `Google · Rechercher dans mes
  fichiers`, plus lisible que `searchDriveFiles`.
- Rendu : les marques multicolores sont des `<img>` **nus** ; le `dark:invert`
  utilisé pour `public/mcp/` est proscrit ici, il détruirait les couleurs. Les
  marques monochromes (GitHub, et demain Notion, Discord) passent par un
  **masque CSS + `currentColor`** (`.integration-logo`, `app/globals.css`), donc
  elles suivent le thème sans variante `dark:` — et restent utilisables telles
  quelles dans Wakies, qui n'a qu'un seul thème.

---

## 7. Ajouter un connecteur

1. `lib/integrations/providers.ts` : un `IntegrationDescriptor` (endpoints,
   portées, politique de rafraîchissement, hôtes, `mentionToken`, `monochrome`,
   `accessSummary`).
2. `lib/integrations/repository.ts` : ajouter l'identifiant à l'énumération
   `provider` de `lib/db/schema.ts`, **et** à la colonne `varchar` de la
   migration additive correspondante.
3. `lib/plugins/<id>/{index.ts,index.json}` : les outils, avec `effect` sur
   chacun, puis `pnpm plugins:gen && pnpm plugins:check`.
4. `public/plugins/<id>.svg` : le logo, et le test d'inventaire doit rester vert.
5. `.env.example` : `<PREFIX>_CLIENT_ID` / `<PREFIX>_CLIENT_SECRET` dans la
   section « Intégrations externes (OAuth) ».

Ni le moteur, ni les mentions, ni le rendu, ni l'onglet Plugins n'ont à être
modifiés : ils lisent le registre.

---

## 8. Configurer les consoles

### Google Cloud — un seul client pour Drive, Agenda et Gmail

Écran de consentement *External* + credentials **OAuth client ID → Web
application**. URI autorisées, une seule par environnement :
`https://<hôte>/api/integration/google/callback` (et son pendant
`http://localhost:3000/...` en développement).

Les portées retenues sont classées **sensitive** par Google
(`drive.readonly`, `calendar.readonly`, `calendar.events`, `gmail.readonly`,
`gmail.send`). **Sans vérification de l'écran de consentement** : page
d'avertissement « application non vérifiée », plafond de 100 utilisateurs
testeurs, expiration des jetons au bout de sept jours en mode test, et surtout
**aucun `refresh_token`** — la connexion meurt à la première heure. Cette
vérification est un prérequis de mise en production, pas une formalité
ultérieure. `gmail.modify` et `drive` (full) sont « restricted » : audit de
sécurité payant et revérification annuelle ; ils ne sont pas demandés.

Sans `prompt=consent` et `access_type=offline`, Google ne rend un
`refresh_token` que lors du tout premier consentement.

### GitHub — OAuth App classique, pas une GitHub App

Settings → Developer settings → **OAuth Apps**, callback
`https://<hôte>/api/integration/github/callback`. Une GitHub App exigerait un
PEM par installation et une signature JWT sans rien apporter de plus pour
« l'utilisateur connecte ses propres dépôts » ; elle ne devient intéressante que
pour agir sur une organisation sans accord humain. Portées demandées à
l'autorisation : `repo`, `public_repo`, `read:user`.

### Variables

```
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   un seul client pour les trois accès
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
MCP_ENCRYPTION_KEY                       coffre des jetons ET scellement de l'état
MAI_OAUTH_REDIRECT_BASE_URL              optionnel, derrière un proxy qui masque l'hôte
```

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
