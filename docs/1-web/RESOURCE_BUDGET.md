# Budget de ressources — Vercel Fluid Active CPU & Neon

> Diagnostic établi le 23 novembre 2026 sur la base du code, du build PPR
> présent dans `.next/` et des quotas publics des deux plateformes.
>
> **Aucune modification de code n'a été faite à ce stade.** Ce document est le
> plan d'options demandé : chaque action porte son gain estimé, son effort et
> son risque. Les gains sont **modélisés**, pas mesurés : la première étape
> (phase 0) consiste à relever la répartition réelle dans les deux consoles.

---

## 1. Deux quotas, deux causes différentes

Les deux limites ne se corrigent pas par les mêmes gestes.

| Quota | Ce qui est facturé | Ce qui le fait exploser |
|---|---|---|
| **Vercel Fluid Active CPU** | Le temps CPU où **votre code JavaScript s'exécute**, hors attente réseau/base | Rendu SSR, sérialisation JSON, streaming IA, parsing de fichiers, cold starts |
| **Neon CU-hours** | `taille du compute × heures où il est réveillé` | Le compute qui **ne s'endort jamais** : requêtes récurrentes à moins de 5 min d'intervalle |

Conséquence importante : une requête SQL lente coûte du **Neon**, pas du
Vercel. Une page React rendue coûte du **Vercel**, pas du Neon. Optimiser l'un
ne réduit pas l'autre. Il faut deux plans séparés.

---

## 2. Diagnostic Vercel Fluid Active CPU

### 2.1 Ce que dit le build

Build analysé : `BUILD_ID` du 23/11/2026, `cacheComponents` + PPR activés.

- **206 routes API**, **88 pages**, **137 routes prérendues**, 21 routes
  dynamiques.
- Toutes les routes principales sont en `renderingMode: "PARTIALLY_STATIC"`.
- La coquille prérendue est **quasi identique pour toutes les pages** :
  - `/` → 547 373 octets
  - `/site` → 547 898 octets
  - `/site/pricing` → 547 828 octets
  - `/settings` → 548 003 octets

Autrement dit : la coquille statique est la **coque de l'application**, pas le
contenu des pages. Le contenu est rendu à chaque requête dans le trou dynamique
du layout `(chat)`, parce que `SidebarShell` fait `await getMaiUser()` **avant**
de rendre `{children}` (`app/(chat)/layout.tsx`). PPR ne protège donc pas le
contenu des pages.

De plus, `experimentalBypassFor` inclut les user-agents des crawlers
(Googlebot, Bingbot, Lighthouse…). Ces requêtes **bypassent PPR** et forcent un
rendu dynamique complet : le marketing indexé coûte donc le prix fort.

### 2.2 Les postes de coût identifiés, par ordre décroissant

| Poste | Preuve dans le code | Pourquoi c'est cher |
|---|---|---|
| **Ticks CRON paresseux sur Vercel** | `after(() => maybeRunLazyCronTicks())` dans `GET /api/notifications` ; `maxDuration = 300` | Un tick Agent/Wakies peut consommer plusieurs minutes de CPU dans une seule invocation. Même rare, c'est le pire cas possible sur un quota de 4 h |
| **Rendu dynamique de toutes les pages `(chat)`** | `app/(chat)/layout.tsx` : `await getMaiUser()` gate `{children}` | Chaque visite de `/site`, `/changelog`, `/settings`, `/agents`… re-rend le contenu et la coquille côté serveur |
| **Layout `/site`** | `app/(chat)/site/layout.tsx` : `getMaiUser` + `getChangelogs()` + `getNewsArticles()` synchrones | Double porte dynamique + lecture/parse du système de fichiers **à chaque requête** |
| **Polling client** | Wakies `20 s` (`components/wakies/polling.ts`), notifications `180 s`, Vibe `60 s`, captures Wakies `30 s` | Chaque relève est une invocation de fonction + sérialisation JSON. Un onglet Wakies ouvert = 180 invocations/heure |
| **Streaming IA** | `app/(chat)/api/chat`, `agent`, `wakies/chat`, `quizzly/coach` | Encodage SSE token par token, parsing des outils, télémetrie AI SDK |
| **Parsing du catalogue de modèles** | `lib/ai/models.server.ts` | Le cache est indexé par **jeton** alors que la requête OpenRouter n'utilise pas ce jeton : chaque compte/instance re-parse ~1 Mo de JSON |
| **Génération de titre** | `lib/chat/stream.ts` appelle un second LLM après le premier message | Un appel IA supplémentaire par nouvelle conversation |
| **Exports et médias** | PDF/DOCX (`chats/[id]/export`), uploads, images | CPU pur (compression, mise en page, parsing) |
| **Télémétrie globale** | `instrumentation.ts` : `registerOTel` + `registerTelemetry(new OpenTelemetry())` | Chaque span et chaque événement AI SDK sérialise des attributs, y compris prompt/réponse |
| **Middleware** | `proxy.ts` : `getActiveMaintenance()` sur chaque requête | La requête DB ne coûte pas de CPU Vercel (attente), mais le JWT, les branches et `NextResponse` si |

### 2.3 Le plafond de 4 h est-il atteignable ?

4 h = **240 minutes CPU par mois**, soit environ **8 minutes par jour**. Pour
un utilisateur qui discute avec l'IA, une réponse de 1 500 tokens peut déjà
coûter 0,3 à 1,5 s de CPU serveur. Le quota Hobby est donc dimensionné pour un
**projet personnel à faible trafic**, pas pour une application multi-utilisateurs
avec Agent, Vibe et Wakies.

Trois trajectoires sont possibles :

1. **Trafic faible** (< 20 000 requêtes/mois, < 300 réponses IA) : les gains
   « rapides » suffisent probablement.
2. **Trafic moyen** : il faut rendre le contenu public statique et sortir les
   ticks du runtime Vercel.
3. **Trafic réel de production** : le plan Hobby n'est pas le bon outil. Le plan
   Pro inclut 20 $ de crédit, soit ~110–155 h de CPU actif selon la région, et
   autorise l'usage commercial (le Hobby est réservé au personnel/non commercial).

---

## 3. Diagnostic Neon — 81 CU-hours sur 100

### 3.1 Le calcul qui explique tout

Le plan Free accorde **100 CU-hours/projet/mois** et le compute suspend
automatiquement après **5 minutes sans requête** (`scale to zero`).

À la taille par défaut de **0,25 CU** :

```
100 CU-h / 0,25 CU = 400 heures de compute éveillé par mois
81 CU-h  / 0,25 CU = 324 heures éveillées
324 h / 720 h      = 45 % du mois
```

Votre base est donc **réveillée environ 10,8 h par jour en moyenne**. Ce n'est
pas le coût des requêtes qui pèse : c'est le fait qu'aucune fenêtre de 5 minutes
ne s'écoule sans activité.

Si le compute est monté à 0,5 ou 1 CU (autoscaling Free jusqu'à 2 CU), le même
temps éveillé coûte 2 à 4 fois plus. **C'est le premier point à vérifier dans la
console Neon** : taille min/max et autoscaling.

### 3.2 La carte des réveils

| Source | Cadence | Effet sur le scale-to-zero |
|---|---|---|
| **CRON GitHub `cron-master`** | toutes les 5 min, 24 h/24 | À lui seul, il empêche tout sommeil : 720 h éveillées = **180 CU-h** théoriques |
| **Cloche de notifications** | toutes les 3 min par onglet ouvert | Aucune fenêtre de 5 min : ~10 h/jour éveillées = **75 CU-h** |
| **Wakies** | 20 s (données), 30 s (captures) | Identique : un onglet ouvert garde la base éveillée en continu |
| **Vibe** | 60 s | Même effet pendant la navigation |
| **Middleware maintenance** | cache de **5 s** | Une requête Neon quasi permanente dès qu'il y a du trafic |
| **Résolution de session** | 3 requêtes séquentielles, cache 2 min par instance | Chaque instance froide refait 3 allers-retours (blacklist + users + weekly_usage) |
| **Ticks de notifications** | `claimCronTicks` + `seedTicks` par instance | Ajoute des requêtes même quand aucun tick n'est dû |

Les 81 CU-h observés correspondent presque exactement à **un onglet ouvert
pendant une journée de travail** avec la cloche à 3 min. Le CRON à 5 min est le
second coupable ; s'il est moins fiable que prévu (GitHub Actions peut retarder
les schedules des dépôts publics), c'est pour cela que le total n'est pas 180.

### 3.3 Requêtes coûteuses identifiées

- `resolveUserFromDb` (`lib/auth/session.ts`) : 3 requêtes **séquentielles**,
  dont un `SELECT` sur `users` avec cinq `OR` et des `LOWER(...)` — donc un
  **seq scan** dès que la table grandit.
- `getWeeklyAiTokenUsage` : `WHERE user_id::text = $1` empêche l'usage de
  l'index entier.
- `getNotificationsByUserId` : filtre `userId`, tri `createdAt` ; l'index
  composite `(userId, createdAt DESC)` manque (il n'y a que `userId` seul et
  `userId, isRead`).
- `getMessagesByChatId` : renvoie **tous** les messages, `parts` JSON compris.
  Une conversation longue = beaucoup d'I/O et de parsing.
- `recordTokenUsage` : 3 écritures séquentielles par réponse IA
  (`UsageEvent`, `weekly_usage`, `mprojects_api_logs`), dont la dernière est un
  journal historique.
- `getChangelogs` / `getNewsArticles` / `getModels` : lectures synchrones du
  disque à chaque rendu, sans cache module.

---

## 4. Plan Neon — options et gains estimés

Base de départ : **81 CU-h**. Les gains sont indiqués en CU-h/mois et ne sont
**pas additifs à l'infini** : plusieurs options suppriment le même temps
d'éveil. Les scénarios cumulés en bas de tableau tiennent compte des
recouvrements.

| # | Action | Fichiers / console | Gain estimé | Effort | Risque |
|---|---|---|---|---|---|
| **N1** | Fixer le compute à **0,25 CU** (min = max), désactiver l'autoscaling au-delà | Console Neon → Computes | **0 à −60 CU-h** selon la taille actuelle | 5 min | Requêtes lourdes plus lentes |
| **N2** | Cloche : 180 s → **600 s** ; pause après 5 min sans interaction ; relève au focus | `hooks/use-notifications.ts` | −15 à −25 CU-h | 0,5 j | Notifications jusqu'à 10 min de retard |
| **N3** | Wakies : 20 s → **120 s** visible / 300 s masqué ; arrêt après inactivité | `components/wakies/polling.ts`, `workspace-app.tsx`, `Chat.tsx`, `FriendsScreen.tsx` | −15 à −30 CU-h | 0,5 j | Fraîcheur perçue |
| **N4** | Vibe : 60 s → **300 s**, et pas de relève si l'onglet est inactif | `components/vibe/vibe-app.tsx`, pages Vibe | −5 à −10 CU-h | 0,5 j | Compteurs moins frais |
| **N5** | CRON master : 5 min → **30 min** (ou 15 min le jour, 1×/h la nuit) | `.github/workflows/cron-master.yml` | −25 à −50 CU-h (plafonné par N2–N4) | 0,5 j | Tâches Agent jusqu'à 30 min de retard |
| **N6** | Maintenance : TTL 5 s → **300 s** ; ne pas interroger si le drapeau `MAINTENANCE_ENABLED` est absent | `lib/maintenance/maintenance-service.ts` | −1 à −3 CU-h | 2 h | Maintenance visible avec 5 min de retard |
| **N7** | Session : une seule requête CTE au lieu de 3 ; cache 2 → **10 min** ; index d'expression `lower(email)` / `lower(username)` | `lib/auth/session.ts`, migration | −3 à −8 CU-h | 1 j | Révocation jusqu'à 10 min de retard |
| **N8** | Supprimer l'écriture `mprojects_api_logs` ; regrouper `UsageEvent` + `weekly_usage` en un aller-retour | `lib/db/queries/chats.ts` | −1 à −3 CU-h | 2 h | Perte d'un journal historique |
| **N9** | Index composite `Notification(userId, createdAt DESC)` ; rétention des notifications lues > 30 j | migration + tick | −2 à −5 CU-h | 0,5 j | Aucun |
| **N10** | Paginer les messages (50 par page) et ne sélectionner que les colonnes utiles | `lib/db/queries/chats.ts`, API chat | −1 à −4 CU-h | 0,5 j | Chargement progressif |

### Scénarios cumulés

| Scénario | Actions | Estimation | Commentaire |
|---|---|---|---|
| **Prudent** | N1 + N6 + N7 + N8 + N9 | **65–75 CU-h** | Corrections sans changer la fraîcheur perçue |
| **Recommandé** | Prudent + N2 + N3 + N4 | **40–55 CU-h** | Les relèves restent utilisables, mais laissent la base s'endormir |
| **Agressif** | Recommandé + N5 + N10 | **25–40 CU-h** | Suppose d'accepter 30 min de latence sur l'Agent |
| **Plafond** | Toutes + arrêt des relèves hors interaction | **15–25 CU-h** | Base éveillée seulement quand l'utilisateur agit |

> Le gain de N1 peut être le plus spectaculaire et le moins coûteux. **À faire
> avant tout le reste** : si le compute autoscale à 1 CU, le passer à 0,25 CU
> divise mécaniquement la facture par 4.

---

## 5. Plan Vercel — options et gains estimés

Je n'ai pas la répartition Vercel actuelle. Les gains ci-dessous sont exprimés
en **minutes CPU/mois** pour des volumes explicites, afin d'être comparables au
quota de 240 min. La phase 0 doit remplacer ces hypothèses par les chiffres de
la console.

Hypothèses de modélisation : 50 000 pages vues/mois, 30 000 appels API,
1 000 réponses IA, 2 000 démarrages à froid.

| # | Action | Fichiers | Gain estimé (min/mois) | Effort | Risque |
|---|---|---|---|---|---|
| **V1** | **Couper les ticks paresseux sur Vercel** (`CRON_LAZY_TICKS=off` en production) | variable d'environnement | 0 à −150 (le pire cas disparaît) | 5 min | Perte du filet si GitHub saute |
| **V2** | Désactiver OTel + télémétrie AI SDK par défaut (`OTEL_ENABLED=1` pour les activer) | `instrumentation.ts`, `lib/chat/stream.ts` | −15 à −60 (−5 à −20 % du total) | 1 h | Perte des traces |
| **V3** | **Sortir `{children}` de la porte `await getMaiUser()`** : sidebar dans son propre `<Suspense>`, contenu rendu indépendamment | `app/(chat)/layout.tsx` | −30 à −80 | 1–2 j | Régression de la coque auth |
| **V4** | Groupe de routes public pour `/site` et `/changelog`, sans session ni layout `(chat)` | arborescence `app/` | −20 à −70 | 2–3 j | SSO du Site à refaire côté client |
| **V5** | Mettre en cache les lectures disque du Site (`getNewsArticles`, `getChangelogs`, `getModels`) | `lib/site/*.ts` | −5 à −20 | 2 h | Contenu figé jusqu'au déploiement |
| **V6** | Catalogue de modèles : **un seul cache global**, sans jeton dans la clé | `lib/ai/models.server.ts` | −2 à −10 | 1 h | Aucun (le jeton n'est pas utilisé) |
| **V7** | Réduire le polling (mêmes réglages que N2–N4) | voir N2–N4 | −30 à −60 | 0,5 j | Fraîcheur |
| **V8** | Plafonner la sortie IA (tokens, étapes Agent) ; différer ou supprimer la génération de titre | `lib/chat/stream.ts`, `lib/agent/*` | −10 à −40 % du CPU IA | 1 j | Produit |
| **V9** | Déporter le streaming IA hors Vercel (Worker/VPS) | architecture | −50 à −90 % si l'IA domine | semaines | Gros chantier |
| **V10** | Passer au plan Pro | facturation | +110 à 155 h de crédit CPU | 0 | Usage commercial conforme |

### Scénarios cumulés

| Scénario | Actions | Résultat attendu |
|---|---|---|
| **Faible trafic** | V1 + V2 + V5 + V6 | Suffisant si le CPU actuel est < 6 h |
| **Trafic moyen** | + V3 + V7 | Réduction de 50–70 % du rendu de pages et du polling |
| **Trafic soutenu** | + V4 + V8 | Le rendu public devient statique, l'IA reste le poste dominant |
| **Plafond Hobby** | + V9 | L'IA ne consomme plus le quota Vercel |
| **Plan Pro** | V10 | 4 h ne sont plus un plafond de conception |

---

## 6. Séquence recommandée

### Phase 0 — Mesurer (aujourd'hui, 1 h)

1. **Vercel → Observability → Functions** : trier par *Active CPU* sur 7 jours ;
   noter les 10 routes les plus coûteuses et le nombre de démarrages à froid.
2. **Neon → Console → Computes** : relever la taille min/max, l'autoscaling et
   le temps actif réel.
3. Activer `pg_stat_statements` et relever le top 20 :

   ```sql
   SELECT query, calls, total_exec_time, mean_exec_time
   FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 20;
   ```

4. Vérifier que le scale-to-zero est bien à 5 min (il est fixe sur Free) et que
   le compute n'est pas resté à une taille supérieure à 0,25 CU.

### Phase 1 — Gains immédiats (0,5 j)

- N1 (taille du compute) ;
- V1 (`CRON_LAZY_TICKS=off`) ;
- V2 (télémétrie désactivée par défaut) ;
- N6 (TTL maintenance) ;
- V6 (cache global du catalogue).

Ces cinq gestes ne changent aucune fonctionnalité visible et attaquent les
pertes les plus certaines.

### Phase 2 — Polling et session (1–2 j)

- N2, N3, N4, V7 : un seul rythme de relève, jamais sous 2 min, avec pause
  après 5 min d'inactivité ;
- N7 : session en une requête + cache 10 min + index d'expression ;
- N8 et N9 : écritures et index.

Objectif : **Neon sous 50 CU-h**, sans dégrader la fraîcheur au-delà de 2 min.

### Phase 3 — Structurel (2–4 j)

- V3 : le contenu des pages ne doit plus dépendre de l'await de session ;
- V5 : cache des lectures disque du Site ;
- N10 : pagination des messages ;
- V4 si le trafic marketing/crawler est significatif.

Objectif : **Vercel sous 4 h** si le trafic reste modéré ; **Neon sous 40 CU-h**.

### Phase 4 — Si le plafond ne suffit pas

- V8 : plafonds IA ;
- V9 : déport du streaming ;
- ou V10 : plan Pro.

---

## 7. Protocole de vérification

Après chaque phase, relever sur **7 jours consécutifs** :

| Indicateur | Où | Cible |
|---|---|---|
| Active CPU total | Vercel Observability | < 240 min/mois, extrapolé |
| Top routes CPU | Vercel Observability | Aucune route > 20 % du total |
| CU-hours Neon | Console Neon | < 50, puis < 40 |
| Temps éveillé Neon | Console Neon | < 200 h/mois |
| Requêtes lentes | `pg_stat_statements` | Aucune requête > 5 % du temps total |
| Cold starts | Vercel Observability | En baisse après V3/V5 |

Ne pas conclure sur une journée : les crawlers et les schedules GitHub créent
des pics qui faussent une mesure courte.

---

## 8. Garde-fous — ce qu'il ne faut pas réintroduire

- **Ne pas désactiver le scale-to-zero** de Neon pour « éviter les cold starts » :
  c'est exactement ce qui transforme 40 CU-h en 180 CU-h.
- **Ne pas ajouter de ping de keep-alive** (ni cron, ni `setInterval` serveur).
- **Ne pas remettre les ticks CRON sur Vercel** : le runner GitHub direct est la
  bonne architecture pour le CPU Fluid.
- **Ne pas remettre le polling Wakies à 5–20 s** : c'est le premier poste
  d'invocations et il empêche le sommeil Neon.
- **Ne pas faire dépendre les pages publiques d'un cookie** : une page marketing
  qui lit la session est une page dynamique, même si elle est « statique » dans
  le manifeste PPR.
- **Ne pas activer la télémétrie IA en production sans budget** : elle
  sérialise les prompts et les réponses pour chaque appel.
- **Ne pas ajouter une colonne ou un index sans migration** : le runtime ne
  répare plus le schéma (`DB_RUNTIME_DDL_REPAIR` désactivé par défaut).

---

## 9. Résumé exécutif

| Levier | Effort | Gain | Quand |
|---|---|---|---|
| Compute Neon à 0,25 CU | 5 min | Jusqu'à −60 CU-h | Maintenant |
| Ticks paresseux Vercel coupés | 5 min | Jusqu'à −150 min CPU | Maintenant |
| Télémétrie désactivée | 1 h | −5 à −20 % CPU | Maintenant |
| Polling > 5 min + pause d'inactivité | 1 j | −30 à −45 CU-h, −30 à −60 min | Cette semaine |
| Session en 1 requête + cache 10 min | 1 j | −3 à −8 CU-h | Cette semaine |
| Layout sans porte de session | 1–2 j | −30 à −80 min | Ce mois |
| Site public statique + cache disque | 2–3 j | −25 à −90 min | Ce mois |
| Déport IA ou plan Pro | semaines / 20 $ | Le seul passage à l'échelle | Si nécessaire |

**Trajectoire réaliste sans changement produit** : Neon **81 → 40–50 CU-h**
(−40 à −50 %), Vercel **−50 à −70 %** du CPU hors IA. Pour garantir moins de
4 h/mois avec un usage IA réel, il faudra soit déporter le streaming, soit
passer au plan Pro.
