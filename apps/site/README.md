# Site officiel mAI — application source

Ce dossier contient la version autonome du Site officiel mAI, une application Next.js qui présente les modèles, les produits, la documentation et les points d’entrée développeur de l’écosystème.

Le site est également intégré à l’application hôte sous /site. Dans le dépôt hôte, le port se trouve dans components/site/, lib/site/ et app/(chat)/site/. Les deux formes partagent le contenu, mais leurs builds et certaines dépendances ne sont pas les mêmes.

## Développement autonome

Depuis apps/site :

~~~sh
npm install
npm run dev
~~~

Consultez les scripts du package pour lancer le build, les contrôles, les tests ou les outils d’administration. Les variables d’environnement de cette application doivent être configurées dans son environnement local ; ne copiez pas les fichiers .env personnels dans Git.

## Repères de développement

- Les données des modèles sont décrites dans lib/mai-models.ts et lib/models-data.ts.
- Les pages éditoriales et les fiches de modèles sont sous docs/.
- Les routes API propres au site sont sous app/api/.
- L’application intégrée à l’hôte est documentée dans [docs/5-site/INTEGRATION.md](../../docs/5-site/INTEGRATION.md).
- Les règles de routage, de styles et de SSO du port se trouvent dans [docs/5-site/AGENTS.md](../../docs/5-site/AGENTS.md).

Le Site source n’est pas compilé par pnpm build à la racine. Pour modifier le port /site, suivez les guides du dépôt hôte et les sources génératrices prévues.

---

# Avertissement pour les agents et les relectures : référence morte

Cet arbre n’est **pas** l’application qui tourne. Il est conservé comme référence
historique et comme source de deux choses précises (voir plus bas). Rien de ce qui
s’y trouve n’est vérifié par les contrôles du dépôt :

| Contrôle | `apps/site` |
|---|---|
| `pnpm typecheck` | non — `tsconfig.json` racine déclare `exclude: ["apps"]` |
| `pnpm build` | non — `package.json` ne construit jamais `apps/site` |
| CI (`.github/workflows/ci.yml`) | non |

Un défaut qui s’y glisse ne lève donc **aucun** signal. C’est arrivé, et c’est ce
qui rend cet avertissement nécessaire plutôt que décoratif.

## Deux divergences connues, corrigées seulement dans l’hôte

1. **`lib/session-auth.ts:50-68`** — `authenticateSession` et `getSessionIdentity`
   appellent `verifyMaiSessionToken` **directement**, sans repli. Si
   `MAI_JWT_SECRET` est absent ou différent du secret de l’émetteur, la
   vérification locale rend `null` et la session est tenue pour définitivement
   invalide : un 401 pour un utilisateur bel et bien connecté.
   L’hôte a corrigé cela avec `resolveSessionIdentity`
   (`lib/site/session-auth.ts`), qui délègue à l’autorité canonique `getMaiUser`
   quand la vérification locale est **impossible** — sans jamais tenir un jeton non
   vérifié pour valide. Verrouillé par `tests/unit/site-session-auth.test.ts`.

2. **`lib/api-key-manager.ts:46,196,255,486,704`** — `ensureKeyNameColumn` exécute
   un `ALTER TABLE mprojects_api_keys ADD COLUMN …` **au milieu des requêtes
   utilisateur**, dans un `try/catch` muet. Sur une base dont le rôle SQL n’a pas
   le privilège DDL, l’`ALTER` échoue en silence, la colonne `key_name` n’arrive
   jamais, et les `SELECT k.key_name` rendent les clés existantes invisibles.
   L’hôte a supprimé ce DDL au profit de la migration versionnée
   `lib/db/migrations/0040_mprojects_api_keys_key_name.sql`, et
   `tests/unit/api-key-migration-safety.test.ts` échoue si un `ALTER TABLE` revient
   dans `lib/site/api-key-manager.ts`. C’est la règle AGENTS.md §6.2 : pas de DDL
   au runtime.

Une revue automatique portant sur le dépôt entier a signalé ces deux points comme
des défauts **ouverts** : elle avait raison sur le pattern et tort sur l’endroit —
les lignes incriminées étaient ici, pas dans le module vivant.

## Les chemins d’API d’ici ne sont pas ceux de l’hôte

`apps/site` monte ses routes à `/api/**` (`/api/dev-keys`, `/api/v1/models`,
`/api/support/upload`…). Dans l’hôte, les mêmes routes vivent sous
**`/api/site/**`**. Écrire en dur `/api/dev-keys` dans un composant porté produit
un 404.

**Règle** : aucun composant de `app/(chat)/site/**` ou `components/site/**` ne
reçoit un chemin copié d’ici. Un appel d’API passe par le registre
`lib/site/api-routes.ts` (`SITE_API_ROUTES`), et une navigation par
`components/site/router.tsx` (`useSiteRouter`, `toSitePath`, `Link`).

## Ce qui est malgré tout vivant dans cet arbre

- `apps/site/app/globals.css` est la **source** de `scripts/build-site-css.mjs`,
  qui produit `components/site/site.css` — feuille interdite à l’édition manuelle
  (`docs/5-site/AGENTS.md` règle 1).
- Les documentation et données lues au runtime par `lib/site/changelog.ts`,
  `lib/site/docs.ts` et `lib/site/news.ts` viennent aussi d’ici.

**Conséquence** : supprimer `apps/site` n’est pas un simple `git rm`. Il faut
d’abord re-sourcer le générateur CSS et ces lectures, sinon
`components/site/site.css` devient non régénérable.
