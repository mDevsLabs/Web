/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MOBILE TAB BAR (src/components/layout/MobileTabBar.tsx)
 * Barre d'onglets ergonomique en bas (< 640px) + FABs Composer & mAI
 * Design dock « liquid-glass », retours haptiques universels, safe-area iOS/Android
 * ============================================================================
 */

import React, { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon as Home, CompassIcon as Compass, SparklesIcon as Sparkles, PenSquareIcon as PenSquare, BellIcon as Bell, MessageCircleIcon as MessageCircle, SearchIcon as Search, XIcon as X } from "@mdevs/icons";
import { ProfileAvatar } from '../common/ProfileAvatar';
import { useMotionPrefs } from '../../hooks/useMotionPrefs';
import { GlobalSearchBar } from './GlobalSearchBar';

/** Navigation avec View Transitions API (fallback natif si indisponible). */
function navigateWithTransition(navigate: (to: string) => void, to: string) {
  try {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => navigate(to));
      });
      return;
    }
  } catch {}
  navigate(to);
}

interface MobileTabBarProps {
  onOpenComposer: () => void;
  onToggleMAIDrawer: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  onOpenComposer,
  onToggleMAIDrawer,
  unreadNotifications = 0,
  unreadMessages = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { play: playMotion, animationsEnabled } = useMotionPrefs();
  const { user, profile } = useAuth();
  const profilePath = user?.username ? `/@${user.username}` : '/profile';

  const isHomeActive = location.pathname === '/';
  const isExploreActive = location.pathname.startsWith('/explore');
  const isNotificationsActive = location.pathname.startsWith('/notifications');
  const isMessagesActive = location.pathname.startsWith('/messages');
  const isProfileActive =
    location.pathname.startsWith('/@') ||
    location.pathname === '/profile' ||
    (Boolean(user?.username) && location.pathname === `/${user?.username}`);

  const activeAvatar = profile?.avatarUrl || user?.avatar_url || null;

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    if (isHomeActive) {
      playMotion('medium');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      playMotion('selection');
      e.preventDefault();
      navigateWithTransition(navigate, '/');
    }
  }, [isHomeActive, navigate, playMotion]);

  const goTab = useCallback((e: React.MouseEvent, to: string) => {
    playMotion('selection');
    e.preventDefault();
    navigateWithTransition(navigate, to);
  }, [navigate, playMotion]);

  const handleComposerClick = useCallback(() => {
    playMotion('medium');
    onOpenComposer();
  }, [onOpenComposer, playMotion]);

  const handleMAIClick = useCallback(() => {
    playMotion('selection');
    onToggleMAIDrawer();
  }, [onToggleMAIDrawer, playMotion]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const handleSearchClick = useCallback(() => {
    playMotion('selection');
    setIsSearchOpen(true);
  }, [playMotion]);

  return (
    <>
      {/* FABs d'action rapide ergonomiques : mAI + Composer */}
      <div className="sm:hidden fixed right-4 bottom-[calc(4.35rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 select-none pointer-events-auto">
        {/* Bouton mAI Assistant avec gradient verre dépoli */}
        <motion.button
          whileTap={animationsEnabled ? { scale: 0.85 } : undefined}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={handleMAIClick}
          aria-label="Ouvrir l'assistant mAI"
          title="Assistant mAI"
          className="w-10 h-10 rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-purple-500/35 text-purple-300 shadow-xl flex items-center justify-center transition-all hover:brightness-110 active:border-purple-400 group relative touch-manipulation"
        >
          <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping opacity-75 pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 pointer-events-none" />
        </motion.button>

        {/* Bouton Principal : Créer / Composer une Vibe */}
        <motion.button
          whileTap={animationsEnabled ? { scale: 0.88 } : undefined}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={handleComposerClick}
          aria-label="Publier une vibe"
          title="Poster une vibe"
          style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
          className="w-12 h-12 rounded-2xl bg-white text-black shadow-2xl shadow-black/80 flex items-center justify-center transition-all hover:brightness-95 border border-white/20 touch-manipulation"
        >
          <PenSquare className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Barre d'onglets fixe basse en verre dépoli (Dock) */}
      <nav
        aria-label="Navigation principale mobile"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-black/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom)] select-none"
      >
        <div className="grid grid-cols-6 items-stretch h-14">
          {/* 1. Accueil */}
          <Link
            to="/"
            onClick={handleHomeClick}
            aria-label="Accueil"
            className={`relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation ${
              isHomeActive ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <motion.div whileTap={animationsEnabled ? { scale: 0.85 } : undefined} className="relative p-1">
              <Home className={`w-6 h-6 transition-transform ${isHomeActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
            </motion.div>
            {isHomeActive && (
              <motion.span
                layoutId={animationsEnabled ? 'mobile-tab-dot' : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              />
            )}
          </Link>

          {/* 2. Explorer */}
          <Link
            to="/explore"
            onClick={(e) => goTab(e, '/explore')}
            aria-label="Explorer"
            className={`relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation ${
              isExploreActive ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <motion.div whileTap={animationsEnabled ? { scale: 0.85 } : undefined} className="relative p-1">
              <Compass className={`w-6 h-6 transition-transform ${isExploreActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
            </motion.div>
            {isExploreActive && (
              <motion.span
                layoutId={animationsEnabled ? 'mobile-tab-dot' : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              />
            )}
          </Link>

          {/* 2b. Recherche globale */}
          <motion.button
            whileTap={animationsEnabled ? { scale: 0.85 } : undefined}
            onClick={handleSearchClick}
            aria-label="Recherche"
            className="relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation text-zinc-500 active:text-zinc-300"
          >
            <div className="relative p-1">
              <Search className="w-6 h-6 stroke-[1.8]" />
            </div>
          </motion.button>

          {/* 3. Notifications */}
          <Link
            to="/notifications"
            onClick={(e) => goTab(e, '/notifications')}
            aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} non lues)` : ''}`}
            className={`relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation ${
              isNotificationsActive ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <motion.div whileTap={animationsEnabled ? { scale: 0.85 } : undefined} className="relative p-1">
              <Bell className={`w-6 h-6 transition-transform ${isNotificationsActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-md shadow-rose-500/50 animate-pulse">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </motion.div>
            {isNotificationsActive && (
              <motion.span
                layoutId={animationsEnabled ? 'mobile-tab-dot' : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              />
            )}
          </Link>

          {/* 4. Messages */}
          <Link
            to="/messages"
            onClick={(e) => goTab(e, '/messages')}
            aria-label={`Messages ${unreadMessages > 0 ? `(${unreadMessages} non lus)` : ''}`}
            className={`relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation ${
              isMessagesActive ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <motion.div whileTap={animationsEnabled ? { scale: 0.85 } : undefined} className="relative p-1">
              <MessageCircle className={`w-6 h-6 transition-transform ${isMessagesActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-md shadow-rose-500/50 animate-pulse">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </motion.div>
            {isMessagesActive && (
              <motion.span
                layoutId={animationsEnabled ? 'mobile-tab-dot' : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              />
            )}
          </Link>

          {/* 5. Profil */}
          <Link
            to={profilePath}
            onClick={(e) => goTab(e, profilePath)}
            aria-label="Mon Profil"
            className={`relative flex flex-col items-center justify-center h-full transition-colors touch-manipulation ${
              isProfileActive ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <motion.div whileTap={animationsEnabled ? { scale: 0.85 } : undefined} className="relative p-1 flex items-center justify-center">
              <div
                className={`rounded-full transition-all ${
                  isProfileActive
                    ? 'p-0.5 ring-2 ring-white scale-105'
                    : 'p-0.5 ring-1 ring-zinc-700 opacity-80'
                }`}
              >
                <ProfileAvatar
                  src={activeAvatar}
                  alt={user?.username || 'Profil'}
                  fallbackName={user?.username}
                  size="xs"
                  className="w-5 h-5 pointer-events-none"
                />
              </div>
            </motion.div>
            {isProfileActive && (
              <motion.span
                layoutId={animationsEnabled ? 'mobile-tab-dot' : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
              />
            )}
          </Link>
        </div>
      </nav>

      {/* Modale recherche globale plein écran (mobile) */}
      {isSearchOpen && (
        <div className="sm:hidden fixed inset-0 z-[60] bg-black/95 backdrop-blur-md p-4 pt-safe animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              <GlobalSearchBar autoFocus onNavigate={() => setIsSearchOpen(false)} />
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              aria-label="Fermer la recherche"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
