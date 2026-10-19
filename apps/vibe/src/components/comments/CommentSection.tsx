/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — COMMENT SECTION (src/components/comments/CommentSection.tsx)
 * Réponses riches (éditeur WYSIWYG), médias avec légendes (3 images / 1 vidéo),
 * likes de commentaires & synthèse mAI des échanges.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SparklesIcon as Sparkles, HeartIcon as Heart, MicIcon as Mic, MicOffIcon as MicOff, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, ImageIcon, LanguagesIcon as Languages, XIcon as X } from "@mdevs/icons";
import { Comment, MediaAsset } from '../../types/vibe';
import { ApiService, TRANSLATION_LANGUAGES } from '../../services/api';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { RichContent, htmlToPlainText } from '../common/RichContent';
import { RichTextEditor, RichTextEditorHandle } from '../common/RichTextEditor';
import { haptics } from '../../services/haptics';
import { isPaidTier } from '../../services/tierLimits';
import { motion } from 'framer-motion';
import { useMotionPrefs } from '../../hooks/useMotionPrefs';
import { LikeParticles } from '../common/LikeParticles';

const nextToastId = () => Date.now();

const MAX_COMMENT_IMAGES = 3;
const MAX_COMMENT_VIDEOS = 1;
const MAX_COMMENT_TOTAL = MAX_COMMENT_IMAGES + MAX_COMMENT_VIDEOS;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 Mo

interface UploadedMedia {
  url: string;
  media_type: 'image' | 'video';
  mime_type?: string;
  size?: number;
  alt_text?: string;
}

interface CommentSectionProps {
  postId: string;
}

const isVideoAsset = (m: { url: string; media_type?: string }) =>
  String(m.media_type || '').startsWith('video') || /\.(mp4|webm|mov)(\?|$)/i.test(m.url);

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [aiDigest, setAiDigest] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [burstMap, setBurstMap] = useState<Record<string, number>>({});
  const { play: playMotion, animationsEnabled } = useMotionPrefs();
  // Traduction DeepL par commentaire (repli mAI côté serveur)
  const [commentTranslations, setCommentTranslations] = useState<Record<string, { text: string; language: string; targetLanguage?: string; provider?: string }>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Composer de réponse : contenu riche + médias
  const [contentText, setContentText] = useState('');
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (text) => {
      editorRef.current?.insertText(text);
    },
  });

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await ApiService.getComments(postId);
      setComments(data.comments || []);
      setAiDigest(data.aiDigest || null);
      setLikedIds(new Set((data.comments || []).filter((c: any) => c.liked_by_me).map((c: any) => String(c.id))));
    } catch (err: any) {
      setComments([]);
      setAiDigest(null);
      setLoadError(err?.message || 'Impossible de charger les commentaires.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchComments();
    });
  }, [fetchComments]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imagesCount = mediaList.filter((m) => m.media_type === 'image').length;
    const videosCount = mediaList.filter((m) => m.media_type === 'video').length;
    let newImages = 0;
    let newVideos = 0;
    for (const f of files) {
      if (f.type.startsWith('image/')) newImages++;
      else if (f.type.startsWith('video/')) newVideos++;
    }

    if (imagesCount + newImages > MAX_COMMENT_IMAGES) {
      setComposerError(`Limite de ${MAX_COMMENT_IMAGES} images par réponse (actuel : ${imagesCount}).`);
      return;
    }
    if (videosCount + newVideos > MAX_COMMENT_VIDEOS) {
      setComposerError(`Limite de ${MAX_COMMENT_VIDEOS} vidéo par réponse.`);
      return;
    }
    if (mediaList.length + files.length > MAX_COMMENT_TOTAL) {
      setComposerError(`Maximum ${MAX_COMMENT_TOTAL} médias par réponse.`);
      return;
    }
    const totalBytes =
      mediaList.reduce((acc, m) => acc + (m.size || 0), 0) + files.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setComposerError('La taille totale des médias ne peut pas dépasser 50 Mo.');
      return;
    }

    setComposerError(null);
    setIsUploading(true);
    try {
      for (const file of files) {
        if (file.size > MAX_TOTAL_BYTES) {
          throw new Error(`Le fichier ${file.name} dépasse 50 Mo.`);
        }
        const res = await ApiService.uploadFile(file);
        if (res.url) {
          const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
          setMediaList((prev) => [
            ...prev,
            { url: res.url, media_type: type, mime_type: file.type, size: file.size, alt_text: '' },
          ]);
        }
      }
    } catch (err: any) {
      setComposerError(err.message || 'Erreur lors du téléversement du média.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const html = editorRef.current?.getHTML() || '';
    const plainText = htmlToPlainText(html).trim();
    if ((!plainText && mediaList.length === 0) || isSubmitting) return;

    // Commande /mai : réservée aux abonnés Plus, Pro et Max
    const isMaiCommand = /^\/mai\b/i.test(plainText);
    if (isMaiCommand && !isPaidTier(user?.tier)) {
      haptics.warning();
      setComposerError('La commande /mai est réservée aux abonnés Plus, Pro et Max.');
      return;
    }

    if (isListening) {
      stopListening();
      resetTranscript();
    }

    setIsSubmitting(true);
    setComposerError(null);
    try {
      const mediaAssets = mediaList.map((m) => ({
        url: m.url,
        media_type: m.mime_type || (m.media_type === 'video' ? 'video/mp4' : 'image/jpeg'),
        alt_text: m.alt_text?.trim() || undefined,
      }));
      const res = await ApiService.addComment(postId, html, replyingTo?.id, mediaAssets.length > 0 ? mediaAssets : undefined);
      const aiPending = Boolean((res as any)?.ai_pending) || isMaiCommand;
      editorRef.current?.clear();
      setContentText('');
      setMediaList([]);
      setReplyingTo(null);
      haptics.success();
      fetchComments();
      if (aiPending) {
        // La réponse de mAI arrive de façon asynchrone : rafraîchissements différés
        NotificationService.showInAppToast(
          'mAI réfléchit…',
          'Votre question /mai a été envoyée : la réponse apparaîtra sous peu en commentaire.',
          'info'
        );
        window.setTimeout(() => fetchComments(), 2500);
        window.setTimeout(() => fetchComments(), 8000);
      }
    } catch (err: any) {
      if (err?.code === 'MAI_CMD') {
        haptics.warning();
        setComposerError(err?.message || 'La commande /mai est réservée aux abonnés Plus, Pro et Max.');
      } else {
        haptics.error();
        setComposerError(err.message || 'Erreur lors de l’envoi de la réponse.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (cm: Comment) => {
    if (!user) {
      // Bouton "mort" si déconnecté : on prévient au lieu d'un update optimiste
      // qui serait annulé par un 401.
      haptics.warning();
      window.dispatchEvent(
        new CustomEvent('vibe:in_app_toast', {
          detail: {
            id: nextToastId(),
            title: 'Connexion requise',
            message: 'Connectez-vous pour aimer un commentaire.',
          },
        })
      );
      return;
    }
    const id = String(cm.id);
    const wasLiked = likedIds.has(id);
    if (!wasLiked) {
      playMotion('like');
      setBurstMap((m) => ({ ...m, [id]: (m[id] || 0) + 1 }));
    } else {
      playMotion('unlike');
    }
    // Mise à jour optimiste
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        String(c.id) === id
          ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) + (wasLiked ? -1 : 1)) }
          : c
      )
    );
    try {
      const res = await ApiService.likeComment(postId, id);
      if (typeof res?.likes_count === 'number') {
        setComments((prev) =>
          prev.map((c) => (String(c.id) === id ? { ...c, likes_count: res.likes_count } : c))
        );
      }
    } catch {
      // Revenir en arrière en cas d'échec
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          String(c.id) === id
            ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) + (wasLiked ? 1 : -1)) }
            : c
        )
      );
    }
  };

  /** Traduction DeepL d'un commentaire (repli mAI côté serveur, cache inclus). */
  const handleTranslateComment = async (cm: Comment) => {
    const id = String(cm.id);
    if (translatingId || commentTranslations[id]) return;
    setTranslatingId(id);
    try {
      const userLang = ApiService.resolveTargetLanguage();
      let res = await ApiService.translateComment(id, userLang);
      // Si le commentaire est déjà dans la langue cible (ex : en français pour cible FR),
      // on traduit vers l'anglais (ou le français si la cible initiale était l'anglais).
      if (res?.same_language) {
        const altLang = userLang.slice(0, 2).toUpperCase() === 'FR' ? 'EN-US' : 'FR';
        res = await ApiService.translateComment(id, altLang);
      }
      if (res?.translation && !res.same_language) {
        const rawLang = res.detected_language || '';
        const prettyLang = rawLang
          ? res.provider === 'deepl'
            ? TRANSLATION_LANGUAGES.find((l) => l.code === rawLang.toUpperCase())?.label || rawLang
            : rawLang
          : '';
        const targetLabel = res.target_lang
          ? TRANSLATION_LANGUAGES.find((l) => l.code === res.target_lang?.toUpperCase())?.label || res.target_lang
          : (userLang.slice(0, 2).toUpperCase() === 'FR' && rawLang.toUpperCase().startsWith('FR') ? 'Anglais' : undefined);
        setCommentTranslations((prev) => ({
          ...prev,
          [id]: { text: res.translation, language: prettyLang, targetLanguage: targetLabel, provider: res.provider },
        }));
      } else {
        NotificationService.showInAppToast('Traduction indisponible', "La traduction n'a pas pu être récupérée.", 'error');
      }
    } catch (err: any) {
      NotificationService.showInAppToast('Traduction impossible', err?.message || "La traduction n'a pas pu être récupérée.", 'error');
    } finally {
      setTranslatingId(null);
    }
  };

  const renderCommentMedia = (assets: MediaAsset[]) => {
    const images = assets.filter((m) => !isVideoAsset(m));
    const videos = assets.filter(isVideoAsset);
    return (
      <div className="mt-1.5 space-y-1.5">
        {images.length > 0 && (
          <div className={`grid gap-1 rounded-xl overflow-hidden ${images.length === 1 ? 'grid-cols-1 max-h-64' : 'grid-cols-2'}`}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt_text || 'Média du commentaire'}
                loading="lazy"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
                className={`w-full rounded-lg border border-zinc-800 object-cover ${images.length === 1 ? 'max-h-64' : 'h-full'}`}
              />
            ))}
          </div>
        )}
        {images.filter((img) => img.alt_text?.trim()).map((img, i) => (
          <p key={`cimg-${i}`} className="text-[11px] text-zinc-500 leading-snug break-words">{img.alt_text}</p>
        ))}
        {videos.map((vid, i) => (
          <div key={`cvid-${i}`} className="rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-64">
            <video src={vid.url} controls preload="metadata" className="w-full max-h-64 object-cover" />
            {vid.alt_text?.trim() && (
              <p className="px-2.5 py-1.5 text-[11px] text-zinc-500 leading-snug break-words border-t border-zinc-900">
                {vid.alt_text}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderComment = (cm: Comment) => {
    const liked = likedIds.has(String(cm.id));
    return (
      <div
        key={String(cm.id)}
        className={`p-3.5 rounded-2xl bg-black border border-zinc-900 space-y-1.5 ${
          (cm.depth || 0) > 0 ? 'ml-4 sm:ml-6 border-l-2 border-zinc-700' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ProfileAvatar
              src={cm.avatar_url}
              alt={cm.username}
              fallbackName={cm.username}
              size="xs"
              className="border border-zinc-800 shrink-0"
            />
            <span className="text-xs font-bold text-white truncate">{cm.display_name || cm.username}</span>
            {cm.username === 'mai' && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300 bg-violet-500/10 border border-violet-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                mAI
              </span>
            )}
            <span className="text-[11px] text-zinc-500 truncate">@{cm.username}</span>
          </div>
          <button
            onClick={() => setReplyingTo(cm)}
            className="text-[11px] text-zinc-500 hover:text-white transition-colors shrink-0 ml-2"
          >
            Répondre
          </button>
        </div>
        <div className="text-xs text-zinc-200 pl-8">
          <RichContent content={cm.content} />
        </div>
        {translatingId === String(cm.id) && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 pl-8">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Traduction en cours…</span>
          </div>
        )}
        {commentTranslations[String(cm.id)] && (
          <div className="pl-8">
            <div className="pl-2.5 border-l-2 border-zinc-700">
              <div className="text-xs text-zinc-300 leading-relaxed break-words">
                <RichContent content={commentTranslations[String(cm.id)].text} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px]">
                <span className="text-zinc-600">
                  {commentTranslations[String(cm.id)].targetLanguage
                    ? `Traduit en ${commentTranslations[String(cm.id)].targetLanguage} via mAI`
                    : commentTranslations[String(cm.id)].language
                    ? `Traduit de l'« ${commentTranslations[String(cm.id)].language} » via mAI`
                    : `Traduit via mAI`}
                </span>
                <button
                  onClick={() =>
                    setCommentTranslations((prev) => {
                      const next = { ...prev };
                      delete next[String(cm.id)];
                      return next;
                    })
                  }
                  className="text-zinc-500 hover:text-white transition-colors font-bold"
                >
                  Afficher l'original
                </button>
              </div>
            </div>
          </div>
        )}
        {cm.media_assets && cm.media_assets.length > 0 && (
          <div className="pl-8">{renderCommentMedia(cm.media_assets)}</div>
        )}
        <div className="flex items-center gap-4 pl-8 pt-0.5">
          <motion.button
            whileTap={animationsEnabled ? { scale: 0.8 } : undefined}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            onClick={() => handleLikeComment(cm)}
            className={`relative flex items-center gap-1 text-[11px] transition-all ${
              liked ? 'text-rose-500 font-bold' : 'text-zinc-500 hover:text-rose-400'
            }`}
          >
            <span className={`relative inline-flex ${burstMap[String(cm.id)] ? 'animate-likeBurst' : ''}`}>
              <Heart className={`w-3.5 h-3.5 transition-transform ${liked ? 'fill-rose-500 scale-110' : 'hover:scale-110'}`} />
              {animationsEnabled && <LikeParticles burstKey={burstMap[String(cm.id)] || 0} count={5} />}
            </span>
            <span key={cm.likes_count || 0} className={burstMap[String(cm.id)] ? 'animate-countPop' : ''}>{cm.likes_count || 0}</span>
          </motion.button>
          {!commentTranslations[String(cm.id)] && translatingId !== String(cm.id) && (
            <button
              onClick={() => handleTranslateComment(cm)}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors"
              title="Traduire ce commentaire (mAI)"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Traduire</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* mAI Thread Synthesis */}
      {aiDigest && (
        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Synthèse mAI des échanges</span>
          </div>
          <RichContent content={aiDigest} className="text-xs text-zinc-300 leading-relaxed" />
        </div>
      )}

      {/* Reply Input Form */}
      <form onSubmit={handleSubmit} className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
        {replyingTo && (
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              En réponse à <strong className="text-white">@{replyingTo.username}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-zinc-500 hover:text-white"
            >
              Annuler
            </button>
          </div>
        )}

        {composerError && (
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{composerError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <ProfileAvatar
            src={user?.avatar_url}
            alt="Avatar"
            fallbackName={user?.username}
            size="sm"
            className="border border-zinc-800 shrink-0"
          />
          <div className="flex-1 space-y-2 min-w-0">
            <RichTextEditor
              ref={editorRef}
              compact
              onChange={(_html, text) => setContentText(text)}
              placeholder={isListening ? 'Parlez, dictée vocale en cours…' : 'Poster votre réponse…'}
              disabled={isSubmitting}
            />

            {/* Indication commande /mai (réponse mAI en commentaire) */}
            {/^\/mai\b/i.test(contentText.trim()) && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  isPaidTier(user?.tier) ? 'text-zinc-400' : 'text-amber-400'
                }`}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                {isPaidTier(user?.tier)
                  ? 'mAI répondra à votre question à partir du contenu de cette publication.'
                  : '/mai interroge mAI — réservé aux abonnés Plus, Pro et Max.'}
              </div>
            )}

            {/* Aperçus médias + légendes */}
            {mediaList.length > 0 && (
              <div className="space-y-1.5">
                <div className={`grid gap-1.5 rounded-xl overflow-hidden ${mediaList.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {mediaList.map((m, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video">
                      {m.media_type === 'video' ? (
                        <video src={m.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt={m.alt_text || 'Média'} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaList((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-black"
                        title="Retirer le média"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {mediaList.map((m, idx) => (
                  <input
                    key={`ccap-${idx}`}
                    type="text"
                    value={m.alt_text || ''}
                    onChange={(e) =>
                      setMediaList((prev) =>
                        prev.map((mm, i) => (i === idx ? { ...mm, alt_text: e.target.value } : mm))
                      )
                    }
                    placeholder={`Légende ${m.media_type === 'video' ? 'de la vidéo' : 'de l’image'} ${idx + 1}…`}
                    maxLength={280}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-800 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || mediaList.length >= MAX_COMMENT_TOTAL}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  title={`Ajouter des médias (max ${MAX_COMMENT_IMAGES} images, ${MAX_COMMENT_VIDEOS} vidéo)`}
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isPaidTier(user?.tier)) {
                      haptics.warning();
                      setComposerError('La commande /mai est réservée aux abonnés Plus, Pro et Max.');
                      return;
                    }
                    editorRef.current?.insertText('/mai ');
                    editorRef.current?.focus();
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Interroger mAI sur cette publication (abonnés Plus, Pro et Max)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                {isSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isListening ? 'bg-white text-black pulse-recording' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isUploading || (!contentText.trim() && mediaList.length === 0)}
                className="py-1.5 px-4 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {isSubmitting ? 'Envoi…' : 'Répondre'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-2">
        {isLoading && (
          <div className="text-center py-6 text-xs text-zinc-400 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            <span>Chargement des commentaires…</span>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="text-center py-6 text-xs text-zinc-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{loadError}</span>
            <button
              onClick={fetchComments}
              className="py-1.5 px-4 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !loadError && comments.map(renderComment)}

        {!isLoading && !loadError && comments.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-500 font-mono">
            Aucun commentaire pour le moment. Soyez le premier à répondre !
          </div>
        )}
      </div>
    </div>
  );
};
