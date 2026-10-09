/**
 * ============================================================================
 * VIBE — MODALES DE GROUPES (src/components/messages/GroupModals.tsx)
 * Création d'un groupe et ajout de membres : la recherche d'utilisateurs
 * (débouncée) et ses états vivent dans ces composants ; la sélection reste
 * contrôlée par la page (« selected » + « onToggleUser »).
 * ============================================================================
 */

import { CheckIcon as Check, Loader2Icon as Loader2, SearchIcon as Search, UserPlusIcon as UserPlus, UsersIcon as Users } from "@mdevs/icons";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { ApiService } from "@/lib/vibe/services/api";

export interface DMSearchUser {
  avatar_url?: string;
  display_name?: string;
  id: string | number;
  is_verified?: boolean;
  tier?: string;
  username: string;
}

export type SelectedUser = {
  id: string | number;
  username: string;
  display_name?: string;
  avatar_url?: string;
};

/** Recherche d'utilisateurs débouncée (300 ms), hors compte courant. */
function useUserSearch(excludeUserId: string | number | undefined) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DMSearchUser[]>([]);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mémoïsé : les modales l'appellent depuis un effet dont `reset` est une
  // dépendance — sans cela, l'effet rejouerait à chaque rendu.
  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setBusy(false);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await ApiService.searchUsers(q.trim());
        setResults(
          (res?.users || []).filter(
            (u: DMSearchUser) => String(u.id) !== String(excludeUserId)
          )
        );
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 300);
  };

  return { busy, query, reset, results, search };
}

/** Champ de recherche + liste de résultats avec état de sélection. */
const MemberSearchBlock: React.FC<{
  query: string;
  busy: boolean;
  onQueryChange: (q: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  results: DMSearchUser[];
  selected: SelectedUser[];
  onToggleUser: (u: DMSearchUser) => void;
  emptyWithQuery: string;
  emptyWithoutQuery: string;
  filter?: (u: DMSearchUser) => boolean;
}> = ({
  query,
  busy,
  onQueryChange,
  placeholder,
  autoFocus,
  results,
  selected,
  onToggleUser,
  emptyWithQuery,
  emptyWithoutQuery,
  filter,
}) => {
  const list = filter ? results.filter(filter) : results;
  return (
    <>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          autoFocus={autoFocus}
          className="vibe-chat-search-input w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-none"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          type="text"
          value={query}
        />
        {busy && (
          <Loader2 className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
      </div>
      <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 vibe-dark:divide-zinc-900 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800">
        {list.map((u) => {
          const isSelected = selected.some(
            (s) => String(s.id) === String(u.id)
          );
          return (
            <button
              className={`vibe-chat-menu-item w-full p-2.5 flex items-center gap-3 transition-colors text-left ${
                isSelected ? "selected font-bold" : ""
              }`}
              key={u.id}
              onClick={() => onToggleUser(u)}
            >
              <ProfileAvatar
                alt={u.username}
                className="border border-zinc-200 vibe-dark:border-zinc-800 shrink-0"
                fallbackName={u.username}
                size="sm"
                src={u.avatar_url}
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold truncate">
                  {u.display_name || u.username}
                </span>
                <p className="text-[11px] text-zinc-500 font-mono">
                  @{u.username}
                </p>
              </div>
              {isSelected && <Check className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
        {list.length === 0 && !busy && (
          <p className="p-4 text-center text-[11px] text-zinc-500">
            {query.trim() ? emptyWithQuery : emptyWithoutQuery}
          </p>
        )}
      </div>
    </>
  );
};

/** Modale : créer un groupe (nom + sélection d'au moins un membre). */
export const CreateGroupModal: React.FC<{
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  selected: SelectedUser[];
  onToggleUser: (u: DMSearchUser) => void;
  busy: boolean;
  onClose: () => void;
  onCreate: () => void;
}> = ({
  open,
  name,
  onNameChange,
  selected,
  onToggleUser,
  busy,
  onClose,
  onCreate,
}) => {
  const { user } = useAuth();
  const search = useUserSearch(user?.id);

  useEffect(() => {
    if (!open) search.reset();
  }, [open, search.reset]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-3 animate-scaleUp text-zinc-900 vibe-dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <h3 className="text-sm font-bold">Créer un groupe</h3>
        </div>
        <input
          autoFocus
          className="vibe-chat-search-input w-full p-2.5 rounded-xl text-xs focus:outline-none"
          maxLength={50}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nom du groupe"
          type="text"
          value={name}
        />
        <p className="text-[10px] text-zinc-500">
          Sélectionnez au moins un membre. Vous serez l'administrateur du
          groupe.
        </p>
        <MemberSearchBlock
          busy={search.busy}
          emptyWithoutQuery="Recherchez des membres ci-dessus pour les ajouter."
          emptyWithQuery="Aucun compte trouvé."
          onQueryChange={search.search}
          onToggleUser={onToggleUser}
          placeholder="Rechercher des membres…"
          query={search.query}
          results={search.results}
          selected={selected}
        />
        <div className="flex justify-end gap-2">
          <button
            className="vibe-chat-modal-btn py-2 px-4 text-[11px] font-semibold"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="vibe-chat-accent-btn py-2 px-4 text-[11px] font-bold disabled:opacity-40"
            disabled={selected.length === 0 || busy}
            onClick={onCreate}
            style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
          >
            {busy ? "..." : "Créer le groupe"}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Modale : ajouter des membres à un groupe existant (admin). */
export const AddMembersModal: React.FC<{
  open: boolean;
  selected: SelectedUser[];
  onToggleUser: (u: DMSearchUser) => void;
  /** Ids des membres déjà présents (exclus des résultats). */
  existingMemberIds: Set<string>;
  busy: boolean;
  onClose: () => void;
  onAdd: () => void;
}> = ({
  open,
  selected,
  onToggleUser,
  existingMemberIds,
  busy,
  onClose,
  onAdd,
}) => {
  const { user } = useAuth();
  const search = useUserSearch(user?.id);

  useEffect(() => {
    if (!open) search.reset();
  }, [open, search.reset]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-3 animate-scaleUp text-zinc-900 vibe-dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <h3 className="text-sm font-bold">Ajouter des membres</h3>
        </div>
        <p className="text-[10px] text-zinc-500">
          Les nouveaux membres récupèrent tout l'historique de la conversation.
        </p>
        <MemberSearchBlock
          autoFocus
          busy={search.busy}
          emptyWithoutQuery="Recherchez des membres avec la barre de recherche."
          emptyWithQuery="Aucun compte à ajouter trouvé."
          filter={(u) => !existingMemberIds.has(String(u.id))}
          onQueryChange={search.search}
          onToggleUser={onToggleUser}
          placeholder="Rechercher des membres à ajouter…"
          query={search.query}
          results={search.results}
          selected={selected}
        />
        <div className="flex justify-end gap-2">
          <button
            className="vibe-chat-modal-btn py-2 px-4 text-[11px] font-semibold"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="vibe-chat-accent-btn py-2 px-4 text-[11px] font-bold disabled:opacity-40"
            disabled={selected.length === 0 || busy}
            onClick={onAdd}
            style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
          >
            {busy ? "..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
};
