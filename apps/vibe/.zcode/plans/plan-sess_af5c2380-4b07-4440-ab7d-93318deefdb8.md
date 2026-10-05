# Plan — Vibe : partage de post, mentions @, compteur de vues, épinglage, onglets notifications, Bloquer/Masquer

## Contexte (constats de l'analyse)
- Backend **Hono/Deno à la racine** (`vibe-posts.ts`, `vibe-users.ts`, `vibe-dms.ts`…), Neon Postgres, routes enregistrées sous 4 alias via `registerMulti`. Frontend **React 19 + Tailwind dans `src/`**.
- **`posts.views_count` et `posts.is_pinned` existent déjà** en base (jamais utilisés) → aucune migration nécessaire pour ces colonnes.
- Lib **`qrcode` déjà installée** ; `ProfileShareModal.tsx` = référence pour copie de lien/QR.
- **DM** : `ApiService.sendMessage(recipient_id, content)` existe déjà ; recherche d'utilisateurs : `ApiService.searchUsers(q)`.
- **Blocage existant** : table `blocked_users` + `POST /v1/dms/block`, mais appliqué aux DM uniquement. **Aucun mute** n'existe.
- **Onglets notifications déjà présents** (Toutes / J'aime / Mentions / Vérifiés) → il faut les *affiner*, pas les créer.
- Recommender actuel : `vibe-recommender.ts` (racine, 152 lignes, `HybridRecommender.scorePost`).

**Hypothèses retenues** (questions sans réponse) : algorithme combiné client (`src/algorithms/`) + serveur (`lib/recommendation/`) ; 4 onglets notifications conservés et affinés ; Block/Mute niveau « complet façon X ».

---

## 1. Nouveau dossier d'algorithmes côté client — `src/algorithms/`
- **`text.ts`** — détection du trigger `@` : `detectMentionTrigger(text, cursorPos) → { query, startIndex } | null`, `insertMention(text, startIndex, username)`, regex partagée `@[a-zA-Z0-9_]{1,30}` (cohérente avec `FormattedText`).
- **`format.ts`** — `formatCompactCount(n)` → format FR « 14,2k », « 1,2M ».
- **`viewTracking.ts`** — constantes (seuil visibilité 0.5, dwell 1000 ms) + dédoublonnage par session via `sessionStorage` (clé `vibe_counted_views`).
- **`feedFilter.ts`** — filtrage client des posts d'auteurs masqués/bloqués + helpers de dédup.
- **`index.ts`** — barrel d'exports.

## 2. Amélioration de l'algorithme serveur — nouveau dossier `lib/recommendation/`
- **`signals.ts`** — fonctions pures : décroissance de fraîcheur (demi-vie exponentielle), `engagementScore` intégrant les **vues** (`likes*3 + reposts*2 + replies*2 + views*0.1`), vélocité, facteur sécurité/toxicité.
- **`index.ts`** — classe `HybridRecommender` (logique actuelle améliorée : intégration du signal vues, décroissance exponentielle, poids tuner conservés, interface inchangée).
- **`vibe-recommender.ts`** devient un shim qui ré-exporte `lib/recommendation/index.ts` → imports existants (`vibe-posts.ts`, `vibe.ts`) inchangés.

## 3. Backend — endpoints + application des règles
**`vibe-posts.ts`**
- `POST /vibe/posts/:id/view` → `UPDATE posts SET views_count = COALESCE(views_count,0) + 1`, retourne le nouveau compte.
- `POST /vibe/posts/:id/pin` body `{ pinned: boolean }` (JWT, auteur uniquement) : si épinglage et ≥ 3 posts déjà épinglés → **400 `PIN_LIMIT`** ; sinon `UPDATE posts SET is_pinned`.
- `handleFeed` / `handleSearchPosts` : exclusion des auteurs masqués/bloqués via helper `resolveHiddenUserIds(viewerId)` (exporté).

**`vibe-users.ts`**
- `handleGetProfile` : `ORDER BY p.is_pinned DESC, p.published_at DESC` (épinglés en haut pour tout le monde ; `SELECT p.*` fait déjà remonter `is_pinned`) ; renvoyer les flags `isFollowing`, `blocked_by_me`, `blocked_me`, `muted_by_me`.
- `POST /vibe/users/:username/mute` `{ muted: boolean }` et `GET /vibe/users/muted`.
- `handleFollow` : refus 403 si blocage dans un sens ou l'autre.

**`vibe-dms.ts`**
- `handleNotifications` : exclure les notifications d'acteurs bloqués ou masqués par le destinataire.
- Créations de notifications (mention/reply/like) : sautées si blocage croisé. DM block : inchangé (déjà appliqué).

**Migration `lib/db/migrations/009_social_mute_block.sql`** — table `muted_users` (user_id, muted_user_id, UNIQUE) + `blocked_users` en `CREATE TABLE IF NOT EXISTS` (traçabilité, idempotent) ; appliquée via `npm run migrate`.

## 4. Frontend — types & service API
- **`src/types/vibe.ts`** : `Post.is_pinned?: boolean`, type `MutedUser`, champs de blocage sur le profil.
- **`src/services/api.ts`** : `viewPost(id)`, `setPostPinned(id, pinned)`, `muteUser(username, muted)`, `getMutedUsers()` (pattern `/v1/...` + fallback `/api/vibe/...`).

## 5. Fonctionnalités UI
**5.1 Compteur de vues** — `src/hooks/usePostViewTracking.ts` : IntersectionObserver (seuil 0.5) + dwell 1 s + dédup session + `viewPost` fire-and-forget. Dans `PostCard` : ref sur l'`<article>`, cellule non cliquable dans le footer (après Repost) : icône `BarChart2` + `formatCompactCount(views_count)` (ex. 14,2k), +1 optimiste après comptage.

**5.2 Partage (DM par défaut, lien, QR)** — `src/components/feed/PostShareModal.tsx`, 3 onglets :
- **Message** (défaut) : recherche d'utilisateurs (debounce → `searchUsers`), lignes avatar + nom + @username + badge, message éditable prérempli avec le permalink, envoi via `sendMessage` + toast de confirmation.
- **Lien** : permalink `/post/:id` + bouton copier (`navigator.clipboard`) + `navigator.share` si dispo.
- **QR Code** : QR simple via `qrcode.toDataURL(url)` sur carte blanche + téléchargement PNG.
Ouverture : item **« Partager »** du menu `...` + icône `Share2` dans le footer du post.

**5.3 Autocomplete @mentions** — `src/components/feed/MentionAutocomplete.tsx` (style `ToolAutocomplete` : `absolute bottom-full z-50 animate-scaleUp`, lignes = `ProfileAvatar` + nom + @username + `VerifiedBadge`) + `src/hooks/useMentionAutocomplete.ts` (trigger via `algorithms/text`, debounce 250 ms → `searchUsers`, **navigation clavier ↑/↓/Entrée/Échap**, insertion `@username ` remplaçant le token partiel). Branché sur **`PostComposer`** (textarea, wrapper `relative` existant) et **`CommentSection`** (input + ajout d'un wrapper `relative`). `MAIDrawer`/`MAIStudioPage` (outils mAI) inchangés.

**5.4 Épingler (max 3)** — menu `...` du `PostCard` (auteur) : « Épingler sur votre profil » / « Désépingler du profil » (`Pin`/`PinOff`) → `setPostPinned` + événement `vibe:post_updated` + toasts (erreur `PIN_LIMIT` → « Vous ne pouvez épingler que 3 posts maximum »). Affichage : petite icône punaise + étiquette **« Post épinglé »** au-dessus du contenu quand `post.is_pinned` ; l'ordre en haut de l'onglet Vibes est garanti par le backend.

**5.5 Onglets notifications** — `NotificationsPage.tsx` : filtre « Mentions » affiné à **citations + réponses directes + mentions** (`type ∈ quote/reply/mention`) ; onglets « Toutes / Mentions / J'aime / Vérifiés » ; filtre client de secours (mute/block) via `algorithms/feedFilter`.

**5.6 Bloquer / Masquer** —
- `PostCard` menu (posts d'autrui) : « Masquer @user » (`EyeOff`, silencieux) et « Bloquer @user » (`Ban`, avec `window.confirm` explicatif) → `muteUser`/`blockUser`, retrait local du post + `vibe:feed_refresh` + toast.
- `ProfilePage` : menu `...` en header (visible sur profil d'autrui) : Masquer/Réactiver, Bloquer/Débloquer selon les flags renvoyés ; bannière « Vous avez bloqué @user », bouton Suivre masqué si blocage.
- `SettingsPage` : nouvelles sections « Comptes bloqués » / « Comptes masqués » (listes + débloquer/démasquer).

## 6. Vérification
- `npm run migrate` (applique 009), puis `npm run build` (`tsc -b && vite build`) pour le typage complet.
- Parcours manuels : taper @ dans composer + commentaire ; vues incrémentées une fois/post/session ; épingler 3 posts puis 4e refusé ; partage DM/lien/QR ; filtres notifications ; mute/block invisibles côté feed et notifications.

**Fichiers touchés** : ~20 (5 nouveaux dans `src/algorithms/`, 2 dans `lib/recommendation/`, 1 migration, 2 hooks, 2 nouveaux composants, et modifications de `PostCard`, `PostComposer`, `CommentSection`, `ProfilePage`, `NotificationsPage`, `SettingsPage`, `api.ts`, `vibe.ts`, `vibe-posts.ts`, `vibe-users.ts`, `vibe-dms.ts`, `vibe-recommender.ts`).