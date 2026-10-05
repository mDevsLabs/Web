/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POST CARD (src/components/feed/PostCard.tsx)
 * Multi-Image Grid (up to 5), Video Player (up to 2) & Unlimited Content
 * ============================================================================
 */

import { motion } from "framer-motion";
import {
  Ban,
  BarChart2,
  BookMarked,
  Bookmark,
  CalendarClock,
  Check,
  Download,
  EyeOff,
  Heart,
  HelpCircle,
  Languages,
  Loader2,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Quote,
  Repeat,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  Volume2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useConfirmDialog } from "@/components/vibe/common/ConfirmDialog";
import { LikeParticles } from "@/components/vibe/common/LikeParticles";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import {
  htmlToPlainText,
  RichContent,
} from "@/components/vibe/common/RichContent";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import { BookPickerModal } from "@/components/vibe/feed/BookPickerModal";
import { BookRefCard } from "@/components/vibe/feed/BookRefCard";
import { MediaCarousel } from "@/components/vibe/feed/MediaCarousel";
import { MediaLightbox } from "@/components/vibe/feed/MediaLightbox";
import { PostShareModal } from "@/components/vibe/feed/PostShareModal";
import { PostStatsModal } from "@/components/vibe/feed/PostStatsModal";
import { formatCompactCount } from "@/lib/vibe/algorithms";
import { useAudioPlayer } from "@/lib/vibe/context/AudioPlayerContext";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { useMotionPrefs } from "@/lib/vibe/hooks/useMotionPrefs";
import { usePostViewTracking } from "@/lib/vibe/hooks/usePostViewTracking";
import { ApiService, TRANSLATION_LANGUAGES } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { downloadMedia, shareMedia } from "@/lib/vibe/services/mediaActions";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import { RealtimeService } from "@/lib/vibe/services/realtimeService";
import type { Post } from "@/lib/vibe/types/vibe";

interface PostCardProps {
  onOpenExplain?: (post: Post) => void;
  onOpenProfile?: (username: string) => void;
  onOpenThread?: (post: Post) => void;
  onPostDeleted?: (postId: string) => void;
  onRemoveFromBook?: (postId: string) => void;
  post: Post;
}

const formatTimeAgo = (dateStr: string): string => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  } catch {
    return "";
  }
};

export const PostCardBase: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onOpenThread,
  onOpenExplain,
  onOpenProfile,
  onRemoveFromBook,
}) => {
  const { user } = useAuth();
  const { playQueue } = useAudioPlayer();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.has_liked || false);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [isReposted, setIsReposted] = useState(post.has_reposted || false);
  const [isBookmarked, setIsBookmarked] = useState(
    post.has_bookmarked || false
  );
  const [repliesCount, setRepliesCount] = useState(post.replies_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  // Retour d'algorithme : « Cela m'intéresse » / « Cela ne m'intéresse pas »
  const [myFeedback, setMyFeedback] = useState<"more" | "less" | null>(
    post.my_feedback || null
  );
  // Traduction DeepL (repli mAI côté serveur), affichée sous le texte d'origine
  const [translation, setTranslation] = useState<{
    text: string;
    language: string;
    targetLanguage?: string;
    provider?: string;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  // Épinglage sur le profil + modale de partage
  const [isPinned, setIsPinned] = useState(post.is_pinned || false);
  const [isPinnedByProfile, setIsPinnedByProfile] = useState(
    post.pinned_by_profile || false
  );
  // Visionneuse plein écran (index dans la liste d'images du post)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  // Livre : « Vibe préférée » enregistrée dans un Livre (favoris durables)
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [isInABook, setIsInABook] = useState(
    Boolean((post as any).in_books > 0)
  );
  // Sondage intégré (vote unique modifiable)
  const [poll, setPoll] = useState(post.poll || null);
  const [isVoting, setIsVoting] = useState(false);
  // Statistiques créateur (auteur uniquement)
  const [showStats, setShowStats] = useState(false);
  // Collaboration : réponse à une invitation en attente
  const [collabStatus, setCollabStatus] = useState<string | null>(() => {
    const mine = (post.collaborators || []).find(
      (c) => c.username === user?.username
    );
    return mine ? mine.status : null;
  });

  // Resynchronise le sondage quand le parent recharge le post
  useEffect(() => {
    setPoll(post.poll || null);
  }, [post.id, post.poll]);

  const handleVote = async (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    if (isVoting || !poll || poll.expired) return;
    setIsVoting(true);
    try {
      const res = await ApiService.votePoll(post.id, optionId);
      if (res?.poll) {
        setPoll(res.poll);
        haptics.success();
      }
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Vote impossible",
        err?.message || "Réessayez dans un instant.",
        "error"
      );
    } finally {
      setIsVoting(false);
    }
  };

  const handleCollabRespond = async (e: React.MouseEvent, accept: boolean) => {
    e.stopPropagation();
    try {
      const res = await ApiService.respondToCollab(post.id, accept);
      setCollabStatus(res?.status || (accept ? "accepted" : "declined"));
      haptics.success();
      NotificationService.showInAppToast(
        accept ? "Co-signature acceptée" : "Invitation déclinée",
        accept
          ? "Votre avatar apparaît désormais sur ce post."
          : "L'invitation a été déclinée.",
        "info"
      );
      window.dispatchEvent(new CustomEvent("vibe:post_updated"));
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Réponse impossible.",
        "error"
      );
    }
  };

  // État du cœur flottant pour double-tap mobile
  const [heartFloatPos, setHeartFloatPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();
  const lastTapRef = useRef<number>(0);
  // Animations spring/pop + haptics synchro (respecte toggle + reduced-motion)
  const { play, animationsEnabled } = useMotionPrefs();
  const [burstKey, setBurstKey] = useState(0);
  const [repostBurst, setRepostBurst] = useState(false);
  const [bookmarkBurst, setBookmarkBurst] = useState(false);

  // Temps réel (SSE) : compteurs like/repost/réponses poussés par le serveur
  useEffect(
    () =>
      RealtimeService.on((type, payload) => {
        if (
          type !== "post_stats" ||
          !payload ||
          String(payload.post_id) !== String(post.id)
        )
          return;
        if (payload.likes_count !== undefined)
          setLikesCount(Number(payload.likes_count) || 0);
        if (payload.reposts_count !== undefined)
          setRepostsCount(Number(payload.reposts_count) || 0);
        if (payload.replies_count !== undefined)
          setRepliesCount(Number(payload.replies_count) || 0);
      }),
    [post.id]
  );

  // Resynchronise les compteurs quand le parent recharge le post (avec garde d'égalité)
  useEffect(() => {
    const targetLikes = post.likes_count || 0;
    const targetReposts = post.reposts_count || 0;
    const targetReplies = post.replies_count || 0;
    setLikesCount((prev) => (prev === targetLikes ? prev : targetLikes));
    setRepostsCount((prev) => (prev === targetReposts ? prev : targetReposts));
    setRepliesCount((prev) => (prev === targetReplies ? prev : targetReplies));
  }, [post.id, post.likes_count, post.reposts_count, post.replies_count]);

  useEffect(() => {
    const targetPinned = post.is_pinned || false;
    setIsPinned((prev) => (prev === targetPinned ? prev : targetPinned));
  }, [post.id, post.is_pinned]);

  const isAuthor =
    user && (user.id === post.author_id || user.username === post.username);

  // Compteur d'impressions : IntersectionObserver + dwell 1 s, une vue par
  // session et par post (fire-and-forget, cf. src/algorithms/viewTracking.ts)
  const { ref: viewRef, viewsCount } = usePostViewTracking(
    post.id,
    post.views_count,
    { enabled: post.status !== "scheduled" }
  );

  /**
   * Affine l'algorithme : enregistre/retire un retour d'intérêt qui
   * influence le classement des futures Vibes (« Pour Vous »).
   */
  const applyFeedback = async (value: "more" | "less") => {
    const newValue = myFeedback === value ? null : value;
    setMyFeedback(newValue);
    try {
      await ApiService.sendPostFeedback(post.id, newValue);
      NotificationService.showInAppToast(
        newValue === "more"
          ? "Cela m'intéresse"
          : newValue === "less"
            ? "Cela ne m'intéresse pas"
            : "Préférence retirée",
        newValue
          ? "Vos Vibes futures seront affinées."
          : "Ce post n'influence plus votre algorithme.",
        "info"
      );
    } catch {
      setMyFeedback(myFeedback);
    }
  };

  const handleQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("vibe:open_composer", { detail: { quotedPost: post } })
    );
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    window.dispatchEvent(
      new CustomEvent("vibe:open_composer", { detail: { editPost: post } })
    );
  };

  const handleAskMAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("vibe:open_mai", { detail: { postId: post.id } })
    );
  };

  /** Traduction DeepL (repli mAI côté serveur) : langue cible = réglage ou navigateur. */
  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTranslating || translation) return;
    setIsTranslating(true);
    try {
      const userLang = ApiService.resolveTargetLanguage();
      let res = await ApiService.translatePost(post.id, userLang);
      // Si la publication est déjà dans la langue cible (ex : post en français pour un utilisateur francophone),
      // on traduit vers l'anglais (ou vers le français si la cible initiale était l'anglais).
      if (res?.same_language) {
        const altLang =
          userLang.slice(0, 2).toUpperCase() === "FR" ? "EN-US" : "FR";
        res = await ApiService.translatePost(post.id, altLang);
      }
      if (res?.translation && !res.same_language) {
        const rawLang = res.detected_language || "";
        const prettyLang = rawLang
          ? res.provider === "deepl"
            ? TRANSLATION_LANGUAGES.find(
                (l) => l.code === rawLang.toUpperCase()
              )?.label || rawLang
            : rawLang
          : "";
        const targetLabel = res.target_lang
          ? TRANSLATION_LANGUAGES.find(
              (l) => l.code === res.target_lang?.toUpperCase()
            )?.label || res.target_lang
          : userLang.slice(0, 2).toUpperCase() === "FR" &&
              rawLang.toUpperCase().startsWith("FR")
            ? "Anglais"
            : undefined;
        setTranslation({
          language: prettyLang,
          provider: res.provider,
          targetLanguage: targetLabel,
          text: res.translation,
        });
      } else {
        NotificationService.showInAppToast(
          "Traduction indisponible",
          "La traduction n'a pas pu être récupérée.",
          "error"
        );
      }
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Traduction impossible",
        err?.message || "La traduction n'a pas pu être récupérée.",
        "error"
      );
    } finally {
      setIsTranslating(false);
    }
  };

  /** Écoute la publication avec la voix mAI (mini-lecteur flottant). */
  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const plain = htmlToPlainText(post.content || "").trim();
    const snippet = plain.slice(0, 48);
    playQueue([
      {
        id: post.id,
        text: plain,
        title: `@${post.username}${snippet ? ` — ${snippet}${plain.length > 48 ? "…" : ""}` : ""}`,
      },
    ]);
  };

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));
    if (newLikedState) {
      setLikeBurst(true);
      setBurstKey((k) => k + 1);
      setTimeout(() => setLikeBurst(false), 450);
      play("like");
    } else {
      play("unlike");
    }

    try {
      await ApiService.toggleLike(post.id);
    } catch {
      setIsLiked(!newLikedState);
      setLikesCount((prev) =>
        newLikedState ? Math.max(0, prev - 1) : prev + 1
      );
    }
  };

  /** Double tap mobile sur le post / média : déclenche un like et une animation de cœur */
  const handleTouchDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      let clientX = rect.left + rect.width / 2;
      let clientY = rect.top + rect.height / 2;
      if ("clientX" in e && typeof (e as any).clientX === "number") {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      } else if ("touches" in e && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      setHeartFloatPos({ x: clientX - rect.left, y: clientY - rect.top });
      setTimeout(() => setHeartFloatPos(null), 780);

      play("like");
      if (!isLiked) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        setLikeBurst(true);
        setBurstKey((k) => k + 1);
        setTimeout(() => setLikeBurst(false), 450);
        ApiService.toggleLike(post.id).catch(() => {
          setIsLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        });
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRepostState = !isReposted;
    setIsReposted(newRepostState);
    setRepostsCount((prev) =>
      newRepostState ? prev + 1 : Math.max(0, prev - 1)
    );
    if (newRepostState) {
      setRepostBurst(true);
      setTimeout(() => setRepostBurst(false), 450);
      play("success");
    } else {
      play("medium");
    }

    try {
      await ApiService.toggleRepost(post.id);
    } catch {
      setIsReposted(!newRepostState);
      setRepostsCount((prev) =>
        newRepostState ? Math.max(0, prev - 1) : prev + 1
      );
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (next) {
      setBookmarkBurst(true);
      setTimeout(() => setBookmarkBurst(false), 450);
      play("success");
    } else {
      play("light");
    }
    try {
      await ApiService.toggleBookmark(post.id);
    } catch {
      setIsBookmarked(!next);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.warning();
    const ok = await confirm({
      confirmLabel: "Supprimer",
      message: "Cette action est irréversible.",
      title: "Supprimer cette publication ?",
      tone: "danger",
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      await ApiService.deletePost(post.id);
      NotificationService.notifyPostDeleted();
      window.dispatchEvent(new CustomEvent("vibe:post_updated"));
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err.message || "Erreur lors de la suppression.",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  /** Épingle/désépingle la publication tout en haut du profil (max 2). */
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const next = !isPinned;
    try {
      const res = await ApiService.setPostPinned(post.id, next);
      setIsPinned(Boolean(res.pinned));
      NotificationService.showInAppToast(
        res.pinned ? "Post épinglé" : "Post désépinglé",
        res.pinned
          ? "Il restera fixé tout en haut de votre profil."
          : "Il reprend sa place chronologique.",
        "info"
      );
      window.dispatchEvent(new CustomEvent("vibe:post_updated"));
    } catch (err: any) {
      if (err?.code === "PIN_LIMIT") {
        NotificationService.showInAppToast(
          "Limite atteinte",
          "Vous ne pouvez épingler que 2 publications maximum.",
          "error"
        );
      } else {
        NotificationService.showInAppToast(
          "Erreur",
          err?.message || "L'épinglage a échoué.",
          "error"
        );
      }
    }
  };

  /** Met en avant un post d'un autre compte sur son profil (max 2 au total). */
  const handleToggleProfilePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const next = !isPinnedByProfile;
    try {
      const res = await ApiService.setPostProfilePinned(post.id, next);
      setIsPinnedByProfile(Boolean(res.pinned));
      haptics.success();
      NotificationService.showInAppToast(
        res.pinned ? "Post mis en avant" : "Post retiré",
        res.pinned
          ? "Il apparaît en tête de votre profil avec son auteur original."
          : "Il ne figure plus sur votre profil.",
        "info"
      );
      window.dispatchEvent(new CustomEvent("vibe:post_updated"));
    } catch (err: any) {
      if (err?.code === "PIN_LIMIT") {
        haptics.warning();
        NotificationService.showInAppToast(
          "Limite atteinte",
          "Vous ne pouvez épingler que 2 publications maximum.",
          "error"
        );
      } else {
        NotificationService.showInAppToast(
          "Erreur",
          err?.message || "L'épinglage a échoué.",
          "error"
        );
      }
    }
  };

  /** Mute : les publications/notifications de l'auteur disparaissent, en silence. */
  const handleMuteAuthor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      await ApiService.muteUser(post.username, true);
      NotificationService.showInAppToast(
        "Compte masqué",
        `Les publications de @${post.username} n'apparaîtront plus dans votre fil.`,
        "info"
      );
      window.dispatchEvent(new CustomEvent("vibe:feed_refresh"));
      onPostDeleted?.(post.id);
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Le masquage a échoué.",
        "error"
      );
    }
  };

  /** Block : coupe tout contact de manière visible (DM, follow, notifications). */
  const handleBlockAuthor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const ok = await confirm({
      confirmLabel: "Bloquer",
      message:
        "Cette action coupe tout contact de manière visible : messages, abonnement et notifications.",
      title: `Bloquer @${post.username} ?`,
      tone: "danger",
    });
    if (!ok) return;
    try {
      await ApiService.blockUser(post.author_id);
      NotificationService.showInAppToast(
        "Compte bloqué",
        `@${post.username} ne pourra plus interagir avec vous.`,
        "info"
      );
      window.dispatchEvent(new CustomEvent("vibe:feed_refresh"));
      onPostDeleted?.(post.id);
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Le blocage a échoué.",
        "error"
      );
    }
  };

  const allMedia: Array<{
    url: string;
    media_type?: string;
    alt_text?: string;
  }> =
    post.media_assets && post.media_assets.length > 0
      ? post.media_assets
      : post.media_url
        ? [
            {
              alt_text: "Média joint",
              media_type: post.media_url.endsWith(".mp4") ? "video" : "image",
              url: post.media_url,
            },
          ]
        : [];

  // Classification fiable : MIME "video/*" ou extension vidéo
  const isVideoMedia = (m: { url: string; media_type?: string }) =>
    String(m.media_type || "").startsWith("video") ||
    /\.(mp4|webm|mov)(\?|$)/i.test(m.url);

  const images = allMedia.filter((m) => !isVideoMedia(m));
  const videos = allMedia.filter(isVideoMedia);

  const quotedPost = post.quoted_post;
  const quotedImage = quotedPost?.media_assets?.find((m) => !isVideoMedia(m));

  const isScheduled = post.status === "scheduled";

  return (
    <article
      className="p-4 border-b border-zinc-800/90 bg-black hover:bg-zinc-950/70 transition-colors cursor-pointer relative select-none overflow-hidden"
      onClick={() => onOpenThread?.(post)}
      onDoubleClick={handleTouchDoubleTap}
      ref={viewRef}
    >
      {/* Cœur animé flottant lors d'un double-tap mobile */}
      {heartFloatPos && (
        <div
          className="absolute z-30 pointer-events-none animate-heartFloat"
          style={{ left: `${heartFloatPos.x}px`, top: `${heartFloatPos.y}px` }}
        >
          {animationsEnabled ? (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-full bg-black/70 backdrop-blur-md shadow-2xl border border-rose-500/40 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.3 }}
              transition={{ damping: 20, stiffness: 500, type: "spring" }}
            >
              <Heart className="w-10 h-10 fill-rose-500 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
            </motion.div>
          ) : (
            <div className="p-3 rounded-full bg-black/70 backdrop-blur-md shadow-2xl border border-rose-500/40 flex items-center justify-center">
              <Heart className="w-10 h-10 fill-rose-500 text-rose-500" />
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenProfile) onOpenProfile(post.username);
          }}
        >
          <ProfileAvatar
            alt={post.username}
            className="border border-zinc-800 hover:opacity-90 transition-opacity"
            fallbackName={post.username}
            size="md"
            src={post.avatar_url}
          />
          {/* Co-auteurs : avatars empilés */}
          {(post.collaborators || []).filter(
            (c) => c.status === "accepted" || c.username === user?.username
          ).length > 0 && (
            <div className="flex -mt-2 ml-4">
              {(post.collaborators || [])
                .filter(
                  (c) =>
                    c.status === "accepted" || c.username === user?.username
                )
                .slice(0, 2)
                .map((c) => (
                  <span
                    className="-ml-2 rounded-full ring-2 ring-black"
                    key={c.username}
                    title={`Co-signé par @${c.username}`}
                  >
                    <ProfileAvatar
                      alt={c.username}
                      className="border border-zinc-700"
                      fallbackName={c.username}
                      size="xs"
                      src={c.avatar_url}
                    />
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Étiquette « Post épinglé » (auteur) ou « mis en avant » (profil d'un autre) */}
          {isPinnedByProfile ? (
            <div
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400"
              title="Post mis en avant sur ce profil"
            >
              <Pin className="w-3 h-3" />
              Épinglé par @{post.pinned_by_username || "un membre"}
            </div>
          ) : isPinned ? (
            <div
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400"
              title="Ce post est épinglé sur le profil de son auteur"
            >
              <Pin className="w-3 h-3" />
              Post épinglé
            </div>
          ) : null}

          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                className="font-bold text-sm text-white hover:underline truncate"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenProfile) onOpenProfile(post.username);
                }}
              >
                {post.display_name || post.username}
              </span>
              <VerifiedBadge
                isVerified={post.is_verified || (post as any).isVerified}
                size="sm"
                tier={(post as any).tier}
              />
              <span className="text-zinc-500 text-xs">@{post.username}</span>
              <span className="text-zinc-600 text-xs">·</span>
              {isScheduled ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                  <CalendarClock className="w-2.5 h-2.5" />
                  Planifiée
                  {post.scheduled_at
                    ? ` · ${new Date(post.scheduled_at).toLocaleString("fr-FR", { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" })}`
                    : ""}
                </span>
              ) : (
                <span className="text-zinc-500 text-xs font-mono">
                  {formatTimeAgo(post.published_at)}
                </span>
              )}

              {/* Visibilité de la publication (Public par défaut = rien d'affiché) */}
              {post.visibility === "followers" && (
                <span
                  className="inline-flex items-center text-zinc-500"
                  title="Visible par les abonnés uniquement"
                >
                  <Users className="w-3 h-3" />
                </span>
              )}
              {post.visibility === "circle" && (
                <span
                  className="inline-flex items-center text-zinc-500"
                  title="Cercle Privé"
                >
                  <Users className="w-3 h-3" />
                  <Lock className="-ml-0.5 w-2 h-2" />
                </span>
              )}
              {post.visibility === "private" && (
                <span
                  className="inline-flex items-center text-zinc-500"
                  title="Visible par vous seul"
                >
                  <Lock className="w-3 h-3" />
                </span>
              )}

              {post.created_via === "mai_agent" && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                  <Sparkles className="w-2.5 h-2.5" />
                  mAI Post
                </span>
              )}

              {post.ai_generated && post.created_via !== "mai_agent" && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-500 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  Créé avec l'IA
                </span>
              )}

              {/* Badge co-signature */}
              {(post.collaborators || []).some(
                (c) => c.status === "accepted"
              ) && (
                <span
                  className="ml-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-semibold"
                  title={(post.collaborators || [])
                    .filter((c) => c.status === "accepted")
                    .map((c) => `@${c.username}`)
                    .join(", ")}
                >
                  <Users className="w-2.5 h-2.5" />
                  Co-signé
                </span>
              )}
            </div>

            {/* Options Menu & Actions */}
            <div className="flex items-center gap-1">
              {onRemoveFromBook && (
                <button
                  className="p-1 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromBook(post.id);
                  }}
                  title="Retirer du Livre"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="relative">
                <button
                  className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  title="Options de la publication"
                  type="button"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-6 z-20 w-48 vibe-menu rounded-2xl p-1.5 space-y-1">
                    {onRemoveFromBook && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onRemoveFromBook(post.id);
                        }}
                        type="button"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                        <span>Retirer du Livre</span>
                      </button>
                    )}
                    {onOpenExplain && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onOpenExplain(post);
                        }}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-white" />
                        <span>Pourquoi ce post ?</span>
                      </button>
                    )}

                    {/* Partage : DM (par défaut), lien ou QR Code */}
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowShare(true);
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>Partager</span>
                    </button>

                    {/* Affinement de l'algorithme (Vibes futures) */}
                    <button
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-zinc-800 flex items-center gap-2 transition-colors ${
                        myFeedback === "more"
                          ? "text-white font-bold"
                          : "text-zinc-300 hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        applyFeedback("more");
                      }}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-white" />
                      <span>Cela m'intéresse</span>
                      {myFeedback === "more" && (
                        <Check className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-zinc-800 flex items-center gap-2 transition-colors ${
                        myFeedback === "less"
                          ? "text-white font-bold"
                          : "text-zinc-300 hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        applyFeedback("less");
                      }}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-white" />
                      <span>Cela ne m'intéresse pas</span>
                      {myFeedback === "less" && (
                        <Check className="w-3 h-3 ml-auto" />
                      )}
                    </button>

                    {/* Mentionner la publication à l'assistant mAI */}
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                      onClick={handleAskMAI}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Demander à mAI</span>
                    </button>

                    {/* Écoute la publication avec la voix mAI */}
                    {post.content?.trim() && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={handleListen}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                        <span>Écouter avec mAI</span>
                      </button>
                    )}

                    {isAuthor && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={handleEdit}
                      >
                        <Pencil className="w-3.5 h-3.5 text-white" />
                        <span>Modifier</span>
                      </button>
                    )}

                    {/* Épinglage sur le profil (auteur uniquement, max 2) */}
                    {isAuthor && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={handleTogglePin}
                      >
                        {isPinned ? (
                          <>
                            <PinOff className="w-3.5 h-3.5 text-white" />
                            <span>Désépingler du profil</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3.5 h-3.5 text-white" />
                            <span>Épingler sur votre profil</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Mise en avant d'un post d'un autre compte (max 2 au total) */}
                    {!isAuthor && user && post.visibility === "public" && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={handleToggleProfilePin}
                      >
                        {isPinnedByProfile ? (
                          <>
                            <PinOff className="w-3.5 h-3.5 text-white" />
                            <span>Retirer de mon profil</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3.5 h-3.5 text-white" />
                            <span>Épingler sur mon profil</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Statistiques créateur (auteur uniquement) */}
                    {isAuthor && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowStats(true);
                        }}
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-white" />
                        <span>Statistiques</span>
                      </button>
                    )}

                    {isAuthor && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        disabled={isDeleting}
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                        <span>Supprimer</span>
                      </button>
                    )}

                    {/* Modération (posts d'autrui) : masquage silencieux + blocage visible */}
                    {!isAuthor && user && (
                      <>
                        <button
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          onClick={handleMuteAuthor}
                        >
                          <EyeOff className="w-3.5 h-3.5 text-white" />
                          <span>Masquer @{post.username}</span>
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2"
                          onClick={handleBlockAuthor}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Bloquer @{post.username}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Post Text (Unlimited, rendu riche sécurisé) */}
          <div className="text-zinc-100 text-sm sm:text-base leading-relaxed">
            <RichContent content={post.content} onOpenProfile={onOpenProfile} />
          </div>

          {/* Livres référencés (@livre / attachement) */}
          {post.book_refs && post.book_refs.length > 0 && (
            <BookRefCard books={post.book_refs} />
          )}

          {/* Traduction DeepL (repli mAI) : affichée sous le texte d'origine */}
          {(translation || isTranslating) && (
            <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
              {isTranslating ? (
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Traduction en cours…</span>
                </div>
              ) : (
                <div className="pl-2.5 border-l-2 border-zinc-700">
                  <div className="text-sm text-zinc-300 leading-relaxed break-words">
                    <RichContent content={translation!.text} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-600">
                      {translation!.targetLanguage
                        ? `Traduit en ${translation!.targetLanguage} via mAI`
                        : translation!.language
                          ? `Traduit de l'« ${translation!.language} » via mAI`
                          : "Traduit via mAI"}
                    </span>
                    <button
                      className="text-zinc-500 hover:text-white transition-colors font-bold"
                      onClick={() => setTranslation(null)}
                    >
                      Afficher l'original
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton « Traduire » (langue cible = réglage utilisateur ou navigateur) */}
          {!translation && !isTranslating && post.content?.trim() && (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-white transition-colors"
                onClick={handleTranslate}
                title="Traduire dans votre langue (mAI)"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Traduire</span>
              </button>
            </div>
          )}

          {/* Invitation de co-signature en attente (invité uniquement) */}
          {collabStatus === "pending" && (
            <div
              className="rounded-2xl border border-zinc-700 bg-zinc-950 p-3 flex items-center gap-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Users className="w-4 h-4 text-white shrink-0" />
              <p className="flex-1 text-xs text-zinc-300">
                <strong className="text-white">@{post.username}</strong> vous
                invite à co-signer ce post.
              </p>
              <button
                className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:brightness-90 transition-all"
                onClick={(e) => handleCollabRespond(e, true)}
              >
                Accepter
              </button>
              <button
                className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 text-xs font-bold hover:text-white transition-all"
                onClick={(e) => handleCollabRespond(e, false)}
              >
                Décliner
              </button>
            </div>
          )}

          {/* Sondage intégré */}
          {poll && (
            <div
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" />
                {poll.question}
              </p>
              <div className="space-y-1.5">
                {poll.options.map((opt) => {
                  const total = Math.max(1, Number(poll.total_votes || 0));
                  const pct = Math.round(
                    (Number(opt.votes_count || 0) / total) * 100
                  );
                  const mine = poll.my_vote === String(opt.id);
                  const voted = Boolean(poll.my_vote);
                  return (
                    <button
                      className={`relative w-full text-left px-3 py-2 rounded-xl border text-xs transition-all overflow-hidden disabled:cursor-default ${
                        mine
                          ? "border-white"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                      disabled={isVoting || poll.expired}
                      key={opt.id}
                      onClick={(e) => handleVote(e, String(opt.id))}
                      title={
                        poll.expired
                          ? "Sondage expiré"
                          : voted
                            ? "Cliquer pour changer de vote"
                            : "Voter"
                      }
                    >
                      {voted && (
                        <span
                          className={`absolute inset-y-0 left-0 ${mine ? "bg-white/20" : "bg-zinc-800"}`}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <span className="relative flex items-center justify-between gap-2">
                        <span className="text-zinc-100 font-semibold truncate">
                          {opt.label}
                        </span>
                        {voted && (
                          <span className="text-zinc-400 font-mono shrink-0">
                            {pct} %
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                {poll.total_votes} vote{(poll.total_votes || 0) > 1 ? "s" : ""}
                {" · "}
                {poll.expired
                  ? "Expiré"
                  : `Expire le ${new Date(poll.ends_at).toLocaleString("fr-FR", { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" })}`}
              </p>
            </div>
          )}

          {/* Publication citée (quote-post) : post original intégré, cliquable */}
          {quotedPost && (
            <div
              className="mt-1 rounded-2xl border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900/70 transition-colors p-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenThread) onOpenThread(quotedPost as unknown as Post);
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ProfileAvatar
                  alt={quotedPost.username}
                  fallbackName={quotedPost.username}
                  size="xs"
                  src={quotedPost.avatar_url}
                />
                <span className="text-xs font-bold text-white truncate">
                  {quotedPost.display_name || quotedPost.username}
                </span>
                <VerifiedBadge isVerified={quotedPost.is_verified} size="sm" />
                <span className="text-xs text-zinc-500 truncate">
                  @{quotedPost.username}
                </span>
                {quotedPost.published_at && (
                  <>
                    <span className="text-zinc-600 text-xs shrink-0">·</span>
                    <span className="text-xs text-zinc-500 font-mono shrink-0">
                      {formatTimeAgo(quotedPost.published_at)}
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm text-zinc-300 mt-1.5 line-clamp-4 break-words">
                <RichContent content={quotedPost.content} />
              </div>
              {quotedImage && (
                <img
                  alt={quotedImage.alt_text || "Média cité"}
                  className="mt-2 rounded-xl border border-zinc-800 max-h-44 w-full object-cover animate-mediaIn"
                  decoding="async"
                  loading="lazy"
                  src={quotedImage.url}
                />
              )}
            </div>
          )}

          {/* Images : image unique cliquable ou carrousel défilant (légendes intégrées) */}
          {images.length > 0 && (
            <div className="pt-2">
              {images.length === 1 ? (
                <>
                  <button
                    aria-label={images[0].alt_text || "Image 1"}
                    className="block w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.light();
                      setLightboxIndex(0);
                    }}
                    type="button"
                  >
                    <img
                      alt={images[0].alt_text || "Média 1"}
                      className="w-full max-h-[480px] object-cover animate-mediaIn"
                      decoding="async"
                      loading="lazy"
                      src={images[0].url}
                    />
                  </button>
                  {images[0].alt_text?.trim() && (
                    <p className="mt-1.5 text-xs text-zinc-500 leading-snug break-words">
                      {images[0].alt_text}
                    </p>
                  )}
                </>
              ) : (
                <MediaCarousel
                  images={images}
                  onOpen={(i) => {
                    haptics.light();
                    setLightboxIndex(i);
                  }}
                />
              )}
            </div>
          )}

          {/* Video Players (Up to 2 videos) avec légendes et actions */}
          {videos.length > 0 && (
            <div className="pt-2 space-y-2">
              {videos.map((vid, idx) => (
                <div
                  className="rounded-2xl overflow-hidden border border-zinc-800 bg-black max-h-96 animate-mediaIn"
                  key={idx}
                >
                  <video
                    className="w-full max-h-96 object-cover"
                    controls
                    onClick={(e) => e.stopPropagation()}
                    preload="metadata"
                    src={vid.url}
                  />
                  {vid.alt_text?.trim() && (
                    <p className="px-3 py-2 text-xs text-zinc-500 leading-snug break-words border-t border-zinc-900">
                      {vid.alt_text}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-t border-zinc-900">
                    <button
                      className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMedia(vid.url);
                      }}
                      title="Télécharger la vidéo"
                      type="button"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareMedia(vid.url, "Vidéo Vibe");
                      }}
                      title="Partager la vidéo"
                      type="button"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Engagement Footer Actions */}
          <div className="flex items-center justify-between pt-3 text-zinc-500 max-w-md text-xs">
            {/* Replies */}
            <button
              className="flex items-center gap-1.5 hover:text-white transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenThread) onOpenThread(post);
              }}
            >
              <div className="p-1.5 rounded-full group-hover:bg-zinc-900 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span>{repliesCount}</span>
            </button>

            {/* Repost */}
            <motion.button
              className={`flex items-center gap-1.5 transition-colors group ${
                isReposted ? "text-white font-bold" : "hover:text-white"
              }`}
              onClick={handleRepost}
              transition={{ damping: 25, stiffness: 500, type: "spring" }}
              whileTap={animationsEnabled ? { scale: 0.82 } : undefined}
            >
              <div
                className={`p-1.5 rounded-full group-hover:bg-zinc-900 transition-colors ${repostBurst ? "animate-likeBurst" : ""}`}
              >
                <Repeat className="w-4 h-4" />
              </div>
              <span
                className={repostBurst ? "animate-countPop" : ""}
                key={repostsCount}
              >
                {repostsCount}
              </span>
            </motion.button>

            {/* Citer (quote-post : nouvelle publication avec l'original intégré) */}
            <button
              className="flex items-center gap-1.5 hover:text-white transition-colors group"
              onClick={handleQuote}
              title="Citer cette publication dans un nouveau post"
            >
              <div className="p-1.5 rounded-full group-hover:bg-zinc-900 transition-colors">
                <Quote className="w-4 h-4" />
              </div>
            </button>

            {/* Impressions / Vues (non cliquable, à la X) */}
            <span
              className="flex items-center gap-1.5"
              title={`${Number(viewsCount) || 0} vues`}
            >
              <div className="p-1.5 rounded-full">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span>{formatCompactCount(viewsCount)}</span>
            </span>

            {/* Like */}
            <motion.button
              className={`flex items-center gap-1.5 transition-all group ${
                isLiked ? "text-rose-500 font-bold" : "hover:text-rose-400"
              }`}
              onClick={handleLike}
              title={isLiked ? "Ne plus aimer" : "J'aime"}
              transition={{ damping: 22, stiffness: 500, type: "spring" }}
              whileTap={animationsEnabled ? { scale: 0.82 } : undefined}
            >
              <div
                className={`relative p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors ${likeBurst ? "animate-likeBurst" : ""}`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${isLiked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:scale-110"}`}
                />
                {animationsEnabled && <LikeParticles burstKey={burstKey} />}
              </div>
              <span
                className={`${isLiked ? "text-rose-500" : ""} ${likeBurst ? "animate-countPop" : ""}`}
                key={likesCount}
              >
                {likesCount}
              </span>
            </motion.button>

            {/* Livre : enregistrer la Vibe dans un Livre (Vibe préférées) */}
            <button
              className={`flex items-center gap-1.5 transition-all active:scale-90 group ${
                isInABook ? "text-sky-300 font-bold" : "hover:text-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                setShowBookPicker(true);
              }}
              title={
                isInABook
                  ? "Enregistrée dans un Livre — gérer"
                  : "Enregistrer dans un Livre (Vibe préférées)"
              }
            >
              <div
                className={`p-1.5 rounded-full group-hover:bg-zinc-900 transition-colors ${isInABook ? "bg-sky-500/10" : ""}`}
              >
                <BookMarked
                  className={`w-4 h-4 ${isInABook ? "fill-sky-400/30 text-sky-300" : ""}`}
                />
              </div>
            </button>

            {/* Bookmark */}
            <motion.button
              className={`flex items-center gap-1.5 transition-all group ${
                isBookmarked ? "text-amber-400 font-bold" : "hover:text-white"
              }`}
              onClick={handleBookmark}
              title={
                isBookmarked
                  ? "Retirer des signets"
                  : "Enregistrer dans les signets"
              }
              transition={{ damping: 25, stiffness: 500, type: "spring" }}
              whileTap={animationsEnabled ? { scale: 0.82 } : undefined}
            >
              <div
                className={`p-1.5 rounded-full group-hover:bg-amber-400/10 transition-colors ${bookmarkBurst ? "animate-likeBurst" : ""}`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`}
                />
              </div>
            </motion.button>

            {/* Partager (ouvre la modale DM / lien / QR Code) */}
            <button
              className="flex items-center gap-1.5 hover:text-white transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                setShowShare(true);
              }}
              title="Partager"
            >
              <div className="p-1.5 rounded-full group-hover:bg-zinc-900 transition-colors">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modale de partage : Message privé (défaut), Lien, QR Code */}
      {showShare && (
        <PostShareModal onClose={() => setShowShare(false)} post={post} />
      )}

      {/* Visionneuse plein écran des images (swipe, légende, téléchargement, partage) */}
      {lightboxIndex !== null && images.length > 0 && (
        <MediaLightbox
          initialIndex={lightboxIndex}
          items={images}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Modale « Enregistrer dans un Livre » (Vibe préférées) */}
      {showBookPicker && user && (
        <BookPickerModal
          onClose={() => setShowBookPicker(false)}
          onSavedBooksChange={(ids) => setIsInABook(ids.length > 0)}
          postId={post.id}
        />
      )}

      {/* Modale statistiques créateur (auteur uniquement) */}
      {showStats && (
        <PostStatsModal onClose={() => setShowStats(false)} postId={post.id} />
      )}

      {confirmDialog}
    </article>
  );
};

/**
 * Mémoïsation : la carte ne re-render que si ses données ou ses callbacks
 * changent — critique pour garder le scroll infini fluide.
 */
export const PostCard = React.memo(
  PostCardBase,
  (prev, next) =>
    prev.post === next.post &&
    prev.onOpenThread === next.onOpenThread &&
    prev.onOpenProfile === next.onOpenProfile &&
    prev.onOpenExplain === next.onOpenExplain &&
    prev.onPostDeleted === next.onPostDeleted &&
    prev.onRemoveFromBook === next.onRemoveFromBook
);
