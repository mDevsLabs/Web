# 🤖 Directives & Règles pour Agents IA — Blackline (`6-blackline`)

Ce document contient les règles fondamentales et les consignes de développement
à respecter impérativement lors de toute modification concernant **Blackline**
(dans `apps/blackline/`, `components/blackline/`, `lib/blackline/`,
`app/(chat)/blackline/` et `app/(chat)/api/blackline/`).

---

## 1. ⚠️ Les Règles d'Or de l'Intégration

### Règle n° 1 — `components/blackline/blackline.css` ne s'édite jamais manuellement

| Fichier | Produit par | Règle |
|---|---|---|
| `components/blackline/blackline.css` | `node scripts/build-blackline-css.mjs` | **NE JAMAIS ÉDITER DIRECTEMENT**. Source : le CSS produit par le build Vite du jeu. |

### Règle n° 2 — Tout Blackline vit strictement sous `.blackline-root`

Le jeu a été écrit pour **posséder le document** : sa feuille déclarait
`:root`, `html` et `body`, et posait ses composants sur des sélecteurs nus
(`button`, `input`, `select`, `*`). Intégré tel quel, il repeindrait le chat,
la barre latérale et les réglages de mAI.

Le script de build **re-ancre** chaque sélecteur sous `.blackline-root`,
l'élément posé par `app/(chat)/blackline/layout.tsx`. Le test
`tests/unit/blackline-style-isolation.test.ts` vérifie qu'aucun sélecteur ne
sort de cette racine.

> [!CAUTION]
> Deux transformations sont faites en plus du ré-ancrage, et elles sont
> **indispensables** :
> - `position: fixed` → `position: absolute` : sinon le canvas du jeu
>   couvrirait la barre latérale du chat (`fixed` se référence au viewport) ;
> - les `@keyframes` sont préfixés `blackline-` : leurs noms (`pulse`,
>   `loading`…) sont globaux, et l'interface mAI ne doit pas les hériter.

### Règle n° 3 — Le jeu ne touche JAMAIS `<html>`

Les classes d'état du jeu (`touch-device`, `reduced-motion`,
`no-screen-effects`, `left-handed`, `portrait-blocked`) et ses variables CSS
(`--reticle-scale`, `--crosshair`, `--touch-scale`, `--touch-opacity`) sont
posées sur la **racine du jeu**, jamais sur `document.documentElement`.

Le point d'accès unique est `apps/blackline/src/root.ts` (`setRoot`,
`toggleRootClass`, `setRootProperty`). Un `document.documentElement` dans le
code du jeu est une régression : il repeindrait l'hôte.

> [!NOTE]
> L'application autonome (Electron, Capacitor) monte le jeu sur `<html>` —
> il possède le document, et la feuille d'origine s'y applique. C'est le MÊME
> code : `root.ts` ne connaît pas la différence.

### Règle n° 4 — L'âge n'est JAMAIS persisté

Blackline est classé **PEGI 16**. La confirmation d'âge est demandée **à
chaque lancement** et n'est écrite **ni en base, ni en `localStorage`, ni en
cookie**. Elle vit dans l'état du composant `components/blackline/age-gate.tsx`.

Un rechargement de page — ou une navigation qui quitte `/blackline` puis y
revient — repose la question. C'est le comportement demandé, et c'est le plus
simple à auditer : il n'y a rien à purger, donc rien qui puisse survivre par
accident.

### Règle n° 5 — La PROGRESSION reste locale

Seuls les **réglages** du jeu sont partagés par le compte (table
`BlacklineSettings`, migration 0064). L'XP, les armes, la collection et la
carrière restent dans le `localStorage` de l'appareil, avec export/import JSON.

Blackline a **volontairement retiré** la synchronisation en ligne (version
1.2.0) : « les récompenses et sauvegardes d'un jeu solo local ne sont pas une
économie serveur anti-triche ». Ne pas rouvrir ce chantier sans décision
produit explicite.

---

## 2. Le montage : un point d'entrée, deux mondes

`apps/blackline/src/entry.ts` expose `mountBlackline(options)`. C'est le **seul**
point de montage, partagé par :

- `apps/blackline/src/mount.ts` — l'application autonome (Electron, Capacitor) ;
- `components/blackline/blackline-host.tsx` — l'hôte mAI.

Extraire ce code dans un module unique évite d'avoir deux montages qui
divergent : le bug « l'un marche, l'autre non » serait quasi certain.

Le moteur reste **paresseux** : `import('./game.ts')` est dynamique, et
`scripts/check-bundle.mjs` vérifie que le moteur n'est PAS chargé avant
l'interface. C'est ce qui permet à l'hôte d'afficher son écran pendant que
le moteur arrive.

> [!WARNING]
> `manualChunks` (dans `apps/blackline/vite.config.ts`) **écrase** le
> découpage naturel de Rollup : un module importé dynamiquement et capturé
> par une règle manuelle se retrouve dans un chunk STATIQUE. La règle
> « tout `src/ui/` va dans `interface` » a un jour capturé la visionneuse de
> l'arsenal — et le contrôle du bundle a échoué. Toute nouvelle règle
> `manualChunks` doit vérifier ce point.

### Règle n° 6 — Le contrat d'intégration est un OBJET sur `window`

L'hôte mAI importe le jeu par un chemin **fixe**
(`/blackline/assets/blackline.js`) et appelle :

```ts
window.blackline.mount({ container, root, settings });
```

**Ne jamais** transformer ce contrat en export nommé. Rollup renomme les
exports d'un chunk d'entrée (`mountBlackline` devient `r`), et l'arbreur peut
même les **élaguer** — le point d'entrée n'a personne à qui parler tant que
l'hôte ne l'appelle pas. L'hôte chercherait alors un contrat absent,
**sans le moindre message**, puisque le chargement du module réussit.

Les **propriétés d'un objet** ne sont jamais renommées, et une affectation sur
`window` ne peut pas être élaguée.

> [!NOTE]
> `tests/unit/blackline-integration-contract.test.ts` verrouille ce contrat
> des deux côtés : c'est le seul endroit où les deux moitiés peuvent être
> comparées, les deux fichiers ne se compilant pas ensemble.

---

## 3. Les réglages : le serveur fait foi

Les réglages passent par `lib/blackline/settings.ts`, qui **normalise** :

- une énumération illisible est **ignorée** (absente du résultat) ;
- un nombre hors bornes est **borné** dans l'intervalle du jeu ;
- un booléen absent prend sa **valeur par défaut** ;
- une clé inconnue est **ignorée**.

Un réglage illisible ne fait **jamais** échouer l'enregistrement des autres :
c'est le contrat de l'hôte (« le serveur fait foi »), le même que pour le
thème, le modèle par défaut ou le mode de création.

L'interface (`components/blackline/blackline-settings-section.tsx`) ne
**recalcule** aucun réglage : elle affiche ce que le serveur renvoie et lui
renvoie ce que l'utilisateur a choisi.

---

## 4. Scripts de maintenance

```bash
# Compiler le jeu et copier ses artefacts vers public/blackline/
node scripts/build-blackline.mjs

# Re-générer la feuille de style re-ancrée
node scripts/build-blackline-css.mjs

# Les deux, dans l'ordre (le CSS lit la sortie du build)
pnpm run build:blackline
```

`public/blackline/` est un **artefact** : il n'est pas versionné et se
reconstruit par `pnpm build`. Le jeu n'est **pas** membre du workspace pnpm :
ses dépendances s'installent par `npm ci --prefix apps/blackline`.

---

## 5. Ce que Blackline n'est pas

- **Pas un iframe** : la CSP de l'hôte interdit `frame-ancestors` externe, et
  le README du jeu refuse explicitement tout iframe.
- **Pas une application de bureau** : contrairement à Coder, Blackline est un
  jeu web, servi par l'hôte. Il n'a pas de fenêtre native.
- **Pas un service payant** : le jeu ne consomme aucun token IA. Il n'y a
  **pas de paywall**, et aucun quota de forfait ne le concerne.
- **Pas un portage React** : le moteur Three.js (522 Ko) n'a pas de version
  React. Le jeu reste un artefact statique, monté par l'hôte.
