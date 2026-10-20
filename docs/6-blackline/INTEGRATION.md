# Blackline intégré : sources Vite, montage sous /blackline

Blackline est un FPS 3D solo (Three.js, TypeScript, Vite) dont la source vit
dans `apps/blackline/`. L'hôte mAI ne le compile pas : il le **monte**, dans
une page qui charge le bundle du jeu comme un artefact statique.

## Vue d'ensemble

| Élément | Valeur |
|---|---|
| Source | `apps/blackline/` — 140 fichiers `.ts`, 21 feuilles `.css` |
| Build | Vite → `public/blackline/` (artefact, non versionné) |
| Bundle | 13 chunks JS ; entrée **au nom stable** `assets/blackline.js` (11 Ko) |
| Moteur | `three-core` 522 Ko, `game` 84 Ko — chargés **à la demande** |
| Feuille de style | `components/blackline/blackline.css` (générée, re-ancrée) |
| Route | `/blackline` (groupe `(chat)` : la barre latérale mAI reste visible) |
| Réglages | table `BlacklineSettings` (migration 0064), par compte |
| Accès | ouvert à **tous** les forfaits — aucun token IA consommé |
| Classification | **PEGI 16** — confirmation d'âge à chaque lancement |

## Le montage

### Un point d'entrée, deux mondes

`apps/blackline/src/entry.ts` expose `mountBlackline(options)`. C'est le seul
point de montage du jeu :

- `apps/blackline/src/mount.ts` l'appelle pour l'application autonome
  (Electron, Capacitor, `index.html` du dépôt) ;
- `components/blackline/blackline-host.tsx` l'appelle depuis la page hôte.

Extraire ce code dans un module unique évite d'avoir deux montages qui
divergent. Le moteur reste paresseux : `import('./game.ts')` est dynamique, et
`scripts/check-bundle.mjs` vérifie que le moteur n'est **pas** chargé avant
l'interface — c'est ce qui permet à l'hôte d'afficher son écran pendant que le
moteur arrive.

### Le contrat : un objet, pas un nom d'export

L'hôte mAI importe le jeu par un chemin **fixe** :

```
/blackline/assets/blackline.js
```

et appelle le contrat que le jeu publie sur `window` :

```ts
window.blackline.mount({ container, root, settings });
```

**Pourquoi un objet et pas un export nommé** — c'est le point le plus subtil
de l'intégration. Rollup renomme les exports d'un chunk d'entrée
(`mountBlackline` devient `r`), et l'arbreur peut même les **élaguer** : le
point d'entrée n'a personne à qui parler tant que l'hôte ne l'appelle pas.
L'hôte chercherait alors `module.blackline.mount` dans le vide — **sans le
 moindre message**, puisque le chargement du module réussit.

Les **propriétés d'un objet** ne sont jamais renommées, et une affectation sur
`window` ne peut pas être élaguée : rien ne la rend inutile au regard de
l'arbreur. C'est donc un objet, publié sur `window`, qui constitue le
contrat.

`tests/unit/blackline-integration-contract.test.ts` vérifie que les deux
moitiés restent d'accord — c'est le seul endroit où elles peuvent l'être, les
deux fichiers ne se compilant pas ensemble.

### Le DOM du jeu

Le point d'entrée **construit** ce qu'il attend (`#game-canvas`, `#app`,
`#boot`) dans le conteneur fourni. L'hôte n'a pas à connaître la structure
interne du jeu, et le jeu n'a pas à connaître celle de l'hôte.

Trois rôles sont distincts, et les confondre est un bug silencieux :

| Rôle | Élément | Autonome | Hôte mAI |
|---|---|---|---|
| Conteneur | canvas + interface | `<body>` | `.blackline-root` |
| Racine | classes et variables CSS | `<html>` | `.blackline-root` |
| Overlay | orientation (paysage) | `<html>` | `.blackline-root` |

### Les classes du jeu

Le jeu posait ses classes (`touch-device`, `reduced-motion`,
`no-screen-effects`, `left-handed`, `portrait-blocked`) et ses variables CSS
sur `document.documentElement`. Dans l'hôte, ce document est celui du CHAT :
le jeu repeindrait la barre latérale, les réglages et le composeur.

Elles sont désormais posées sur la **racine du jeu** — `apps/blackline/src/root.ts`
est le point d'accès unique. L'application autonome monte le jeu sur `<html>`
(il possède le document) et n'est donc pas affectée : c'est le même code.

## La feuille de style

`components/blackline/blackline.css` est produite par
`scripts/build-blackline-css.mjs`, qui lit le CSS du build Vite et le
**re-ancre** sous `.blackline-root` — la même mécanique que
`scripts/build-vibe-css.mjs` et `scripts/build-wakies-css.mjs`.

Deux transformations vont au-delà du ré-ancrage :

- **`position: fixed` → `position: absolute`** : le canvas et l'overlay
  d'orientation doivent être bornés par le JEU, pas par le viewport — sinon
  ils couvriraient la barre latérale du chat ;
- **`@keyframes` préfixés `blackline-`** : leurs noms (`pulse`, `loading`,
  `scan`…) sont globaux, et l'interface mAI ne doit pas les hériter.

Le script **échoue** (code 1) si une règle n'a pas pu être ancrée ou si un
sélecteur document survit : il n'écrit jamais de feuille partielle.
`tests/unit/blackline-style-isolation.test.ts` vérifie le résultat.

## La confirmation d'âge (16+, PEGI 16)

`components/blackline/age-gate.tsx` est montée **à chaque entrée** dans
`/blackline`. Elle vit dans l'état du composant : **rien** n'est écrit en
base, dans le `localStorage` ni dans un cookie. Un rechargement — ou une
navigation qui quitte le jeu puis y revient — repose la question.

Tant que l'âge n'est pas confirmé, le bundle du jeu n'est même pas demandé :
ni moteur, ni texture, ni bande passante.

## Les réglages

### Ce qui est partagé

Les **réglages** du jeu (qualité, résolution de rendu, sensibilité, volume,
FOV, réticule, caméra…) sont enregistrés par compte dans `BlacklineSettings`
(migration 0064) et lus par le jeu à son montage.

- `GET /api/blackline/settings` — les réglages du compte ;
- `PUT /api/blackline/settings` — les remplace.

Le serveur **normalise** avant d'écrire (`lib/blackline/settings.ts`) : une
énumération illisible est ignorée, un nombre hors bornes est borné dans
l'intervalle du jeu, un booléen absent prend sa valeur par défaut. Un réglage
illisible ne fait jamais échouer l'enregistrement des autres.

Les réglages sont pilotables depuis l'onglet **Paramètres → Applications →
Blackline** (`components/blackline/blackline-settings-section.tsx`).

### Ce qui reste local

La **progression** (XP, armes, collection, carrière) reste dans le
`localStorage` de l'appareil, avec export/import JSON depuis l'onglet
Sauvegarde du jeu. Blackline a volontairement retiré la synchronisation en
ligne (version 1.2.0) : « les récompenses et sauvegardes d'un jeu solo local
ne sont pas une économie serveur anti-triche ».

Les **touches PC** et les **réglages tactiles** (zone morte du joystick, taille
des commandes) restent dans le jeu : ils dépendent de l'appareil, pas du
compte.

## Build

```bash
# Compiler le jeu et copier ses artefacts vers public/blackline/
node scripts/build-blackline.mjs

# Re-générer la feuille de style re-ancrée (lit la sortie du build)
node scripts/build-blackline-css.mjs

# Les deux
pnpm run build:blackline
```

`pnpm build` enchaîne les deux avant `next build`.

Le jeu n'est **pas** membre du workspace pnpm (`pnpm-workspace.yaml` liste
`packages: []`) : il a son propre `package-lock.json` et ses propres
`node_modules`, installés par `npm ci --prefix apps/blackline`. La CI le fait
avant le build Vercel.

## Contraintes de sécurité

- La CSP de l'hôte n'a pas besoin d'être touchée : le jeu est servi depuis la
  **même origine** (`/blackline/assets/…`), donc `script-src 'self'` et
  `font-src 'self'` couvrent déjà le bundle et la police.
- `frame-ancestors 'none'` interdit l'iframe — le jeu n'en utilise pas.
- Le bundle ne contient aucune chaîne de connexion (vérifié par
  `apps/blackline/scripts/check-bundle.mjs`).
- `/api/blackline/**` est protégé par `proxy.ts` (cookie de session) ; la
  mutation vérifie en plus l'origine de la requête.

## Limites connues

- La confirmation d'âge est demandée à chaque lancement : c'est le
  comportement demandé, mais un utilisateur qui change d'application revient
  au jeu et doit répondre à nouveau.
- Le moteur (522 Ko) est chargé au lancement du jeu, pas à l'entrée dans la
  page : l'interface mAI et l'écran d'âge restent instantanés.
- La visée exige un pointeur. Le jeu gère un repli sans capture de souris.
- Sur mobile, le jeu se joue en paysage : le portrait met la partie en pause.
