# @mdevs/ui

Bibliothèque React et TypeScript de composants d'interface. Version **0.9.3** :
**132 primitives** et **1 080 composants métier** repartis en **108 domaines**,
chaque domaine exposant dix familles d'affichage et un modèle typé.

```tsx
import {ThemeProvider, Button, GlassCard} from "@mdevs/ui";
import "@mdevs/ui/styles.css";

<ThemeProvider theme="system">
  <GlassCard title="Bienvenue">
    <Button>Continuer</Button>
  </GlassCard>
</ThemeProvider>
```

## Dans ce dépôt

Le paquet est **consommé en dépendance `file:packages/ui`**, installé par
`pnpm install` à la racine. Il n'est pas membre du workspace pnpm
(`pnpm-workspace.yaml` = `packages: []`).

`dist/`, `src/` et `catalog/` sont des **artefacts versionnés**, produits ailleurs :
les scripts du générateur (`scripts/generate.py`, `scripts/foundations.py`,
`scripts/data/domains.txt`) et les commandes `npm run generate`, `npm run verify`
citées dans [AGENTS.md](AGENTS.md) **n'existent pas dans ce dépôt**. Les fiches
`catalog/<domaine>/README.md` et `catalog/components/**/*.md` sont des sorties :
ne pas les réécrire à la main.

Consommation réelle ici : environ 55 sites d'import dans l'hôte — `app/layout.tsx`,
`app/globals.css`, `components/ui/mdevs-island.tsx`, l'interface de Wakies et le
Site. Deux particularités :

- `next.config.ts` **n'inclut pas** `@mdevs/ui` dans `optimizePackageImports`,
  contrairement aux icônes.
- Wakies régénère `packages/ui/dist/styles.css` dans sa propre feuille
  (`components/wakies/wakies-ui.css`, `@layer mdevs`).

## Utiliser

React et React DOM 18.3 ou 19 sont des pair dependencies ; `radix-ui` est une
dépendance du paquet. Importer `@mdevs/ui/styles.css` **une seule fois**, au
niveau global. Aucune configuration Tailwind ni fournisseur CSS-in-JS n'est
nécessaire.

Encadrer les composants par un `ThemeProvider` : les jetons visuels restent sur
`.md-root` et ne modifient pas le thème de l'hôte. Sans provider, les tokens ne
sont pas définis. Les superpositions portalisées suivent le thème via
`PortalScope`, qui recopie thème, variante, accent, rayon, verre et les variables
`--*` passées à `ThemeProvider.style` — une variable définie seulement dans une
règle CSS sur le wrapper ne suit pas son portail.

Les composants ne transportent **ni validation, ni autorisation, ni réseau** :
valeurs, état métier, appels et persistance restent à la charge du projet hôte.
Un composant n'est pas une garde serveur.

## Référence

- [Manifeste des exports](catalog/manifest.json) · [Index de la documentation](catalog/docs/README.md)
- [Guides par domaine](catalog/) · [Règles d'intégration](AGENTS.md) · [Tokens et conventions](STYLE.md)
- Guides ciblés : formulaires (`catalog/docs/FORM_PATTERNS.md`), superpositions
  (`OVERLAYS.md`), accessibilité (`ACCESSIBILITY.md`), limites (`LIMITATIONS.md`)

Vérifier le manifeste et les déclarations `.d.ts` de `dist/` avant de supposer un
export ou un contrat de props. Les licences sont dans `LICENSE` et
`LICENSE-INTER.txt` (Inter variable 4.1, redistribuée avec son `metadata.json`).
