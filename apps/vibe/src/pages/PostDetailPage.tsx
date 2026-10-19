/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POST DETAIL PAGE (src/pages/PostDetailPage.tsx)
 * Single post view with comments thread & mAI synthesis
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon as ArrowLeft, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, SparklesIcon as Sparkles, Volume2Icon as Volume2 } from "@mdevs/icons";
import { Post } from '../types/vibe';
import { PostCard } from '../components/feed/PostCard';
import { CommentSection } from '../components/comments/CommentSection';
import { ApiService } from '../services/api';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { htmlToPlainText } from '../components/common/RichContent';

interface PostDetailPageProps {
  postId: string;
  onBack: () => void;
  onOpenProfile: (username: string) => void;
}

export const PostDetailPage: React.FC<PostDetailPageProps> = ({
  postId,
  onBack,
  onOpenProfile,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isQueueingThread, setIsQueueingThread] = useState(false);
  const { playQueue } = useAudioPlayer();

  /** Écoute tout le fil avec la voix mAI : post principal puis commentaires. */
  const handleListenThread = async () => {
    if (!post || isQueueingThread) return;
    setIsQueueingThread(true);
    try {
      const plain = htmlToPlainText(post.content || '').trim();
      const snippet = plain.slice(0, 48);
      const segments: Array<{ id: string; title: string; text: string }> = [
        {
          id: `post-${post.id}`,
          title: `@${post.username}${snippet ? ` — ${snippet}${plain.length > 48 ? '…' : ''}` : ''}`,
          text: plain,
        },
      ];
      try {
        const res = await ApiService.getComments(post.id);
        for (const c of (res.comments || []).slice(0, 30)) {
          segments.push({
            id: `comment-${c.id}`,
            title: `Réponse de @${c.username}`,
            text: htmlToPlainText(c.content || ''),
          });
        }
      } catch {}
      playQueue(segments);
    } finally {
      setIsQueueingThread(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await ApiService.getPost(postId);
        if (data?.post) {
          setPost(data.post);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Erreur chargement post:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white tracking-tight">Publication</h1>
        {post?.content?.trim() && (
          <button
            onClick={handleListenThread}
            disabled={isQueueingThread}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
            title="Écouter la publication et son fil de discussion avec la voix de mAI"
          >
            {isQueueingThread ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Écouter le fil</span>
            <span className="sm:hidden">Écouter</span>
          </button>
        )}
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent('vibe:open_mai', { detail: { postId } }))
          }
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          title="Mentionner cette publication à l'assistant mAI (contenu, médias, commentaires et stats transmis)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mentionner dans mAI</span>
          <span className="sm:hidden">mAI</span>
        </button>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          <span className="text-sm font-medium">Chargement de la publication…</span>
        </div>
      )}

      {/* Not Found state */}
      {!isLoading && (notFound || !post) && (
        <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Cette publication n'existe pas</h2>
            <p className="text-xs text-zinc-500 max-w-xs">
              Elle a peut-être été supprimée par son auteur ou le lien est invalide.
            </p>
          </div>
          <button
            onClick={onBack}
            className="mt-2 px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            Retour au fil d'actualité
          </button>
        </div>
      )}

      {/* Main Post & Comments */}
      {!isLoading && post && (
        <>
          <div className="border-b border-zinc-800">
            <PostCard
              post={post}
              onOpenProfile={onOpenProfile}
              onPostDeleted={() => {
                onBack();
              }}
            />
          </div>

          {/* Comment Section & Discussion Synthesis */}
          <div className="p-4">
            <CommentSection postId={postId} />
          </div>
        </>
      )}
    </div>
  );
};
