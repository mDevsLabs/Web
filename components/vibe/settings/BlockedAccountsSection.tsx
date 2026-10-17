/**
 * ============================================================================
 * VIBE — COMPTES BLOQUÉS & MASQUÉS (components/vibe/settings/BlockedAccountsSection.tsx)
 * Section Paramètres : Consultation et gestion des comptes bloqués et masqués.
 * ============================================================================
 */

import {
  BanIcon as Ban,
  EyeOffIcon as EyeOff,
  Loader2Icon as Loader2,
} from "@mdevs/icons";
import type React from "react";

export interface BlockedAccountsSectionProps {
  blockedAccounts: Array<{
    id: string;
    blocked_user_id: string;
    blocked_username?: string;
    blocked_display_name?: string;
    blocked_avatar_url?: string;
  }>;
  isLoadingAccounts: boolean;
  mutedAccounts: Array<{
    id: string;
    muted_user_id: string;
    muted_username?: string;
    muted_display_name?: string;
    muted_avatar_url?: string;
  }>;
  onUnblockAccount: (userId: string, username?: string) => void;
  onUnmuteAccount: (username?: string) => void;
}

export const BlockedAccountsSection: React.FC<BlockedAccountsSectionProps> = ({
  isLoadingAccounts,
  blockedAccounts,
  mutedAccounts,
  onUnblockAccount,
  onUnmuteAccount,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Ban className="w-4 h-4 text-white" />
          <span>Comptes bloqués &amp; masqués</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Modération personnelle
        </span>
      </div>

      {isLoadingAccounts ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Chargement des listes…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Comptes bloqués */}
          <div className="space-y-2">
            <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <Ban className="w-3 h-3 text-zinc-400" />
              Bloqués ({blockedAccounts.length}) — contact coupé
            </p>
            {blockedAccounts.length === 0 ? (
              <p className="text-zinc-600 text-[11px]">Aucun compte bloqué.</p>
            ) : (
              <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-40 overflow-y-auto">
                {blockedAccounts.map((b) => (
                  <div className="flex items-center gap-3 p-2.5" key={b.id}>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-white block truncate">
                        {b.blocked_display_name || b.blocked_username}
                      </span>
                      <span className="text-zinc-500">
                        @{b.blocked_username}
                      </span>
                    </div>
                    <button
                      className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-900 hover:text-white transition-colors shrink-0 text-xs"
                      onClick={() =>
                        onUnblockAccount(b.blocked_user_id, b.blocked_username)
                      }
                      type="button"
                    >
                      Débloquer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comptes masqués */}
          <div className="space-y-2">
            <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <EyeOff className="w-3 h-3 text-zinc-400" />
              Masqués ({mutedAccounts.length}) — silencieux
            </p>
            {mutedAccounts.length === 0 ? (
              <p className="text-zinc-600 text-[11px]">Aucun compte masqué.</p>
            ) : (
              <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-40 overflow-y-auto">
                {mutedAccounts.map((m) => (
                  <div className="flex items-center gap-3 p-2.5" key={m.id}>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-white block truncate">
                        {m.muted_display_name || m.muted_username}
                      </span>
                      <span className="text-zinc-500">@{m.muted_username}</span>
                    </div>
                    <button
                      className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-900 hover:text-white transition-colors shrink-0 text-xs"
                      onClick={() => onUnmuteAccount(m.muted_username)}
                      type="button"
                    >
                      Réactiver
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
