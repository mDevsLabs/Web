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

---

## 4. 🗄️ Données : lectures pré-hydratées, écritures API

Les lectures de premier écran sont servies par `lib/vibe/server/` (Postgres
direct, `DATABASE_URL` partagé avec le backend) ; les **écritures, l'IA et le
SSE restent sur l'API** `mai.val.run`. Details et contrats :
`docs/2-vibe/INTEGRATION.md` § 7bis. Points d'attention pour un agent :

- Une page `app/(chat)/vibe/**` est **générée** : le gabarit async vit dans
  `scripts/build-vibe-routes.mjs` (clé `cle` de la table `ROUTES`) ; la graine
  transite par `getVibeHydration()` → `vibe-routes.tsx` → prop `hydration`.
- Les lecteurs (`lib/vibe/server/queries/*`) sont des **répliques lecture
  seule** des handlers backend, alias snake_case et clauses de visibilité
  compris — jamais de DDL, jamais d'écriture ; toute erreur ⇒ graine `null`
  ⇒ repli API automatique.
- Injecter une donnée en base dans le cache client passe exclusivement par
  `ApiService.seedEndpointFor`/`profileEndpoint`/`feedEndpoint` : une clé qui
  diverge du getter re-déclenche l'appel API supprimé, silencieusement.
- Suppression de routes backend : un handler ne meurt que si NI le portage NI
  `apps/vibe/src` (app mobile) ne l'appellent, et la suppression s'applique
  aux **deux copies** (`vibe-*.ts` racine et `scripts/vibe-*.ts`, identiques
  au byte près).

---

## 5. 🎞️ Stories : contrats à ne pas casser

Guide complet : [STORIES.md](./STORIES.md). Ce qui engage une modification :

- **Les tables Vibe ne sont pas dans Drizzle.** Le DDL des stories vit à deux
  endroits qui doivent décrire la même structure : `ensureStoriesTables()` dans
  `vibe-stories.ts` et `apps/vibe/lib/db/migrations/026_vibe_stories.sql`. Le
  migrateur Vibe vérifie les sommes de contrôle : une migration appliquée ne se
  retouche pas, elle se remplace par une `027`.
- **Deux plafonds média différents, en sens inverse.** Upload `/v1/upload-file` :
  50 Mo en Free, 1 Go en Plus/Pro/Max (`MEDIA_UPLOAD_LIMITS_BYTES`). Média d'une
  story : **50 Mo quel que soit le forfait** (`STORY_MEDIA_MAX_BYTES`). Les
  « réaligner » l'un sur l'autre casse un des deux contrats. Le contrôle de la
  story se fait par `HEAD` sur l'objet, jamais sur la taille déclarée par le
  navigateur.
- **Origine des médias.** Seules les origines du pool (`getStorageNodes()`) et le
  namespace `uploads/` sont acceptés, comparés sur `URL.origin` — un `startsWith`
  sur une URL se contourne avec un hôte fabriqué.
- **Le quota se renouvelle à minuit heure de Paris**, par une clé de jour calculée
  dans le module (`Intl`, `Europe/Paris`) et passée à l'upsert. `CURRENT_DATE` est
  UTC : l'utiliser remettrait le compteur à 1 h ou 2 h du matin. La divergence avec
  le quota d'images (UTC) est délibérée.
- **Forme des erreurs Vibe.** `error` est une chaîne, les champs machine sont à
  plat : `ApiService` fabrique `new Error(errJson.error)`, un objet imbriqué
  s'affiche « [object Object] ».
- **L'anneau est une coque externe.** `ProfileAvatar` ne reçoit aucune prop
  d'anneau (une vingtaine de sites de rendu, un jumeau dans `apps/vibe/src` aux
  imports différents). États portés par `data-live` / `data-seen`, jamais par des
  classes conditionnelles. Styles dans `apps/vibe/src/index.css`, puis
  `node scripts/build-vibe-css.mjs`.
- **Le rail n'est pas pré-hydraté** : le gabarit de page n'admet qu'une graine par
  route, celle du fil est prise. Ne pas ajouter une clé `stories` au registre
  d'hydratation sans page qui la consomme.
- **Le portail du lecteur se rend dans `.vibe-root`**, pas dans `document.body` :
  sinon il perd les tokens de thème du conteneur.
