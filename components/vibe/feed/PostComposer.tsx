/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POST COMPOSER (src/components/feed/PostComposer.tsx)
 * Éditeur WYSIWYG riche, Multi-Media avec légendes, planification (Plus/Pro/Max),
 * mode édition & dictée vocale.
 * ============================================================================
 */

import { AlertCircleIcon as AlertCircle, BarChart2Icon as BarChart2, BookHeartIcon as BookHeart, CalendarClockIcon as CalendarClock, CheckIcon as Check, ClockIcon as Clock, FileTextIcon as FileText, GlobeIcon as Globe, ImageIcon, Loader2Icon as Loader2, LockIcon as Lock, MicIcon as Mic, MicOffIcon as MicOff, SendIcon as Send, SparklesIcon as Sparkles, Undo2Icon as Undo2, UsersIcon as Users, Wand2Icon as Wand2, XIcon as X } from "@mdevs/icons";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { htmlToPlainText } from "@/components/vibe/common/RichContent";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/vibe/common/RichTextEditor";
import { BookAttachModal } from "@/components/vibe/feed/BookAttachModal";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { useMotionPrefs } from "@/lib/vibe/hooks/useMotionPrefs";
import { useSpeechRecognition } from "@/lib/vibe/hooks/useSpeechRecognition";
import { ApiService } from "@/lib/vibe/services/api";
import {
  clearVibeDraft,
  draftToHTML,
  notifyDraftRestored,
  onDraftChanged,
  readVibeDraft,
  saveVibeDraft,
  type VibeDraft,
} from "@/lib/vibe/services/draftCookie";
import {
  deleteDraftFromServer,
  loadDraftsFromServer,
  saveDraftToServer,
  serverDraftToLocal,
} from "@/lib/vibe/services/draftSync";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import {
  formatMediaLimit,
  getMediaBytesLimit,
  getPostCharLimit,
} from "@/lib/vibe/services/tierLimits";
import type { Post } from "@/lib/vibe/types/vibe";

type PostVisibility = "public" | "followers" | "circle" | "private";

interface PostComposerProps {
  /** Post en cours de modification (mode édition). */
  editingPost?: Post | null;
  initialContent?: string;
  initialMediaUrl?: string;
  /** Post original cité (quote-post) prérempli (bouton « Citer »). */
  initialQuotedPost?: Post | null;
  isModal?: boolean;
  onClose?: () => void;
  onPostCreated: () => void;
  placeholder?: string;
}

interface UploadedMedia {
  alt_text?: string;
  file_name?: string;
  media_type: "image" | "video";
  mime_type?: string;
  size?: number;
  url: string;
}

const SCHEDULED_TIERS = ["Plus", "Pro", "Max"];

/** Options d'audience d'une publication. */
const VISIBILITY_OPTIONS: Array<{
  value: PostVisibility;
  label: string;
  hint: string;
}> = [
  {
    hint: "Tout le monde peut voir cette publication",
    label: "Public",
    value: "public",
  },
  {
    hint: "Seuls vos abonnés verront cette publication",
    label: "Abonnés uniquement",
    value: "followers",
  },
  {
    hint: "Uniquement les membres de votre cercle",
    label: "Cercle Privé",
    value: "circle",
  },
];

/** Tons proposés pour la réécriture mAI. */
const AI_TONES: Array<{ value: string; label: string }> = [
  { label: "Professionnel", value: "professionnel" },
  { label: "Amical", value: "amical" },
  { label: "Humoristique", value: "humoristique" },
  { label: "Direct", value: "direct" },
  { label: "Inspirant", value: "inspirant" },
];

/** Formatte une valeur datetime-local pour l'affichage français. */
const formatScheduleLabel = (localValue: string): string => {
  try {
    const d = new Date(localValue);
    return d.toLocaleString("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      weekday: "short",
    });
  } catch {
    return localValue;
  }
};

/** Formate la date de sauvegarde d'un brouillon pour le bandeau de reprise. */
const formatDraftDate = (ts: number): string => {
  try {
    const d = new Date(ts);
    const sameDay = new Date().toDateString() === d.toDateString();
    return sameDay
      ? `aujourd'hui à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
      : d.toLocaleString("fr-FR", {
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
        });
  } catch {
    return "";
  }
};

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  placeholder = "Quoi de neuf sur Vibe ?",
  isModal = false,
  onClose,
  initialContent,
  initialMediaUrl,
  initialQuotedPost,
  editingPost,
}) => {
  const { user, profile } = useAuth();

  // Limites par forfait : Vibe 1 000 caractères (Free), médias 50 Mo (Free) / 1 Go (Plus+)
  const postCharLimit = getPostCharLimit(user?.tier);
  const postCharUnlimited = !Number.isFinite(postCharLimit);
  const mediaBytesLimit = getMediaBytesLimit(user?.tier);
  const mediaLimitLabel = formatMediaLimit(mediaBytesLimit);
  const isEditing = Boolean(editingPost);
  const [contentText, setContentText] = useState(
    htmlToPlainText(initialContent || editingPost?.content || "")
  );
  const [mediaList, setMediaList] = useState<UploadedMedia[]>(
    editingPost?.media_assets?.length
      ? editingPost.media_assets.map((m) => ({
          alt_text: m.alt_text || "",
          media_type: (String(m.media_type || "").startsWith("video") ||
          /\.(mp4|webm|mov)(\?|$)/i.test(m.url)
            ? "video"
            : "image") as "image" | "video",
          url: m.url,
        }))
      : initialMediaUrl
        ? [{ media_type: "image" as const, url: initialMediaUrl }]
        : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const { play: playMotion } = useMotionPrefs();
  // Badge « Créé avec l'IA » : défaut issu des réglages utilisateur
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [quotedPost, setQuotedPost] = useState<Post | null>(
    initialQuotedPost || null
  );
  // Planification (Plus / Pro / Max)
  const [showSchedule, setShowSchedule] = useState(
    Boolean(editingPost?.status === "scheduled")
  );
  const [scheduledAt, setScheduledAt] = useState<string>(
    editingPost?.scheduled_at ? toLocalInputValue(editingPost.scheduled_at) : ""
  );

  // Audience : Public / Abonnés uniquement / Cercle Privé
  const [visibility, setVisibility] = useState<PostVisibility>(
    (editingPost?.visibility as PostVisibility) || "public"
  );
  const [showVisibility, setShowVisibility] = useState(false);

  // Sondage intégré (2-4 options, 1h-7j)
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<number>(24);
  // Galerie : grille vs carrousel + réordonnancement drag & drop
  const [carouselMode, setCarouselMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Co-auteur (collaboration)
  const [showCollab, setShowCollab] = useState(false);
  const [collabQuery, setCollabQuery] = useState("");
  const [collabResults, setCollabResults] = useState<
    Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
    }>
  >([]);
  const [collabSelected, setCollabSelected] = useState<{
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [collabSearching, setCollabSearching] = useState(false);
  // Brouillon serveur (multi-appareils) : id du brouillon synchronisé
  const [serverDraftId, setServerDraftId] = useState<string | null>(null);
  const serverDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // mAI : continuation automatique (Tab) + actions rapides sur le brouillon
  const [ghostSuggestion, setGhostSuggestion] = useState<string | null>(null);
  const [aiCompletionEnabled, setAiCompletionEnabled] = useState(true);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSnapshot, setAiSnapshot] = useState<string | null>(null);
  const contentTextRef = useRef(contentText);
  useEffect(() => {
    contentTextRef.current = contentText;
  }, [contentText]);

  // ── Brouillon « anti-fermeture accidentelle » (cookie 30 jours) ────────
  // Le texte (plus l'audience, la planification et le badge IA) est écrit dans
  // un cookie de 30 jours ; les médias ne sont jamais conservés. À l'ouverture
  // d'un composeur vierge, un bandeau propose de reprendre le brouillon.
  const [recoverableDraft, setRecoverableDraft] = useState<VibeDraft | null>(
    null
  );
  const dirtyRef = useRef(false);

  /** Écrit (ou efface) le cookie de brouillon d'après l'état courant. */
  const flushDraft = useCallback(() => {
    if (isEditing || !dirtyRef.current) return;
    if (!contentText.trim()) {
      if (readVibeDraft()) clearVibeDraft();
      return;
    }
    saveVibeDraft({
      ai: isAIGenerated,
      html: editorRef.current?.getHTML() || "",
      scheduledAt,
      text: contentText,
      username: user?.username || null,
      visibility,
    });
  }, [
    isEditing,
    contentText,
    visibility,
    scheduledAt,
    isAIGenerated,
    user?.username,
  ]);

  // Sauvegarde différée : 800 ms après la dernière frappe / changement
  useEffect(() => {
    const timer = setTimeout(flushDraft, 800);
    return () => clearTimeout(timer);
  }, [flushDraft]);

  // Synchronisation serveur (multi-appareils) : debounce 2 s, en parallèle du cookie local
  useEffect(() => {
    if (isEditing) return;
    if (serverDraftTimer.current) clearTimeout(serverDraftTimer.current);
    serverDraftTimer.current = setTimeout(async () => {
      if (!dirtyRef.current || !contentText.trim()) return;
      const id = await saveDraftToServer({
        ai_generated: isAIGenerated,
        html: editorRef.current?.getHTML() || "",
        id: serverDraftId || undefined,
        scheduled_at: scheduledAt || null,
        text: contentText,
        visibility,
      });
      if (id) setServerDraftId(id);
    }, 2000);
    return () => {
      if (serverDraftTimer.current) clearTimeout(serverDraftTimer.current);
    };
  }, [
    contentText,
    visibility,
    scheduledAt,
    isAIGenerated,
    isEditing,
    serverDraftId,
  ]);

  // Au montage : fusionne cookie local + brouillons serveur (le plus récent gagne)
  useEffect(() => {
    if (isEditing || initialContent || initialMediaUrl) return;
    let cancelled = false;
    loadDraftsFromServer()
      .then((drafts) => {
        if (cancelled || drafts.length === 0) return;
        const latest = drafts[0];
        const local = readVibeDraft(user?.username || null);
        const serverTs = latest.updated_at ? Date.parse(latest.updated_at) : 0;
        if (!local || serverTs > (local.ts || 0)) {
          setServerDraftId(latest.id);
          setRecoverableDraft(
            serverDraftToLocal(latest, user?.username || null)
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEditing, initialContent, initialMediaUrl, user?.username]);

  // Fermeture d'onglet, rafraîchissement ou démontage : sauvegarde immédiate
  const flushDraftRef = useRef(flushDraft);
  useEffect(() => {
    flushDraftRef.current = flushDraft;
  }, [flushDraft]);
  useEffect(() => {
    const flushNow = () => flushDraftRef.current();
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", flushNow);
    return () => {
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", flushNow);
      flushNow(); // démontage (fermeture de la modale) : dernier état en cookie
    };
  }, []);

  // Composeur vierge au montage : lit le cookie et suit ses changements
  // (un autre composeur a pu sauvegarder, reprendre ou vider le brouillon).
  useEffect(() => {
    if (isEditing || initialContent || initialMediaUrl) return;
    const refresh = (type: string) => {
      if (type === "restore" || type === "clear") {
        setRecoverableDraft(null);
        return;
      }
      const next = readVibeDraft(user?.username || null);
      setRecoverableDraft((prev) => {
        if (!next) return null;
        if (prev && prev.ts === next.ts) return prev;
        return next;
      });
    };
    refresh("save");
    return onDraftChanged(refresh);
  }, [isEditing, initialContent, initialMediaUrl, user?.username]);

  const canSchedule = SCHEDULED_TIERS.includes(user?.tier || "Free");

  useEffect(() => {
    if (isEditing) return;
    ApiService.getSettings()
      .then((res: any) => {
        setIsAIGenerated(Boolean(res?.settings?.posts_ai_generated_by_default));
        if (res?.settings?.default_vibe_audience) {
          const defaultAudience = res.settings
            .default_vibe_audience as PostVisibility;
          if (["public", "followers", "circle"].includes(defaultAudience)) {
            setVisibility(defaultAudience);
          }
        }
      })
      .catch(() => {});
  }, [isEditing]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  // Référencement d'un Livre (@livre) : carte affichée sous la Vibe publiée
  const [showBookAttach, setShowBookAttach] = useState(false);

  const handleAttachBook = (book: { id: string; title: string }) => {
    const safeTitle = String(book.title || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    editorRef.current?.insertHtml(
      `<a data-book-id="${book.id}" href="/books/${book.id}" class="rich-link">@${safeTitle}</a>&nbsp;`
    );
    editorRef.current?.focus();
  };

  useEffect(() => {
    NotificationService.requestPermission().catch(() => {});
  }, []);

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

  const imagesCount = mediaList.filter((m) => m.media_type === "image").length;
  const videosCount = mediaList.filter((m) => m.media_type === "video").length;

  // ── Continuation mAI (ghost text) : débattée 900 ms après l'arrêt de saisie ──
  useEffect(() => {
    const text = contentText.trimEnd();
    if (
      !aiCompletionEnabled ||
      isSubmitting ||
      aiBusy ||
      text.length < 8 ||
      text.length > 4000
    ) {
      const t = setTimeout(() => setGhostSuggestion(null), 0);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await ApiService.aiTransformText(text, "complete");
        // Ignore les réponses arrivées après une nouvelle frappe
        if (contentTextRef.current.trimEnd() !== text) return;
        if (res?.success && res.text?.trim()) {
          setGhostSuggestion(res.text.trim().slice(0, 140));
        } else {
          setGhostSuggestion(null);
        }
      } catch {
        setGhostSuggestion(null);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [contentText, aiCompletionEnabled, isSubmitting, aiBusy]);

  /** Insère la continuation suggérée (Tab ou clic). */
  const acceptGhostSuggestion = () => {
    if (!ghostSuggestion) return;
    const glue =
      /\s$/.test(contentText) || /^\s/.test(ghostSuggestion) ? "" : " ";
    editorRef.current?.insertText(`${glue}${ghostSuggestion}`);
    setGhostSuggestion(null);
  };

  /** Actions IA rapides sur le brouillon : corriger, allonger, réduire, ton. */
  const applyAiAction = async (
    action: "fix_spelling" | "lengthen" | "shorten" | "tone",
    tone?: string
  ) => {
    const text = contentText.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    setAiMenuOpen(false);
    setAiError(null);
    setGhostSuggestion(null);
    try {
      const res = await ApiService.aiTransformText(text, action, tone);
      if (res?.success && res.text?.trim()) {
        setAiSnapshot(editorRef.current?.getHTML() || null);
        editorRef.current?.clear();
        editorRef.current?.insertText(res.text.trim());
        editorRef.current?.focus();
      } else {
        setAiError("mAI n'a pas pu transformer ce texte.");
      }
    } catch (err: any) {
      setAiError(err?.message || "mAI est indisponible pour le moment.");
    } finally {
      setAiBusy(false);
    }
  };

  /** Restaure le brouillon tel qu'avant la transformation mAI. */
  const undoAiAction = () => {
    if (!aiSnapshot) return;
    const snapshot = aiSnapshot;
    setAiSnapshot(null);
    editorRef.current?.clear();
    // insertText insère du texte brut : réinjecte le HTML via le presse-papiers interne
    const el = document.createElement("div");
    el.innerHTML = snapshot;
    editorRef.current?.insertText(el.textContent || "");
    editorRef.current?.focus();
  };

  /** Reprend le brouillon retrouvé : texte, audience, planification, badge IA. */
  const handleRestoreDraft = () => {
    const draft = recoverableDraft;
    if (!draft) return;
    setRecoverableDraft(null);
    dirtyRef.current = true;
    editorRef.current?.setHTML(draftToHTML(draft));
    setContentText(draft.text);
    setVisibility((draft.visibility as PostVisibility) || "public");
    if (draft.scheduledAt && Date.parse(draft.scheduledAt) > Date.now()) {
      setScheduledAt(draft.scheduledAt);
      setShowSchedule(true);
    }
    setIsAIGenerated(Boolean(draft.ai));
    editorRef.current?.focus();
    notifyDraftRestored();
  };

  /** Abandonne définitivement le brouillon récupéré (suppression du cookie). */
  const handleDiscardDraft = () => {
    clearVibeDraft();
    setRecoverableDraft(null);
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentTotalBytes = mediaList.reduce(
      (acc, m) => acc + (m.size || 0),
      0
    );
    const newFilesBytes = files.reduce((acc, f) => acc + f.size, 0);

    if (currentTotalBytes + newFilesBytes > mediaBytesLimit) {
      setError(
        `La taille totale des médias ne peut pas dépasser ${mediaLimitLabel} par publication (sélection actuelle : ${((currentTotalBytes + newFilesBytes) / (1024 * 1024)).toFixed(1)} Mo).`
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        if (file.size > mediaBytesLimit) {
          throw new Error(
            `Le fichier ${file.name} dépasse la limite de ${mediaLimitLabel}.`
          );
        }
        const res = await ApiService.uploadFile(file);
        if (res.url) {
          const type: "image" | "video" = file.type.startsWith("video/")
            ? "video"
            : "image";
          setMediaList((prev) => [
            ...prev,
            {
              alt_text: "",
              file_name: file.name,
              media_type: type,
              mime_type: file.type,
              size: file.size,
              url: res.url,
            },
          ]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du téléversement du média.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Réordonnancement drag & drop (HTML5 natif) : réordonne uploadedMediaList
  const handleMediaDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setMediaList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  // Recherche co-auteur (debounce 300 ms)
  useEffect(() => {
    const q = collabQuery.trim();
    if (!showCollab || q.length < 2) {
      setCollabResults([]);
      return;
    }
    setCollabSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await ApiService.searchUsers(q);
        setCollabResults((res?.users || []).slice(0, 5));
      } catch {
        setCollabResults([]);
      } finally {
        setCollabSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [collabQuery, showCollab]);

  const handleCaptionChange = (index: number, caption: string) => {
    setMediaList((prev) =>
      prev.map((m, i) => (i === index ? { ...m, alt_text: caption } : m))
    );
  };

  const [scheduleBaseTime] = useState(() => Date.now());

  const minScheduleTime = useMemo(
    () => new Date(scheduleBaseTime + 5 * 60_000).toISOString().slice(0, 16),
    [scheduleBaseTime]
  );

  const isScheduleValid = useMemo(() => {
    if (!scheduledAt) return true;
    const ts = Date.parse(scheduledAt);
    return !Number.isNaN(ts) && ts > scheduleBaseTime;
  }, [scheduledAt, scheduleBaseTime]);

  const validateSchedule = (): string | null => {
    if (!scheduledAt) return null;
    const ts = Date.parse(scheduledAt);
    if (Number.isNaN(ts)) return "Date de planification invalide.";
    if (ts <= scheduleBaseTime)
      return "La date de planification doit être dans le futur.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    const html = editor?.getHTML() || "";
    const plainText = htmlToPlainText(html).trim();
    const hasMedia = mediaList.length > 0;
    if ((!plainText && !hasMedia) || isSubmitting) return;

    const scheduleError = validateSchedule();
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    if (isListening) {
      stopListening();
      resetTranscript();
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const primaryMedia = mediaList[0]?.url;
      // Type MIME réel du fichier (jamais codé en dur), déduit de l'extension en secours
      const mediaAssets = mediaList.map((m) => ({
        alt_text: m.alt_text?.trim() || undefined,
        media_type:
          m.mime_type ||
          (m.media_type === "video" ? "video/mp4" : "image/jpeg"),
        size: m.size,
        url: m.url,
      }));

      const scheduledForPublish =
        canSchedule && scheduledAt ? new Date(scheduledAt).toISOString() : null;

      if (isEditing && editingPost) {
        const res = await ApiService.updatePost(
          editingPost.id,
          html,
          mediaAssets,
          {
            mediaPositions: mediaList.map((_, i) => i),
            scheduledAt: scheduledForPublish,
            visibility,
          }
        );
        NotificationService.showInAppToast(
          res.post?.status === "scheduled"
            ? "Planification mise à jour"
            : "Vibe modifiée",
          res.post?.status === "scheduled"
            ? `Publication prévue le ${formatScheduleLabel(scheduledAt)}`
            : "Votre publication a été mise à jour.",
          "info"
        );
        window.dispatchEvent(new CustomEvent("vibe:post_updated"));
      } else {
        // Sondage : 2-4 libellés non vides, durée 1h-7j
        const cleanOptions = showPoll
          ? pollOptions
              .map((o) => o.trim())
              .filter(Boolean)
              .slice(0, 4)
          : [];
        const pollPayload =
          showPoll && cleanOptions.length >= 2
            ? {
                duration_hours: Math.min(168, Math.max(1, pollDuration)),
                options: cleanOptions,
                question: pollQuestion.trim().slice(0, 120) || undefined,
              }
            : undefined;
        if (showPoll && cleanOptions.length < 2) {
          setError("Un sondage nécessite au moins 2 options.");
          setIsSubmitting(false);
          return;
        }
        const res = await ApiService.createPost(
          html,
          primaryMedia,
          mediaAssets,
          {
            aiGenerated: isAIGenerated,
            collaboratorUsername: collabSelected?.username,
            mediaPositions: mediaList.map((_, i) => i),
            poll: pollPayload,
            quotedPostId: quotedPost?.id,
            scheduledAt: scheduledForPublish,
            visibility,
          }
        );
        if (res.post?.status === "scheduled") {
          NotificationService.showInAppToast(
            "Vibe planifiée",
            `Publication prévue le ${formatScheduleLabel(scheduledAt)}`,
            "info"
          );
        } else {
          NotificationService.notifyPostPublished(plainText);
        }
        window.dispatchEvent(new CustomEvent("vibe:post_updated"));
        // Insertion optimiste : le fil affiche le post immédiatement, sans recharger
        if (res?.post && res.post.status !== "scheduled") {
          window.dispatchEvent(
            new CustomEvent("vibe:feed_refresh", { detail: { post: res.post } })
          );
        }
      }

      editorRef.current?.clear();
      setContentText("");
      dirtyRef.current = false;
      // Publication réussie : le brouillon sauvegardé n'a plus de raison d'être
      if (!isEditing) {
        clearVibeDraft();
        if (serverDraftId) {
          deleteDraftFromServer(serverDraftId).catch(() => {});
          setServerDraftId(null);
        }
      }
      setMediaList([]);
      setQuotedPost(null);
      setScheduledAt("");
      setShowSchedule(false);
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowCollab(false);
      setCollabSelected(null);
      setCollabQuery("");
      setVisibility("public");
      setShowVisibility(false);
      setGhostSuggestion(null);
      setAiMenuOpen(false);
      setAiSnapshot(null);
      setAiError(null);
      haptics.success();
      playMotion("success");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 1400);
      onPostCreated();
      if (isModal && onClose) {
        onClose();
      }
    } catch (err: any) {
      haptics.error();
      playMotion("error");
      setError(err.message || "Erreur lors de la publication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarSrc = profile?.avatarUrl || user?.avatar_url || null;
  const submitDisabled =
    isSubmitting ||
    isUploading ||
    aiBusy ||
    contentText.length > postCharLimit ||
    (!contentText.trim() && mediaList.length === 0);
  const activeVisibility =
    VISIBILITY_OPTIONS.find((v) => v.value === visibility) ||
    VISIBILITY_OPTIONS[0];

  /** Tab accepte la continuation mAI, Échap la rejette. */
  const handleComposerKeyDown = (e: React.KeyboardEvent) => {
    if (!ghostSuggestion) return;
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      acceptGhostSuggestion();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setGhostSuggestion(null);
    }
  };

  return (
    <div
      className={`p-4 bg-black relative ${
        isModal
          ? "border-none p-4 sm:p-6 flex-1 flex flex-col min-h-full"
          : "border-b border-zinc-800"
      }`}
    >
      {error && (
        <div
          className="mb-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2 shrink-0 animate-shake"
          key={error}
        >
          <AlertCircle className="w-4 h-4 text-white shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className={`flex gap-3 sm:gap-4 ${isModal ? "flex-1 min-h-0" : ""}`}>
        <ProfileAvatar
          alt="Avatar"
          className="border border-zinc-800 shrink-0"
          fallbackName={user?.username}
          size="md"
          src={avatarSrc}
        />

        <div
          className={`flex-1 relative ${
            isModal ? "flex flex-col min-h-0 space-y-3" : "space-y-3"
          }`}
          onClick={() => {
            setShowVisibility(false);
            setAiMenuOpen(false);
          }}
          onKeyDown={handleComposerKeyDown}
        >
          {/* Brouillon récupéré (cookie 30 jours) : reprise après fermeture accidentelle.
              Les médias ne sont jamais restaurés — seul le texte l'est. */}
          {recoverableDraft &&
            !contentText.trim() &&
            mediaList.length === 0 && (
              <div
                className="flex items-center gap-2 flex-wrap p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                <span className="text-zinc-400 flex-1 min-w-0">
                  Brouillon récupéré{" "}
                  <span className="text-zinc-500">
                    ({formatDraftDate(recoverableDraft.ts)}
                    {recoverableDraft.truncated ? " · tronqué" : ""})
                  </span>{" "}
                  — les médias ne sont pas conservés.
                </span>
                <button
                  className="px-2.5 py-1 rounded-full bg-white text-black font-bold hover:brightness-90 transition-colors shrink-0"
                  onClick={handleRestoreDraft}
                  type="button"
                >
                  Reprendre
                </button>
                <button
                  className="px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
                  onClick={handleDiscardDraft}
                  type="button"
                >
                  Ignorer
                </button>
              </div>
            )}

          <RichTextEditor
            disabled={isSubmitting || aiBusy}
            fillHeight={isModal}
            initialHTML={
              isEditing ? editingPost?.content || "" : initialContent || ""
            }
            maxChars={postCharUnlimited ? undefined : postCharLimit}
            onChange={(_html, text) => {
              dirtyRef.current = true;
              setContentText(text);
            }}
            placeholder={
              isListening
                ? "Parlez, dictée vocale en cours…"
                : isEditing
                  ? "Modifiez votre vibe…"
                  : placeholder
            }
            ref={editorRef}
          />

          {/* Compteur de caractères (forfait Free : 1 000 max) */}
          {!postCharUnlimited && (
            <div
              className={`text-right text-[10px] font-mono shrink-0 ${
                contentText.length > postCharLimit
                  ? "text-red-500 font-bold"
                  : "text-zinc-500"
              }`}
            >
              {contentText.length}/{postCharLimit.toLocaleString("fr-FR")}
            </div>
          )}

          {/* Continuation mAI (ghost text) : « Tab » pour l'ajouter au post */}
          {ghostSuggestion && (
            <div
              className="flex items-center gap-2 flex-wrap text-[11px] shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-left hover:border-zinc-600 transition-colors"
                onClick={acceptGhostSuggestion}
                title="Cliquer ou appuyer sur Tab pour insérer la suite proposée par mAI"
                type="button"
              >
                <Wand2 className="w-3 h-3 text-violet-300 shrink-0" />
                <span className="text-zinc-400 truncate">
                  Suite suggérée :{" "}
                  <em className="text-zinc-300 not-italic">
                    {ghostSuggestion}
                  </em>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-300 shrink-0">
                  Tab ⇥
                </kbd>
              </button>
            </div>
          )}

          {/* Erreur outil mAI + retour arrière */}
          {(aiError || aiSnapshot) && (
            <div
              className="flex items-center gap-3 text-[11px] shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {aiError && <span className="text-amber-400">{aiError}</span>}
              {aiSnapshot && (
                <button
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors font-bold"
                  onClick={undoAiAction}
                  type="button"
                >
                  <Undo2 className="w-3 h-3" />
                  Annuler la transformation mAI
                </button>
              )}
            </div>
          )}

          {/* Publication citée (quote-post) */}
          {quotedPost && (
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-3 flex items-start gap-2.5 shrink-0">
              <ProfileAvatar
                alt={quotedPost.username}
                className="border border-zinc-800 shrink-0"
                fallbackName={quotedPost.username}
                size="sm"
                src={quotedPost.avatar_url}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {quotedPost.display_name || quotedPost.username}{" "}
                  <span className="text-zinc-500 font-normal">
                    @{quotedPost.username}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-3 mt-0.5 leading-relaxed">
                  {htmlToPlainText(quotedPost.content)}
                </p>
              </div>
              <button
                className="p-1 rounded-full bg-black/80 text-white hover:bg-black transition-colors shrink-0"
                onClick={() => setQuotedPost(null)}
                title="Retirer la citation"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload indicator */}
          {isUploading && (
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-300 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>
                Téléversement des médias ({imagesCount + videosCount}{" "}
                fichier(s))...
              </span>
            </div>
          )}

          {/* Multi-Media Previews (images / vidéos, budget de taille par forfait) + légendes */}
          {mediaList.length > 0 && (
            <div className="space-y-2 shrink-0">
              {mediaList.length > 1 && (
                <div className="flex items-center justify-end">
                  <button
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      carouselMode
                        ? "bg-white text-black border-white"
                        : "border-zinc-700 text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setCarouselMode(!carouselMode)}
                    title={
                      carouselMode
                        ? "Afficher en grille"
                        : "Afficher en carrousel"
                    }
                    type="button"
                  >
                    {carouselMode ? "Grille" : "Carrousel"}
                  </button>
                </div>
              )}
              <div
                className={
                  carouselMode && mediaList.length > 1
                    ? "flex gap-2 overflow-x-auto rounded-2xl pb-1 snap-x"
                    : `grid gap-2 rounded-2xl overflow-hidden ${mediaList.length === 1 ? "grid-cols-1" : mediaList.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`
                }
              >
                {mediaList.map((m, idx) => (
                  <div
                    className={`relative group rounded-xl overflow-hidden border bg-zinc-950 aspect-video flex items-center justify-center cursor-grab active:cursor-grabbing ${
                      carouselMode && mediaList.length > 1
                        ? "min-w-[75%] snap-center"
                        : ""
                    } ${dragIndex === idx ? "border-white opacity-60" : "border-zinc-800"}`}
                    draggable
                    key={m.url + idx}
                    onDragOver={(e) => e.preventDefault()}
                    onDragStart={() => setDragIndex(idx)}
                    onDrop={() => handleMediaDrop(idx)}
                    title="Glisser-déposer pour réordonner"
                  >
                    {m.media_type === "video" ? (
                      <video
                        className="w-full h-full object-cover"
                        controls
                        src={m.url}
                      />
                    ) : (
                      <img
                        alt={m.alt_text || "Média"}
                        className="w-full h-full object-cover"
                        src={m.url}
                      />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono">
                      {idx + 1}/{mediaList.length}
                    </span>
                    <button
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
                      onClick={() => handleRemoveMedia(idx)}
                      title="Retirer le média"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Légendes des médias */}
              <div className="space-y-1.5">
                {mediaList.map((m, idx) => (
                  <div
                    className="flex items-center gap-2"
                    key={`caption-${idx}`}
                  >
                    <span className="text-[10px] font-mono text-zinc-600 w-8 shrink-0">
                      {m.media_type === "video" ? "VIDÉO" : "IMAGE"} {idx + 1}
                    </span>
                    <input
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                      maxLength={280}
                      onChange={(e) => handleCaptionChange(idx, e.target.value)}
                      placeholder={"Ajouter une légende…"}
                      type="text"
                      value={m.alt_text || ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panneau de planification */}
          {showSchedule && (
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Planifier la publication
                </span>
                {canSchedule && scheduledAt && isScheduleValid && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Check className="w-3 h-3 text-white" />
                    {formatScheduleLabel(scheduledAt)}
                  </span>
                )}
              </div>
              {canSchedule ? (
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-500"
                  min={minScheduleTime}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  type="datetime-local"
                  value={scheduledAt}
                />
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Fonctionnalité réservée aux abonnés{" "}
                    <strong className="text-white">Plus · Pro · Max</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Panneau sondage */}
          {showPoll && !isEditing && (
            <div
              className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Sondage
                </span>
                <button
                  className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors"
                  onClick={() => setShowPoll(false)}
                  title="Retirer le sondage"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                maxLength={120}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Question (optionnel, 120 car.)"
                type="text"
                value={pollQuestion}
              />
              {pollOptions.map((opt, i) => (
                <div className="flex items-center gap-2" key={i}>
                  <input
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    maxLength={80}
                    onChange={(e) =>
                      setPollOptions((prev) =>
                        prev.map((o, j) => (j === i ? e.target.value : o))
                      )
                    }
                    placeholder={`Option ${i + 1}`}
                    type="text"
                    value={opt}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      className="p-1.5 rounded-full text-zinc-500 hover:text-white transition-colors"
                      onClick={() =>
                        setPollOptions((prev) => prev.filter((_, j) => j !== i))
                      }
                      title="Retirer cette option"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2">
                {pollOptions.length < 4 && (
                  <button
                    className="text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                    type="button"
                  >
                    + Ajouter une option ({pollOptions.length}/4)
                  </button>
                )}
                <select
                  className="ml-auto px-2 py-1.5 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:outline-none"
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  title="Durée du sondage"
                  value={pollDuration}
                >
                  <option value={1}>1 heure</option>
                  <option value={24}>24 heures</option>
                  <option value={72}>3 jours</option>
                  <option value={168}>7 jours</option>
                </select>
              </div>
            </div>
          )}

          {/* Panneau co-auteur */}
          {showCollab && !isEditing && (
            <div
              className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Co-auteur
                </span>
                <button
                  className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors"
                  onClick={() => {
                    setShowCollab(false);
                    setCollabSelected(null);
                    setCollabQuery("");
                  }}
                  title="Retirer le co-auteur"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {collabSelected ? (
                <div className="flex items-center gap-2.5">
                  <ProfileAvatar
                    alt={collabSelected.username}
                    className="border border-zinc-700"
                    fallbackName={collabSelected.username}
                    size="sm"
                    src={collabSelected.avatar_url}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      @{collabSelected.username}
                    </p>
                    <p className="text-[10px] text-amber-400">
                      Invitation en attente
                    </p>
                  </div>
                  <button
                    className="text-[11px] text-zinc-400 hover:text-white"
                    onClick={() => setCollabSelected(null)}
                    type="button"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    onChange={(e) => setCollabQuery(e.target.value)}
                    placeholder="Rechercher un utilisateur…"
                    type="text"
                    value={collabQuery}
                  />
                  {collabSearching && (
                    <p className="text-[11px] text-zinc-500">Recherche…</p>
                  )}
                  {collabResults.map((u) => (
                    <button
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-zinc-900 transition-colors text-left"
                      key={u.id}
                      onClick={() =>
                        setCollabSelected({
                          avatar_url: u.avatar_url,
                          display_name: u.display_name,
                          username: u.username,
                        })
                      }
                      type="button"
                    >
                      <ProfileAvatar
                        alt={u.username}
                        className="border border-zinc-700"
                        fallbackName={u.username}
                        size="sm"
                        src={u.avatar_url}
                      />
                      <span className="text-xs text-white font-semibold truncate">
                        @{u.username}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Action Tools Bar */}
          <div
            className={`flex items-center justify-between border-t border-zinc-900 shrink-0 ${
              isModal ? "pt-3.5 mt-auto pb-safe sm:pb-0" : "pt-2"
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <input
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                className="hidden"
                multiple
                onChange={handleFilesSelected}
                ref={fileInputRef}
                type="file"
              />

              {/* Bouton unique pour l'import de photos ET vidéos */}
              <button
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                title={`Ajouter photos ou vidéos (max ${mediaLimitLabel} au total)`}
                type="button"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Référencer un Livre public (@livre) — carte sous la Vibe */}
              <button
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                onClick={() => setShowBookAttach(true)}
                title="Référencer un Livre (@livre) : carte affichée sous la Vibe"
                type="button"
              >
                <BookHeart className="w-4 h-4" />
              </button>

              {/* Outils mAI : continuation Tab + actions rapides sur le brouillon */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`p-2 rounded-full transition-colors ${
                    aiMenuOpen || aiBusy
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  disabled={aiBusy}
                  onClick={() => setAiMenuOpen(!aiMenuOpen)}
                  title="mAI : corriger l'orthographe, allonger, réduire, changer le ton"
                  type="button"
                >
                  {aiBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </button>

                {aiMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1 z-20 w-56 vibe-menu rounded-2xl p-1.5 space-y-1 shadow-2xl">
                    <p className="px-3 pt-1 pb-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      mAI transforme votre brouillon
                    </p>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
                      disabled={!contentText.trim()}
                      onClick={() => applyAiAction("fix_spelling")}
                      type="button"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      Corriger l'orthographe
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
                      disabled={!contentText.trim()}
                      onClick={() => applyAiAction("lengthen")}
                      type="button"
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-white text-xs font-bold">
                        +
                      </span>
                      Allonger
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
                      disabled={!contentText.trim()}
                      onClick={() => applyAiAction("shorten")}
                      type="button"
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-white text-xs font-bold">
                        −
                      </span>
                      Réduire
                    </button>
                    <div className="border-t border-zinc-800 my-1" />
                    <p className="px-3 pb-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Changer le ton
                    </p>
                    {AI_TONES.map((t) => (
                      <button
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40"
                        disabled={!contentText.trim()}
                        key={t.value}
                        onClick={() => applyAiAction("tone", t.value)}
                        type="button"
                      >
                        {t.label}
                      </button>
                    ))}
                    <div className="border-t border-zinc-800 my-1" />
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                      onClick={() => {
                        setAiCompletionEnabled(!aiCompletionEnabled);
                        setAiMenuOpen(false);
                      }}
                      type="button"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span className="flex-1">
                        Suggestions automatiques (Tab)
                      </span>
                      {aiCompletionEnabled && (
                        <Check className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Audience : Public / Abonnés uniquement / Cercle Privé */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-colors text-[11px] font-bold ${
                    showVisibility || visibility !== "public"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={() => setShowVisibility(!showVisibility)}
                  title={`Audience : ${activeVisibility.label} — cliquer pour changer`}
                  type="button"
                >
                  {visibility === "public" && <Globe className="w-3.5 h-3.5" />}
                  {visibility === "followers" && (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {(visibility === "circle" || visibility === "private") && (
                    <span className="relative inline-flex">
                      <Users className="w-3.5 h-3.5" />
                      <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5" />
                    </span>
                  )}
                  <span className="hidden sm:inline max-w-[9rem] truncate">
                    {visibility === "private"
                      ? "Privé"
                      : activeVisibility.label}
                  </span>
                </button>

                {showVisibility && (
                  <div className="absolute left-0 bottom-full mb-1 z-20 w-56 vibe-menu rounded-2xl p-1.5 space-y-1 shadow-2xl">
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <button
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800 flex items-start gap-2"
                        key={opt.value}
                        onClick={() => {
                          setVisibility(opt.value);
                          setShowVisibility(false);
                        }}
                        type="button"
                      >
                        <span className="mt-0.5 w-3.5 flex justify-center shrink-0">
                          {opt.value === "public" && (
                            <Globe className="w-3.5 h-3.5 text-white" />
                          )}
                          {opt.value === "followers" && (
                            <Users className="w-3.5 h-3.5 text-white" />
                          )}
                          {opt.value === "circle" && (
                            <span className="inline-flex relative">
                              <Users className="w-3.5 h-3.5 text-white" />
                              <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-white" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block text-xs font-bold ${visibility === opt.value ? "text-white" : "text-zinc-300"}`}
                          >
                            {opt.label}
                          </span>
                          <span className="block text-[10px] text-zinc-500 leading-snug">
                            {opt.hint}
                          </span>
                        </span>
                        {visibility === opt.value && (
                          <Check className="w-3 h-3 ml-auto mt-1 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Planification (Plus / Pro / Max) */}
              {!isEditing && (
                <button
                  className={`p-2 rounded-full transition-colors relative ${
                    showSchedule || scheduledAt
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={() => setShowSchedule(!showSchedule)}
                  title={
                    canSchedule
                      ? "Planifier la publication"
                      : "Planification réservée aux abonnés Plus · Pro · Max"
                  }
                  type="button"
                >
                  {canSchedule ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <CalendarClock className="w-4 h-4" />
                  )}
                  {!canSchedule && (
                    <Lock className="w-2 h-2 absolute top-1 right-1 text-zinc-400" />
                  )}
                </button>
              )}

              {/* Sondage */}
              {!isEditing && (
                <button
                  className={`p-2 rounded-full transition-colors ${
                    showPoll
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={() => setShowPoll(!showPoll)}
                  title="Ajouter un sondage (2-4 options)"
                  type="button"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
              )}

              {/* Co-auteur */}
              {!isEditing && (
                <button
                  className={`p-2 rounded-full transition-colors ${
                    showCollab || collabSelected
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={() => setShowCollab(!showCollab)}
                  title="Inviter un co-auteur"
                  type="button"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {/* Badge « Créé avec l'IA » (défaut = réglage posts_ai_generated_by_default) */}
              {!isEditing && (
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isAIGenerated
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={() => setIsAIGenerated(!isAIGenerated)}
                  title={
                    isAIGenerated
                      ? "Publication marquée « créée avec l'IA » — cliquer pour retirer"
                      : "Marquer cette publication comme créée avec l'IA"
                  }
                  type="button"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}

              {isSupported && (
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? "Arrêter la dictée" : "Dicter la vibe"}
                  type="button"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-500 max-w-24 truncate">
                {scheduledAt && validateSchedule() === null
                  ? `⏱ ${formatScheduleLabel(scheduledAt)}`
                  : ""}
              </span>

              <button
                className={`py-2 px-5 rounded-full bg-white text-black font-bold text-xs hover:brightness-90 transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-40 ${justSent ? "animate-pop" : ""}`}
                disabled={submitDisabled && !justSent}
                onClick={handleSubmit}
                style={{
                  backgroundColor: justSent
                    ? "#22c55e"
                    : "var(--vibe-accent, #ffffff)",
                }}
              >
                {justSent ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : scheduledAt && canSchedule ? (
                  <CalendarClock className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {justSent
                    ? "Publié !"
                    : isEditing
                      ? "Enregistrer"
                      : scheduledAt && canSchedule
                        ? "Planifier"
                        : "Poster une vibe"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de référencement d'un Livre (@livre) */}
      <BookAttachModal
        isOpen={showBookAttach}
        onClose={() => setShowBookAttach(false)}
        onSelect={handleAttachBook}
      />
    </div>
  );
};

/** Convertit une date ISO en valeur utilisable par <input type="datetime-local">. */
function toLocalInputValue(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}
