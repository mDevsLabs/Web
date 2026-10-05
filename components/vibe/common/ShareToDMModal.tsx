/**
 * ============================================================================
 * VIBE — MODALE « PARTAGER PAR MESSAGE VIBE » (src/components/common/ShareToDMModal.tsx)
 * Sélection d'un destinataire (recherche de comptes) + envoi d'un message
 * prérempli en DM. Utilisée pour partager une réponse mAI (Studio & Drawer).
 * ============================================================================
 */

import { ArrowLeft, Check, Loader2, Search, Send, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";

interface ShareToDMModalProps {
  initialMessage: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

interface Recipient {
  avatar_url?: string;
  display_name?: string;
  id: number;
  username: string;
}

export const ShareToDMModal: React.FC<ShareToDMModalProps> = ({
  isOpen,
  onClose,
  initialMessage,
  title = "Partager par message Vibe",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setRecipient(null);
    setMessage(initialMessage);
    setSent(false);
    setError(null);
  }, [isOpen, initialMessage]);

  useEffect(() => {
    if (!isOpen || recipient) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await ApiService.searchUsers(q);
        setResults((res?.users || []).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, isOpen, recipient]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!recipient || !message.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await ApiService.sendMessage(recipient.id, message.trim());
      haptics.success();
      setSent(true);
    } catch (err: any) {
      haptics.error();
      setError(err?.message || "L'envoi du message a échoué.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn h-dvh"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black/60">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4" />
            {title}
          </span>
          <button
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {sent ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <span className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </span>
              <p className="text-sm font-bold text-white">
                Message envoyé à @{recipient?.username}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
                  onClick={() => {
                    setSent(false);
                    setRecipient(null);
                    setQuery("");
                    setResults([]);
                  }}
                  type="button"
                >
                  Envoyer à quelqu'un d'autre
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
                  onClick={onClose}
                  type="button"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : recipient ? (
            <>
              <button
                className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
                onClick={() => setRecipient(null)}
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Changer de destinataire
              </button>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                <ProfileAvatar
                  alt={recipient.username}
                  fallbackName={recipient.username}
                  size="sm"
                  src={recipient.avatar_url}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {recipient.display_name || recipient.username}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    @{recipient.username}
                  </div>
                </div>
              </div>

              <textarea
                className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                maxLength={5000}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                value={message}
              />

              {error && (
                <p className="text-[11px] text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                className="w-full py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                disabled={!message.trim() || isSending}
                onClick={handleSend}
                type="button"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer le message
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un compte (@nom)…"
                  type="text"
                  value={query}
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {query.trim().length >= 2 &&
                results.length === 0 &&
                !isSearching && (
                  <p className="text-center text-[11px] text-zinc-500 py-4">
                    Aucun compte trouvé.
                  </p>
                )}

              {results.length > 0 && (
                <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden max-h-64 overflow-y-auto">
                  {results.map((u) => (
                    <button
                      className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-zinc-900/60 transition-colors"
                      key={u.id}
                      onClick={() => {
                        haptics.selection();
                        setRecipient(u);
                      }}
                      type="button"
                    >
                      <ProfileAvatar
                        alt={u.username}
                        fallbackName={u.username}
                        size="sm"
                        src={u.avatar_url}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-white truncate">
                          {u.display_name || u.username}
                        </span>
                        <span className="block text-[11px] text-zinc-500 truncate">
                          @{u.username}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
