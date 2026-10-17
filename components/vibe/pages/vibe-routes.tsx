/**
 * ============================================================================
 * VIBE — ADAPTATEURS DE ROUTE (components/vibe/pages/vibe-routes.tsx)
 * ============================================================================
 *
 * Les pages Vibe reçoivent leur navigation par PROPS : `onOpenThread`,
 * `onOpenProfile`, `onBack`. C'était le routeur Vite qui les injectait depuis
 * `App.tsx`. Ce routeur n'existe plus — la navigation passe par l'adaptateur
 * `components/vibe/router.tsx`.
 *
 * Plutôt que de réécrire chaque page pour importer `useNavigate` (quinze
 * signatures à reprendre), on garde les props et on fournit ici les
 * implémentations. Les pages restent inchangées, et chaque route de l'App
 * Router se réduit à un appel de deux lignes.
 *
 * Les segments dynamiques sont lus via `useParams()` de l'adaptateur, qui les
 * dérive du chemin Vibe : `/vibe/post/:postId` et `/vibe/books/:bookId`
 * fonctionnent sans prop.
 */

"use client";

import { BooksJoinPage } from "@/components/vibe/pages/BooksJoinPage";
import { BooksPage } from "@/components/vibe/pages/BooksPage";
import { ExplorePage } from "@/components/vibe/pages/ExplorePage";
import { HomePage } from "@/components/vibe/pages/HomePage";
import { MAIStudioPage } from "@/components/vibe/pages/MAIStudioPage";
import { MessagesPage } from "@/components/vibe/pages/MessagesPage";
import { NotificationsPage } from "@/components/vibe/pages/NotificationsPage";
import { PostDetailPage } from "@/components/vibe/pages/PostDetailPage";
import { ProfilePage } from "@/components/vibe/pages/ProfilePage";
import { SettingsPage } from "@/components/vibe/pages/SettingsPage";
import { StatsPage } from "@/components/vibe/pages/StatsPage";
import { useNavigate, useParams } from "@/components/vibe/router";
import type { Post, VibeHydrationSeed } from "@/lib/vibe/types/vibe";

/**
 * Seed serveur optionnel, produit par `getVibeHydration` dans les pages
 * générées. Le type miroir vient de `lib/vibe/types/vibe.ts` : le module
 * d'hydratation lui-même est `server-only` et ne doit jamais être importé ici.
 */
type VibeRouteProps = { hydration?: VibeHydrationSeed<unknown> };

/** Fil principal (/vibe) */
export function VibeFeedRoute({ hydration }: VibeRouteProps) {
  const navigate = useNavigate();
  return (
    <HomePage
      hydration={hydration}
      onOpenProfile={(username: string) =>
        navigate(`/@${username.replace(/^@/, "")}`)
      }
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
    />
  );
}

/** Exploration (/vibe/explore, /vibe/explore/:tab) */
export function VibeExploreRoute({ hydration }: VibeRouteProps) {
  const navigate = useNavigate();
  return (
    <ExplorePage
      hydration={hydration}
      onOpenProfile={(username: string) =>
        navigate(`/@${username.replace(/^@/, "")}`)
      }
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
    />
  );
}

/** Détail d'une publication (/vibe/post/:postId) */
export function VibePostRoute({ hydration }: VibeRouteProps) {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  return (
    <PostDetailPage
      hydration={hydration}
      onBack={() => navigate(-1)}
      onOpenProfile={(username: string) =>
        navigate(`/@${username.replace(/^@/, "")}`)
      }
      postId={postId || ""}
    />
  );
}

/**
 * Profil — couvre `/vibe/u/:username`, `/vibe/profile/:username` et le profil
 * propre `/vibe/profile`. L'adaptateur normalise le `@` en tête de segment.
 */
export function VibeProfileRoute({ hydration }: VibeRouteProps) {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const clean = username ? username.replace(/^@/, "") : undefined;
  return (
    <ProfilePage
      hydration={hydration}
      onBack={() => navigate(-1)}
      onOpenProfile={(u: string) => navigate(`/@${u.replace(/^@/, "")}`)}
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
      username={clean}
    />
  );
}

export function VibeNotificationsRoute({ hydration }: VibeRouteProps) {
  return <NotificationsPage hydration={hydration} />;
}

export function VibeMessagesRoute({ hydration }: VibeRouteProps) {
  return <MessagesPage hydration={hydration} />;
}

export function VibeMaiRoute() {
  return <MAIStudioPage />;
}

export function VibeSettingsRoute({ hydration }: VibeRouteProps) {
  return <SettingsPage hydration={hydration} />;
}

/** Livres — `/vibe/books` liste, `/vibe/books/:bookId` ouvre un livre. */
export function VibeBooksRoute({ hydration }: VibeRouteProps) {
  return <BooksPage hydration={hydration} />;
}

/** Invitation à rejoindre un livre (`/vibe/books/join/:code`) */
export function VibeBooksJoinRoute({ hydration }: VibeRouteProps) {
  return <BooksJoinPage hydration={hydration} />;
}

/** Statistiques créateur (`/vibe/stats`) */
export function VibeStatsRoute({ hydration }: VibeRouteProps) {
  return <StatsPage hydration={hydration} />;
}
