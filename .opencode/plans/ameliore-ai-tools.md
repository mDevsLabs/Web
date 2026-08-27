# Plan d'amélioration des outils IA (`lib/ai/tools/`)

## Problème identifié (root cause)
- `createDocument` (`create-document.ts`) n'a pas de paramètre `content`. Il crée le document via `documentHandler.onCreateDocument` qui génère du contenu par `streamText(prompt: title)`. Quand l'IA veut créer un document avec un texte précis (déjà généré dans la réponse), le contenu n'est pas transmis au document : il est soit vide, soit réécrit par le modèle au lieu d'être celui souhaité.
- `updateDocument` (`update-document.ts`) fonctionne uniquement en `description` (réécriture par le modèle), sans possibilité d'injecter directement `content`.
- `editDocument` (`edit-document.ts`) est correct mais manque de robustesse : pas de vérification du format `id`, pas de support de `content` direct, messages d'erreur améliorables, pas de `title` optionnel.

---

## Phase 1 — Corriger le flux document (priorité haute)

### 1.1 `lib/ai/tools/create-document.ts`
- **Ajouter** `content?: string` au `inputSchema` (max 200_000, optionnel).
- **Modifier `execute`** :
  - Si `content` est fourni et non vide :
    - Générer `id`.
    - Écrire `data-kind`, `data-id`, `data-title`, `data-clear`.
    - Appeler directement `saveDocument({ id, title, kind, content, userId: session.user.id })` (importer depuis `@/lib/db/queries`).
    - Streamer `content` via `dataStream.write({ type: "data-textDelta" / "data-codeDelta" / "data-sheetDelta" / "data-htmlDelta", data: content, transient: true })` selon `kind`.
    - Écrire `data-finish`.
    - Retourner `{ content: "Document créé avec contenu direct.", id, kind, title }`.
  - Si `content` absent : conserver le comportement actuel (`documentHandler.onCreateDocument`).
- **Améliorer la description** de l'outil pour indiquer que `content` peut être fourni directement.

### 1.2 `lib/ai/tools/update-document.ts`
- **Ajouter** `content?: string` au `inputSchema` (max 200_000).
- **Modifier `execute`** :
  - Si `content` fourni : vérifier permissions, sauvegarder directement avec `saveDocument`, streamer le contenu selon `kind`, écrire `data-finish`.
  - Sinon : conserver le comportement `documentHandler.onUpdateDocument` avec `description`.
- **Ajouter** la vérification de `session.user?.id` plus robuste (comme dans `edit-document.ts`).

### 1.3 `lib/artifacts/server.ts` (si nécessaire)
- Optionnel : étendre `CreateDocumentCallbackProps` avec `content?: string` pour que les handlers (`textDocumentHandler`, etc.) puissent l'utiliser si on choisit de ne pas bypass le handler. **Recommandation** : plutôt que de modifier 4 handlers, faire le bypass direct dans `create-document.ts` (plus rapide, moins risqué).

---

## Phase 2 — Améliorer `edit-document.ts`

### 2.1 Robustesse et ux
- **Valider** `id` : format UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`), message explicite si invalide.
- **Ajouter** `title?: string` dans le schéma (pour renommer le document lors de l'édition si besoin).
- **Améliorer** le message d'erreur `old_string introuvable` : suggérer d'utiliser `updateDocument` si le changement est massif, et donner un exemple de contexte (3 lignes).
- **Optimiser** le stream : envoyer `data-textDelta` / `data-codeDelta` / etc. en chunks si `updated` est long, pour éviter un blocage UI.
- **Corriger** la logique de permission : unifier avec `session.user?.id || session.user?.email` et comparer strictement avec `document.userId`.
- **Optionnel** : ajouter un paramètre `content?: string` (remplacement total direct sans `old_string`) pour cas d'usage "remplacer tout le document par ce texte". Si fourni, ignorer `old_string`/`new_string`.

---

## Phase 3 — Améliorer les autres outils

### 3.1 `note.ts`
- Déjà très complet. Améliorations mineures :
  - Ajouter un paramètre `tags` avec validation stricte (déjà présent, vérifier que le client les utilise).
  - S'assurer que `dataStream.write` envoie plusieurs chunks si `built` > 5000 caractères (actuellement un seul bloc).

### 3.2 `calculator.ts`
- Ajouter `operation: "solve_equality"` pour équations simples (`2x+3=7`).
- Améliorer la sécurité de `safeEvalExpression` : ajouter un blocage des chaînes `String(` et `Function(` explicites.
- Ajouter `description` dans la réponse pour chaque résultat (`formatted` est bon, mais un `explanation` aide l'IA).

### 3.3 `code-execution.ts`
- Vérifier que le sandbox limite correctement le temps d'exécution et que le résultat est streamé correctement au `dataStream`.
- Ajouter `language` dans le schéma d'entrée pour que l'IA précise le langage au lieu de deviner.

### 3.4 `web-search.ts`
- Améliorer la description pour indiquer explicitement que les résultats doivent être source de vérité (pas de synthèse hallucinée).
- Ajouter un paramètre `maxResults?: number` (défaut 5, max 10) au schéma.

### 3.5 `request-suggestions.ts`
- Vérifier que la suggestion est pertinente au contexte de la conversation (passer `context` si possible).
- Améliorer le schéma pour inclure `category?: "topic" | "action" | "clarification"`.

### 3.6 `audio-generate.ts` / `image-generate.ts`
- Vérifier que `dataStream` reçoit le `url` ou `id` généré pour affichage immédiat.
- Ajouter `description` dans le schéma (pour que l'IA décrive ce qu'elle veut générer, améliorant la qualité).

### 3.7 `config.ts`
- Documenter clairement comment les outils sont enregistrés dans le chatbot.

---

## Phase 4 — Tests et validation (après modifications)

- Vérifier que `createDocument({ title: "Test", kind: "text", content: "Hello" })` crée un document avec `content = "Hello"` et que le stream affiche le texte.
- Vérifier que `updateDocument({ id: "...", content: "New" })` met à jour correctement.
- Vérifier que `editDocument({ id: "...", old_string: "Hello", new_string: "Hi" })` fonctionne toujours.
- Tester chaque `kind` (`text`, `code`, `sheet`, `html`) avec `content` direct.

---

## Fichiers à modifier (liste finale)

| Fichier | Modifications |
|---|---|
| `lib/ai/tools/create-document.ts` | + `content`; bypass direct + save + stream |
| `lib/ai/tools/update-document.ts` | + `content`; bypass direct + save + stream |
| `lib/ai/tools/edit-document.ts` | + validation id, + title, + content direct optionnel, messages améliorés |
| `lib/ai/tools/note.ts` | + chunk stream si long |
| `lib/ai/tools/calculator.ts` | + solve_equality, + explication, + sécurité |
| `lib/ai/tools/code-execution.ts` | + language param, + vérif stream |
| `lib/ai/tools/web-search.ts` | + maxResults, + description source |
| `lib/ai/tools/request-suggestions.ts` | + category, + contexte |
| `lib/ai/tools/audio-generate.ts` | + description param |
| `lib/ai/tools/image-generate.ts` | + description param |
| `lib/artifacts/server.ts` | Optionnel : `content?` dans props (si on modifie handlers au lieu de bypass) |

---

## Décision requise (optionnel avant exécution)
- **A.** Faire le bypass direct dans `create/update-document` (recommandé : rapide, pas besoin de toucher 4 handlers).
- **B.** Modifier `CreateDocumentCallbackProps` et chaque `artifact/server` (*text, code, html, sheet*) pour accepter `content`. (Plus propre archi, mais plus long.

*Recommandation : option A pour la correction immédiate du bug "texte non mis", puis option B si besoin d'homogénéité profonde.*
