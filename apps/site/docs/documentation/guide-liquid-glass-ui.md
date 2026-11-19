---
title: "Design System Liquid Glass & Bibliothèque @mdevs/ui"
description: "Principes visuels Liquid Glass, système de jetons CSS Tailwind v4, accessibilité et intégration des composants de @mdevs/ui."
category: "Guides"
order: 18
---

# Design System Liquid Glass & Bibliothèque @mdevs/ui

Le design system **Liquid Glass** de mAI associe une esthétique achromatique épurée à des surfaces de verre subtiles, une réfraction lumineuse délicate et un respect rigoureux des normes d'accessibilité numérique.

L'ensemble des composants graphiques est distribué dans le paquet autonome `@mdevs/ui`.

---

## 1. Philosophie Visuelle & Tokens CSS-First

L'interface de mAI repose sur une stricte sobriété visuelle régie par **Tailwind CSS v4** sans fichier de configuration JavaScript :

### Règle d'Achromatisme
L'interface est monochrome par défaut. Les teintes colorées n'interviennent que pour porter une information univoque et universelle :

| Token Sémantique | Signification & Rôle | Utilisation Recommandée |
|---|---|---|
| `--success` | Confirmation, validation, opération réussie | `text-success`, `bg-success/10` |
| `--warning` | Alerte quota, avertissement, attention requise | `text-warning`, `ring-warning/20` |
| `--info` | Étiquettes d'information neutres, métadonnées | `text-info`, `bg-info/10` |
| `--destructive` | Erreur bloquante, suppression, action irréversible | `text-destructive`, `bg-destructive/10` |

> Les couleurs en dur (`emerald-500`, `amber-600`, `sky-500`) sont proscrites dans les composants afin d'éviter toute disparité avec le thème principal.

### Primitives de Surface
Quatre utilitaires fondamentaux unifient la mise en page :
- `surface-card` : Conteneur principal à fond translucide et bordures adoucies.
- `surface-muted` : Encadré d'information secondaire ou d'avertissement discret.
- `chip` : Pastille de sélection filtrante (activation pilotée par `data-active`).
- `field-input` : Surface de saisie ergonomique avec anneau de focus contrasté.

---

## 2. Architecture du Paquet `@mdevs/ui`

Le paquet `@mdevs/ui` est composé de :
- **132 Primitives Fondamentales** : Boutons, dialogues, tiroirs, champs de formulaires, infobulles, tableaux, accordéons.
- **108 Domaines Métiers Typés** : 1 080 composants prêts à l'emploi couvrant des structures métier standardisées (cartes, filtres, métriques, chronologies).

### Utilisation dans un Projet Hôte
```tsx
import { ThemeProvider, Button, GlassCard } from "@mdevs/ui";
import "@mdevs/ui/styles.css";

export function MonComposant() {
  return (
    <ThemeProvider theme="system" variant="liquid-glass">
      <GlassCard title="Espace de Travail">
        <p className="md-muted">Contenu textuel protégé par le verre liquide.</p>
        <Button variant="solid">Valider</Button>
      </GlassCard>
    </ThemeProvider>
  );
}
```

---

## 3. Gestion des Portails & Scoping DOM

Dans une architecture multi-vues où certains sous-systèmes sont confinés (par exemple `.site-root`), les fenêtres modales et menus déroulants ne doivent pas déborder arbitrairement dans `document.body` :

- Les composants de superposition (`Dialog`, `Popover`, `Drawer`, `Tooltip`, `DropdownMenu`) exposent une propriété optionnelle `container?: HTMLElement | null`.
- Lorsqu'elle est spécifiée, le portail Radix UI sous-jacent est ancré directement dans ce nœud DOM dédié.
- Les variables CSS personnalisées et les classes de thème (`data-md-theme`) demeurent ainsi parfaitement héritées sans perte de style.

---

## 4. Accessibilité ARIA & Formulaires

Les primitives de formulaire respectent le standard WCAG 2.1 AA :
- **Liaison Automatique des Erreurs** : Le composant `Field` inspecte ses éléments enfants pour propager automatiquement les attributs `aria-describedby` (reliant les messages d'aide et d'erreur) et `aria-invalid` en cas de validation non satisfaite.
- **Combobox Ergonomique** : Le champ de sélection recherchable préserve visuellement le libellé de l'option préalablement choisie lors de la prise de focus, évitant toute impression d'effacement inopiné, tout en permettant un filtrage instantané dès la frappe.
