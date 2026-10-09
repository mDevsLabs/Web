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
import type { Post } from "@/lib/vibe/types/vibe";

/** Fil principal (/vibe) */
export function VibeFeedRoute() {
  const navigate = useNavigate();
  return (
    <HomePage
      onOpenProfile={(username: string) =>
        navigate(`/@${username.replace(/^@/, "")}`)
      }
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
    />
  );
}

/** Exploration (/vibe/explore, /vibe/explore/:tab) */
export function VibeExploreRoute() {
  const navigate = useNavigate();
  return (
    <ExplorePage
      onOpenProfile={(username: string) =>
        navigate(`/@${username.replace(/^@/, "")}`)
      }
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
    />
  );
}

/** Détail d'une publication (/vibe/post/:postId) */
export function VibePostRoute() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  return (
    <PostDetailPage
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
export function VibeProfileRoute() {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const clean = username ? username.replace(/^@/, "") : undefined;
  return (
    <ProfilePage
      onBack={() => navigate(-1)}
      onOpenProfile={(u: string) => navigate(`/@${u.replace(/^@/, "")}`)}
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
      username={clean}
    />
  );
}

export function VibeNotificationsRoute() {
  return <NotificationsPage />;
}

export function VibeMessagesRoute() {
  return <MessagesPage />;
}

export function VibeMaiRoute() {
  return <MAIStudioPage />;
}

export function VibeSettingsRoute() {
  return <SettingsPage />;
}

/** Livres — `/vibe/books` liste, `/vibe/books/:bookId` ouvre un livre. */
export function VibeBooksRoute() {
  return <BooksPage />;
}

/** Invitation à rejoindre un livre (`/vibe/books/join/:code`) */
export function VibeBooksJoinRoute() {
  return <BooksJoinPage />;
}

/** Statistiques créateur (`/vibe/stats`) */
export function VibeStatsRoute() {
  return <StatsPage />;
}
