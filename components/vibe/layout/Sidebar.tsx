/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SIDEBAR (src/components/layout/Sidebar.tsx)
 * Primary Navigation Bar with Centered Circular Shadows & mAI Actions
 * ============================================================================
 */

import {
  Bell,
  Compass,
  Home,
  Library,
  LogOut,
  Mail,
  PenSquare,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import type React from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import { GlobalSearchBar } from "@/components/vibe/layout/GlobalSearchBar";
import { VibeLogo } from "@/components/vibe/layout/VibeLogo";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { Link, useLocation, useNavigate } from "../router";

interface SidebarProps {
  onOpenComposer: () => void;
  unreadMessages?: number;
  unreadNotifications?: number;
}

const NAV_ITEMS = [
  { exact: true, icon: Home, label: "Accueil", path: "/" },
  { icon: Compass, label: "Explorer", path: "/explore" },
  // En xl, cette entrée est remplacée par le bouton cloche en haut à droite du logo
  {
    badgeKey: "notifications" as const,
    compactOnly: true,
    icon: Bell,
    label: "Notifications",
    path: "/notifications",
  },
  {
    badgeKey: "messages" as const,
    icon: Mail,
    label: "Messages",
    path: "/messages",
  },
  { icon: Library, label: "Livres", path: "/books" },
  { icon: Sparkles, label: "mAI", path: "/mai" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

// Préchargement au survol des liens (code splitting immédiat)
const pageLoaders: Record<string, () => Promise<unknown>> = {
  "/books": () => import("@/components/vibe/pages/BooksPage"),
  "/explore": () => import("@/components/vibe/pages/ExplorePage"),
  "/mai": () => import("@/components/vibe/pages/MAIStudioPage"),
  "/messages": () => import("@/components/vibe/pages/MessagesPage"),
  "/notifications": () => import("@/components/vibe/pages/NotificationsPage"),
  "/settings": () => import("@/components/vibe/pages/SettingsPage"),
};

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenComposer,
  unreadNotifications = 0,
  unreadMessages = 0,
}) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === "/" : location.pathname.startsWith(path);

  const isProfileActive =
    location.pathname === "/profile" ||
    (Boolean(user?.username) &&
      (location.pathname === `/@${user?.username}` ||
        location.pathname === `/${user?.username}` ||
        location.pathname === `/profile/${user?.username}`));

  const activeAvatar = profile?.avatarUrl || user?.avatar_url || null;

  return (
    <aside className="hidden sm:flex w-16 sm:w-20 xl:w-64 h-screen sticky top-0 border-r border-zinc-800 flex-col justify-between p-2 sm:p-3 xl:p-4 bg-black select-none z-30 shrink-0">
      {/* Brand & Nav List */}
      <div className="space-y-4">
        {/* Brand Logo + bouton Notifications (déplacé en haut à droite du logo en xl) */}
        <div className="flex items-center justify-center xl:justify-between xl:gap-2">
          <Link
            className="cursor-pointer p-1.5 flex items-center justify-center"
            title="Accueil Vibe"
            to="/"
          >
            <div className="xl:hidden">
              <VibeLogo showText={false} size={40} />
            </div>
            <div className="hidden xl:block">
              <VibeLogo showText={true} size={40} />
            </div>
          </Link>

          <Link
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} non lues)` : ""}`}
            className={`hidden xl:flex relative w-10 h-10 rounded-full items-center justify-center shrink-0 transition-all ${
              isActive("/notifications")
                ? "bg-zinc-900 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-950"
            }`}
            onFocus={() => pageLoaders["/notifications"]?.()}
            onMouseEnter={() => pageLoaders["/notifications"]?.()}
            title="Notifications"
            to="/notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md shadow-rose-500/50">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        </div>

        {/* Recherche globale (écrans larges — complète le lien Explorer) */}
        <div className="hidden xl:block px-1">
          <GlobalSearchBar />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex flex-col items-center xl:items-stretch">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            const count =
              item.badgeKey === "notifications"
                ? unreadNotifications
                : item.badgeKey === "messages"
                  ? unreadMessages
                  : 0;

            const handleClick = (e: React.MouseEvent) => {
              if (item.path === "/mai") {
                e.preventDefault();
                navigate(`/mai?new=${Date.now()}`);
                window.dispatchEvent(
                  new CustomEvent("vibe:mai:new_conversation")
                );
              }
            };

            return (
              <Link
                className={`w-12 h-12 xl:w-full xl:h-auto p-0 xl:px-4 xl:py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center xl:justify-start gap-4 group relative ${
                  active
                    ? "bg-zinc-900 text-white font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-950"
                } ${item.compactOnly ? "xl:hidden" : ""}`}
                key={item.path}
                onClick={handleClick}
                onFocus={() => pageLoaders[item.path]?.()}
                onMouseEnter={() => pageLoaders[item.path]?.()}
                title={item.label}
                to={item.path}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${active ? "text-white" : ""}`}
                  />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 xl:hidden min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center leading-none animate-pulse">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-base flex-1">
                  {item.label}
                </span>
                {count > 0 && (
                  <span className="hidden xl:flex min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-bold items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
          {/* Profil : lien dynamique vers /@username ou /profile */}
          <Link
            className={`w-12 h-12 xl:w-full xl:h-auto p-0 xl:px-4 xl:py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center xl:justify-start gap-4 group ${
              isProfileActive
                ? "bg-zinc-900 text-white font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-950"
            }`}
            title="Profil"
            to={user?.username ? `/@${user.username}` : "/profile"}
          >
            <UserIcon
              className={`w-6 h-6 transition-transform group-hover:scale-110 ${isProfileActive ? "text-white" : ""}`}
            />
            <span className="hidden xl:inline text-base">Profil</span>
          </Link>
        </nav>

        {/* Action Button: Publier */}
        <div className="pt-2 space-y-2 flex flex-col items-center xl:items-stretch">
          <button
            className="w-12 h-12 xl:w-full xl:h-auto xl:py-3.5 xl:px-4 rounded-full bg-white text-black font-bold text-sm xl:text-base hover:brightness-90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            onClick={onOpenComposer}
            style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
            title="Poster une vibe"
          >
            <PenSquare className="w-5 h-5 shrink-0" />
            <span className="hidden xl:inline">Poster une vibe</span>
          </button>
        </div>
      </div>

      {/* User Footer Card & Logout */}
      <div className="pt-4 border-t border-zinc-900 space-y-2">
        <div className="flex items-center justify-between p-1.5 xl:p-2 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900 transition-all">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1 justify-center xl:justify-start"
            onClick={() =>
              navigate(user?.username ? `/@${user.username}` : "/profile")
            }
            title="Voir mon profil"
          >
            <ProfileAvatar
              alt="Avatar"
              className="border border-zinc-700 shrink-0"
              fallbackName={user?.username}
              size="sm"
              src={activeAvatar}
            />
            <div className="hidden xl:flex flex-col truncate min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {profile?.displayName || user?.username || "Utilisateur"}
                </span>
                <VerifiedBadge
                  isVerified={
                    (profile as any)?.is_verified || (user as any)?.is_verified
                  }
                  size="xs"
                  tier={user?.tier}
                />
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                @{user?.username}
              </span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-1">
            <button
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-all"
              onClick={logout}
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
