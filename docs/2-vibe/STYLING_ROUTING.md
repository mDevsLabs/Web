# 🎨 Styling & Routage de Vibe dans mAI Web

L'intégration de Vibe au sein de mAI Web repose sur deux mécanismes de compilation automatisés pour garantir une isolation visuelle parfaite et une intégration fluide dans l'App Router Next.js.

---

## 1. 🖌️ Ré-ancrage CSS sous `.vibe-root`

Vibe possède sa propre feuille de style Tailwind v4 (`apps/vibe/src/index.css`) définissant sa palette de couleurs zinc et ses propres règles d'animation.

### Le Script de Build (`scripts/build-vibe-css.mjs`)
Ce script compile `apps/vibe/src/index.css` vers `components/vibe/vibe.css` en modifiant l'arbre syntaxique abstrait (AST) PostCSS :
- `html`, `body`, `:root` sont transformés en `.vibe-root`.
- `html.light`, `html.dark` deviennent `.vibe-root.light`, `.vibe-root.dark`.
- `[data-theme="dark"] .x` devient `.vibe-root[data-theme="dark"] .x`.

> [!WARNING]
> Ce fichier généré **ne doit jamais être édité à la main**. Toute modification de style doit être apportée dans `apps/vibe/src/index.css`, puis régénérée avec `node scripts/build-vibe-css.mjs`.

### La variante `vibe-dark:`
Dans `app/globals.css`, la règle :
```css
@custom-variant vibe-dark (&:where(.vibe-root.dark, .vibe-root.dark *));
```
permet aux classes Tailwind portées de cibler exclusivement le mode sombre de Vibe sans interférer avec le mode sombre global de l'application mAI.

---

## 2. 🗺️ Routage & Adaptateurs Next.js

Les composants de Vibe étaient initialement écrits pour `react-router-dom` avec des callbacks de navigation passés par props (`onOpenProfile`, `onOpenThread`, etc.).

### Le Générateur de Pages (`scripts/build-vibe-routes.mjs`)
Le script lit la table des 15 routes déclarées et génère automatiquement les fichiers `page.tsx` dans `app/(chat)/vibe/**/page.tsx` :
- Chaque page est un composant serveur ultra-léger qui importe un adaptateur depuis `components/vibe/pages/vibe-routes.tsx`.
- L'adaptateur fait le pont entre le router Next.js (`useRouter`, `useSearchParams`) et les composants React de Vibe.

### Le Router Isolé (`components/vibe/router.tsx`)
Pour éviter que des liens internes ne fassent sortir l'utilisateur de l'espace `/vibe` :
- `toVibePath(path)` préfixe automatiquement le chemin avec `/vibe`.
- `stripVibeBasePath(path)` retire le préfixe `/vibe` pour que les comparaisons internes du composant restent vraies.
- `toVibeAbsoluteUrl(path)` fabrique une URL absolue complète pour le partage et les invitations.
