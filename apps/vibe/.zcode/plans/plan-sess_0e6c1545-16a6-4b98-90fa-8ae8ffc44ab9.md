# Vibe 0.8.0 — Nouveau style, mobile, IA & features sociales

Architecture confirmée : React 19 + Vite + Tailwind v4 (frontend `src/`), backend Hono/Deno (`*.ts` racine, Neon Postgres, stockage S3, IA via OpenRouter). Choix validés : police **Plus Jakarta Sans**, **barre d'onglets en bas** sur mobile, menu 3 points **conservé à droite**, style **liquid-glass raffiné**.

---

## A. Version + nouveau style
1. `package.json` : `0.7.0` → `0.8.0`.
2. `index.html` (l.20-22) : remplacer Inter par **Plus Jakarta Sans** (Google Fonts, poids 200..800, `display=swap`).
3. `src/index.css` :
   - `--font-sans: 'Plus Jakarta Sans', …` dans le bloc `@theme` (l.4) — seul point de définition, tout le reste suit.
   - Raffinement liquid-glass : ombres/bordures de cartes, focus rings cohérents, hover states, transitions, scrollbars — identité (tokens, accent) conservée.

## B. Expérience mobile
1. Nouveau `src/components/layout/MobileTabBar.tsx` : barre fixe en bas — Accueil, Explorer, Notifications (badge), Messages (badge), Profil — états actifs, cibles tactiles ≥ 44px, `padding-bottom: env(safe-area-inset-bottom)`. **Remplace** le FAB hamburger (`MobileNav.tsx` supprimé, usage retiré d'`App.tsx`).
2. Boutons flottants empilés au-dessus de la barre (droite) : **Composer** (accent) + **mAI** (Sparkles → ouvre le drawer).
3. Safe-areas : utilitaires CSS (`pt-safe`, `pb-safe`…) dans `index.css`, appliqués aux headers sticky (Home, PostDetail, Profile) avec `max(env(safe-area-inset-top), …)`.
4. Composer modal (`App.tsx`) : ancré en bas sur mobile (`items-end sm:items-start`), `h-dvh`, zone scrollable, gestion clavier.
5. `index.html` : réactivation du pinch-zoom (retrait `user-scalable=no` / `maximum-scale=1`) — accessibilité.
6. Padding bas du contenu (`pb-24`) pour dégager la barre ; entrée **Paramètres** (engrenage) ajoutée au header de `ProfilePage` (compense la disparition du drawer).

## C. Badge « Créé avec l'IA » + réglage par défaut
1. Migration `lib/db/migrations/008_ai_and_quotes.sql` (ALTER idempotents) + « ensure » paresseux dans le code (même pattern que `ensurePersonalizationColumns`) :
   - `posts.ai_generated BOOLEAN DEFAULT FALSE`
   - `posts.quoted_post_id UUID` (phase F)
   - `user_settings.posts_ai_generated_by_default BOOLEAN DEFAULT FALSE`
2. `vibe-posts.ts` `handleCreatePost` : accepte `ai_generated` ; si absent → lit `posts_ai_generated_by_default` de l'utilisateur.
3. `vibe-settings.ts` : colonne ajoutée aux 3 endroits (colonnes INSERT, VALUES, `DO UPDATE SET` CASE).
4. Frontend : `Post.ai_generated`, `UserSettings.posts_ai_generated_by_default` (`types/vibe.ts`) ; **PostComposer** : toggle « Créé avec l'IA » (Sparkles) initialisé depuis les réglages et envoyé à `createPost` ; `api.ts` `createPost` étendu.
5. **PostCard** : badge « Créé avec l'IA » si `ai_generated` (le badge « mAI Post » existant reste pour `created_via='mai_agent'`).
6. **SettingsPage** : toggle dans la section « Intelligence Artificielle mAI ».

## D. Mentionner un post vers mAI (drawer latéral)
1. Backend `handleMAIChat` (`vibe-mai.ts`) : accepte `context.post_id` ; construit le contexte complet — post (auteur, contenu), stats (likes, réponses), **10 premiers commentaires**, médias. **Images envoyées comme fichiers** : fetch des octets → base64 data URL → content parts multimodales `[{type:'text'},{type:'image_url', image_url:{url:'data:…'}}]` (jamais de simple URL). Si images présentes → modèle vision forcé (`gpt-4o` via mapping existant, fallback `gemini-2.5-flash`), sinon comportement actuel inchangé.
2. `api.ts` `chatMAI` : 4ᵉ paramètre optionnel `context`.
3. **MAIDrawer** : saisie `@` ou `/` → nouvel item « Mentionner un post… » dans l'autocomplétion existante → sélecteur de posts (recherche via `/v1/search` si présente, sinon légère route `GET /v1/posts/search` ajoutée) → chip « Post de @user » retirable au-dessus de l'input → envoi avec `context.post_id` ; la bulle utilisateur affiche la pièce jointe.
4. Bouton **« Mentionner dans mAI »** : dans le header de `PostDetailPage` + entrée « Demander à mAI » du menu 3 points (`PostCard`) → event `vibe:open_mai {postId}` → `App.tsx` ouvre le drawer avec le post pré-attaché.

## E. Algorithme affinable (menu 3 points, à droite)
1. Endpoint `POST /v1/posts/:id/feedback` `{value:'more'|'less'|null}` : lignes `post_interactions` (types `interest_more`/`interest_less`, upsert + suppression du contraire). Feed et `getPost` renvoient `my_feedback`.
2. `handleFeed` (Pour vous) : charge les 200 derniers retours + `profiles.interests` (enfin exploités) → signaux : poids par auteur (boost/pénalité plafonnés) + recouvrement mots-clés/hashtags/centres d'intérêt.
3. `vibe-recommender.ts` : nouveau signal `interestScore` dans `scorePost` (ajustement multiplicatif borné ≈ ×0.55–×1.5), intégré au `scoreBreakdown` et aux explications (« D'après vos retours… »).
4. **PostCard** (menu) : « Cela m'intéresse » / « Cela ne m'intéresse pas » — état coché via `my_feedback`, toggle optimiste, toast « Vos Vibes futures seront affinées ».

## F. Citer un post
1. Backend : `handleCreatePost` accepte `quoted_post_id` (validation existence/visibilité) + notification type `quote` à l'auteur cité. Helper `attachQuotedPosts(sql, posts)` : 1 requête jointe → champ `quoted_post` {username, display_name, avatar_url, content, media_assets} ; branché sur le feed (3 modes), `getPost` et les posts de profil.
2. `api.ts` `createPost` : param `quotedPostId` ; type `Post.quoted_post`.
3. **PostCard** : bouton **« Citer »** dans la barre d'actions → event `vibe:open_composer {quotedPost}` ; rendu du bloc citation sous le texte (avatar, nom, @user, extrait 4 lignes, vignette média) — clic → ouvre le post cité (`stopPropagation`).
4. **PostComposer** : prop `initialQuotedPost` + aperçu retirable ; `App.tsx` étend `composerDraft` avec `quotedPost`.
5. La citation est un **post à part entière** : elle apparaît sur le profil de son auteur, avec le post original intégré.

## Vérifications
- `npm run build` (tsc + vite) et `npm run lint` sans erreur.
- Comparateur memo de `PostCard` intact : nouvelles actions via window events, pas de nouvelles props.
- Schéma non destructif : colonnes idempotentes + ensure runtime (compatible Deno Deploy sans migration manuelle).
- Points de vigilance : modèle par défaut sans vision → bascule automatique si images ; existence de `/v1/search` vérifiée, sinon route ajoutée.