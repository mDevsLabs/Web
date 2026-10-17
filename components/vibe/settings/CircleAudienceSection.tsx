/**
 * ============================================================================
 * VIBE — CERCLE PRIVÉ & AUDIENCE (components/vibe/settings/CircleAudienceSection.tsx)
 * Section Paramètres : Définition de l'audience par défaut et gestion des membres du cercle privé.
 * ============================================================================
 */

import {
  CheckIcon as Check,
  GlobeIcon as Globe,
  Loader2Icon as Loader2,
  LockIcon as Lock,
  SearchIcon as Search,
  UserPlusIcon as UserPlus,
  UsersIcon as Users,
  XIcon as X,
} from "@mdevs/icons";
import type React from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";

export interface CircleAudienceSectionProps {
  addingUsername: string | null;
  circleMembers: Array<{
    id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  }>;
  circleSearchQuery: string;
  circleSearchResults: Array<{
    id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
    followers_count?: number;
  }>;
  defaultVibeAudience: "public" | "followers" | "circle";
  isSearchingCircleUsers: boolean;
  onAddToCircle: (username: string) => void;
  onRemoveFromCircle: (username: string) => void;
  setCircleSearchQuery: (q: string) => void;
  setCircleSearchResults: (results: any[]) => void;
  setDefaultVibeAudience: (aud: "public" | "followers" | "circle") => void;
}

export const CircleAudienceSection: React.FC<CircleAudienceSectionProps> = ({
  circleMembers,
  defaultVibeAudience,
  setDefaultVibeAudience,
  circleSearchQuery,
  setCircleSearchQuery,
  circleSearchResults,
  setCircleSearchResults,
  isSearchingCircleUsers,
  addingUsername,
  onAddToCircle,
  onRemoveFromCircle,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Users className="w-5 h-5 text-white" />
            <span>Cercle Privé &amp; Audience par défaut des Vibes</span>
          </div>
          <p className="text-xs text-zinc-400">
            Définissez l'audience appliquée par défaut à vos publications et
            composez votre liste de personnes autorisées.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-white" />
            <span>
              {circleMembers.length}{" "}
              {circleMembers.length > 1
                ? "personnes autorisées"
                : "personne autorisée"}
            </span>
          </span>
        </div>
      </div>

      {/* 1. Audience par défaut des publications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Audience par défaut dans les Vibes</span>
          </label>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Enregistré en table SQL
          </span>
        </div>
        <p className="text-[11px] text-zinc-400">
          L'audience sélectionnée sera choisie par défaut lors de la rédaction
          de chaque nouvelle publication Vibe.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              badge: "Par défaut",
              description:
                "Tout le monde peut voir et interagir avec vos publications sur le fil.",
              icon: Globe,
              id: "public",
              label: "Public",
            },
            {
              badge: null,
              description:
                "Seuls les utilisateurs qui vous suivent ont accès à vos publications.",
              icon: Users,
              id: "followers",
              label: "Abonnés uniquement",
            },
            {
              badge: `${circleMembers.length} membres`,
              description:
                "Uniquement les membres autorisés de votre cercle privé ci-dessous.",
              icon: Lock,
              id: "circle",
              label: "Cercle Privé",
            },
          ].map((opt) => {
            const Icon = opt.icon;
            const isSelected = defaultVibeAudience === opt.id;
            return (
              <button
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? "bg-zinc-900 border-white ring-1 ring-white/50 text-white shadow-lg shadow-white/5"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
                key={opt.id}
                onClick={() => setDefaultVibeAudience(opt.id as any)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-white">
                      {opt.label}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : opt.badge ? (
                    <span className="text-[9px] font-mono uppercase bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded">
                      {opt.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Recherche & Sélection des personnes autorisées pour le Cercle Privé */}
      <div className="space-y-3 pt-4 border-t border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Concevoir votre cercle privé</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            Recherchez et sélectionnez les noms d'utilisateurs autorisés
          </span>
        </div>

        {/* Champ de recherche */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            {isSearchingCircleUsers ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
            onChange={(e) => setCircleSearchQuery(e.target.value)}
            placeholder="Rechercher un utilisateur par @pseudo ou nom complet..."
            type="text"
            value={circleSearchQuery}
          />
          {circleSearchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-white"
              onClick={() => {
                setCircleSearchQuery("");
                setCircleSearchResults([]);
              }}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Résultats de recherche en direct */}
        {circleSearchQuery.trim().length > 0 && (
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 animate-fadeIn max-h-60 overflow-y-auto">
            <div className="text-[11px] font-mono uppercase text-zinc-400 px-1 flex items-center justify-between">
              <span>Résultats pour « {circleSearchQuery} »</span>
              <span>
                {circleSearchResults.length} trouvé
                {circleSearchResults.length > 1 ? "s" : ""}
              </span>
            </div>

            {isSearchingCircleUsers ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Recherche en cours...</span>
              </div>
            ) : circleSearchResults.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">
                Aucun utilisateur trouvé correspondant à « {circleSearchQuery}{" "}
                ».
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {circleSearchResults.map((u) => {
                  const isAlreadyMember = circleMembers.some(
                    (m) => m.username.toLowerCase() === u.username.toLowerCase()
                  );
                  const isAdding = addingUsername === u.username;
                  return (
                    <div
                      className="flex items-center justify-between gap-3 py-2 px-1 hover:bg-zinc-800/30 rounded-xl transition-colors"
                      key={u.id}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProfileAvatar
                          fallbackName={u.display_name || u.username}
                          size="sm"
                          src={u.avatar_url}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-white truncate">
                              {u.display_name || u.username}
                            </span>
                            {u.is_verified && (
                              <VerifiedBadge isVerified={true} size="xs" />
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      {isAlreadyMember ? (
                        <span className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 vibe-dark:text-emerald-400" />
                          <span>Déjà dans le cercle</span>
                        </span>
                      ) : (
                        <button
                          className="shrink-0 px-3 py-1 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          disabled={isAdding}
                          onClick={() => onAddToCircle(u.username)}
                          type="button"
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Ajout...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Ajouter au cercle</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Liste des personnes autorisées */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <Users className="w-3 h-3 text-zinc-400" />
              <span>Personnes autorisées ({circleMembers.length})</span>
            </p>
            {circleMembers.length > 0 && (
              <span className="text-[10px] text-zinc-500">
                Ces membres ont un accès exclusif aux Vibes publiées en Cercle
                Privé
              </span>
            )}
          </div>

          {circleMembers.length === 0 ? (
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1">
              <p className="text-zinc-400 text-xs font-medium">
                Votre cercle privé est actuellement vide.
              </p>
              <p className="text-zinc-600 text-[11px]">
                Recherchez des utilisateurs par leur pseudo ci-dessus pour
                composer votre cercle de personnes autorisées.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-60 overflow-y-auto bg-zinc-900/30">
              {circleMembers.map((m) => (
                <div
                  className="flex items-center justify-between gap-3 p-2.5 hover:bg-zinc-900/60 transition-colors"
                  key={m.id}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProfileAvatar
                      fallbackName={m.display_name || m.username}
                      size="sm"
                      src={m.avatar_url}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-white text-xs block truncate">
                        {m.display_name || m.username}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        @{m.username}
                      </span>
                    </div>
                  </div>

                  <button
                    className="px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 hover:text-red-500 vibe-dark:hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 text-xs transition-colors shrink-0 flex items-center gap-1"
                    onClick={() => onRemoveFromCircle(m.username)}
                    title={`Retirer @${m.username} du cercle privé`}
                    type="button"
                  >
                    <X className="w-3 h-3" />
                    <span>Retirer</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
