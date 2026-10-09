"use client";

import { EditIcon as Edit, FacebookIcon as Facebook, InstagramIcon as Instagram, LinkedinIcon as Linkedin, LogInIcon as LogIn, MessageCircleIcon as MessageCircle, SendIcon as Send, Share2Icon as Share2, ThumbsDownIcon as ThumbsDown, ThumbsUpIcon as ThumbsUp, Trash2Icon as Trash2, TwitterIcon as Twitter, UserPlusIcon as UserPlus, YoutubeIcon as Youtube } from "@mdevs/icons";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/site/auth-provider";
import Link from "@/components/site/router";
import { formatDisplayDate } from "@/lib/site/date-format";

export type Comment = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  message: string;
  timestamp: number;
  rating?: number;
};

interface ShareButtonsProps {
  description?: string;
  title: string;
  /** URL absolue de l'article, calculée par la page serveur. */
  url: string;
}

export function ShareButtons({ title, description, url }: ShareButtonsProps) {
  return (
    <div className="mt-12 pt-8 border-t border-black/5">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Partager cet article
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-slate-900"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ text: description, title, url });
              } catch {
                // Partage annulé par l'utilisateur : rien à signaler.
              }
            } else {
              toast.error("Partage non supporté sur cet appareil");
            }
          }}
          type="button"
        >
          <Share2 className="w-4 h-4" />
          Partager
        </button>
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-[#1DA1F2]"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Twitter className="w-4 h-4" />
          Twitter/X
        </a>
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-[#1877F2]"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </a>
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-[#0A66C2]"
          href={`https://www.linkedin.com/sharing/share-plugin/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || "")}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Linkedin className="w-4 h-4" />
          LinkedIn
        </a>
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-[#E4405F]"
          href={`https://www.instagram.com/share?url=${encodeURIComponent(url)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Instagram className="w-4 h-4" />
          Instagram
        </a>
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-[#FF0000]"
          href={`https://www.youtube.com/share?url=${encodeURIComponent(url)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Youtube className="w-4 h-4" />
          YouTube
        </a>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-slate-900"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast.success("Lien copié !");
            } catch {
              toast.error("Copie impossible sur cet appareil");
            }
          }}
          type="button"
        >
          <Share2 className="w-4 h-4" />
          Copier le lien
        </button>
      </div>
    </div>
  );
}

function CommentForm({
  onAddComment,
  editingComment,
  onUpdateComment,
  authorName,
  authorEmail,
  authorAvatar,
}: {
  onAddComment: (comment: Comment) => void;
  editingComment?: Comment | null;
  onUpdateComment?: (comment: Comment) => void;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
}) {
  const [message, setMessage] = useState(editingComment?.message || "");
  const [rating, setRating] = useState(editingComment?.rating || 0);

  useEffect(() => {
    if (editingComment) {
      setMessage(editingComment.message || "");
      setRating(editingComment.rating || 0);
    } else {
      setMessage("");
      setRating(0);
    }
  }, [editingComment, authorAvatar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !authorEmail || !message.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    const newComment: Comment = {
      avatar: authorAvatar || undefined,
      email: authorEmail,
      id: editingComment?.id || Date.now().toString(),
      message: message.trim(),
      name: authorName,
      rating: rating || undefined,
      timestamp: editingComment?.timestamp || Date.now(),
    };

    if (editingComment && onUpdateComment) {
      onUpdateComment(newComment);
      toast.success("Commentaire mis à jour !");
    } else {
      onAddComment(newComment);
      toast.success("Commentaire publié !");
    }
    setMessage("");
    setRating(0);
  };

  return (
    <form className="space-y-4 mb-8 relative" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nom
          </label>
          <input
            aria-label="Nom d'utilisateur du compte"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
            readOnly
            type="text"
            value={authorName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            aria-label="Email du compte"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
            readOnly
            type="email"
            value={authorEmail}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Note (optionnel)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              className={`w-10 h-10 rounded-full border-2 transition-colors ${value <= rating ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-300 hover:bg-orange-50"}`}
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Commentaire
        </label>
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Partagez votre avis..."
          required
          rows={4}
          value={message}
        />
      </div>

      <button
        className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center gap-2"
        type="submit"
      >
        <Send className="w-5 h-5" />
        {editingComment
          ? "Mettre à jour le commentaire"
          : "Publier le commentaire"}
      </button>
    </form>
  );
}

type VoteCounts = { helpful: number; unhelpful: number };

/**
 * Lit les compteurs de votes depuis le navigateur. Une valeur absente ou corrompue
 * renvoie des compteurs à zéro plutôt que de lever : un `JSON.parse` non protégé
 * faisait échouer le clic sur un commentaire et bloquait le composant.
 */
function readVoteCounts(commentId: string): VoteCounts {
  try {
    const raw = localStorage.getItem(`votes_${commentId}`);
    if (!raw) return { helpful: 0, unhelpful: 0 };
    const parsed = JSON.parse(raw) as Partial<VoteCounts>;
    return {
      helpful: Number(parsed.helpful) || 0,
      unhelpful: Number(parsed.unhelpful) || 0,
    };
  } catch {
    return { helpful: 0, unhelpful: 0 };
  }
}

function CommentItem({
  comment,
  commentId,
  onDelete,
  onEdit,
}: {
  comment: Comment;
  commentId: string;
  onDelete?: (id: string) => void;
  onEdit?: (comment: Comment) => void;
}) {
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [unhelpfulCount, setUnhelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState<"helpful" | "unhelpful" | null>(
    null
  );

  useEffect(() => {
    const savedVote = localStorage.getItem(`vote_${commentId}`);
    if (savedVote === "helpful") setHasVoted("helpful");
    else if (savedVote === "unhelpful") setHasVoted("unhelpful");
    const counts = readVoteCounts(commentId);
    setHelpfulCount(counts.helpful || 0);
    setUnhelpfulCount(counts.unhelpful || 0);
  }, [commentId]);

  const handleHelpful = () => {
    const counts = readVoteCounts(commentId);
    if (hasVoted === "helpful") {
      localStorage.removeItem(`vote_${commentId}`);
      localStorage.setItem(
        `votes_${commentId}`,
        JSON.stringify({ ...counts, helpful: counts.helpful - 1 })
      );
      setHasVoted(null);
      setHelpfulCount(counts.helpful - 1);
    } else {
      const newCounts =
        hasVoted === "unhelpful"
          ? {
              ...counts,
              helpful: counts.helpful + 1,
              unhelpful: counts.unhelpful - 1,
            }
          : { ...counts, helpful: counts.helpful + 1 };
      localStorage.setItem(`vote_${commentId}`, "helpful");
      localStorage.setItem(`votes_${commentId}`, JSON.stringify(newCounts));
      setHasVoted("helpful");
      setHelpfulCount(newCounts.helpful);
      if (hasVoted === "unhelpful") setUnhelpfulCount(newCounts.unhelpful);
    }
  };

  const handleUnhelpful = () => {
    const counts = readVoteCounts(commentId);
    if (hasVoted === "unhelpful") {
      localStorage.removeItem(`vote_${commentId}`);
      localStorage.setItem(
        `votes_${commentId}`,
        JSON.stringify({ ...counts, unhelpful: counts.unhelpful - 1 })
      );
      setHasVoted(null);
      setUnhelpfulCount(counts.unhelpful - 1);
    } else {
      const newCounts =
        hasVoted === "helpful"
          ? {
              ...counts,
              helpful: counts.helpful - 1,
              unhelpful: counts.unhelpful + 1,
            }
          : { ...counts, unhelpful: counts.unhelpful + 1 };
      localStorage.setItem(`vote_${commentId}`, "unhelpful");
      localStorage.setItem(`votes_${commentId}`, JSON.stringify(newCounts));
      setHasVoted("unhelpful");
      setUnhelpfulCount(newCounts.unhelpful);
      if (hasVoted === "helpful") setHelpfulCount(newCounts.helpful);
    }
  };

  const formatDate = (timestamp: number) =>
    formatDisplayDate(timestamp, {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getAvatarElement = () => {
    if (comment.avatar && comment.avatar.startsWith("http")) {
      return (
        <Image
          alt={comment.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 bg-white"
          height={48}
          src={comment.avatar}
          unoptimized
          width={48}
        />
      );
    }
    if (
      comment.avatar &&
      (/\p{Extended_Pictographic}/u.test(comment.avatar) ||
        /[^\u0020-\uFFFF]/.test(comment.avatar))
    ) {
      return (
        <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-orange-200 flex items-center justify-center text-xl">
          {comment.avatar}
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-orange-200 flex items-center justify-center text-white font-semibold text-lg">
        {comment.name
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </div>
    );
  };

  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 transition-all hover:shadow-md">
      <div className="flex items-start gap-4 mb-4">
        {getAvatarElement()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-slate-900">{comment.name}</h4>
            <span className="text-xs text-slate-500">
              {formatDate(comment.timestamp)}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-2">{comment.email}</p>
          {comment.rating && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-sm text-slate-600">Note:</span>
              <div className="flex gap-1">
                {[...new Array(5)].map((_, i) => (
                  <ThumbsUp
                    className={`w-4 h-4 ${i < comment.rating! ? "text-orange-500 fill-orange-500" : "text-slate-300"}`}
                    key={i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-700 mb-4 leading-relaxed">{comment.message}</p>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
        <button
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors text-sm ${hasVoted === "helpful" ? "text-orange-500 bg-orange-100" : hasVoted === "unhelpful" ? "text-slate-400" : "text-slate-600 hover:bg-slate-100"}`}
          onClick={handleHelpful}
        >
          <ThumbsUp className="w-4 h-4" />
          Utile ({helpfulCount})
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors text-sm ${hasVoted === "unhelpful" ? "text-slate-500 bg-slate-100" : hasVoted === "helpful" ? "text-slate-400" : "text-slate-600 hover:bg-slate-100"}`}
          onClick={handleUnhelpful}
        >
          <ThumbsDown className="w-4 h-4" />
          Inutile ({unhelpfulCount})
        </button>
        {onEdit && (
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-full text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            onClick={() => onEdit(comment)}
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        )}
        {onDelete && (
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-full text-slate-600 hover:bg-red-100 transition-colors text-sm"
            onClick={() => {
              onDelete(commentId);
              toast.success("Commentaire supprimé !");
            }}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ articleSlug }: { articleSlug: string }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const nextPath = `/news/${articleSlug}`;

  useEffect(() => {
    const storedComments = localStorage.getItem(`comments_${articleSlug}`);
    if (storedComments) {
      try {
        setComments(JSON.parse(storedComments));
      } catch {
        setComments([]);
      }
    } else {
      setComments([]);
    }
    setHydrated(true);
  }, [articleSlug]);

  // Synchroniser l'avatar de l'utilisateur connecté avec ses anciens commentaires
  useEffect(() => {
    if (user?.email && comments.length > 0) {
      let changed = false;
      const updatedComments = comments.map((c) => {
        if (c.email === user.email && c.avatar !== (user.avatarUrl || "")) {
          changed = true;
          return { ...c, avatar: user.avatarUrl || "" };
        }
        return c;
      });
      if (changed) {
        setComments(updatedComments);
        localStorage.setItem(
          `comments_${articleSlug}`,
          JSON.stringify(updatedComments)
        );
      }
    }
  }, [user, comments, articleSlug]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(`comments_${articleSlug}`, JSON.stringify(comments));
  }, [comments, articleSlug, hydrated]);

  const addComment = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const updateComment = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
    setEditingComment(null);
  };

  const deleteComment = (id: string) => {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next;
    });
    setEditingComment(null);
  };

  const avgRating =
    comments.length > 0
      ? comments.reduce((sum, comment) => (comment.rating || 0) + sum, 0) /
        comments.length
      : 0;

  const canModerate = (comment: Comment) =>
    isAuthenticated &&
    !!user?.email &&
    comment.email.toLowerCase() === user.email.toLowerCase();

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-orange-500" />
            Commentaires ({comments.length})
          </h3>
          <p className="text-slate-600">Partagez votre avis sur cet article</p>
        </div>
        {comments.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-slate-600 mb-1">Note moyenne</div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...new Array(5)].map((_, i) => (
                  <ThumbsUp
                    className={`w-5 h-5 ${i < Math.round(avgRating) ? "text-orange-500 fill-orange-500" : "text-slate-300"}`}
                    key={i}
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-900">
                {avgRating.toFixed(1)}/5
              </span>
            </div>
          </div>
        )}
      </div>

      {authLoading ? (
        <div className="mb-8 p-6 rounded-2xl bg-white/40 border border-white/60 text-slate-500 text-sm">
          Chargement de la session…
        </div>
      ) : isAuthenticated && user ? (
        <CommentForm
          authorAvatar={user.avatarUrl}
          authorEmail={user.email}
          authorName={user.username}
          editingComment={editingComment}
          onAddComment={addComment}
          onUpdateComment={updateComment}
        />
      ) : (
        <div className="mb-8 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 text-center space-y-4">
          <p className="text-slate-700 font-medium">
            Connectez-vous avec votre compte mAI pour commenter.
          </p>
          <p className="text-sm text-slate-500">
            Votre e-mail et nom d&apos;utilisateur seront associés au
            commentaire.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
              href={`/account/login?next=${encodeURIComponent(nextPath)}`}
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </Link>
            <Link
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold transition-colors"
              href={`/account/register?next=${encodeURIComponent(nextPath)}`}
            >
              <UserPlus className="w-4 h-4" />
              Créer un compte
            </Link>
          </div>
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-6 mt-8">
          {comments.map((comment) => (
            <CommentItem
              comment={comment}
              commentId={comment.id}
              key={comment.id}
              onDelete={canModerate(comment) ? deleteComment : undefined}
              onEdit={canModerate(comment) ? setEditingComment : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-700 mb-2">
            Soyez le premier à commenter
          </h4>
          <p className="text-slate-500">
            Partagez vos thoughts et aidez les autres à découvrir cet article
          </p>
        </div>
      )}
    </div>
  );
}
