# Architecture & Guide d'Intégration — Site Officiel (`5-site`)

Ce document décrit en détail l'intégration technique de l'application vitrine `apps/site` dans l'application unifiée mAI Web.

---

## 1. Vue d'Ensemble & Objectifs

L'application `apps/site` était initialement une application Next.js autonome.
Elle a été portée au sein de la racine mAI Web selon les principes établis pour **Vibe** (`docs/2-vibe/`) et **Wakies** (`docs/3-wakies/`):
1. **Zéro régression sur l'hôte**: L'accès à la racine `/` reste strictly dédié au chat principal mAI.
2. **Accessibilité fluide**: Une entrée dédiée « Site officiel» figure dans la barre latérale [`AppSidebar`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/components/chat/app-sidebar.tsx).
3. **Isolation visuelle**: Styles scopés sous `.site-root` via PostCSS dans [`components/site/site.css`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/components/site/site.css).
4. **Build unifié**: Compilation CSS automatisée dans `pnpm build` et intégration dans la CI GitHub Actions.
5. **SSO transparent**: Session synchronisée via le jeton JWT `MAI_SESSION_COOKIE`.
6. **Recherche native préservée**: Recherche interactive `CommandMenu` (Cmd+K).

---

## 2. Structure des Fichiers Intégrés

```
app/(chat)/
├── site/ # Pages et layouts de l'espace Site
│ ├── layout.tsx # Layout englobant avec.site-root, Header, Footer, AuthProvider
│ ├── page.tsx # Page d'accueil du site officiel (/site)
│ ├── account/ # Profil et gestion de compte (/site/account)
│ ├── api/ # Console développeur et clés API (/site/api)
│ ├── changelog/ # Historique des versions (/site/changelog)
│ ├── docs/ # Centre de documentation (/site/docs et sous-pages)
│ ├── downloads/ # Téléchargements clients Desktop / Mobile (/site/downloads)
│ ├── legal/ # Mentions légales et CGU (/site/legal)
│ ├── models/ # Vitrine des modèles mAI (/site/models)
│ ├── news/ # Actualités et blog (/site/news)
│ ├── pricing/ # Tarification et forfaits (/site/pricing)
│ ├── projects/ # Showcase des projets mAI (/site/projects)
│ └── support/ # Assistance et contact (/site/support)
└── api/site/ # 26 routes API dédiées (clés, modèles, newsletter...)
components/site/ # Composants UI, Navigation, CommandMenu, Header, Footer
lib/site/ # Logique métier, données de catalogue, adaptateur email
public/site/ # Assets statiques optimisés (logos, icônes, illustrations)
scripts/
└── build-site-css.mjs # Script de compilation PostCSS ré-ancrant sous.site-root
```

---

## 3. Pipeline de Compilation CSS

Le script [`scripts/build-site-css.mjs`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/scripts/build-site-css.mjs) prend en entrée `apps/site/app/globals.css` et génère [`components/site/site.css`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/components/site/site.css):
- Les règles `@layer`, variables de thème et classes utilitaires sont encapsulées sous `.site-root`.
- Les sélecteurs globaux (`body`, `html`) sont réécrits en `.site-root`.
- Les `@keyframes` sont préservées pour les animations de l'interface.
- Le script est exécuté avant `next build` dans la commande globale `pnpm build`:
  ```json
  "build": "node scripts/build-vibe-css.mjs && node scripts/build-wakies-css.mjs && node scripts/build-site-css.mjs && next build"
  ```

---

## 4. Routage & Adaptateurs

Le fichier [`components/site/router.tsx`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/components/site/router.tsx) assure la compatibilité transparente:
- `toSitePath(href)`: Transforme tout chemin relatif (ex. `/models`) en chemin préfixé `/site/models`.
- `stripSiteBasePath(pathname)`: Retire `/site` pour faciliter les vérifications d'état actif.
- `<Link href="...">`: Remplace le composant `next/link` natif pour automatiquement réécrire les liens internes.
- `useSiteRouter()` & `useSitePathname()`: Hooks adaptés au routage du site officiel.

---

## 5. Authentification & SSO

Dans [`app/(chat)/site/layout.tsx`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/app/(chat)/site/layout.tsx):
- La session active de l'utilisateur est récupérée côté serveur via `getMaiUser()`.
- Le jeton JWT (`mai_session_token`) est transmis à [`components/site/auth-provider.tsx`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/components/site/auth-provider.tsx) via `initialToken` et `initialUser`.
- `AuthProvider` initialise son état client immédiatement sans aucune requête réseau bloquante ni déconnexion.
- Les routes protégées comme `/site/account` utilisent cette session; les routes publiques (`/site/models`, etc.) sont accessibles sans redirection dans [`proxy.ts`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/proxy.ts).

---

## 6. Intégration CI/CD & Déploiement

Le dépôt ne possède qu'**un** workflow, [`.github/workflows/build.yml`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/.github/workflows/build.yml). Il n'existe **pas** de `.github/workflows/ci.yml`, et le filtre de changements `site:` **n'est pas déclaré**: le Site n'a pas de job ni de filtre qui lui propre.

Le Site est néanmoins construit et vérifié, par deux chemins:

- **La feuille de style** est régénérée par `node scripts/build-site-css.mjs`, appelée au début du script `build` de la racine. Le job `deploy-vercel` exécute `pnpm run build`: une modification de `apps/site/app/globals.css` se répercute donc dans l'artefact déployé.
- **Le code porté** (`components/site/`, `lib/site/`, `app/(chat)/site/`, `app/(chat)/api/site/`) est compilé, typechecké et testé comme le reste de l'application: `tsconfig.json` l'inclut, `biome.jsonc` le lint, et le collecteur de Vitest (`lib/**/*.test.ts`, `app/**/*.test.ts`, `tests/unit/**/*.test.ts`) atteint `tests/unit/site-*.test.ts`.

Seul le **code source** de `apps/site/` est hors du typecheck et du lint racine: `tsconfig.json` exclut `apps`, et `biome.jsonc` exclut `!apps`. Une erreur dans `apps/site/` ne lève donc aucun signal tant qu'elle n'atteint pas une source lue par l'hôte (`app/globals.css`, `docs/news/`, `docs/documentation/`, `docs/*/changelog/`).

> Le filtre `blackline:` du même workflow est, lui, déclaré mais **consommé par aucun job**: la sortie `changes.outputs.blackline` n'est lue nulle part. Le jeu est bien construit, mais comme effet de bord de `pnpm run build`.
