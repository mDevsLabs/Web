# 🤖 Directives & Règles pour Agents IA — Vibe Social (`2-vibe`)

Ce document contient les règles fondamentales et les consignes de développement à respecter impérativement lors de modifications concernant la plateforme sociale **Vibe** (que ce soit dans `apps/vibe/` ou dans son portage `components/vibe/`, `lib/vibe/`, `app/(chat)/vibe/`).

---

## 1. ⚠️ Les Trois Règles d'Or du Portage

### Règle n° 1 — Deux sorties de script ne s'éditent jamais manuellement
| Fichier | Produit par | Règle |
|---|---|---|
| `components/vibe/vibe.css` | `node scripts/build-vibe-css.mjs` | **NE JAMAIS ÉDITER**. Source : `apps/vibe/src/index.css`. Le script ré-ancre l'AST PostCSS sous `.vibe-root`. |
| `app/(chat)/vibe/**/page.tsx` | `node scripts/build-vibe-routes.mjs` | **NE JAMAIS ÉDITER**. Source : table `ROUTES` dans `scripts/build-vibe-routes.mjs`. |

> [!NOTE]
> En revanche, `components/vibe/pages/vibe-routes.tsx` **n'est pas généré** : c'est le fichier des adaptateurs entre la navigation par props de Vibe et le routeur de l'hôte mAI.

### Règle n° 2 — Tout Vibe vit strictement sous `.vibe-root`
`lib/vibe/context/ThemeContext.tsx` enveloppe l'application dans `<div class="vibe-root">`. Le thème est posé sur ce conteneur, jamais sur `<html>`.
- Les classes Tailwind dépendant du thème s'écrivent **`vibe-dark:`** (déclaré dans `app/globals.css`), **jamais `dark:`** (qui suit `<html>` et allumerait le mode sombre dans Vibe dès que l'hôte mAI est sombre).
- Aucune règle CSS ne doit déborder hors de `.vibe-root` afin de préserver la palette achromatique de l'hôte.

### Règle n° 3 — Toutes les URLs passent par `components/vibe/router.tsx`
- Utiliser impérativement `toVibePath()` pour générer des liens internes (`/vibe/...`).
- Utiliser `stripVibeBasePath()` pour les comparaisons dans les composants (`location.pathname === '/'`).
- Utiliser `toVibeAbsoluteUrl()` pour les partages externes, invitations et QR codes.
- Les profils utilisent `/vibe/@pseudo`, réécrits de manière transparente vers `/vibe/u/[username]` par `next.config.ts`.

---

## 2. 🛡️ Particularités Lint & Conventions

`biome.jsonc` définit deux exceptions indispensables au bon fonctionnement de Vibe :
1. **`useExhaustiveDependencies` assoupli** : Dans Vibe, plusieurs tableaux de dépendances sont des déclencheurs volontaires (`[post.id, post.poll]` pour forcer la synchronisation, `[nonce]` pour rafraîchir). Ne pas les supprimer.
2. **`useSortedKeys` désactivé sur `lib/vibe/context/ThemeContext.tsx`** : L'ordre des clés des 5 tables de réglages (thèmes de bulles, fonds, formes, palettes d'accent, tailles de texte) dicte l'ordre d'affichage des boutons dans l'interface. Trier ces clés altère l'UI.

---

## 3. 📱 Application Mobile (Capacitor)

- La configuration mobile se trouve dans `apps/vibe/capacitor.config.ts`.
- L'URL distante chargée par la WebView est paramétrée par `VIBE_WEB_URL` (défaut : `https://mai-vibe.vercel.app`).
- Les builds Android/iOS et leurs releases sont intégrés dans `.github/workflows/build.yml`.
