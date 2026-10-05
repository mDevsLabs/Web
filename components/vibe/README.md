# `components/vibe` — l'application Vibe, dans mAI Web

Ce dossier contient Vibe **portée** : l'application sociale autonome
(`apps/vibe/`, une app Vite + react-router) rendue telle quelle sous `/vibe`
dans mAI Web. Les fichiers suivent l'arborescence d'origine
(`components/feed`, `components/layout`, `lib/vibe/services`…) pour qu'une
comparaison avec la source reste possible : **`apps/vibe/src/` est la
référence**, ce dossier est la copie adaptée.

La navigation est celle de l'App Router, mais les composants Vibe n'ont pas été
réécrits : `components/vibe/router.tsx` leur fournit les primitives de
react-router (`useLocation`, `useNavigate`, `useParams`, `Link`) construites sur
`next/navigation`. Voir `docs/VIBE.md` pour l'architecture complète.

## Règle n° 1 — deux sorties de script ne s'éditent pas

| Fichier | Produit par | Contenu |
|---|---|---|
| `vibe.css` | `node scripts/build-vibe-css.mjs` | la feuille de style de Vibe, ré-ancrée sur `.vibe-root` (source : `apps/vibe/src/index.css`) |
| `app/(chat)/vibe/**/page.tsx` | `node scripts/build-vibe-routes.mjs` | les 15 pages minces de l'App Router (table `ROUTES` du script) |

Toute correction faite à la main dans l'un de ces fichiers disparaît à la
prochaine génération. Pour un changement de fond, corriger la **source** :
`apps/vibe/src/index.css` pour la feuille de style, la table `ROUTES` de
`scripts/build-vibe-routes.mjs` pour les pages.

Le générateur CSS refuse d'écrire un résultat douteux (sélecteur non ancré,
`@import "tailwindcss"` résiduel, at-rule non traitée) et sort en code 1 : un
`vibe.css` incomplet rendrait la portée inopérante, donc silencieusement
cassée.

`pages/vibe-routes.tsx` n'est PAS généré : c'est le fichier des quinze
adaptateurs (navigation par props → routeur de l'hôte), à éditer à la main quand
une route est ajoutée ou renommée. Après une telle modification, relancer
`node scripts/build-vibe-routes.mjs` : le script réécrit les quinze pages de
l'App Router depuis sa table `ROUTES`, en laissant les adaptateurs intacts.

## Règle n° 2 — tout Vibe vit sous `.vibe-root`

`lib/vibe/context/ThemeContext.tsx` pose un `<div class="vibe-root">` autour de
l'application, et le thème (`light`/`dark`, `data-theme`) est écrit **sur cet
élément**, jamais sur `<html>`. Conséquence à respecter :

- les classes Tailwind de Vibe qui dépendent du thème s'écrivent
  **`vibe-dark:`**, jamais `dark:`. La variante `dark:` de l'hôte suit `<html>`,
  donc elle s'allumerait dans une page Vibe claire dès que mAI est sombre ; la
  variante `vibe-dark` est déclarée dans `app/globals.css` et ne suit que
  `.vibe-root` ;
- toute nouvelle règle CSS de Vibe doit rester ancrée sous `.vibe-root` : c'est
  le générateur qui s'en charge, et c'est ce qui empêche le remappage de palette
  de Vibe (`--color-zinc-*`) de repeindre le chat, la barre latérale et les
  réglages de mAI ;
- `lib/vibe/services/animationPrefs.ts` écrit `data-animations` sur
  `.vibe-root` (et non sur `document.documentElement`) pour la même raison.

## Règle n° 3 — les URL passent par `components/vibe/router.tsx`

`toVibePath` (relatif → `/vibe/…`), `stripVibeBasePath` (l'inverse, pour les
comparaisons `location.pathname === '/'` des composants) et `toVibeAbsoluteUrl`
(liens copiés, QR codes, codes d'invitation). Un chemin écrit à la main mène
hors de `/vibe` : c'est un 404 chez le destinataire, pas une erreur visible en
développement. Ces trois fonctions sont couvertes par
`tests/unit/vibe-router.test.ts` — à compléter si une route est ajoutée.

L'URL des profils est `/vibe/@pseudo`, comme dans l'application d'origine ;
`next.config.ts` la réécrit vers `/vibe/u/[username]` (l'App Router ne peut pas
porter de dossier commençant par `@`, réservé aux slots parallèles).

## Deux exceptions de lint, assumées

`biome.jsonc` contient deux overrides qui ne concernent que ce dossier (et
`lib/vibe`) :

1. `useExhaustiveDependencies` ne signale plus les dépendances **superflues**
   dans le code porté. Plusieurs tableaux de dépendances de Vibe sont des
   déclencheurs volontaires (`[post.id, post.poll]` resynchronise une
   publication, `[nonce]` force un refetch, `[current]` réapplique une vitesse) :
   Biome les voit comme inutiles et proposerait de les retirer, ce qui
   supprimerait le déclenchement. Les dépendances **manquantes**, elles, restent
   signalées et sont corrigées.
2. `useSortedKeys` est désactivé sur `lib/vibe/context/ThemeContext.tsx` : les
   cinq tables de réglages (thèmes de bulles, fonds, formes, palette d'accent,
   tailles de texte) sont itérées par `Object.keys`/`Object.values`, donc leur
   **ordre de clés est l'ordre d'affichage** des options. Trier ces tables
   changerait l'interface (et le thème par défaut).

`vibe.css` est exclu du lint pour la même raison que les catalogues générés.
