# mAI Web — application et backend

Cette section documente l'application Next.js principale (`app/`, `components/`,
`lib/`, `hooks/`), le backend Hono déployé séparément sur Val Town, le moteur
d'Agent et les données PostgreSQL.

## Guides

| Sujet | Document |
| --- | --- |
| Règles impératives du domaine | [AGENTS.md](AGENTS.md) |
| Frontière Next / API, BFF, double runtime | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Exécution de l'Agent (boucle, outils, approbations) | [AGENT_ENGINE.md](AGENT_ENGINE.md) |
| Routes et modules du backend Hono | [BACKEND_API.md](BACKEND_API.md) |
| Audit du backend | [BACKEND_AUDIT.md](BACKEND_AUDIT.md) |
| Inventaire reproductible des modules et routes | [API_INVENTORY.json](API_INVENTORY.json) |
| API publique pour agents externes | [AI_AGENTS_API.md](AI_AGENTS_API.md) |
| Connecteurs OAuth (Google, GitHub), portées, jetons | [INTEGRATIONS.md](INTEGRATIONS.md) |
| Schéma, migrations, runner | [DATABASE.md](DATABASE.md) |
| En-têtes, CSP, secrets, garde-fous | [SECURITY.md](SECURITY.md) |
| Plugins et sources de recherche | [PLUGINS.md](PLUGINS.md) |
| Assertions tenues, testées | [VALIDATION_MATRIX.md](VALIDATION_MATRIX.md) |

## Les deux mondes à ne pas confondre

L'application Next est un **BFF** : ses routes `app/(chat)/api/**/route.ts`
appellent le backend via `MAI_API_URL` et normalisent les erreurs amont. Les
modules TypeScript de la racine (`main.ts`, `config.ts`, `vibe-*.ts`, `models.ts`…)
sont un **autre runtime**, déployé sur Val Town, hors du `tsconfig.json` : les
modifier ne déclenche ni typecheck ni build, et un build Next réussi ne valide
 rien sur Val Town.

`cron.ts`, à la racine, est le seul ordonnanceur des quatre ticks
`app/api/cron/**`. Ne pas introduire de second ordonnanceur.

## Démarrer

Installation, variables d'environnement et commandes sont dans le
[README racine](../../README.md). Le plus fréquent des échecs de déploiement
n'est pas du code : `MCP_ENCRYPTION_KEY` absente de l'environnement Vercel laisse
le coffre de secrets inutilisable.

Après toute évolution de routes ou d'imports du backend, régénérer l'inventaire :

```sh
node scripts/audit-backend.mjs
```
