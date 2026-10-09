/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — ROOT APPLICATION (src/App.tsx)
 * Router (react-router-dom), Lazy Pages, Layout, Modals & Toasts
 * ============================================================================
 */

import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { MAIDrawer } from './components/layout/MAIDrawer';
import { FloatingAudioPlayer } from './components/feed/FloatingAudioPlayer';
import { PostComposer } from './components/feed/PostComposer';
import { OnboardingModal } from './components/common/OnboardingModal';
import { HomePage } from './pages/HomePage';
import { AuthModal } from './pages/AuthModal';
import { PageSkeleton } from './components/common/PageSkeleton';
import { Post } from './types/vibe';
import { XIcon as X, CheckCircleIcon as CheckCircle, AlertCircleIcon as AlertCircle, InfoIcon as Info, Loader2Icon as Loader2 } from "@mdevs/icons";
import { InAppToast } from './services/notificationService';
import { ApiService } from './services/api';
import { RealtimeService } from './services/realtimeService';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { applyAnimationsAttribute } from './services/animationPrefs';
import { useVisualViewport } from './hooks/useVisualViewport';

// Code splitting : chaque page est chargée à la demande
const PostDetailPage = lazy(() =>
  import('./pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage }))
);
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
const MessagesPage = lazy(() =>
  import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage }))
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const MAIStudioPage = lazy(() =>
  import('./pages/MAIStudioPage').then((m) => ({ default: m.MAIStudioPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const BooksPage = lazy(() =>
  import('./pages/BooksPage').then((m) => ({ default: m.BooksPage }))
);
const BooksJoinPage = lazy(() =>
  import('./pages/BooksJoinPage').then((m) => ({ default: m.BooksJoinPage }))
);
const StatsPage = lazy(() =>
  import('./pages/StatsPage').then((m) => ({ default: m.StatsPage }))
);

// Restauration de la position de scroll par route (deep-link => haut de page)
const scrollPositions = new Map<string, number>();

function ScrollManager() {
  const location = useLocation();
  const frame = useRef(0);

  useEffect(() => {
    const saved = scrollPositions.get(location.key);
    if (saved != null) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
      return;
    }
    // Nouvelle navigation : remonte en haut après le rendu
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [location.key]);

  useEffect(() => {
    const onScroll = () => scrollPositions.set(location.key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      scrollPositions.set(location.key, window.scrollY);
    };
  }, [location.key]);

  return null;
}

function VibeApp() {
  const { isAuthenticated, isLoadingSession, showOnboarding, dismissOnboarding } = useAuth();
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
  const [maiAttachedPostId, setMaiAttachedPostId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const editingPost = composerDraft?.editPost || null;
  // Compteurs non lus pour les badges de la navigation
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshUnreadCounts = useCallback(async () => {
    if (document.hidden) return;
    try {
      const counts = await ApiService.getUnreadCounts();
      setUnreadNotifications(counts.unread_notifications || 0);
      setUnreadMessages(counts.unread_messages || 0);
    } catch {
      // Fallback : endpoint léger indisponible → comptage local
      try {
        const [notifRes, convRes] = await Promise.all([
          ApiService.getNotifications(),
          ApiService.getConversations(),
        ]);
        setUnreadNotifications((notifRes?.notifications || []).filter((n) => !n.is_read).length);
        setUnreadMessages(
          (convRes?.conversations || []).reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        );
      } catch {}
    }
  }, []);

  useEffect(() => {
    applyAnimationsAttribute();
  }, []);

  // Suit le clavier virtuel (iOS) : publie --vibe-kb-offset pour les zones de saisie
  useVisualViewport();

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUnreadCounts();

    // Temps réel (SSE) : badges poussés par le serveur, plus de polling 15 s.
    // L'intervalle ne sert que de filet de sécurité.
    const token = ApiService.getToken();
    if (token) RealtimeService.start(token);
    const handleUnread = () => refreshUnreadCounts();
    const handleRealtimeUnread = (e: any) => {
      const d = e?.detail;
      if (!d) return;
      if (d.unread_notifications !== undefined) setUnreadNotifications(Number(d.unread_notifications) || 0);
      if (d.unread_messages !== undefined) setUnreadMessages(Number(d.unread_messages) || 0);
    };
    // Notification ou message reçu : re-synchronise les badges (cache court)
    const handleRealtime = (e: any) => {
      const type = e?.detail?.type;
      if (type === 'notification' || type === 'dm_message') refreshUnreadCounts();
    };
    window.addEventListener('vibe:realtime_unread', handleRealtimeUnread);
    window.addEventListener('vibe:realtime', handleRealtime);
    window.addEventListener('vibe:unread_updated', handleUnread);
    const interval = setInterval(refreshUnreadCounts, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vibe:realtime_unread', handleRealtimeUnread);
      window.removeEventListener('vibe:realtime', handleRealtime);
      window.removeEventListener('vibe:unread_updated', handleUnread);
    };
  }, [isAuthenticated, location.pathname, refreshUnreadCounts]);

  // Déconnexion : coupe le flux temps réel
  useEffect(() => {
    if (!isAuthenticated) RealtimeService.stop();
  }, [isAuthenticated]);

  // Ouverture du composer préremplie (ex : « Publier sur Vibe » depuis mAI,
  // ou « Citer » depuis un post avec quotedPost)
  useEffect(() => {
    const handleOpenComposer = (e: any) => {
      setComposerDraft(e?.detail || null);
      setIsComposerModalOpen(true);
    };
    window.addEventListener('vibe:open_composer', handleOpenComposer);
    return () => window.removeEventListener('vibe:open_composer', handleOpenComposer);
  }, []);

  // Mention d'un post vers l'assistant mAI (bouton « Mentionner dans mAI »)
  useEffect(() => {
    const handleOpenMAI = (e: any) => {
      const postId = e?.detail?.postId;
      if (!postId) return;
      setMaiAttachedPostId(postId);
      setIsMAIDrawerOpen(true);
    };
    window.addEventListener('vibe:open_mai', handleOpenMAI);
    return () => window.removeEventListener('vibe:open_mai', handleOpenMAI);
  }, []);

  useEffect(() => {
    const handleToast = (e: any) => {
      const newToast: InAppToast = e.detail;
      if (!newToast) return;
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('vibe:in_app_toast', handleToast);
    return () => {
      window.removeEventListener('vibe:in_app_toast', handleToast);
    };
  }, []);

  // Navigation adossée au routeur — deep-links et bouton retour natifs
  const handleOpenThread = useCallback(
    (post: Post) => navigate(`/post/${post.id}`),
    [navigate]
  );
  const handleOpenProfile = useCallback(
    (username: string) => navigate(`/@${username.replace(/^@/, '')}`),
    [navigate]
  );

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-semibold text-sm tracking-wide">Chargement...</p>
            <p className="text-zinc-500 text-xs">Connexion à votre espace Vibe</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <AuthModal isFullScreen isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black text-white flex justify-center font-sans antialiased selection:bg-white selection:text-black">
      <ScrollManager />
      <div className="w-full max-w-7xl flex relative">
        {/* Left Navigation Sidebar (Desktop / Tablet) */}
        <Sidebar
          onOpenComposer={() => setIsComposerModalOpen(true)}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />

        {/* Center Main Viewport (Pleine largeur étendue) */}
        <main className="flex-1 w-full min-h-dvh border-r border-zinc-800 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage onOpenThread={handleOpenThread} onOpenProfile={handleOpenProfile} />} />
              <Route path="/explore" element={<ExplorePage onOpenProfile={handleOpenProfile} onOpenThread={handleOpenThread} />} />
              <Route path="/explore/:tab" element={<ExplorePage onOpenProfile={handleOpenProfile} onOpenThread={handleOpenThread} />} />
              <Route path="/post/:postId" element={<PostDetailRoute />} />
              <Route path="/profile" element={<ProfileRoute />} />
              <Route path="/profile/:username" element={<ProfileRoute />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/mai" element={<MAIStudioPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Livres : avant le catch-all /:username */}
              <Route path="/books/join/:code" element={<BooksJoinPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:bookId" element={<BooksPage />} />
              {/* Statistiques : accès header Profil uniquement, hors navigation */}
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/:username" element={<ProfileRoute />} />
              <Route path="*" element={<HomePage onOpenThread={handleOpenThread} onOpenProfile={handleOpenProfile} />} />
            </Routes>
          </Suspense>
        </main>

        {/* Mobile Bottom Tab Bar (< 640px) */}
        <MobileTabBar
          onOpenComposer={() => setIsComposerModalOpen(true)}
          onToggleMAIDrawer={() => setIsMAIDrawerOpen(!isMAIDrawerOpen)}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />

        {/* Retractable mAI Drawer */}
        <MAIDrawer
          isOpen={isMAIDrawerOpen}
          onClose={() => {
            setIsMAIDrawerOpen(false);
            setMaiAttachedPostId(null);
          }}
          attachedPostId={maiAttachedPostId}
          onClearAttachedPost={() => setMaiAttachedPostId(null)}
          onPostCreated={() => {
            if (location.pathname === '/') {
              window.dispatchEvent(new CustomEvent('vibe:feed_refresh'));
            }
          }}
        />

        {/* Modal Post Composer (hauteur et largeur étendues pour la rédaction) */}
        {isComposerModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn h-dvh"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsComposerModalOpen(false);
            }}
          >
            <div className="w-full max-w-2xl lg:max-w-3xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-scaleUp h-[94dvh] sm:h-[86dvh] max-h-[94dvh] flex flex-col">
              <div className="p-3.5 pt-safe sm:pt-3.5 border-b border-zinc-800 flex justify-between items-center bg-black/60 shrink-0">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  {editingPost ? 'Modifier la vibe' : 'Poster une vibe'}
                </span>
                <button
                  onClick={() => setIsComposerModalOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 flex flex-col min-h-0">
                <PostComposer
                  isModal
                  editingPost={editingPost}
                  initialContent={composerDraft?.content}
                  initialMediaUrl={composerDraft?.imageUrl}
                  initialQuotedPost={composerDraft?.quotedPost}
                  onPostCreated={() => {
                    setIsComposerModalOpen(false);
                    setComposerDraft(null);
                    window.dispatchEvent(new CustomEvent('vibe:feed_refresh'));
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {/* Floating In-App Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
            {toasts.map((toast) => {
              const toastType = toast.type || 'success';
              const ToastIcon =
                toastType === 'error' ? AlertCircle : toastType === 'info' ? Info : CheckCircle;
              const iconClass =
                toastType === 'error'
                  ? 'text-red-400'
                  : toastType === 'info'
                  ? 'text-sky-400'
                  : 'text-emerald-400';
              return (
                <div
                  key={toast.id}
                  className="pointer-events-auto p-4 rounded-2xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs text-white animate-fadeIn"
                >
                  <ToastIcon className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
                  <div className="flex-1">
                    <p className="font-bold text-white text-xs">{toast.title}</p>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-relaxed">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="text-zinc-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* Mini-lecteur audio flottant mAI (posts & fils de discussion) */}
        <FloatingAudioPlayer />

        {/* Onboarding guidé (première visite, user_settings.onboarding_completed = false) */}
        {showOnboarding && <OnboardingModal onDone={dismissOnboarding} />}

        {/* Offline status banner */}
        <OfflineBanner />

        {/* PWA : bannière quand une nouvelle version est prête */}
        <PWAUpdatePrompt />
      </div>
    </div>
  );
}

/** Route wrapper : injecte les paramètres d'URL dans les pages à props. */
function PostDetailRoute() {
  const { postId } = useParams<{ postId: string }>();
  return <PostDetailRouteInner postId={postId || ''} />;
}

function PostDetailRouteInner({ postId }: { postId: string }) {
  const navigate = useNavigate();
  return (
    <PostDetailPage
      postId={postId}
      onBack={() => navigate(-1)}
      onOpenProfile={(username) => navigate(`/@${username}`)}
    />
  );
}

/** Route profil : gère /profile, /profile/:username et /:username (ex: /@username ou /username). */
function ProfileRoute() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const cleanUsername = username ? username.replace(/^@/, '') : undefined;
  return (
    <ProfilePage
      username={cleanUsername}
      onBack={() => navigate(-1)}
      onOpenThread={(post: Post) => navigate(`/post/${post.id}`)}
      onOpenProfile={(u: string) => navigate(`/@${u.replace(/^@/, '')}`)}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AudioPlayerProvider>
            <VibeApp />
          </AudioPlayerProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
