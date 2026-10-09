/**
 * ============================================================================
 * VIBE — MODALE DE PARTAGE DE POST (src/components/feed/PostShareModal.tsx)
 * Trois modes de partage d'une publication :
 *   • Message  (onglet par défaut) — envoi par DM à un utilisateur recherché
 *   • Lien     — permalink copiable + partage natif (Web Share API)
 *   • QR Code  — QR simple du permalink, téléchargeable en PNG
 * ============================================================================
 */

import { CheckIcon as Check, CopyIcon as Copy, DownloadIcon as Download, Link2Icon as Link2, Loader2Icon as Loader2, MessageSquareIcon as MessageSquare, QrCodeIcon as QrCode, SearchIcon as Search, SendIcon as Send, Share2Icon as Share2, UserPlusIcon as UserPlus, XIcon as X } from "@mdevs/icons";
import QRCode from "qrcode";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { makeExcerpt } from "@/components/vibe/common/richTextUtils";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import { toVibeAbsoluteUrl } from "@/components/vibe/router";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import type { Post } from "@/lib/vibe/types/vibe";

interface PostShareModalProps {
  onClose: () => void;
  post: Post;
}

type ShareTab = "message" | "link" | "qr";

interface SearchedUser {
  avatar_url?: string;
  display_name?: string;
  id: number | string;
  is_verified?: boolean;
  username: string;
}

export const PostShareModal: React.FC<PostShareModalProps> = ({
  post,
  onClose,
}) => {
  const [tab, setTab] = useState<ShareTab>("message");

  // Lien absolu via l'adaptateur : `/post/…` seul sortirait de `/vibe` (404).
  const postUrl = useMemo(
    () => toVibeAbsoluteUrl(`/post/${post.id}`),
    [post.id]
  );

  // Snippet du message de partage : auteur + extrait + lien
  const defaultShareMessage = useMemo(() => {
    const excerpt = makeExcerpt(post.content, 80);
    return excerpt
      ? `À voir sur Vibe — @${post.username} : « ${excerpt} »\n${postUrl}`
      : `À voir sur Vibe : ${postUrl}`;
  }, [post.content, post.username, postUrl]);

  // ── Onglet Message (DM) ──────────────────────────────────────────────
  const [recipientQuery, setRecipientQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [dmMessage, setDmMessage] = useState(defaultShareMessage);
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Recherche d'utilisateurs (debounce 300 ms, comme MessagesPage)
  useEffect(() => {
    if (tab !== "message" || selectedUser) return;
    const q = recipientQuery.trim();
    const timer = setTimeout(
      async () => {
        if (!q) {
          setResults([]);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);
        try {
          const res = await ApiService.searchUsers(q.replace(/^@/, ""));
          setResults(
            (res?.users || []).filter(
              (u) =>
                String(u.username).toLowerCase() !==
                String(post.username).toLowerCase()
            )
          );
        } catch {
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      },
      q ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [recipientQuery, tab, selectedUser, post.username]);

  const handleSendDM = async () => {
    if (!selectedUser || isSending) return;
    setIsSending(true);
    try {
      const res = await ApiService.sendMessage(
        selectedUser.id,
        dmMessage.trim()
      );
      if (res?.success) {
        haptics.success();
        setSentTo(selectedUser.username);
        NotificationService.showInAppToast(
          "Publication partagée",
          `Envoyée en message privé à @${selectedUser.username}.`,
          "success"
        );
      } else {
        haptics.error();
        NotificationService.showInAppToast(
          "Envoi impossible",
          "Le message n'a pas pu être envoyé.",
          "error"
        );
      }
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Envoi impossible",
        err?.message || "Le message n'a pas pu être envoyé.",
        "error"
      );
    } finally {
      setIsSending(false);
    }
  };

  // ── Onglet Lien ──────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      NotificationService.showInAppToast(
        "Copie impossible",
        "Copiez le lien manuellement.",
        "error"
      );
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        text: "À voir sur Vibe",
        title: `Post de @${post.username}`,
        url: postUrl,
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") await handleCopyLink();
    }
  };

  // ── Onglet QR Code ───────────────────────────────────────────────────
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (tab !== "qr") return;
    let cancelled = false;
    QRCode.toDataURL(postUrl, {
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
      margin: 2,
      width: 480,
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, postUrl]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `vibe-post-${post.id.slice(0, 8)}.png`;
    link.click();
  };

  const tabs: Array<{ key: ShareTab; label: string; icon: React.ElementType }> =
    [
      { icon: MessageSquare, key: "message", label: "Message" },
      { icon: Link2, key: "link", label: "Lien" },
      { icon: QrCode, key: "qr", label: "QR Code" },
    ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-mediaIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white vibe-dark:bg-zinc-950 border border-zinc-200 vibe-dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 vibe-dark:border-zinc-800">
          <h2 className="text-base font-bold text-black vibe-dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-black vibe-dark:text-white" />
            Partager cette vibe
          </h2>
          <button
            aria-label="Fermer"
            className="text-zinc-500 hover:text-black vibe-dark:hover:text-white p-1.5 rounded-full hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-black vibe-dark:text-white" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-zinc-200 vibe-dark:border-zinc-800 bg-zinc-50 vibe-dark:bg-black/60">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative ${
                tab === key
                  ? "text-black vibe-dark:text-white"
                  : "text-zinc-600 vibe-dark:text-zinc-400 hover:text-black vibe-dark:hover:text-zinc-300"
              }`}
              key={key}
              onClick={() => setTab(key)}
            >
              <Icon className="w-3.5 h-3.5 text-black vibe-dark:text-white" />
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black vibe-dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── MESSAGE (DM, par défaut) ── */}
          {tab === "message" && (
            <div className="space-y-4">
              {sentTo ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-600 vibe-dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-black vibe-dark:text-white font-bold">
                    Partagé avec @{sentTo} !
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-full bg-white border border-zinc-300 vibe-dark:border-transparent text-black text-xs font-bold hover:bg-zinc-100 transition-colors shadow-sm"
                      onClick={() => {
                        setSentTo(null);
                        setSelectedUser(null);
                        setRecipientQuery("");
                      }}
                    >
                      Partager à quelqu'un d'autre
                    </button>
                    <button
                      className="px-4 py-2 rounded-full border border-zinc-300 vibe-dark:border-zinc-700 bg-white vibe-dark:bg-transparent text-black vibe-dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
                      onClick={onClose}
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              ) : selectedUser ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800 bg-zinc-50 vibe-dark:bg-zinc-900/60">
                    <ProfileAvatar
                      alt={selectedUser.username}
                      fallbackName={selectedUser.username}
                      size="sm"
                      src={selectedUser.avatar_url}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-black vibe-dark:text-white truncate">
                          {selectedUser.display_name || selectedUser.username}
                        </span>
                        <VerifiedBadge
                          isVerified={selectedUser.is_verified}
                          size="xs"
                        />
                      </div>
                      <span className="text-xs text-zinc-600 vibe-dark:text-zinc-400">
                        @{selectedUser.username}
                      </span>
                    </div>
                    <button
                      className="text-zinc-500 hover:text-black vibe-dark:hover:text-white text-xs font-bold p-1.5 rounded-full hover:bg-zinc-200 vibe-dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setSelectedUser(null)}
                    >
                      <X className="w-3.5 h-3.5 text-black vibe-dark:text-white" />
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-zinc-50 vibe-dark:bg-transparent border border-zinc-200 vibe-dark:border-zinc-800 rounded-2xl p-3 text-sm text-black vibe-dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 vibe-dark:focus:border-zinc-600 resize-none"
                    onChange={(e) => setDmMessage(e.target.value)}
                    placeholder="Message à envoyer…"
                    rows={4}
                    value={dmMessage}
                  />
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white border border-zinc-300 vibe-dark:border-transparent text-black text-sm font-bold hover:bg-zinc-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSending || !dmMessage.trim()}
                    onClick={handleSendDM}
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Send className="w-4 h-4 text-black" />
                    )}
                    <span className="text-black">Envoyer en message privé</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black vibe-dark:text-zinc-400" />
                    <input
                      autoFocus
                      className="w-full bg-zinc-50 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-black vibe-dark:text-white placeholder-zinc-400 vibe-dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 vibe-dark:focus:border-zinc-600"
                      onChange={(e) => setRecipientQuery(e.target.value)}
                      placeholder="Rechercher un compte à qui envoyer…"
                      type="text"
                      value={recipientQuery}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-zinc-200 vibe-dark:divide-zinc-900 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800">
                    {isSearching && (
                      <div className="flex items-center gap-2 p-3 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black vibe-dark:text-white" />
                        Recherche…
                      </div>
                    )}
                    {!isSearching &&
                      recipientQuery.trim() &&
                      results.length === 0 && (
                        <div className="p-3 text-xs text-zinc-500">
                          Aucun compte trouvé.
                        </div>
                      )}
                    {!recipientQuery.trim() && (
                      <div className="flex items-center gap-2 p-3 text-xs text-zinc-600 vibe-dark:text-zinc-400">
                        <UserPlus className="w-3.5 h-3.5 text-black vibe-dark:text-zinc-400" />
                        Tapez un nom d'utilisateur pour partager en DM.
                      </div>
                    )}
                    {results.map((u) => (
                      <button
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setDmMessage(defaultShareMessage);
                        }}
                      >
                        <ProfileAvatar
                          alt={u.username}
                          fallbackName={u.username}
                          size="sm"
                          src={u.avatar_url}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-black vibe-dark:text-white truncate">
                              {u.display_name || u.username}
                            </span>
                            <VerifiedBadge
                              isVerified={u.is_verified}
                              size="xs"
                            />
                          </div>
                          <span className="text-xs text-zinc-600 vibe-dark:text-zinc-400">
                            @{u.username}
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-black vibe-dark:text-zinc-400" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── LIEN ── */}
          {tab === "link" && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800 bg-zinc-50 vibe-dark:bg-zinc-900/60 text-xs text-black vibe-dark:text-zinc-300 break-all font-mono">
                {postUrl}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-white border border-zinc-300 vibe-dark:border-transparent text-black text-sm font-bold hover:bg-zinc-100 transition-colors shadow-sm"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-black" />
                  ) : (
                    <Copy className="w-4 h-4 text-black" />
                  )}
                  <span className="text-black">
                    {copied ? "Lien copié !" : "Copier le lien"}
                  </span>
                </button>
                {"share" in navigator && (
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-zinc-300 vibe-dark:border-zinc-700 bg-white vibe-dark:bg-transparent text-black vibe-dark:text-zinc-300 text-sm font-bold hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors shadow-sm"
                    onClick={handleNativeShare}
                    title="Partage natif"
                  >
                    <Share2 className="w-4 h-4 text-black vibe-dark:text-zinc-300" />
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-600 vibe-dark:text-zinc-400 text-center">
                Toute personne disposant du lien peut voir cette publication.
              </p>
            </div>
          )}

          {/* ── QR CODE ── */}
          {tab === "qr" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white border border-zinc-200 rounded-2xl shadow-md">
                  {qrDataUrl ? (
                    <img
                      alt="QR Code du post"
                      className="w-48 h-48"
                      src={qrDataUrl}
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-black vibe-dark:text-zinc-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-600 vibe-dark:text-zinc-400 text-center">
                  Scannez pour ouvrir la publication
                </p>
              </div>
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white border border-zinc-300 vibe-dark:border-transparent text-black text-sm font-bold hover:bg-zinc-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!qrDataUrl}
                onClick={handleDownloadQr}
              >
                <Download className="w-4 h-4 text-black" />
                <span className="text-black">Télécharger le QR Code</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
