/**
 * ============================================================================
 * VIBE — GESTION DU COMPTE & SESSION UNIFIÉE (components/vibe/settings/AccountSection.tsx)
 * Section Paramètres : identité Vibe/mAI, accès profil public, sécurité mAI et déconnexion.
 * ============================================================================
 */

import {
  ExternalLinkIcon as ExternalLink,
  KeyRoundIcon as KeyRound,
  LogOutIcon as LogOut,
  MessageSquareIcon as MessageSquare,
  UserCheckIcon as UserCheck,
  UserCogIcon as UserCog,
} from "@mdevs/icons";
import type React from "react";
import { useConfirmDialog } from "@/components/vibe/common/ConfirmDialog";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { useNavigate } from "../router";

export const AccountSection: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirmDialog();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const username = user?.username || profile?.username || "utilisateur";
  const displayName = profile?.displayName || username;
  const avatarUrl = profile?.avatarUrl || user?.avatar_url || null;
  const tierLabel = (user?.tier || profile?.tier || "Free").toUpperCase();
  const isVerified = Boolean(
    profile?.is_verified ||
      (user as any)?.is_verified ||
      ["plus", "pro", "max"].includes(
        (user?.tier || profile?.tier || "").toLowerCase().trim()
      )
  );

  const handleFullLogout = async () => {
    const ok = await confirm({
      cancelLabel: "Annuler",
      confirmLabel: "Se déconnecter",
      message:
        "Votre session unifiée mAI Web et Vibe sera fermée sur cet appareil.",
      title: "Se déconnecter de mAI & Vibe ?",
      tone: "danger",
    });
    if (ok) {
      await logout({ fullSignOut: true });
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <UserCheck className="w-4 h-4 text-white" />
          <span>Mon compte Vibe &amp; mAI</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full uppercase">
          Session unifiée · Forfait {tierLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <ProfileAvatar
            alt={displayName}
            className="border border-zinc-700 shrink-0"
            fallbackName={username}
            size="md"
            src={avatarUrl}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white truncate">
                {displayName}
              </span>
              <VerifiedBadge
                isVerified={isVerified}
                size="xs"
                tier={user?.tier}
              />
            </div>
            <p className="text-xs font-mono text-zinc-400 truncate">
              @{username}
            </p>
            {user?.email ? (
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>

        <button
          className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          onClick={() => navigate(`/@${username}?edit=1`)}
          type="button"
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>Modifier mon profil</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <a
          className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors"
          href={`${basePath}/settings?tab=profile`}
        >
          <span className="flex items-center gap-2 font-medium">
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            E-mail &amp; mot de passe mAI
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        </a>

        <a
          className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors"
          href={`${basePath}/`}
        >
          <span className="flex items-center gap-2 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            Retourner sur mAI Chat
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        </a>

        <button
          className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-red-900/50 bg-red-950/20 text-red-400 font-semibold hover:bg-red-950/40 transition-colors cursor-pointer"
          onClick={() => void handleFullLogout()}
          type="button"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {confirmDialog}
    </div>
  );
};
