/**
 * ============================================================================
 * VIBE — COQUILLE APPLICATIVE (components/vibe/vibe-app.tsx)
 * ============================================================================
 *
 * Rôle
 *
 * Ce composant est l'hôte de toutes les pages Vibe : il monte les providers
 * (thème, session, lecteur audio), la navigation (barre latérale, onglets
 * mobiles), les surfaces globales (tiroir mAI, composeur, toasts, onboarding)
 * et le canal temps réel. Il affiche ensuite `children` — c'est-à-dire la page
 * que l'App Router a résolue.
 *
 * CE QUI A CHANGÉ PAR RAPPORT À LA VERSION VITE
 *
 * 1. Le routeur disparaît. `App.tsx` Vite déclarait ses routes avec
 *    `<Routes>/<Route>` et rendait lui-même chaque page en `lazy()`. Ici, les
 *    routes sont de vrais segments d'`app/(chat)/vibe/**` : le serveur choisit la
 *    page, l'App Router gère l'historique et les deep-links, et ce composant
 *    n'a plus qu'à fournir le décor. `useLocation`/`useNavigate` viennent de
 *    `components/vibe/router.tsx`, calé sur `/vibe`.
 *
 * 2. La gestion du scroll change de nature. Le `ScrollManager` de la version
 *    Vite indexait les positions par `location.key` de react-router et
 *    interceptait `window.scrollTo`. Ici, `appNewScrollHandler` (next.config.ts)
 *    gère le scroll de l'App Router, y compris la restauration pour les
 *    navigations navigateur. Réimplémenter ce mécanisme en parallèle produirait
 *    deux écritures sur `scrollY` et des sauts de position au retour arrière.
 *
 * 3. Le son du terminal : `console.error` reste utilisé par les composants
 *    Vibe d'origine ; on n'ajoute pas de `logger` ici, ce n'est pas le sujet.
 *
 * LE THÈME EST POSÉ SUR `.vibe-root`, PAS SUR `<html>`
 *
 * `ThemeProvider` (lib/vibe/context/ThemeContext.tsx) appliquait `.dark`/
 * `.light` au `documentElement`. Intégré, cela aurait basculé le thème de
 * TOUTE l'application mAI — y compris le chat et le sidebar — depuis la page
 * Vibe. Les classes sont donc portées par l'élément racine Vibe, et les tokens
 * correspondants sont définis sous `.vibe-root` (components/vibe/vibe.css).
 */

"use client";

import { AlertCircle, CheckCircle, Info, Loader2, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { OfflineBanner } from "@/components/vibe/common/OfflineBanner";
import { OnboardingModal } from "@/components/vibe/common/OnboardingModal";
import { PageSkeleton } from "@/components/vibe/common/PageSkeleton";
import { FloatingAudioPlayer } from "@/components/vibe/feed/FloatingAudioPlayer";
import { PostComposer } from "@/components/vibe/feed/PostComposer";
import { MAIDrawer } from "@/components/vibe/layout/MAIDrawer";
import { MobileTabBar } from "@/components/vibe/layout/MobileTabBar";
import { Sidebar } from "@/components/vibe/layout/Sidebar";
import { AuthModal } from "@/components/vibe/pages/AuthModal";
import { useLocation, useNavigate } from "@/components/vibe/router";
import { AudioPlayerProvider } from "@/lib/vibe/context/AudioPlayerContext";
import { AuthProvider, useAuth } from "@/lib/vibe/context/AuthContext";
import { ThemeProvider } from "@/lib/vibe/context/ThemeContext";
import { VibeSessionBridge } from "@/lib/vibe/context/VibeSession";
import { useVisualViewport } from "@/lib/vibe/hooks/useVisualViewport";
import { applyAnimationsAttribute } from "@/lib/vibe/services/animationPrefs";
import { ApiService } from "@/lib/vibe/services/api";
import type { InAppToast } from "@/lib/vibe/services/notificationService";
import { RealtimeService } from "@/lib/vibe/services/realtimeService";
import type { Post } from "@/lib/vibe/types/vibe";

/** Durée d'affichage d'un toast en application, en millisecondes. */
const TOAST_DUREE_MS = 4000;

export interface VibeAppProps {
  /** Page résolue par l'App Router. */
  children: React.ReactNode;
  /** Jeton de session lu côté serveur dans le cookie `mai_session_token`. */
  sessionToken: string | null;
}

/**
 * Racine cliente de /vibe. Les providers sont ici plutôt que dans le layout
 * serveur : `ThemeProvider` et `AuthProvider` lisent `localStorage` au montage
 * et n'ont de sens que dans un composant client.
 */
export function VibeApp({ sessionToken, children }: VibeAppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VibeSessionBridge sessionToken={sessionToken} />
        <AudioPlayerProvider>
          <VibeShell>{children}</VibeShell>
        </AudioPlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function VibeShell({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoadingSession,
    showOnboarding,
    dismissOnboarding,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMAIDrawerOpen, setIsMAIDrawerOpen] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<{
    content?: string;
    imageUrl?: string;
    quotedPost?: Post;
    editPost?: Post;
  } | null>(null);
  const [maiAttachedPostId, setMaiAttachedPostId] = useState<string | null>(
    null
  );
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const editingPost = composerDraft?.editPost || null;

  const refreshUnreadCounts = useCallback(async () => {
    if (document.hidden) {
      return;
    }
    try {
      const counts = await ApiService.getUnreadCounts();
      setUnreadNotifications(counts.unread_notifications || 0);
      setUnreadMessages(counts.unread_messages || 0);
    } catch {
      // Repli : endpoint léger indisponible → comptage local.
      try {
        const [notifRes, convRes] = await Promise.all([
          ApiService.getNotifications(),
          ApiService.getConversations(),
        ]);
        setUnreadNotifications(
          (notifRes?.notifications || []).filter((n) => !n.is_read).length
        );
        setUnreadMessages(
          (convRes?.conversations || []).reduce(
            (sum, conv) => sum + (conv.unread_count || 0),
            0
          )
        );
      } catch {
        // Les compteurs restent à zéro : un badge absent vaut mieux qu'un crash.
      }
    }
  }, []);

  useEffect(() => {
    applyAnimationsAttribute();
  }, []);

  // Suit le clavier virtuel (iOS) : publie --vibe-kb-offset pour les zones de saisie.
  useVisualViewport();

  // Comptes non lus + flux temps réel (SSE). L'intervalle n'est qu'un filet de
  // sécurité : les badges sont poussés par le serveur.
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    refreshUnreadCounts();

    const token = ApiService.getToken();
    if (token) {
      RealtimeService.start(token);
    }
    const handleUnread = () => {
      refreshUnreadCounts();
    };
    const handleRealtimeUnread = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail) {
        return;
      }
      if (detail.unread_notifications !== undefined) {
        setUnreadNotifications(Number(detail.unread_notifications) || 0);
      }
      if (detail.unread_messages !== undefined) {
        setUnreadMessages(Number(detail.unread_messages) || 0);
      }
    };
    const handleRealtime = (event: Event) => {
      const type = (event as CustomEvent).detail?.type;
      if (type === "notification" || type === "dm_message") {
        refreshUnreadCounts();
      }
    };
    window.addEventListener("vibe:realtime_unread", handleRealtimeUnread);
    window.addEventListener("vibe:realtime", handleRealtime);
    window.addEventListener("vibe:unread_updated", handleUnread);
    const interval = setInterval(refreshUnreadCounts, 60_000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("vibe:realtime_unread", handleRealtimeUnread);
      window.removeEventListener("vibe:realtime", handleRealtime);
      window.removeEventListener("vibe:unread_updated", handleUnread);
    };
  }, [isAuthenticated, location.pathname, refreshUnreadCounts]);

  // Déconnexion : coupe le flux temps réel.
  useEffect(() => {
    if (!isAuthenticated) {
      RealtimeService.stop();
    }
  }, [isAuthenticated]);

  // Composeur prérempli (« Publier sur Vibe » depuis mAI, « Citer » depuis un post).
  useEffect(() => {
    const handleOpenComposer = (event: Event) => {
      setComposerDraft((event as CustomEvent).detail || null);
      setIsComposerModalOpen(true);
    };
    window.addEventListener("vibe:open_composer", handleOpenComposer);
    return () =>
      window.removeEventListener("vibe:open_composer", handleOpenComposer);
  }, []);

  // Mention d'un post vers l'assistant mAI (« Mentionner dans mAI »).
  useEffect(() => {
    const handleOpenMAI = (event: Event) => {
      const postId = (event as CustomEvent).detail?.postId;
      if (!postId) {
        return;
      }
      setMaiAttachedPostId(postId);
      setIsMAIDrawerOpen(true);
    };
    window.addEventListener("vibe:open_mai", handleOpenMAI);
    return () => window.removeEventListener("vibe:open_mai", handleOpenMAI);
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const newToast = (event as CustomEvent).detail as InAppToast;
      if (!newToast) {
        return;
      }
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, TOAST_DUREE_MS);
    };
    window.addEventListener("vibe:in_app_toast", handleToast);
    return () => window.removeEventListener("vibe:in_app_toast", handleToast);
  }, []);

  if (isLoadingSession) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-4 text-white selection:bg-white selection:text-black">
        <div className="flex animate-fadeIn flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold tracking-wide text-white">
              Chargement...
            </p>
            <p className="text-xs text-zinc-500">
              Connexion à votre espace Vibe
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black p-4">
        <AuthModal isFullScreen isOpen onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-black font-sans text-white antialiased selection:bg-white selection:text-black">
      <div className="relative flex w-full max-w-7xl">
        {/* Navigation latérale (bureau / tablette) */}
        <Sidebar
          onOpenComposer={() => setIsComposerModalOpen(true)}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
        />

        {/* Vue principale — la page est rendue par l'App Router */}
        <main className="min-h-dvh w-full flex-1 border-r border-zinc-800 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </main>

        {/* Onglets inférieurs (< 640px) */}
        <MobileTabBar
          onOpenComposer={() => setIsComposerModalOpen(true)}
          onToggleMAIDrawer={() => setIsMAIDrawerOpen((open) => !open)}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
        />

        {/* Tiroir mAI rétractable */}
        <MAIDrawer
          attachedPostId={maiAttachedPostId}
          isOpen={isMAIDrawerOpen}
          onClearAttachedPost={() => setMaiAttachedPostId(null)}
          onClose={() => {
            setIsMAIDrawerOpen(false);
            setMaiAttachedPostId(null);
          }}
          onPostCreated={() => {
            if (location.pathname === "/") {
              window.dispatchEvent(new CustomEvent("vibe:feed_refresh"));
            }
          }}
        />

        {/* Composeur de publication */}
        {isComposerModalOpen && (
          <div
            className="fixed inset-0 z-50 flex h-dvh animate-fadeIn items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsComposerModalOpen(false);
              }
            }}
          >
            <div className="flex h-[94dvh] max-h-[94dvh] w-full max-w-2xl animate-scaleUp flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:h-[86dvh] sm:rounded-3xl lg:max-w-3xl">
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-black/60 p-3.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  {editingPost ? "Modifier la vibe" : "Poster une vibe"}
                </span>
                <button
                  className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
                  onClick={() => setIsComposerModalOpen(false)}
                  title="Fermer"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <PostComposer
                  editingPost={editingPost}
                  initialContent={composerDraft?.content}
                  initialMediaUrl={composerDraft?.imageUrl}
                  initialQuotedPost={composerDraft?.quotedPost}
                  isModal
                  onPostCreated={() => {
                    setIsComposerModalOpen(false);
                    setComposerDraft(null);
                    window.dispatchEvent(new CustomEvent("vibe:feed_refresh"));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Toasts in-app */}
        {toasts.length > 0 && (
          <div className="pointer-events-none fixed top-5 right-5 z-50 flex max-w-sm flex-col gap-2">
            {toasts.map((toast) => {
              const toastType = toast.type || "success";
              const ToastIcon =
                toastType === "error"
                  ? AlertCircle
                  : toastType === "info"
                    ? Info
                    : CheckCircle;
              const iconClass =
                toastType === "error"
                  ? "text-red-400"
                  : toastType === "info"
                    ? "text-sky-400"
                    : "text-emerald-400";
              return (
                <div
                  className="pointer-events-auto flex animate-fadeIn items-start gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 text-xs text-white shadow-2xl backdrop-blur-md"
                  key={toast.id}
                >
                  <ToastIcon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">
                      {toast.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    className="p-0.5 text-zinc-400 hover:text-white"
                    onClick={() =>
                      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                    }
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mini-lecteur audio flottant mAI */}
        <FloatingAudioPlayer />

        {/* Onboarding guidé (première visite) */}
        {showOnboarding && <OnboardingModal onDone={dismissOnboarding} />}

        {/* Bandeau hors-ligne */}
        <OfflineBanner />
      </div>
    </div>
  );
}
