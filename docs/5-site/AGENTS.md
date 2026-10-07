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
