# Audit des API et des runtimes

L’inventaire [API_INVENTORY.json](API_INVENTORY.json) est produit par `node scripts/audit-backend.mjs`. Il suit les imports transitifs de `main.ts`, y compris les imports à effets de bord, puis relève les méthodes, chemins, fichiers et lignes des déclarations Hono. Il inventorie aussi les routes Next et leurs imports. Ce résultat provient du code local, sans appel au service de production.

## Frontières d’exécution

| Surface | Entrée et stockage | Validation |
| --- | --- | --- |
| Backend public Hono | `main.ts`, imports `npm:`/`esm.town`, Neon et SQLite | Déploiement Val Town séparé ; hors du typecheck Next |
| Application Next | `app/`, React, Drizzle/PostgreSQL | `pnpm typecheck`, tests et build |
| Routes BFF Next | Modules sous `app/**/api` qui appellent `MAI_API_URL` | Session mAI, adaptation des erreurs amont |
| Domaine Wakies | `/api/wakies/**`, `lib/wakies`, tables privées PostgreSQL | Session mAI, propriété des ressources, origine des mutations et quotas |
| Outils CLI et autres apps | Points d’entrée dédiés sous `scripts/` et `apps/` | Commandes propres à chaque runtime, pas nécessairement couvertes par Next |
| Ticks planifiés de l’hôte | `cron.ts`, val CRON Val Town, variables `APP_URL` et `CRON_SECRET` | Quatre routes `app/api/cron/**` appelées en parallèle ; cadence 5 min, plan Pro requis |

Un fichier absent du build Next n’est pas nécessairement inutilisé. Les miroirs CLI du backend sous `scripts/` restent conservés : leurs imports et points d’entrée ne relèvent pas du graphe `main.ts` seul. Il en va de même des vals à déclencheur propre, absents de l’inventaire parce qu’ils ne sont importés par personne : `cron.ts` appelle les quatre routes `app/api/cron/**` de l’application Next (tick de 5 min) et `updateModels.ts` synchronise le catalogue de modèles (12 h).

## Démarrage et routes Hono

`main.ts` importe d’abord `models-cron.ts`, puis prépare SQLite sans bloquer le démarrage. Il pose CORS, une réponse preflight et les en-têtes de sécurité, puis les chemins racines informatifs. Le middleware d’identité et de quota précède les registres de routes.

| Domaine | Registre principal | Contrat et dépendances |
| --- | --- | --- |
| Identité | `auth.ts` | Inscription, vérification, session et clés ; PostgreSQL, signature JWT et mails |
| Modèles et chat | `models.ts` | Catalogue, compatibilité OpenAI, streaming, fournisseurs et comptage des tokens |
| Images et audio | `images.ts`, `audio.ts` | Entrées et modèles validés, quotas de génération et parole |
| Recherche | `web.ts` | Recherche web et accès fournisseur côté serveur |
| Stockage et projets | `storage.ts`, `projects.ts` | Propriété, fichiers, projets et quotas |
| Appareils et temps réel | `devices.ts`, `realtime.ts` | Identité, sessions d’appareil et fournisseurs audio |
| Traduction | `translate.ts`, `mai-translate.ts` | Traduction et fournisseurs de modèles |
| Vibe et IA sociale | `vibe.ts`, `vibe-ai.ts` et leurs modules | Publications, livres, messages, groupes, cercle, outils, flotte et réglages |

Le script comprend les appels directs `app.<méthode>` et les listes de chemins de `registerMulti`. Un chemin calculé reste signalé comme tel : l’inventaire ne lui invente pas une URL concrète. Les alias HTTP sont des déclarations distinctes, pas des fonctionnalités supplémentaires.

## Identité, erreurs et quotas

Le backend extrait les credentials depuis les en-têtes et les paramètres qu’il prend en charge. Il distingue les clés API enregistrées et les JWT de session. Une session ne consomme pas le quota hebdomadaire des clés API. Les handlers appliquent leurs quotas propres, notamment tokens, images, parole et stockage.

Le BFF ne doit pas prendre un cookie présent pour une identité validée. `getMaiUser` vérifie localement la signature lorsque possible, puis laisse l’API émettrice trancher lorsqu’une validation locale ne suffit pas. Un secret divergent ne doit pas créer de session fantôme ou empêcher la reconnexion.

Les erreurs Hono et celles du BFF ont des formes différentes. Les proxys Next normalisent l’amont via `lib/api/error-response.ts`. Les routes locales Wakies utilisent `lib/wakies/http.ts` et ne doivent pas exposer les erreurs SQL ni des secrets.

## Évolution Wakies

Les amitiés restent des abonnements à des agents publics. Un clone appartient au compte destinataire et utilise ses quotas. La messagerie enrichie ajoute deux préférences persistées et un journal d’événements de réponses terminées ; les routes et scénarios sont détaillés dans [MESSAGING.md](../3-wakies/MESSAGING.md).

Les runtimes autonomes OpenMuse retirés ne sont plus une procédure de production. Leur provenance et les retraits sont conservés dans [CLEANUP_INVENTORY.json](../CLEANUP_INVENTORY.json), avec le rapport [CLEANUP.md](../CLEANUP.md).

## Limites de validation

Cet audit établit les dépendances et déclarations du code. Il ne certifie pas les réponses des fournisseurs, les données d’une base distante ou le déploiement Val Town. Les contrôles Next ne valident pas le runtime Deno. Les migrations du chantier ne sont pas appliquées à la production automatiquement.
