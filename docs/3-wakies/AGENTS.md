# 🤖 Directives & Règles pour Agents IA — Wakies Workspace (`3-wakies`)

Ce document contient les règles fondamentales et les consignes d'architecture à respecter impérativement lors du développement sur l'espace **Wakies** (dans `apps/wakies/` ou dans son code porté `components/wakies/`, `lib/wakies/`, `app/(wakies)/wakies/`).

---

## 1. ⚠️ Les Règles Fondamentales du Portage

### Règle n° 1 — `.wakies-root` et Route Isolée
- L'espace Wakies vit dans son propre layout dédié `app/(wakies)/wakies/layout.tsx`.
- L'élément racine porte impérativement la classe CSS `.wakies-root`.
- **Aucune variante sombre** : Wakies possède son propre design system clair natif, sans Tailwind. Ne jamais introduire de classe `dark:`.

### Règle n° 2 — Feuilles de Style Générées (Ne pas éditer)
| Fichier généré | Source | Script |
|---|---|---|
| `components/wakies/wakies.css` | `apps/wakies/integration/web/style.css` | `node scripts/build-wakies-css.mjs` |
| `components/wakies/wakies-editor.css` | `apps/wakies/integration/web/editor.css` | `node scripts/build-wakies-css.mjs` |

> [!CAUTION]
> Ne jamais modifier directement ces fichiers CSS dans `components/wakies/`. Toute correction doit être faite dans la source sous `apps/wakies/integration/web/` puis régénérée.

### Règle n° 3 — Isolation Absolue par `userId`
Dans la version portée sous PostgreSQL Neon, **les tables propriétaires portent `userId` et les tables enfants sont isolées via leur ressource propriétaire**.
- Chaque fonction de `lib/wakies/queries.ts` prend impérativement `userId` en premier paramètre.
- Une requête sans filtrage par `userId` est une violation de sécurité inacceptable.

### Règle n° 4 — Pas de CopilotKit, Pas de react-markdown
- Le chat utilise le pipeline hôte via `useChat` (`ai@7` / `@ai-sdk/react`) et tape sur `/api/wakies/chat`.
- Le rendu Markdown est assuré par `components/wakies/markdown.tsx` qui encapsule `Streamdown`, le moteur officiel de mAI Web.
- Le vocabulaire canonique est **« conversation »** (`conversationId`), et non « thread » (`threadId`).

### Règle n° 5 — Quotas & Facturation Unifiés
Wakies ne dispose pas de quota isolé : chaque message ou action IA consomme les jetons du forfait mAI Web du compte (`lib/plans/tier-limits.ts`).

---

## 2. 🔄 Scripts de Maintenance

Après toute modification dans `apps/wakies/integration/web/` :
```bash
# 1. Recompiler les feuilles de style ré-ancrées
node scripts/build-wakies-css.mjs

# 2. Vérifier la provenance officielle
node scripts/check-wakies-source.mjs
```
