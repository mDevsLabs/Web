# Plan d'améliorations — mAI Vibe

Architecture actuelle : SPA React 19 + Vite (`src/`), backend Hono unique (Val Town/Deno, `*.ts` racine), Neon Postgres + SQLite legacy, stockage S3 "Z1".

## Phase 1 — Corrections de bugs critiques

1. **Profil — modifications non enregistrées**
   - `vibe-users.ts` : remplacer l'upsert `COALESCE(EXCLUDED.x, profiles.x)` par une écriture réelle des champs envoyés (permettre de vider bio/interests).
   - `ProfilePage.tsx` : après sauvegarde, mettre à jour `AuthContext.user` avec la réponse du serveur (nouveau username inclus) au lieu de refetcher avec l'ancien ; afficher les erreurs (fini le `catch {}` silencieux) ; toast de confirmation.
   - `AuthContext.tsx` : ajouter `updateUser()` qui synchronise user + username ; `refreshProfile()` utilise l'user à jour.

2. **Photos de profil & bannières**
   - Supprimer le doublon de routes `/v1/upload-avatar` (garder le handler storage.ts, déléguer depuis vibe-users.ts).
   - Dans `storage.ts` : si S3/Z1 indisponible → fallback stockage de l'image (base64 en table `media_assets` / retour d'URL data:) pour que l'upload fonctionne toujours ; messages d'erreur explicites côté UI.

3. **Abonnement / follow**
   - Backend `GET /v1/profiles/:username` : renvoyer `is_following` (selon le token).
   - Frontend : initialiser `isFollowing` depuis la réponse, rafraîchir compteurs + bouton immédiatement après toggle (maj optimiste puis synchro serveur).

4. **Profil — Chargement des posts**
   - Ajouter un état `loading` dédié : squelette "Chargement…" pendant le fetch, "Aucun post" uniquement si fetch réussi et 0 post, message d'erreur + bouton réessayer sinon.
   - Optimiser le N+1 (media chargé en une requête `IN (...)`).

5. **Commentaires**
   - `scripts/migrate.js` : migration `ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid, depth int DEFAULT 0, likes_count int DEFAULT 0` (+ table `comment_likes`).
   - `vibe-posts.ts` : corriger le cast `::uuid` (paramètres bindés propres), gérer les réponses imbriquées (depth ≤ 3 ou aplati avec `parent_username`).
   - Nouvel endpoint like/unlike commentaire + bouton cœur dans `CommentSection.tsx`.
   - Supprimer les faux commentaires de démo en fallback ; afficher vraie erreur.
   - UI : répondre à un commentaire (inline), liker, liker un commentaire-réponse.

6. **Login / vérification**
   - `AuthModal.tsx` : état "Connexion…" avec spinner dès la soumission email+mdp, transition fluide vers l'étape vérification (éviter le blocage silencieux si la réponse diffère de `verification_required`).
   - `AuthContext.fetchSession` : ne plus supprimer le token sur erreur réseau/500 (seulement sur 401).
   - Feed : montage dès l'authentification + préchargement du feed pendant l'étape vérification (warm-up) ; limiter le double appel `/v1/usage/log` (debounce/dédup).

## Phase 2 — Navigation & UI mobile

7. **Barre Liquid Glass latérale sur mobile** (remplace la nav basse de `App.tsx:153-197`)
   - Nouveau composant `SideNav` : bouton flottant (FAB glass) en haut à gauche qui déroule un panneau latéral (drawer) avec effet Liquid Glass (`backdrop-blur-2xl`, translucidité, bordures lumineuses), icônes + labels, animation slide.
   - Supprimer la bottom nav `sm:hidden` ; conserver la sidebar desktop.

## Phase 3 — Paramètres & Notifications

8. **Paramètres** (`SettingsPage.tsx`) : réorganisation en sections claires (Compte, Apparence, Confidentialité, Notifications, Abonnement), sauvegarde avec retour visuel, corriger le 2FA codé en dur "ACTIF".
9. **Notifications**
   - `NotificationsPage.tsx` : bouton "Activer les notifications" si `Notification.permission !== 'granted'` → `requestPermission()` (desktop + mobile PWA), état par permission (accordée/refusée/par défaut), instructions par plateforme.
   - `notificationService.ts` : intégration au service worker (`sw.js`) pour notifications même app fermée (optionnel), déduplication des toasts.
   - Améliorer la page : regroupement par jour, icônes par type (like/repost/follow/DM), lu/non-lu, tout marquer comme lu.

## Phase 4 — DMs enrichis

10. **Réactions, répondre, transférer, copier** (`MessagesPage.tsx`)
    - Backend : table `dm_reactions(message_id, user_id, emoji)`, colonnes `reply_to_id`, endpoint réactions + inclusion `reply_to` dans les réponses.
    - UI : appui/clic long ou bouton ⋯ sur bulle → menu (Réagir, Répondre, Transférer, Copier, Copier le texte) ; picker d'emojis (❤️ 😂 👍 😮 😢) affiché sous la bulle ; bulles de réponse avec citation ; transfert = sélecteur de conversation ; copier via clipboard.
    - Rendre les URLs média cliquables sans les dupliquer dans le texte.

11. **IA dans les DMs**
    - Bouton "✨ mAI" dans le composer → génère une suggestion de réponse via l'API mAI (contexte = derniers messages de la conversation), préremplit le champ (envoi manuel par l'utilisateur).

12. **"Publier sur Vibe" pré-rempli**
    - `MAIStudioPage.tsx` : remplacer `handlePublishAsPost` (publication directe) par l'ouverture du composer prérempli avec le texte de la réponse mAI (et l'image si présente), l'utilisateur valide lui-même.

## Phase 5 — Coche bleue

13. Supprimer la checkbox "Compte Vérifié" de l'édition de profil (`ProfilePage.tsx:444-458`) et l'écriture de `is_verified` côté backend profil ; le badge reste automatique pour tiers Plus/Pro/Max (`VerifiedBadge.tsx` inchangé) ; sur les comptes gratuits, afficher une petite info "✓ Disponible avec Plus, Pro et Max" avec lien vers les offres.

## Phase 6 — Outils mAI & app mobile

14. **Outils d'IA** : ajouter au fleet `generate_vibe_image` une vraie génération via l'API images existante (`images.ts`) au lieu d'URLs Unsplash ; nouveaux outils : `draft_reply` (DM), `suggest_post` ; uniformiser `src/data/maiTools.ts` avec `MAI_TOOLS` backend.
15. **App mobile Capacitor**
    - Ajouter Capacitor (android + ios platforms), config (`capacitor.config.ts` : appId `com.mcompany.vibe`, server vers l'URL Vercel), build du SPA → sync → compilation.
    - Nouveau workflow `.github/workflows/build-mobile.yml` : on push tag/workflow_dispatch → build web, `npx cap sync`, `./gradlew assembleRelease` (APK signé si secrets keystore fournis, sinon APK debug) + upload artifact ; job iOS `macos-latest` → `xcodebuild` archive export IPA (signé si secrets Apple, sinon archive non signée) + artifact.
16. Vérification finale : `npm run build` propre, test des parcours (login → feed, profil, upload, follow, commentaires, DMs).

## Ordre d'exécution
Phases 1 → 2 → 3 → 4 → 5 → 6, avec commit à chaque phase. Toutes les modifications backend sont rétrocompatibles (aliases `/v1`, `/api/vibe`, `/vibe` conservés).