# 🤖 Directives & Règles pour Agents IA — Wakies Workspace (`3-wakies`)

Ce document contient les règles fondamentales et les consignes d'architecture à respecter impérativement lors du développement sur l'espace **Wakies** (dans `apps/wakies/` ou dans son code porté `components/wakies/`, `lib/wakies/`, `app/(wakies)/wakies/`).

---

## 1. ⚠️ Les Règles Fondamentales du Portage

### Règle n° 1 — `.wakies-root` et Route Isolée
- L'espace Wakies vit dans son propre layout dédié `app/(wakies)/wakies/layout.tsx`.
- L'élément racine porte impérativement la classe CSS `.wakies-root`.
- **Thème** : Wakies suit le thème résolu de l'hôte (next-themes) — classe `dark` sur
  `<html>` → couche ajoutée à la fin de `components/wakies/wakies-host.css`
  (`html.dark .wakies-root …`). Les feuilles générées restent claires natives ;
  `wakies-ui.css` fournit `data-md-theme`. Ne jamais réintroduire `dark:` Tailwind
  (aucun Tailwind ici) ni une état de thème parallèle.

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

### Règle n° 6 — Le fil ne fabrique aucune donnée
Les décisions de rendu du fil (citation d'une réponse, provenance d'un transfert, séparateurs de jour, curseur de lecture) vivent dans `lib/wakies/shared/transcript.ts` et sont testées. Un composant ne reconstruit pas ces règles : quand la cible d'une citation n'est pas chargée, on n'affiche RIEN plutôt qu'un extrait inventé, et un auteur inconnu s'appelle « Wakie », pas un nom deviné.

### Règle n° 7 — La lecture se marque sur un `seq`, jamais sur une heure
`WakiesConversation.lastReadSeq` est le seul ordre monotone : deux messages d'une même salve partagent leur `createdAt`. Le client envoie le dernier `seq` RÉELLEMENT affiché (`POST /conversations/:id/read`) ; le curseur ne recule jamais côté serveur. Un compteur de non-lus servi par `listConversations` ne se recalcule pas dans l'interface.

### Règle n° 8 — Vibe est lu, jamais écrit
`lib/vibe/server/profil.ts` lit le profil Vibe du compte (lecture seule, `null` en cas d'indisponibilité) pour la carte « Mon profil » et pour le prompt. Wakies n'écrit pas dans Vibe : la modification se fait dans Vibe. Les objets du lecteur ne transportent ni email, ni forfait, ni compteur privé.

### Règle n° 9 — Les ajouts de style vont dans `wakies-host.css`
`wakies.css`, `wakies-editor.css` et `wakies-ui.css` sont GÉNÉRÉS (script `build-wakies-css.mjs`). Nos ajouts — citations, actions de bulle, tiroir de fiche, aperçus de liste — s'écrivent dans `components/wakies/wakies-host.css`, ancrés sous `.wakies-root`.

---

## 2. 🔄 Scripts de Maintenance

Après toute modification dans `apps/wakies/integration/web/` :
```bash
# 1. Recompiler les feuilles de style ré-ancrées
node scripts/build-wakies-css.mjs

# 2. Vérifier la provenance officielle
node scripts/check-wakies-source.mjs
```

## 3. Messagerie et référence OpenMuse

Lire [MESSAGING.md](MESSAGING.md) et les AGENTS locaux du code. Favoris et sourdine sont des préférences serveur. Les notifications durables ne sont produites que pour un tour terminé ; une réponse partielle reste dans l’historique sans alerte. La lecture demande une page visible et la fin du fil visible. La fusion SWR conserve les pages anciennes et protège le streaming.

Le serveur et l’OAuth Google autonomes OpenMuse ont été retirés après vérification de leurs usages. `integration/web`, les médias, la licence, la référence mobile adaptée et son domaine partagé sont conservés. Le manifeste distingue les sources conservées, retirées et adaptées ; ne pas réintroduire une configuration mono-propriétaire ou des variables Google comme authentification mAI.
