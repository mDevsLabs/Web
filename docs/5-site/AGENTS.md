# 🤖 Directives & Règles pour Agents IA — Site Officiel (`5-site`)

Ce document contient les règles fondamentales et les consignes de développement à respecter impérativement lors de modifications concernant le **Site Officiel mAI** (dans `components/site/`, `lib/site/`, `app/(chat)/site/`, `app/(chat)/api/site/` et `public/site/`).

---

## 1. ⚠️ Les Règles d'Or de l'Intégration du Site

### Règle n° 1 — `components/site/site.css` ne s'édite jamais manuellement
| Fichier | Produit par | Règle |
|---|---|---|
| `components/site/site.css` | `node scripts/build-site-css.mjs` | **NE JAMAIS ÉDITER DIRECTEMENT**. Source : `apps/site/app/globals.css`. Le script compile Tailwind v4 et ré-ancre tout l'AST sous `.site-root`. |

### Règle n° 2 — Tout le site vit strictement sous `.site-root`
Le layout racine `app/(chat)/site/layout.tsx` enveloppe l'ensemble des pages du site dans :
```tsx
<div className="site-root min-h-screen text-foreground antialiased selection:bg-primary/20 selection:text-primary">
  {children}
</div>
```
- Toutes les classes de design, de couleurs et d'animations du site s'appliquent à l'intérieur de `.site-root`.
- Aucune règle CSS ne doit déborder hors de `.site-root` afin de préserver le thème achromatique et le design du chat principal mAI.

### Règle n° 3 — Routage et Liens internes via `components/site/router.tsx`
- Pour tout lien interne au site, utiliser `<Link href="...">` depuis `@/components/site/router`.
- Cet adaptateur préfixe automatiquement les chemins relatifs avec `/site` (via `toSitePath()`) pour garantir que la navigation reste à l'intérieur de l'espace vitrine.
- Pour les redirections ou la lecture de l'URL côté client, utiliser les hooks `useSiteRouter()` et `useSitePathname()`.

### Règle n° 4 — SSO Transparent via `AuthProvider`
- L'utilisateur connecté à la session mAI hôte (`MAI_SESSION_COOKIE`) est automatiquement reconnu par le site officiel.
- `app/(chat)/site/layout.tsx` lit le jeton de session et initialise `AuthProvider` (`initialToken` et `initialUser`).
- Aucun écran de reconnexion n'est demandé lorsque l'utilisateur bascule du chat vers le site officiel.

### Règle n° 5 — Recherche propre au Site (`CommandMenu`)
- Le site conserve son propre menu de recherche et de commande (`components/site/command-menu.tsx`), activable par `Cmd/Ctrl + K` ou via le champ de recherche dans l'en-tête.
- Ce menu indexe les modèles, projets, articles d'actualité et pages de documentation.

### Règle n° 6 — Compatibilité Next.js 16 (`cacheComponents`)
- Ne jamais ajouter `export const runtime = "nodejs"`, `export const dynamic = "force-dynamic"` ni de `revalidate` obsolètes dans les routes ou pages sous `app/(chat)/site/`.
- Ces directives déclenchent des erreurs bloquantes avec Turbopack et `cacheComponents: true`.

### Règle n° 7 — Deux runtimes : ne jamais importer les modules Deno racine
- Les fichiers TypeScript à la racine du dépôt (`email.ts`, `main.ts`, etc.) sont réservés au runtime Deno/Val Town (`npm:nodemailer`...).
- Les modules Next.js du site doivent importer le service compatible Node depuis `@/lib/site/email`, **jamais** depuis `@/email`.

### Règle n° 8 — Mode sombre : piloté par `html.dark`, écrit dans la source
- Le Site n'a pas de thème parallèle. `components/site/theme-sync.tsx` recopie le thème résolu de l'hôte (next-themes) en classes `dark` + `data-md-theme` sur `.site-root` ; `@mdevs/ui` prend alors ses jetons sombres.
- Les règles sombres s'écrivent **`html.dark …` dans `apps/site/app/globals.css`** (jamais dans `components/site/site.css`, générée) : le script de build les ré-ancre en `.site-root.dark …`.
- Les utilitaires Tailwind partagent leurs variables entre propriétés (`bg-white` et `text-white` lisent tous deux `--color-white`) : on ne bascule donc **pas** les jetons `--color-*`, on lève chaque classe réellement employée, **par propriété**. Les classes de l'inventaire du Site se ajoutent au même endroit.

### Règle n° 9 — Le sélecteur de modèle du Site a sa propre variante
- Le Site a sa **propre palette** (`slate-*`, `purple-*`) : les tokens de l'hôte (`bg-card`, `text-muted-foreground`, `border-border/60`) **n'existent pas** dans `apps/site/app/globals.css`. Le sélecteur du Site est donc `components/site/model-selector.tsx` (+ `model-selector-groups.tsx`), jamais celui de `components/ai-elements/`.
- **Son popover est accroché dans `.site-root`** (`Popover.Portal container={…}`) : le Portal par défaut monte dans `document.body`, hors du périmètre du Site — ce qui viole la Règle n° 2 et perd les variables de thème.
- **La logique de catalogue est partagée**, pas dupliquée : résolution du fournisseur (`lib/ai/model-selector/provider.ts`), niveaux d'effort (`reasoning.ts`), types (`types.ts`), logo (`logo.tsx`).
- Le Site lit **ses propres** routes de catalogue (`/api/site/v1/models*`), distinctes de celles de l'hôte (`/api/models*`). La revalidation globale (au changement de modèle) vise donc les **six** clés — voir `lib/ai/model-catalog.ts`.

### Règle n° 10 — Le catalogue de modèles se rafraîchit
- Les listes de modèles (texte, image, audio) se revalident **toutes les 10 minutes** (`MODEL_CATALOG_REFRESH_INTERVAL` dans `lib/ai/model-catalog.ts`) et **à chaque changement de modèle** : c'est le moment où l'utilisateur regarde le catalogue, donc le moment où il doit être à jour.
- Le catalogue dépend du forfait : un modèle peut être apparu entre deux consultations. Une revalidation forcée (`revalidate: true`) est nécessaire — servir la copie SWR en cache ne rafraîchirait rien.
- Un **bouton de rafraîchissement** accompagne la barre de recherche des modèles : le timer est un filet de sécurité, pas une attente.

### Règle n° 11 — Le terrain de jeu (`/site/playground`)
- La page exécute l'API par l'**exécuteur BFF** (`/api/site/account/api-executor`), jamais en direct : aucune clé ni URL d'API ne doit apparaître côté client. Les routes autorisées sont celles de l'allowlist (`lib/site/api-key-routes.ts`).
- Le terrain de jeu est un **outil développeur**, pas une page publique : il suppose une session (le jeton de session est transmis à l'exécuteur). Un visiteur non connecté doit voir un message clair, pas une erreur opaque..