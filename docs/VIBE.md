# Vibe dans mAI Web — l'intégration `/vibe`

> Périmètre : l'application sociale **Vibe**, portée de `apps/vibe/` (app Vite +
> react-router) sous `/vibe` dans l'application Next. Pour le portage composant
> par composant, voir `components/vibe/README.md` ; pour le backend qui sert
> Vibe (`/v1/*`), voir `docs/BACKEND_API.md` §7.

---

## 1. Pourquoi un portage et pas une iframe

Vibe est une application complète : fil, profils, messages, notifications,
studio mAI, livres, statistiques, réglages. Elle possède sa propre session, son
propre thème et sa propre feuille de style. Deux options se présentaient :

- **iframe** : rapide, mais deux sessions à maintenir, un thème impossible à
  synchroniser, et un `postMessage` pour chaque action qui touche à l'hôte ;
- **portage** : Vibe vit dans l'arbre React de mAI Web, partage sa session et
  son historique de navigation.

C'est le portage qui a été retenu. Le graphe de composants de Vibe n'a pas été
réécrit : il a été **monté tel quel** derrière un adaptateur de routage, et sa
feuille de style **ré-ancrée** sous un conteneur. Ce sont les deux seules
coutures.

## 2. Les routes

Les 15 routes sont générées par `scripts/build-vibe-routes.mjs` dans
`app/(chat)/vibe/**/page.tsx` : chacune ne fait que rendre un adaptateur de
`components/vibe/pages/vibe-routes.tsx`.

| URL | Page Vibe | Rendu |
|---|---|---|
| `/vibe` | `HomePage` | fil |
| `/vibe/explore`, `/vibe/explore/[tab]` | `ExplorePage` | exploration |
| `/vibe/post/[postId]` | `PostDetailPage` | publication + commentaires |
| `/vibe/@pseudo` | `ProfilePage` | profil (**réécrit**, voir §4) |
| `/vibe/u/[username]`, `/vibe/profile/[username]` | `ProfilePage` | profil |
| `/vibe/profile` | `ProfilePage` | profil de l'utilisateur connecté |
| `/vibe/messages` | `MessagesPage` | messagerie privée + groupes |
| `/vibe/notifications` | `NotificationsPage` | notifications |
| `/vibe/mai` | `MAIStudioPage` | studio mAI |
| `/vibe/settings` | `SettingsPage` | réglages Vibe |
| `/vibe/stats` | `StatsPage` | statistiques |
| `/vibe/books`, `/vibe/books/[bookId]` | `BooksPage` | livres collaboratifs |
| `/vibe/books/join/[code]` | `BooksJoinPage` | rejoindre un livre |

Deux points de forme :

- **`vibe-routes.tsx` reste écrit à la main.** Les pages Vibe reçoivent leur
  navigation par props (`onOpenThread`, `onOpenProfile`, `onBack`), c'était le
  routeur Vite qui les injectait. Plutôt que de réécrire quinze signatures, les
  adaptateurs fournissent ces props à partir du routeur de l'hôte.
- **`/vibe/books/join/:code` est déclaré avant `/vibe/books/:bookId`** dans la
  table du générateur : deux segments dynamiques au même niveau, l'ordre décide
  lequel gagne.

## 3. La coquille (`components/vibe/vibe-app.tsx`)

L'ordre des providers est un contrat, pas une préférence :

```
ThemeProvider → AuthProvider → VibeSessionBridge → AudioPlayerProvider → VibeShell
```

- `ThemeProvider` rend le `<div class="vibe-root">` et écrit le thème de Vibe
  dessus (jamais sur `<html>`) ;
- `VibeSessionBridge` reçoit le jeton de session lu côté serveur et le pose dans
  `ApiService` : c'est ce qui évite une seconde connexion ;
- `AudioPlayerProvider` est monté haut car le mini-lecteur survit aux
  navigations ;
- le flux SSE, les toasts et le gestionnaire de scroll vivent dans `VibeShell`.

## 4. La session

`app/(chat)/vibe/layout.tsx` lit le cookie **httpOnly** `mai_session_token`
(`getMaiSessionToken`) et le passe à la coquille. Aucun composant client ne peut
lire ce cookie : c'est la seule raison d'être du layout.

Sans jeton (`null`), Vibe affiche **son** écran de connexion, qui écrit dans le
même cookie par `POST /login` — la session mAI est donc partagée, pas dupliquée.

Le layout déclare `export const instant = false`. `cacheComponents` exige de
l'annoncer, puisqu'une lecture de `cookies()` rend la route non instante, et un
`<Suspense>` de repli serait rendu **hors** de `.vibe-root` — donc avec les
jetons de l'hôte, remplacés ensuite par ceux de Vibe : un clignotement de
palette à chaque entrée. C'est le même arbitrage que
`app/(chat)/recherche/page.tsx`, pour la même raison.

## 5. Le CSS : ré-ancrage sous `.vibe-root`

`components/vibe/vibe.css` est **généré** depuis `apps/vibe/src/index.css` par
`scripts/build-vibe-css.mjs`. Le script analyse la source en AST (PostCSS) et
ré-écrit chaque liste de sélecteurs sous `.vibe-root` :

| Source | Devient |
|---|---|
| `html`, `body`, `:root` | `.vibe-root` |
| `html.light`, `html.dark` | `.vibe-root.light`, `.vibe-root.dark` |
| `[data-theme="dark"] .x` | `.vibe-root[data-theme="dark"] .x` |
| `.x` | `.vibe-root .x` |
| `::view-transition-old(root)` | inchangé (pseudo-élément du document) |

Sans cet ancrage, Vibe remapperait la palette Tailwind de l'hôte
(`--color-zinc-*`, `--color-black`, `--color-white`) et ses règles `html`/`body`
repeindraient le chat, la barre latérale et les réglages de mAI. Deux
réécritures de valeur accompagnent l'ancrage :

- `overflow-x: hidden` → `clip` sur l'ancien `body` : `.vibe-root` est un flux
  normal, pas un conteneur de défilement, sinon tous les `sticky` de Vibe
  cesseraient de coller ;
- `var(--font-sans)`/`var(--font-mono)` → `var(--vibe-font-sans)`/
  `var(--vibe-font-mono)`, avec repli sur les polices de l'hôte.

Le script **refuse d'écrire** si un sélecteur reste non ancré, si un at-rule de
Tailwind subsiste (`@import "tailwindcss"`, `@theme`, `@custom-variant`) ou si
un sélecteur du document n'a pas été traité : il sort en code 1, car une feuille
incomplète échoue silencieusement à l'écran.

### La variante `vibe-dark`

Tailwind ne lit que `app/globals.css`. Le CSS de Vibe ne peut donc pas déclarer
sa propre variante sombre : `@custom-variant vibe-dark` est déclarée dans
`app/globals.css`, ancrée sur `.vibe-root.dark` / `.vibe-root[data-theme="dark"]`,
et les 354 classes `dark:` de Vibe ont été renommées `vibe-dark:`. La variante
`dark:` de l'hôte suit `<html>` : elle s'allumerait dans une page Vibe claire
dès que mAI est sombre.

## 6. Les URL : un seul convertisseur

`components/vibe/router.tsx` porte les trois conversions, et rien d'autre ne
doit écrire `/vibe` à la main :

- `toVibePath(to)` : chemin relatif de Vibe → URL de l'hôte (`/explore` →
  `/vibe/explore`), idempotent, sans toucher aux URL absolues (`mailto:`,
  `https:`) ;
- `stripVibeBasePath(pathname)` : l'inverse, pour les composants qui comparent
  `location.pathname === '/'` ;
- `toVibeAbsoluteUrl(to)` : liens copiés et partagés (permaliens, QR codes,
  codes d'invitation), **basePath inclus** — `router.push` l'ajoute lui-même,
  pas un `window.location.origin + chemin` écrit à la main.

Les profils sont l'exception à l'App Router : Vibe nomme ses profils
`/@pseudo` (barre latérale, notifications, recherche, partage), et l'App Router
ne peut pas porter de dossier commençant par `@` — le préfixe est réservé aux
slots parallèles. D'où la réécriture de `next.config.ts` :

```
/vibe/@:username  →  /vibe/u/[username]
```

L'URL visible reste `/vibe/@pseudo`, donc les liens partagés sont ceux de Vibe.
`tests/unit/vibe-router.test.ts` couvre les trois conversions et la dérivation
des paramètres de route (`/u/:username`, `/profile/:username`, `/@pseudo`,
`/post/:id`, `/books/:id`, `/books/join/:code`).

## 7. Réseau et CSP

Vibe appelle l'API mAI **directement depuis le navigateur** (`lib/vibe/services/api.ts`,
`fetch` avec jeton Bearer, flux SSE), là où le reste de mAI Web passe par des
routes BFF. `next.config.ts` déclare donc l'origine de l'API
(`NEXT_PUBLIC_MAI_API_URL`, défaut `https://mai.val.run`) dans le `connect-src`
de la CSP — sans quoi le fil, les messages et le temps réel de `/vibe`
répondraient par des erreurs de console.

## 8. Décisions de lint

`biome.jsonc` contient trois exceptions documentées, toutes limitées à Vibe :

- `components/vibe/vibe.css` et `apps/vibe/**` sont exclus (sortie de script ;
  sources Vite conservées comme référence, avec leur propre linter) ;
- `useExhaustiveDependencies` ne signale plus les dépendances **superflues** du
  code porté (déclencheurs volontaires), mais toujours les manquantes ;
- `useSortedKeys` est désactivé sur `lib/vibe/context/ThemeContext.tsx`, dont
  l'ordre des clés de cinq tables de réglages est l'ordre d'affichage.

## 9. Ce qui reste ouvert

- **Deux navigations superposées.** `/vibe` est monté dans le layout `(chat)` :
  la barre latérale de mAI reste visible à gauche, et Vibe rend la sienne (barre
  latérale à lui plus barre d'onglets mobile). Les deux fonctionnent, mais elles
  se répondent visuellement. Trois sorties : garder les deux (Vibe est une
  application dans l'application), masquer celle de l'hôte sur `/vibe`, ou
  intégrer les entrées de Vibe à la navigation de mAI.
- **`apps/vibe/` (la source Vite) est aujourd'hui non suivie par git.**
  `scripts/build-vibe-css.mjs` en lit `src/index.css` : sans ce dossier, la
  feuille de style ne peut plus être régénérée. Le commiter (au moins
  `src/index.css` et `src/context/ThemeContext.tsx`, les deux sources de
  référence) rend la génération reproductible en intégration continue.
