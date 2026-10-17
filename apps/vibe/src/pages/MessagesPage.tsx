/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DIRECT MESSAGES (src/pages/MessagesPage.tsx)
 * Private chats with multi-media (50 Mo Free / 1 Go Plus — médias au total), speech & privacy controls
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptics } from '../services/haptics';
import { motion } from 'framer-motion';
import { useMotionPrefs } from '../hooks/useMotionPrefs';
import { SendIcon as Send, ArrowUpIcon as ArrowUp, PlusIcon as Plus, ImageIcon, MicIcon as Mic, MicOffIcon as MicOff, SearchIcon as Search, ArrowLeftIcon as ArrowLeft, CheckIcon as Check, EyeIcon as Eye, LockIcon as Lock, MailIcon as Mail, Loader2Icon as Loader2, AlertCircleIcon as AlertCircle, XIcon as X, MoreVerticalIcon as MoreVertical, ReplyIcon as Reply, ForwardIcon as Forward, CopyIcon as Copy, SparklesIcon as Sparkles, FlagIcon as Flag, Trash2Icon as Trash2, BanIcon as Ban, PencilIcon as Pencil, ScissorsIcon as Scissors, ExpandIcon as Expand, DramaIcon as Drama, Wand2Icon as Wand2, PenLineIcon as PenLine, InfoIcon as Info, PaletteIcon as Palette, LanguagesIcon as Languages, ClockIcon as Clock, PinIcon as Pin, PinOffIcon as PinOff, FileTextIcon as FileText, UsersIcon as Users, UserPlusIcon as UserPlus, BoldIcon as Bold, ItalicIcon as Italic, UnderlineIcon as Underline, StrikethroughIcon as Strikethrough, Link2Icon as Link2, BellRingIcon as BellRing, CrownIcon as Crown, BookOpenIcon as BookOpen } from "@mdevs/icons";
import { ApiService, browserToDeepLCode, TRANSLATION_LANGUAGES } from '../services/api';
import { getDmCharLimit, getMediaBytesLimit, formatMediaLimit } from '../services/tierLimits';
import { RealtimeService } from '../services/realtimeService';
import { DirectMessage, DMConversation, VibeBookPost } from '../types/vibe';
import { useAuth } from '../context/AuthContext';
import { useTheme, MESSAGE_BUBBLE_THEMES, CHAT_BACKGROUND_THEMES, MESSAGE_BUBBLE_SHAPES, MessageBubbleShape } from '../context/ThemeContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { RichContent, isRichHtml, htmlToPlainText } from '../components/common/RichContent';
import { stripUrlsFromHtml } from '../components/common/richTextUtils';
import { sanitizeRichHtml } from '../components/common/richSanitizer';
import { MessageRichInput, MessageRichInputHandle } from '../components/messages/MessageRichInput';
import { REACTION_EMOJIS } from '../components/messages/reactionEmojis';
import { RenameConversationModal, ReportConversationModal, MessageInfoModal } from '../components/messages/ConversationModals';
import { CreateGroupModal, AddMembersModal } from '../components/messages/GroupModals';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { getBookIcon } from '../components/common/bookIcons';
import { ToolAutocomplete } from '../components/layout/ToolAutocomplete';
import { NotificationService } from '../services/notificationService';

interface AttachedMedia {
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
  fileName?: string;
}

const dmDraftKey = (partnerId: string | number | null) => `vibe_dm_draft_${partnerId}`;

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  // Limites par forfait : messages 3 000 (Free) / 10 000 (Plus+) caractères,
  // médias 50 Mo (Free) / 1 Go (Plus+) au total par message.
  const messageCharLimit = getDmCharLimit(user?.tier);
  const mediaBytesLimit = getMediaBytesLimit(user?.tier);
  const mediaLimitLabel = formatMediaLimit(mediaBytesLimit);
  const {
    messageBubbleTheme,
    setMessageBubbleTheme,
    chatBackgroundTheme,
    setChatBackgroundTheme,
    messageBubbleShape,
    setMessageBubbleShape,
  } = useTheme();

  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | number | null>(null);
  const [activePartner, setActivePartner] = useState<{ id: string | number; username: string; display_name?: string; avatar_url?: string } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  // Texte brut du composeur riche (cap 3 000, mentions, envoi).
  const [messagePlain, setMessagePlain] = useState('');
  const [attachedMediaList, setAttachedMediaList] = useState<AttachedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const { play: playMotion, animationsEnabled } = useMotionPrefs();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Menu + d'import et options IA
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // Édition de message (limite 60 minutes)
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);

  // Modale Informations de message (date/heure, reçu, lu...)
  const [infoModalMessage, setInfoModalMessage] = useState<DirectMessage | null>(null);

  // Modale rapide de thème de discussion
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Interactions par message : réactions, réponse, transfert, copie
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<DirectMessage | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);
  const [customPresetText, setCustomPresetText] = useState('');

  // Modération : menu conversation, renommage, signalement, blocage, suppression
  const [convMenuOpen, setConvMenuOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  // Traduction 1-clic des messages (mAI, texte brut sans post_id)
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  // Langue cible choisie par l'utilisateur (mémorisée localement) + sous-menu du menu message
  const [translateLang, setTranslateLang] = useState<string>(() => {
    try {
      return localStorage.getItem('vibe_dm_translate_lang') || '';
    } catch {
      return '';
    }
  });
  const [translatePickerFor, setTranslatePickerFor] = useState<string | null>(null);
  // Traduction automatique des messages entrants (réglage Paramètres → Messages)
  const [autoTranslateLang, setAutoTranslateLang] = useState<string | null>(null);
  // Permalien (?conv=<id>&msg=<id>) : scroll + surbrillance temporaire
  const [pendingMsgId, setPendingMsgId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  // Modale de gestion du groupe (photo, nom, membres, administration)
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupAvatarUploading, setGroupAvatarUploading] = useState(false);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  // Mentions @ : autocomplétion dans le composeur de groupe
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  // Livre : commande « / » → sélecteur des publications du Livre (carte jointe)
  const [toolQuery, setToolQuery] = useState<string | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [bookPickerQuery, setBookPickerQuery] = useState('');
  const [bookPickerPosts, setBookPickerPosts] = useState<VibeBookPost[]>([]);
  const [bookPickerLoading, setBookPickerLoading] = useState(false);
  const [attachedPost, setAttachedPost] = useState<{ id: string; username: string; excerpt: string; avatar_url?: string | null } | null>(null);
  // Messages épinglés (bannière, max 3, temps réel via SSE dm_pin_updated)
  const [pinnedMessages, setPinnedMessages] = useState<DirectMessage[]>([]);
  const [pinsCollapsed, setPinsCollapsed] = useState(false);
  // Envoi programmé (datetime-local + badge)
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  // Recherche dans la conversation (filtre local + API si < 3 résultats)
  const [convSearchOpen, setConvSearchOpen] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [convSearchApiResults, setConvSearchApiResults] = useState<DirectMessage[]>([]);
  const [convSearchIndex, setConvSearchIndex] = useState(0);
  // Séparateur « Non lus » + bouton flottant ↓
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showJumpToUnread, setShowJumpToUnread] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Conversations de groupe (migration 019)
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSelected, setGroupSelected] = useState<Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string }>>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addMembersSelected, setAddMembersSelected] = useState<Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string }>>([]);
  // Détails de groupe frais (is_admin fiable dès l'ouverture du menu ⋮)
  const [activeGroupInfo, setActiveGroupInfo] = useState<{
    is_admin: boolean;
    members: Array<{ user_id: string | number; username: string; display_name?: string; avatar_url?: string; role: string; joined_at?: string }>;
  } | null>(null);
  // Conversation active dérivée de la liste (nom personnalisé, état de blocage…)
  const activeConv = conversations.find((c) => String(c.partner_id) === String(activePartnerId)) || null;

  const isGroupConv = Boolean(activeConv?.is_group) || String(activePartnerId || '').startsWith('group:');
  const groupId = isGroupConv ? String(activePartnerId).replace(/^group:/, '') : null;

  // Conversation de Livre : mêmes mécanismes que les groupes + publications
  // du Livre joignables via la commande « / » (carte cliquable).
  const isBookConv = Boolean(isGroupConv && activeConv?.is_book);
  const bookId = isBookConv ? (activeConv?.book_id || null) : null;
  const navigate = useNavigate();

  // Le nom/photo affichés se resynchronisent quand la liste des conversations arrive
  // (deep-link, renommage de groupe, nouvel avatar…)
  useEffect(() => {
    if (!activePartnerId || !activeConv) return;
    setActivePartner((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        username: activeConv.partner_username || prev.username,
        display_name: activeConv.partner_display_name || prev.display_name,
        avatar_url: activeConv.partner_avatar_url || prev.avatar_url,
      };
      if (
        next.username === prev.username &&
        next.display_name === prev.display_name &&
        next.avatar_url === prev.avatar_url
      ) {
        return prev;
      }
      return next;
    });
  }, [activeConv, activePartnerId]);

  // Mentions urgentes : @tous (tout le groupe) ou @username (membre précis)
  const hasUrgentMention = /@[a-zA-Z0-9_]{1,30}/.test(messagePlain) && (
    /@tous\b/i.test(messagePlain) ||
    (activeConv?.members || []).some((m) => new RegExp(`@${m.username}\\b`, 'i').test(messagePlain))
  );

  // Brouillons DM (localStorage vibe_dm_draft_<partnerId>)
  const [dmDraftKeys, setDmDraftKeys] = useState<string[]>(() => {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith('vibe_dm_draft_') && localStorage.getItem(k));
    } catch {
      return [];
    }
  });
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePartnerBlocked = Boolean(activeConv?.is_blocked);

  // New conversation user search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string; is_verified?: boolean; tier?: string }>>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Dernière conversation demandée : ignore les réponses réseau obsolètes
  const lastFetchPartnerRef = useRef<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const richInputRef = useRef<MessageRichInputHandle>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Indicateur de frappe du partenaire (« @x est en train d'écrire… »)
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Heartbeat de notre propre frappe (throttlé côté client)
  const lastTypingSentRef = useRef(0);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (text) => {
      // Dictée : insertion au curseur (ou en fin) avec espace de séparation.
      const el = richInputRef.current;
      if (!el) {
        setMessageInput((prev) => (prev ? `${prev} ${text}` : text));
        return;
      }
      const prefix = el.getText().trim() ? ' ' : '';
      el.insertText(`${prefix}${text}`);
    },
  });

  const [currentTimestamp] = useState(() => Date.now());

  const fetchConversations = useCallback(async () => {
    try {
      const res = await ApiService.getConversations();
      // Si une conversation est actuellement affichée, son compteur de non lu passe à 0
      const list = (res.conversations || []).map((c) =>
        activePartnerId && String(c.partner_id) === String(activePartnerId)
          ? { ...c, unread_count: 0 }
          : c
      );
      setConversations(list);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [activePartnerId]);

  const fetchMessages = useCallback(async (partnerId: string | number) => {
    lastFetchPartnerRef.current = partnerId;
    try {
      // Invalider le cache pour forcer la lecture réelle et fraîche
      ApiService.invalidateCache(`/v1/dms/messages/${partnerId}`);
      const res = await ApiService.getMessages(partnerId);
      // Une autre conversation a été demandée entre-temps : réponse obsolète
      if (String(lastFetchPartnerRef.current) !== String(partnerId)) return;
      const msgs = res.messages || [];
      setMessages(msgs);
      setPinnedMessages(res.pinned_messages || []);
      // Restaure les traductions mémorisées côté serveur (dernière langue par message)
      const restored: Record<string, string> = {};
      for (const mm of msgs as any[]) {
        const t = mm?.translations;
        if (t && typeof t === 'object') {
          const langs = Object.keys(t);
          if (langs.length > 0) {
            const last = langs.sort((a, b) => Date.parse(t[a]?.at || 0) - Date.parse(t[b]?.at || 0))[langs.length - 1];
            if (last && t[last]?.text) restored[String(mm.id)] = t[last].text;
          }
        }
      }
      if (Object.keys(restored).length > 0) {
        setTranslations((prev) => ({ ...restored, ...prev }));
      }
      // Premier message non lu (hors messages propres) → séparateur + bouton ↓
      // Groupes : la lecture est suivie par read_by (is_read n'y est jamais posé)
      const isGroupThread = String(partnerId).startsWith('group:');
      const firstUnread = msgs.find((m) => {
        if (!user || String(m.sender_id) === String(user.id)) return false;
        if (isGroupThread) {
          const readers = (((m as any).read_by || []) as any[]).map(String);
          return !readers.includes(String(user.id));
        }
        return !m.is_read;
      });
      setFirstUnreadId(firstUnread ? String(firstUnread.id) : null);
      setShowJumpToUnread(Boolean(firstUnread));

      // Supprimer immédiatement le point/badge de non lu sur la conversation ouverte
      setConversations((prev) =>
        prev.map((c) =>
          String(c.partner_id) === String(partnerId)
            ? { ...c, unread_count: 0 }
            : c
        )
      );

      // Invalider le cache des conversations et actualiser les badges globaux
      ApiService.invalidateCache('/dms/conversations');
      ApiService.invalidateCache('/unread_count');
      window.dispatchEvent(new CustomEvent('vibe:unread_updated'));

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      // Le séparateur « Non lus » disparaît 3 s après le scroll en bas
      setTimeout(() => {
        setShowJumpToUnread(false);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de charger les messages.');
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    // Filet de sécurité : rafraîchissement léger toutes les 60 s.
    // L'instantanéité est assurée par le flux SSE (RealtimeService).
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (activePartnerId) fetchMessages(activePartnerId);
      fetchConversations();
    }, 60000);
    return () => clearInterval(timer);
  }, [activePartnerId, fetchConversations, fetchMessages]);

  // ── Temps réel (SSE) : nouveaux messages + indicateur de frappe ──
  useEffect(() => {
    const unsubscribe = RealtimeService.on((type, payload) => {
      if (type === 'dm_message' && payload) {
        const fromActivePartner =
          activePartnerId != null &&
          (String(payload.sender_id) === String(activePartnerId) ||
            (isGroupConv && payload.conversation_id && String(payload.conversation_id) === String(groupId)));
        const mine = payload.sender_id != null && user && String(payload.sender_id) === String(user.id);
        if (fromActivePartner && !mine) {
          // Dédupliqué contre l'optimiste/le rafraîchissement par id
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(payload.id))) return prev;
            return [...prev, payload as DirectMessage];
          });
          // Marque lu côté serveur + purge les caches DM (rattrapage silencieux)
          ApiService.invalidateCache(`/dms/messages/${activePartnerId}`);
          ApiService.getMessages(activePartnerId).catch(() => {});
          ApiService.invalidateCache('/dms/conversations');
          fetchConversations();
          // Traduction automatique des messages entrants (si activée dans les Paramètres)
          // Les clés serveur sont en minuscules : comparer sans tenir compte de la casse
          const autoTranslateKey = (autoTranslateLang || '').toLowerCase();
          const hasStoredTranslation = autoTranslateKey
            ? Object.keys((payload as any).translations || {}).some((k) => k.toLowerCase() === autoTranslateKey)
            : false;
          if (autoTranslateLang && !hasStoredTranslation) {
            const plain = htmlToPlainText(String(payload.content || ''));
            if (plain.trim()) {
              ApiService.translateText(plain, autoTranslateLang)
                .then((tr) => {
                  if (tr?.translation) {
                    setTranslations((prev) => ({ ...prev, [payload.id]: tr.translation }));
                    ApiService.saveMessageTranslation(String(payload.id), autoTranslateLang, tr.translation, (tr as any).detected_language).catch(() => {});
                  }
                })
                .catch(() => {});
            }
          }
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        } else if (!mine) {
          // Autre conversation : met à jour la liste (aperçu, tri, badge)
          ApiService.invalidateCache('/dms/');
          fetchConversations();
        }
      } else if (type === 'dm_message_edited' && payload) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(payload.id)
              ? {
                  ...m,
                  content: payload.content,
                  is_edited: true,
                  edited_at: payload.edited_at || new Date().toISOString(),
                }
              : m
          )
        );
        fetchConversations();
      } else if (type === 'dm_message_deleted' && payload) {
        // « Supprimé pour tout le monde » : retire le message (et son épingle)
        setMessages((prev) => prev.filter((m) => String(m.id) !== String(payload.id)));
        setPinnedMessages((prev) => prev.filter((p) => String(p.id) !== String(payload.id)));
      } else if (type === 'group_updated' && payload) {
        // Ajout/retrait de membre, renommage, transfert d'admin ou suppression du groupe
        ApiService.invalidateCache('/dms/');
        fetchConversations();
        const gid = payload?.conversation_id;
        if (isGroupConv && gid && String(gid) === String(groupId)) {
          if (payload.action === 'deleted') {
            setActivePartnerId(null);
            setActivePartner(null);
            setMessages([]);
          } else {
            ApiService.getGroup(String(gid))
              .then((res) => res?.group && setActiveGroupInfo(res.group))
              .catch(() => {});
            if (activePartnerId) fetchMessages(activePartnerId);
          }
        }
      } else if (type === 'dm_typing' && payload) {
        const fromActivePartner =
          activePartnerId != null && String(payload.user_id) === String(activePartnerId);
        if (!fromActivePartner) return;
        if (typingHideTimeoutRef.current) clearTimeout(typingHideTimeoutRef.current);
        if (payload.typing === false) {
          setPartnerTyping(false);
        } else {
          setPartnerTyping(true);
          // Disparaît si aucun nouveau signal n'arrive (l'émetteur throttle à 2,5 s)
          typingHideTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 6000);
        }
      }
    });
    return () => {
      unsubscribe();
      if (typingHideTimeoutRef.current) clearTimeout(typingHideTimeoutRef.current);
    };
  }, [activePartnerId, user, fetchConversations, isGroupConv, groupId, autoTranslateLang]);

  // Réinitialise l'indicateur de frappe quand on change de conversation
  useEffect(() => {
    setPartnerTyping((prev) => (prev ? false : prev));
  }, [activePartnerId]);

  // Détails de groupe : rafraîchis à l'ouverture du menu, de la modale d'ajout
  // ou de la modale d'infos (le premier rendu peut précéder fetchConversations).
  useEffect(() => {
    setActiveGroupInfo(null);
  }, [activePartnerId]);

  useEffect(() => {
    if ((!convMenuOpen && !addMembersOpen && !groupInfoOpen) || !isGroupConv || !groupId) return;
    let cancelled = false;
    ApiService.getGroup(groupId)
      .then((res) => {
        if (!cancelled && res?.group) setActiveGroupInfo(res.group);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [convMenuOpen, addMembersOpen, groupInfoOpen, isGroupConv, groupId]);

  // Réglage « traduction automatique » des messages entrants (Paramètres → Messages)
  useEffect(() => {
    ApiService.getSettings()
      .then((res) => {
        const s: any = res?.settings || {};
        if (s.dm_auto_translate) {
          setAutoTranslateLang(s.dm_translate_lang || browserToDeepLCode(navigator.language || 'fr-FR'));
        }
      })
      .catch(() => {});
  }, []);

  // Brouillon DM : restaure à l'ouverture de la conversation
  useEffect(() => {
    if (!activePartnerId) return;
    try {
      const saved = localStorage.getItem(dmDraftKey(activePartnerId)) || '';
      if (!editingMessage) {
        setMessageInput(saved);
        richInputRef.current?.setHTML(saved);
      }
    } catch {}
    setScheduledAt('');
    setShowSchedule(false);
    setConvSearchOpen(false);
    setConvSearchQuery('');
    setConvSearchApiResults([]);
    // Les états « réponse » et « édition » ne doivent pas fuir entre conversations
    setReplyTo(null);
    setEditingMessage(null);
    setMentionQuery(null);
    // Livre : pièce jointe + sélecteur de publications réinitialisés
    setToolQuery(null);
    setAttachedPost(null);
    setBookPickerOpen(false);
    setBookPickerQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartnerId]);

  // Brouillon DM : sauvegarde différée 500 ms après la frappe
  useEffect(() => {
    if (!activePartnerId || editingMessage) return;
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(() => {
      try {
        if (messagePlain.trim()) {
          localStorage.setItem(dmDraftKey(activePartnerId), messageInput);
          setDmDraftKeys((prev) => (prev.includes(dmDraftKey(activePartnerId)) ? prev : [...prev, dmDraftKey(activePartnerId)]));
        } else {
          localStorage.removeItem(dmDraftKey(activePartnerId));
          setDmDraftKeys((prev) => prev.filter((k) => k !== dmDraftKey(activePartnerId)));
        }
      } catch {}
    }, 500);
    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [messageInput, messagePlain, activePartnerId, editingMessage]);

  // SSE : épinglage/désépinglage temps réel des deux côtés
  useEffect(() => {
    const unsubscribe = RealtimeService.on((type, payload) => {
      if (type !== 'dm_pin_updated' || !payload || !activePartnerId) return;
      ApiService.invalidateCache(`/v1/dms/messages/${activePartnerId}`);
      ApiService.getMessages(activePartnerId)
        .then((res) => setPinnedMessages(res.pinned_messages || []))
        .catch(() => {});
    });
    return unsubscribe;
  }, [activePartnerId]);

  // Deep-link : /messages?partner=<id> (recherche globale) ou
  // /messages?conv=<id>&msg=<id> (permalien copié depuis le menu message)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const partner = params.get('conv') || params.get('partner');
      const msgId = params.get('msg');
      if (partner && !activePartnerId) {
        const pid = partner;
        setActivePartnerId(pid);
        setActivePartner({
          id: pid,
          username: String(pid).startsWith('group:') ? 'Groupe' : `user-${pid}`,
        });
        if (msgId) setPendingMsgId(msgId);
        fetchMessages(pid);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permalien : scroll + surbrillance une fois le message chargé
  useEffect(() => {
    if (!pendingMsgId || messages.length === 0) return;
    if (!messages.some((m) => String(m.id) === String(pendingMsgId))) return;
    const id = pendingMsgId;
    setPendingMsgId(null);
    setTimeout(() => {
      scrollToMessage(id);
      setHighlightedMessageId(id);
      setTimeout(() => setHighlightedMessageId((cur) => (cur === id ? null : cur)), 2500);
    }, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, pendingMsgId]);

  const handleSelectConversation = (conv: DMConversation) => {
    haptics.light();
    setActivePartnerId(conv.partner_id);
    setActivePartner({
      id: conv.partner_id,
      username: conv.partner_username,
      display_name: conv.partner_display_name,
      avatar_url: conv.partner_avatar_url,
    });
    // Supprimer immédiatement le badge/point de non lu au clic
    setConversations((prev) =>
      prev.map((c) =>
        String(c.partner_id) === String(conv.partner_id)
          ? { ...c, unread_count: 0 }
          : c
      )
    );
    setConvMenuOpen(false);
    setErrorMessage(null);
    setAttachedMediaList([]);
    fetchMessages(conv.partner_id);
  };

  // ── Conversations de groupe (migration 019) ──
  const handleCreateGroup = async () => {
    if (groupSelected.length === 0 || isCreatingGroup) return;
    setIsCreatingGroup(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.createGroup(groupName.trim() || 'Nouveau groupe', groupSelected.map((u) => u.id));
      setGroupModalOpen(false);
      setGroupName('');
      setGroupSelected([]);
      haptics.success();
      await fetchConversations();
      // Ouvre directement la nouvelle conversation de groupe
      setActivePartnerId(`group:${res.conversation_id}`);
      setActivePartner({ id: `group:${res.conversation_id}`, username: res.name });
      fetchMessages(`group:${res.conversation_id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création du groupe.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAddMembers = async () => {
    if (!groupId || addMembersSelected.length === 0) return;
    setIsCreatingGroup(true);
    try {
      await ApiService.addGroupMembers(groupId, addMembersSelected.map((u) => u.id));
      setAddMembersOpen(false);
      setAddMembersSelected([]);
      haptics.success();
      fetchConversations();
      if (activePartnerId) fetchMessages(activePartnerId);
      if (groupId) {
        ApiService.getGroup(groupId).then((res) => res?.group && setActiveGroupInfo(res.group)).catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'ajout des membres.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!groupId) return;
    const ok = await confirm({
      title: 'Retirer ce membre ?',
      message: "Cette personne n'aura plus accès à la conversation de groupe.",
      confirmLabel: 'Retirer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.removeGroupMember(groupId, memberUserId);
      haptics.light();
      fetchConversations();
      if (activePartnerId) fetchMessages(activePartnerId);
      if (groupId) {
        ApiService.getGroup(groupId).then((res) => res?.group && setActiveGroupInfo(res.group)).catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du retrait du membre.');
    }
  };

  const { confirm, confirmInput, confirmDialog } = useConfirmDialog();

  // Admin fiable dès l'ouverture du menu (activeConv peut être null au 1er rendu)
  const groupIsAdmin = activeGroupInfo?.is_admin ?? Boolean(activeConv?.is_admin);
  const groupMembers = activeGroupInfo?.members ?? (activeConv?.members || []);
  const existingGroupMemberIds = new Set(groupMembers.map((mm) => String(mm.user_id)));

  // ── Mise en forme du message : gras, italique, souligné, barré, lien ──
  // (les commandes s'appliquent à la sélection du composeur riche)
  const handleToolbarCommand = (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => {
    richInputRef.current?.execCommand(cmd);
  };

  const handleInsertLink = async () => {
    const url = await confirmInput({
      title: 'Insérer un lien',
      message: 'Saisissez l’URL à insérer dans le message.',
      confirmLabel: 'Insérer',
      input: { type: 'url', placeholder: 'https://…', maxLength: 500 },
    });
    if (url) richInputRef.current?.insertLink(url);
  };

  // ── Modération conversation ──
  const handleRenameConversation = async (value: string) => {
    if (!activePartnerId || isModerating) return;
    setIsModerating(true);
    try {
      await ApiService.renameConversation(activePartnerId, value);
      setRenameModalOpen(false);
      setConvMenuOpen(false);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du renommage.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleReportConversation = async (reason: string) => {
    if (!activePartnerId || isModerating) return;
    setIsModerating(true);
    try {
      await ApiService.reportConversation(activePartnerId, reason);
      setReportModalOpen(false);
      setConvMenuOpen(false);
      setErrorMessage(null);
      NotificationService.showInAppToast('Signalement transmis', 'Merci de nous aider à garder Vibe sûr.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du signalement.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!activePartnerId || isModerating) return;
    setIsModerating(true);
    try {
      if (activePartnerBlocked) {
        await ApiService.unblockUser(activePartnerId);
      } else {
        const ok = await confirm({
          title: `Bloquer @${activePartner?.username} ?`,
          message: 'Cette personne ne pourra plus vous envoyer de messages.',
          confirmLabel: 'Bloquer',
          tone: 'danger',
        });
        if (!ok) {
          setIsModerating(false);
          return;
        }
        await ApiService.blockUser(activePartnerId);
      }
      setConvMenuOpen(false);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du blocage.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activePartnerId || isModerating) return;
    const ok = await confirm({
      title: 'Supprimer la conversation ?',
      message: 'Cette conversation et tous ses messages seront supprimés définitivement.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    setIsModerating(true);
    try {
      await ApiService.deleteConversation(activePartnerId);
      setActivePartnerId(null);
      setActivePartner(null);
      setMessages([]);
      setConvMenuOpen(false);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la suppression.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleDeleteMessage = async (m: DirectMessage) => {
    setActionMenuFor(null);
    const ok = await confirm({
      title: 'Supprimer ce message ?',
      message: 'Le message sera supprimé pour tout le monde.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    const snapshot = messages;
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    setPinnedMessages((prev) => prev.filter((p) => String(p.id) !== String(m.id)));
    try {
      await ApiService.deleteMessage(String(m.id));
    } catch (err: any) {
      setMessages(snapshot);
      setErrorMessage(err.message || 'Impossible de supprimer le message.');
    }
  };

  /** Traduction d'un message (langue cible choisie ou langue par défaut), mémorisée côté serveur. */
  const handleTranslateMessage = async (m: DirectMessage, targetLang?: string) => {
    setActionMenuFor(null);
    setTranslatePickerFor(null);
    if (translations[m.id] && !targetLang) return;
    const target = (targetLang || translateLang || browserToDeepLCode(navigator.language || 'fr-FR')).toUpperCase();
    if (targetLang) {
      setTranslateLang(target);
      try {
        localStorage.setItem('vibe_dm_translate_lang', target);
      } catch {}
    }
    setTranslatingIds((prev) => new Set(prev).add(String(m.id)));
    try {
      const plain = htmlToPlainText(m.content);
      const res = await ApiService.translateText(plain, target);
      if (res?.translation) {
        setTranslations((prev) => ({ ...prev, [m.id]: res.translation }));
        haptics.success();
        // Mémorisation serveur (survit au rechargement, partagée entre appareils)
        ApiService.saveMessageTranslation(String(m.id), target, res.translation, (res as any).detected_language).catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Traduction impossible.');
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(String(m.id));
        return next;
      });
    }
  };

  /** Supprime le message pour soi uniquement (les autres membres le conservent). */
  const handleHideMessage = async (m: DirectMessage) => {
    setActionMenuFor(null);
    const snapshot = messages;
    setMessages((prev) => prev.filter((x) => String(x.id) !== String(m.id)));
    setPinnedMessages((prev) => prev.filter((p) => String(p.id) !== String(m.id)));
    try {
      await ApiService.hideMessage(String(m.id));
      haptics.success();
    } catch (err: any) {
      setMessages(snapshot);
      setErrorMessage(err.message || 'Impossible de masquer le message.');
    }
  };

  /** Copie le permalien du message (?conv=…&msg=…) dans le presse-papiers. */
  const handleCopyMessageLink = async (m: DirectMessage) => {
    setActionMenuFor(null);
    try {
      const url = `${window.location.origin}/messages?conv=${encodeURIComponent(String(activePartnerId))}&msg=${m.id}`;
      await navigator.clipboard.writeText(url);
      haptics.success();
      NotificationService.showInAppToast('Copié', 'Lien du message copié dans le presse-papiers.', 'success');
    } catch {
      haptics.error();
      NotificationService.showInAppToast('Erreur', 'Impossible de copier le lien du message.', 'error');
    }
  };

  /** Épingle / désépingle un message (max 3 par conversation). */
  const handleTogglePin = async (m: DirectMessage) => {
    setActionMenuFor(null);
    if (!activePartnerId) return;
    const isPinned = pinnedMessages.some((p) => String(p.id) === String(m.id));
    try {
      if (isPinned) {
        await ApiService.unpinMessage(activePartnerId, String(m.id));
        setPinnedMessages((prev) => prev.filter((p) => String(p.id) !== String(m.id)));
      } else {
        await ApiService.pinMessage(activePartnerId, String(m.id));
        if (activePartnerId) fetchMessages(activePartnerId);
      }
      haptics.success();
    } catch (err: any) {
      haptics.error();
      setErrorMessage(err?.message || "L'épinglage a échoué.");
    }
  };

  /** Marque manuellement la conversation comme non lue (menu conversation). */
  const handleMarkUnread = async () => {
    if (!activePartnerId) return;
    setConvMenuOpen(false);
    try {
      await ApiService.markConversationUnread(activePartnerId);
      haptics.success();
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Marquage impossible.');
    }
  };

  /** Recherche dans la conversation : filtre local puis API si < 3 résultats. */
  useEffect(() => {
    const q = convSearchQuery.trim();
    if (!convSearchOpen || !activePartnerId || q.length < 3) {
      setConvSearchApiResults([]);
      return;
    }
    const localCount = messages.filter((m) => m.content.includes(q)).length;
    if (localCount >= 3) {
      setConvSearchApiResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await ApiService.searchDMMessages(activePartnerId, q);
        const known = new Set(messages.map((m) => String(m.id)));
        setConvSearchApiResults((res.messages || []).filter((m) => !known.has(String(m.id))));
      } catch {
        setConvSearchApiResults([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [convSearchQuery, convSearchOpen, activePartnerId, messages]);

  /** Surlignage des occurrences (découpage React, sans HTML brut). */
  const highlightMatches = (content: string, query: string): React.ReactNode => {
    if (!query) return content;
    const parts = content.split(query);
    if (parts.length <= 1) return content;
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <mark className="bg-yellow-400/60 text-inherit rounded-sm px-0.5">{query}</mark>}
          </span>
        ))}
      </>
    );
  };

  const scrollToMessage = (id: string) => {
    const el = messageRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      haptics.light();
    }
  };

  const handleSearchUsers = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await ApiService.searchUsers(q.trim());
        setSearchResults(res.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };

  const handleStartConversationWith = (u: { id: string | number; username: string; display_name?: string; avatar_url?: string }) => {
    haptics.light();
    setActivePartnerId(u.id);
    setActivePartner(u);
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
    setAttachedMediaList([]);
    fetchMessages(u.id);
  };

  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentBytes = attachedMediaList.reduce((acc, m) => acc + m.size, 0);
    const newBytes = files.reduce((acc, f) => acc + f.size, 0);

    if (currentBytes + newBytes > mediaBytesLimit) {
      setErrorMessage(`La taille totale des médias dépasse la limite de ${mediaLimitLabel} (sélection : ${((currentBytes + newBytes) / (1024 * 1024)).toFixed(1)} Mo).`);
      return;
    }

    for (const f of files) {
      if (
        !f.type.startsWith('image/') &&
        !f.type.startsWith('video/') &&
        !f.type.startsWith('application/') &&
        f.type !== 'text/plain'
      ) {
        setErrorMessage(`Type de fichier non pris en charge : ${f.name}`);
        return;
      }
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      for (const file of files) {
        const res = await ApiService.uploadFile(file);
        if (res.url) {
          const type: 'image' | 'video' | 'document' = file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('image/')
            ? 'image'
            : 'document';
          setAttachedMediaList((prev) => [...prev, { url: res.url, type, size: file.size, fileName: file.name }]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l’envoi des fichiers.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Heartbeat « en train d'écrire » : throttlé à 2,5 s pendant la saisie. */
  const notifyTyping = () => {
    if (!activePartnerId || activePartnerBlocked) return;
    // L'indicateur de frappe n'existe qu'en 1-à-1 (partner_id numérique)
    if (isGroupConv) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2500) {
      lastTypingSentRef.current = now;
      ApiService.sendTyping(activePartnerId, true).catch(() => {});
    }
  };

  /** Callback du composeur riche : mémorise le HTML + le texte brut. */
  const handleRichInputChange = (html: string, text: string) => {
    setMessageInput(html);
    setMessagePlain(text);
    // Autocomplétion @mention dans les groupes (dernier mot commençant par @)
    if (isGroupConv) {
      const mq = /@([a-zA-Z0-9_]{0,30})$/.exec(text);
      setMentionQuery(mq ? mq[1] : null);
    } else if (mentionQuery !== null) {
      setMentionQuery(null);
    }
    // Commande « / » dans une conversation de Livre (joindre une publication)
    if (isBookConv) {
      const tq = /(?:^|\s)\/([a-zA-Z0-9_]{0,30})$/.exec(text);
      setToolQuery(tq ? tq[1] : null);
    } else if (toolQuery !== null) {
      setToolQuery(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Mode modification de message existant
    if (editingMessage) {
      const msgId = editingMessage.id;
      const newHtml = sanitizeRichHtml(messageInput).trim();
      const newText = messagePlain.trim();
      const originalText = htmlToPlainText(editingMessage.content).trim();
      if (!newText || newText === originalText) {
        setEditingMessage(null);
        richInputRef.current?.clear();
        return;
      }
      setIsSending(true);
      setErrorMessage(null);
      // Mise à jour optimiste
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: newHtml, is_edited: true, edited_at: new Date().toISOString() } : m
        )
      );
      setEditingMessage(null);
      richInputRef.current?.clear();
      try {
        await ApiService.editMessage(String(msgId), newHtml);
        if (activePartnerId) {
          fetchMessages(activePartnerId);
        }
        fetchConversations();
      } catch (err: any) {
        setErrorMessage(err.message || 'Impossible de modifier le message.');
        if (activePartnerId) fetchMessages(activePartnerId);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const safeHtml = sanitizeRichHtml(messageInput);
    const mediaUrls = attachedMediaList.map((m) => m.url).join(' ');
    const textToSend = mediaUrls
      ? `${safeHtml.trim()}${safeHtml.trim() ? '<br>' : ''}${mediaUrls}`.trim()
      : safeHtml.trim();

    if (!messagePlain.trim() || !activePartnerId || isSending || activePartnerBlocked) return;

    // Conversations de groupe : envoi via conversation_id "group:<uuid>"
    if (isGroupConv && groupId) {
      setIsSending(true);
      setErrorMessage(null);
      try {
        await ApiService.sendMessage(
          undefined as unknown as number,
          textToSend,
          replyTo && !String(replyTo.id).startsWith('temp') ? String(replyTo.id) : undefined,
          undefined,
          `group:${groupId}`,
          undefined,
          attachedPost?.id
        );
        setReplyTo(null);
        setAttachedMediaList([]);
        setAttachedPost(null);
        richInputRef.current?.clear();
        haptics.success();
        fetchMessages(activePartnerId);
        fetchConversations();
      } catch (err: any) {
        setErrorMessage(err.message || 'Impossible d\'envoyer le message au groupe.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Cesse l'indicateur de frappe dès l'envoi
    lastTypingSentRef.current = 0;
    ApiService.sendTyping(activePartnerId, false).catch(() => {});

    if (isListening) {
      stopListening();
      resetTranscript();
    }

    const tempId = Date.now().toString();
    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversation_id: 'temp',
      sender_id: user ? String(user.id) : 'me',
      sender_username: user?.username || 'me',
      recipient_id: String(activePartnerId),
      content: textToSend,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Envoi programmé : la date doit être future
    let sendAtIso: string | undefined;
    if (scheduledAt) {
      const ts = Date.parse(scheduledAt);
      if (Number.isNaN(ts) || ts <= Date.now()) {
        setErrorMessage("La date d'envoi programmé doit être dans le futur.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsSending(false);
        return;
      }
      sendAtIso = new Date(ts).toISOString();
    }

    setMessages((prev) => [...prev, optimisticMsg]);
    richInputRef.current?.clear();
    setAttachedMediaList([]);
    setIsSending(true);
    setErrorMessage(null);

    try {
      await ApiService.sendMessage(activePartnerId, textToSend, replyTo && !String(replyTo.id).startsWith('temp') ? String(replyTo.id) : undefined, sendAtIso);
      setReplyTo(null);
      // Brouillon consommé + programmation réinitialisée
      try {
        localStorage.removeItem(dmDraftKey(activePartnerId));
        setDmDraftKeys((prev) => prev.filter((k) => k !== dmDraftKey(activePartnerId)));
      } catch {}
      setScheduledAt('');
      setShowSchedule(false);
      haptics.success();
      playMotion('success');
      setJustSent(true);
      setTimeout(() => setJustSent(false), 1200);
      fetchMessages(activePartnerId);
      fetchConversations();
    } catch (err: any) {
      haptics.error();
      playMotion('error');
      setErrorMessage(err.message || 'Impossible d’envoyer le message.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleReaction = async (m: DirectMessage, emoji: string) => {
    if (String(m.id).startsWith('temp')) return;
    setActionMenuFor(null);
    // Mise à jour optimiste
    setMessages((prev) => prev.map((msg) => {
      if (msg.id !== m.id) return msg;
      const reactions: { emoji: string; count: number; mine: boolean }[] = [...((msg as any).reactions || [])];
      const g = reactions.find((r) => r.emoji === emoji);
      if (g) {
        if (g.mine) {
          g.count -= 1;
          g.mine = false;
          if (g.count <= 0) g.count = 0;
          playMotion('unlike');
        } else {
          g.count += 1;
          g.mine = true;
          playMotion('like');
        }
      } else {
        reactions.push({ emoji, count: 1, mine: true });
        playMotion('like');
      }
      return { ...msg, reactions: reactions.filter((r) => r.count > 0) } as any;
    }));
    try {
      await ApiService.reactToMessage(String(m.id), emoji);
    } catch {
      fetchMessages(activePartnerId!); // resynchro en cas d'échec
    }
  };

  const handleCopyMessage = async (m: DirectMessage) => {
    setActionMenuFor(null);
    try {
      await navigator.clipboard.writeText(htmlToPlainText(m.content));
      haptics.success();
      NotificationService.showInAppToast('Copié', 'Message copié dans le presse-papiers.', 'success');
    } catch {
      haptics.error();
      NotificationService.showInAppToast('Erreur', 'Impossible de copier le message.', 'error');
    }
  };

  const handleForwardTo = async (conv: DMConversation) => {
    if (!forwardingMessage) return;
    try {
      await ApiService.sendMessage(
        conv.is_group ? (undefined as unknown as number) : conv.partner_id,
        forwardingMessage.content,
        undefined,
        undefined,
        conv.is_group ? conv.partner_id : undefined,
        { message_id: String(forwardingMessage.id) }
      );
      setForwardingMessage(null);
      NotificationService.showInAppToast('Transféré', 'Le message a été transféré.', 'success');
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err.message || 'Erreur lors du transfert.', 'error');
    }
  };

  // ── Gestion du groupe : photo, nom, administration, suppression ──
  const handleGroupAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !groupId) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Choisissez un fichier image pour la photo du groupe.');
      return;
    }
    setGroupAvatarUploading(true);
    try {
      const up = await ApiService.uploadFile(file);
      if (up?.url) {
        await ApiService.updateGroup(groupId, { avatar_url: up.url });
        haptics.success();
        fetchConversations();
        const res = await ApiService.getGroup(groupId);
        if (res?.group) setActiveGroupInfo(res.group);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de changer la photo du groupe.');
    } finally {
      setGroupAvatarUploading(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!groupId || !groupNameDraft.trim() || groupSaving) return;
    setGroupSaving(true);
    try {
      await ApiService.updateGroup(groupId, { name: groupNameDraft.trim() });
      haptics.success();
      fetchConversations();
      setGroupInfoOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de renommer le groupe.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleTransferAdmin = async (targetUserId: string | number) => {
    if (!groupId) return;
    const target = groupMembers.find((mm) => String(mm.user_id) === String(targetUserId));
    const ok = await confirm({
      title: 'Nommer ce membre administrateur ?',
      message: `@${target?.username || 'ce membre'} deviendra administrateur du groupe. Vous deviendrez simple membre.`,
      confirmLabel: 'Nommer admin',
    });
    if (!ok) return;
    try {
      await ApiService.transferGroupAdmin(groupId, targetUserId);
      haptics.success();
      const res = await ApiService.getGroup(groupId);
      if (res?.group) setActiveGroupInfo(res.group);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfert impossible.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    const ok = await confirm({
      title: 'Supprimer ce groupe ?',
      message: 'Le groupe et tous ses messages seront définitivement supprimés. Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ApiService.deleteGroup(groupId);
      setGroupInfoOpen(false);
      setConvMenuOpen(false);
      setActivePartnerId(null);
      setActivePartner(null);
      setMessages([]);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Suppression du groupe impossible.');
    }
  };

  // ── Mentions @ : autocomplétion (membres du groupe) ──
  const mentionSuggestions = isGroupConv && mentionQuery !== null
    ? (activeConv?.members || [])
        .filter((mm) => String(mm.user_id) !== String(user?.id))
        .filter((mm) => mentionQuery === '' || mm.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  const handleInsertMention = (username: string) => {
    try {
      // Supprime la requête tapée (« @xxx ») puis insère la mention complète
      for (let i = 0; i < (mentionQuery?.length || 0) + 1; i++) {
        document.execCommand('delete', false);
      }
    } catch {}
    richInputRef.current?.insertText(`@${username} `);
    setMentionQuery(null);
  };

  // ── Livre : commande « / » → sélecteur des publications du Livre ──
  const openBookPostPicker = () => {
    try {
      // Supprime la requête tapée (« /xxx ») comme pour les mentions
      for (let i = 0; i < (toolQuery?.length || 0) + 1; i++) {
        document.execCommand('delete', false);
      }
    } catch {}
    setToolQuery(null);
    setBookPickerOpen(true);
    setBookPickerQuery('');
    if (bookId) {
      setBookPickerLoading(true);
      ApiService.getBookPosts(bookId)
        .then((res) => setBookPickerPosts(res.posts || []))
        .catch(() => setBookPickerPosts([]))
        .finally(() => setBookPickerLoading(false));
    }
  };

  // Publications du Livre filtrées (recherche locale par auteur / extrait), max 20
  const filteredBookPickerPosts = (() => {
    const q = bookPickerQuery.trim().toLowerCase();
    const list = q
      ? bookPickerPosts.filter((p) => {
          const plain = htmlToPlainText(p.content || '').toLowerCase();
          return plain.includes(q) || String(p.username || '').toLowerCase().includes(q);
        })
      : bookPickerPosts;
    return list.slice(0, 20);
  })();

  const PRESET_OPTIONS: { key: 'shorten' | 'extend' | 'tone' | 'improve' | 'custom'; label: string; icon: React.ReactNode }[] = [
    { key: 'shorten', label: 'Réduire', icon: <Scissors className="w-3.5 h-3.5" /> },
    { key: 'extend', label: 'Allonger', icon: <Expand className="w-3.5 h-3.5" /> },
    { key: 'tone', label: 'Changer le ton', icon: <Drama className="w-3.5 h-3.5" /> },
    { key: 'improve', label: 'Améliorer', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { key: 'custom', label: 'Personnalisé…', icon: <PenLine className="w-3.5 h-3.5" /> },
  ];

  const handleGenerateSuggestion = async (
    preset: 'improve' | 'shorten' | 'extend' | 'tone' | 'custom' = 'improve',
    customPrompt?: string
  ) => {
    if (!activePartnerId || isGeneratingSuggestion) return;
    if (!messagePlain.trim()) {
      setErrorMessage("Veuillez d'abord écrire un texte dans la bulle de message pour que mAI puisse l'améliorer.");
      return;
    }
    if (preset === 'custom' && !customPrompt?.trim()) {
      setCustomPresetOpen(true);
      setPlusMenuOpen(false);
      return;
    }
    setIsGeneratingSuggestion(true);
    setErrorMessage(null);
    setCustomPresetOpen(false);
    try {
      const res = await ApiService.generateDMReply(activePartnerId, messagePlain.trim(), preset, customPrompt?.trim() || undefined);
      if (res?.suggestion) {
        const clean = res.suggestion
          .replace(/User Safety:\s*safe\.?/gi, '')
          .replace(/^User Safety:[^\n]*\n*/gi, '')
          .trim();
        if (clean) {
          setMessageInput(clean);
          richInputRef.current?.setHTML(clean);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'mAI n’a pas pu améliorer le message.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="vibe-chat-page flex-1 flex min-h-screen border-r pb-16 md:pb-0 select-none">
      {/* Left Column: Conversations List */}
      <div className={`vibe-chat-sidebar w-full md:w-80 lg:w-96 border-r flex flex-col ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="vibe-chat-sidebar-header p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight">Messages</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="vibe-chat-icon-btn p-2 transition-colors"
              title="Créer un groupe"
            >
              <Users className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Privé
            </span>
          </div>
        </div>

        {/* User Search Bar */}
        <div className="vibe-chat-search-bar p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Rechercher un membre (@nom)..."
              className="vibe-chat-search-input w-full py-2 pl-9 pr-8 rounded-2xl text-xs focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchingUsers(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Loader pendant la recherche */}
          {isSearchingUsers && (
            <div className="vibe-chat-modal-content mt-2 p-3 rounded-2xl text-center text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black dark:text-white" />
              <span>Recherche des membres...</span>
            </div>
          )}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && !isSearchingUsers && (
            <div className="vibe-chat-modal-content mt-2 divide-y divide-zinc-200 dark:divide-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartConversationWith(u)}
                  className="vibe-chat-menu-item w-full p-2.5 flex items-center gap-3 cursor-pointer transition-colors text-left"
                >
                  <ProfileAvatar
                    src={u.avatar_url}
                    alt={u.username}
                    fallbackName={u.username}
                    size="sm"
                    className="border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-black dark:text-white truncate">{u.display_name || u.username}</span>
                      <VerifiedBadge isVerified={u.is_verified} tier={u.tier} size="xs" />
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearchingUsers && (
            <div className="vibe-chat-modal-content mt-2 p-4 rounded-2xl text-center text-xs text-zinc-500">
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">Aucun résultat</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">Aucun compte trouvé pour « {searchQuery} »</p>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
              <span>Chargement des conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-700" />
              <p className="text-xs">Aucun message direct pour le moment.</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600">Recherchez un utilisateur ci-dessus pour engager la conversation.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activePartnerId === conv.partner_id;
              const hasDraft = dmDraftKeys.includes(dmDraftKey(conv.partner_id));
              const BookIcon = conv.is_book ? getBookIcon(conv.book_icon || 'BookHeart') : null;
              return (
                <div
                  key={conv.partner_id}
                  onClick={() => handleSelectConversation(conv)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleSelectConversation(conv);
                    setConvMenuOpen(true);
                  }}
                  className={`vibe-chat-conv-item p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'active' : ''
                  }`}
                >
                  {conv.is_book && BookIcon ? (
                    <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <BookIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </span>
                  ) : (
                    <ProfileAvatar
                      src={conv.partner_avatar_url}
                      alt={conv.partner_username}
                      fallbackName={conv.is_group ? '#' : conv.partner_username}
                      size="md"
                      className="border border-zinc-200 dark:border-zinc-800 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-black dark:text-white truncate flex items-center gap-1.5">
                        {conv.is_book ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-500 shrink-0 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" /> Livre
                          </span>
                        ) : conv.is_group ? <Users className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> : null}
                        <span className="truncate">
                          {conv.custom_name || conv.partner_display_name || conv.partner_username}
                          {!conv.is_group && conv.custom_name && <span className="ml-1 text-[10px] text-zinc-500 font-normal">@{conv.partner_username}</span>}
                        </span>
                        {conv.is_group && !conv.is_book && Boolean(conv.members?.length) && (
                          <span className="text-[10px] text-zinc-500 font-normal shrink-0">({conv.members!.length + 1})</span>
                        )}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs opacity-70 truncate mt-0.5">{conv.last_message_content || 'Nouveau message'}</p>
                    {hasDraft && (
                      <span className="mt-0.5 inline-block px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500">
                        Brouillon
                      </span>
                    )}
                  </div>
                  {conv.is_blocked && (
                    <span title="Utilisateur bloqué"><Ban className="w-3.5 h-3.5 text-zinc-500 shrink-0" /></span>
                  )}
                  {Boolean(conv.unread_count && conv.unread_count > 0 && String(conv.partner_id) !== String(activePartnerId)) && (
                    <span className="vibe-chat-badge-unread w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 animate-pulse">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Chat */}
      <div className={`vibe-chat-main flex-1 flex flex-col ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Chat Top Header */}
            <div className="vibe-chat-header px-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePartnerId(null)}
                  className="vibe-chat-icon-btn md:hidden p-1.5"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {isBookConv ? (
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {(() => {
                      const HeaderBookIcon = getBookIcon(activeConv?.book_icon || 'BookHeart');
                      return <HeaderBookIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
                    })()}
                  </span>
                ) : (
                  <ProfileAvatar
                    src={activePartner.avatar_url}
                    alt="Avatar"
                    fallbackName={isGroupConv ? '#' : activePartner.username}
                    size="sm"
                    className="border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                )}
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                    {isBookConv ? <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> : isGroupConv ? <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> : null}
                    {isBookConv && bookId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/books/${bookId}`)}
                        className="hover:underline underline-offset-2"
                        title="Ouvrir le Livre"
                      >
                        {activePartner.display_name || activePartner.username}
                      </button>
                    ) : (
                      <span>{activeConv?.custom_name || activePartner.display_name || activePartner.username}</span>
                    )}
                    {!isGroupConv && activeConv?.custom_name && <span className="text-[10px] text-zinc-500 font-normal">(@{activePartner.username})</span>}
                    {!isGroupConv && <VerifiedBadge isVerified={(activePartner as any).is_verified} tier={(activePartner as any).tier} size="xs" />}
                    {isGroupConv && !isBookConv && (
                      <span className="text-[10px] text-zinc-500 font-normal">
                        {((activeConv?.members || []) as any[]).length > 0
                          ? `· ${((activeConv?.members || []) as any[]).length} membre${((activeConv?.members || []) as any[]).length > 1 ? 's' : ''}`
                          : '· groupe'}
                      </span>
                    )}
                    {isBookConv && (
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-500 shrink-0">
                        Livre
                      </span>
                    )}
                    {activePartnerBlocked && (
                      <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> Bloqué
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {isBookConv
                      ? 'Conversation du Livre · « / » pour joindre une publication'
                      : isGroupConv
                      ? `${((activeConv?.members || []) as any[]).map((mm: any) => '@' + mm.username).slice(0, 3).join(' ')}${((activeConv?.members || []) as any[]).length > 3 ? '…' : ''}`
                      : `@${activePartner.username}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Recherche dans la conversation */}
                {convSearchOpen ? (
                  <div className="flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-900 px-2 py-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      value={convSearchQuery}
                      onChange={(e) => {
                        setConvSearchQuery(e.target.value);
                        setConvSearchIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setConvSearchOpen(false);
                          setConvSearchQuery('');
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setConvSearchIndex((i) => i + 1);
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setConvSearchIndex((i) => Math.max(0, i - 1));
                        }
                      }}
                      autoFocus
                      placeholder="Filtrer…"
                      className="w-28 sm:w-40 bg-transparent text-xs text-black dark:text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setConvSearchOpen(false);
                        setConvSearchQuery('');
                      }}
                      className="text-zinc-500 hover:text-black dark:hover:text-white"
                      title="Fermer la recherche"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConvSearchOpen(true)}
                    className="vibe-chat-icon-btn p-2 transition-colors"
                    title="Rechercher dans la conversation"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setThemeModalOpen(true)}
                  className="vibe-chat-icon-btn p-2 transition-colors"
                  title="Personnaliser les couleurs et le fond de discussion"
                >
                  <Palette className="w-4 h-4" />
                </button>

                {/* Menu modération de la conversation */}
                <div className="relative">
                  <button
                    onClick={() => setConvMenuOpen(!convMenuOpen)}
                    className="vibe-chat-icon-btn p-2 transition-colors"
                    title="Options de la conversation"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                {convMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setConvMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 z-30 p-1.5 rounded-2xl vibe-menu shadow-2xl animate-fadeIn">
                      {isBookConv && bookId && (
                        <button
                          onClick={() => {
                            setConvMenuOpen(false);
                            navigate(`/books/${bookId}`);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Ouvrir le Livre
                        </button>
                      )}
                      {isGroupConv && !isBookConv && groupIsAdmin && (
                        <button
                          onClick={() => setAddMembersOpen(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Ajouter des membres
                        </button>
                      )}
                      {isGroupConv && !isBookConv && (
                        <button
                          onClick={() => {
                            setGroupNameDraft(activeConv?.partner_display_name || activeConv?.partner_username || '');
                            setGroupInfoOpen(true);
                            setConvMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                        >
                          <Info className="w-3.5 h-3.5" /> Infos du groupe
                        </button>
                      )}
                      {isGroupConv && !isBookConv && (
                        <>
                          <div className="px-3 pt-1 pb-0.5 text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                            Membres
                          </div>
                          {groupMembers.map((mm) => (
                            <div
                              key={mm.user_id}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-left"
                            >
                              <ProfileAvatar src={mm.avatar_url} alt={mm.username} fallbackName={mm.username} size="xs" />
                              <span className="truncate flex-1">@{mm.username}</span>
                              {mm.role === 'admin' && <span className="text-[9px] font-bold text-zinc-400">admin</span>}
                              {groupIsAdmin && mm.role !== 'admin' && String(mm.user_id) !== String(user?.id) && (
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleTransferAdmin(mm.user_id)}
                                    className="text-amber-500 hover:text-amber-400"
                                    title="Nommer administrateur"
                                  >
                                    <Crown className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleRemoveMember(String(mm.user_id))} className="text-red-500 hover:text-red-400" title="Retirer du groupe">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              )}
                            </div>
                          ))}
                          <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                        </>
                      )}
                      {!isGroupConv && (
                        <button
                          onClick={handleMarkUnread}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                        >
                          <Mail className="w-3.5 h-3.5" /> Marquer comme non lu
                        </button>
                      )}
                      {!isBookConv && (
                        <button
                          onClick={() => setRenameModalOpen(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Renommer la conversation
                        </button>
                      )}
                      {!isGroupConv && (
                        <button
                          onClick={handleBlockPartner}
                          disabled={isModerating}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left disabled:opacity-40"
                        >
                          <Ban className="w-3.5 h-3.5" /> {activePartnerBlocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur'}
                        </button>
                      )}
                      {!isGroupConv && (
                        <button
                          onClick={() => setReportModalOpen(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-amber-500 hover:bg-amber-500/10 text-left"
                        >
                          <Flag className="w-3.5 h-3.5" /> Signaler la conversation
                        </button>
                      )}
                      {!isGroupConv && (
                        <>
                          <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                          <button
                            onClick={handleDeleteConversation}
                            disabled={isModerating}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 text-left disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer la conversation
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="m-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bandeau utilisateur bloqué */}
            {activePartnerBlocked && (
              <div className="vibe-chat-banner m-3 p-3 text-xs flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Vous avez bloqué <strong>@{activePartner.username}</strong>. Vous ne pouvez plus échanger de messages.
                  Débloquez-le depuis le menu <strong>⋮</strong> en haut à droite.
                </span>
              </div>
            )}

            {/* Indicateur de frappe du partenaire (temps réel) */}
            {partnerTyping && !activePartnerBlocked && (
              <div className="px-4 pt-1.5 pb-0.5 flex items-center gap-2 animate-fadeIn" aria-live="polite">
                <div className="vibe-chat-typing flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    @{activePartner?.username} est en train d'écrire…
                  </span>
                </div>
              </div>
            )}

            {/* Bannière messages épinglés (repliable) */}
            {pinnedMessages.length > 0 && (
              <div className="mx-3 mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                <button
                  onClick={() => setPinsCollapsed(!pinsCollapsed)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>📌 Messages épinglés ({pinnedMessages.length})</span>
                  <span className="ml-auto text-zinc-400">{pinsCollapsed ? '▸' : '▾'}</span>
                </button>
                {!pinsCollapsed && (
                  <div className="px-3 pb-2 space-y-1">
                    {pinnedMessages.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPinsCollapsed(true);
                          scrollToMessage(String(p.id));
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        title="Aller au message"
                      >
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                          {String(p.content || '').slice(0, 40) || '(média)'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Thread */}
            <div
              ref={threadRef}
              className="vibe-chat-thread relative flex-1 p-4 space-y-3 overflow-y-auto"
              style={{
                background: chatBackgroundTheme === 'default' ? undefined : CHAT_BACKGROUND_THEMES[chatBackgroundTheme]?.style,
                maxHeight: 'calc(100dvh - 140px - var(--vibe-kb-offset, 0px))',
              }}
            >
              {(() => {
                const q = convSearchOpen ? convSearchQuery.trim() : '';
                if (!q) return null;
                const local = messages.filter((m) => m.content.includes(q));
                const combined = [...local, ...convSearchApiResults];
                if (combined.length === 0) {
                  return (
                    <p className="text-center text-[11px] text-zinc-500 py-2">
                      Aucun message contenant « {q} »
                    </p>
                  );
                }
                const active = combined[Math.min(convSearchIndex, combined.length - 1)];
                return (
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] shadow-lg w-fit mx-auto">
                    <span>{Math.min(convSearchIndex + 1, combined.length)}/{combined.length} résultat(s)</span>
                    <button
                      onClick={() => {
                        const next = Math.max(0, convSearchIndex - 1);
                        setConvSearchIndex(next);
                        scrollToMessage(String(combined[next]?.id));
                      }}
                      className="px-1 font-bold"
                      title="Résultat précédent (↑)"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => {
                        const next = Math.min(combined.length - 1, convSearchIndex + 1);
                        setConvSearchIndex(next);
                        scrollToMessage(String(combined[next]?.id));
                      }}
                      className="px-1 font-bold"
                      title="Résultat suivant (↓)"
                    >
                      ↓
                    </button>
                    {active && (
                      <button
                        onClick={() => scrollToMessage(String(active.id))}
                        className="underline underline-offset-2"
                      >
                        Voir
                      </button>
                    )}
                  </div>
                );
              })()}
              {messages.map((m) => {
                const isMe = user && (String(m.sender_id) === String(user.id) || m.sender_username === user.username);
                // Contenu riche (HTML de l'éditeur) ou texte brut historique
                const richMsg = isRichHtml(m.content);
                const plainSrc = richMsg ? htmlToPlainText(m.content) : m.content;
                // Liens markdown [label](url) : rendus inline par RichContent, pas en média
                const mdLinkRe = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
                const hasMdLinks = !richMsg && mdLinkRe.test(m.content);
                const contentForMedia = richMsg ? plainSrc : m.content.replace(mdLinkRe, ' ');
                // Extract possible media URLs inside message (hors liens markdown)
                const urls = contentForMedia.match(/https?:\/\/[^\s]+/g) || [];
                const nonUrlText = contentForMedia.replace(/https?:\/\/[^\s]+/g, '').trim();
                // HTML sans les URLs média en texte (les <a href> restent intacts)
                const richSource = richMsg && urls.length > 0 ? stripUrlsFromHtml(m.content) : m.content;
                const isMediaOnly = urls.length > 0 && !nonUrlText && !hasMdLinks && !(m as any).reply_to_content;
                const canEdit = isMe && !String(m.id).startsWith('temp') && (currentTimestamp - new Date(m.created_at).getTime()) <= 60 * 60 * 1000;

                const currentThemeConfig = MESSAGE_BUBBLE_THEMES[messageBubbleTheme] || MESSAGE_BUBBLE_THEMES.monochrome;
                const currentShapeConfig = MESSAGE_BUBBLE_SHAPES[messageBubbleShape] || MESSAGE_BUBBLE_SHAPES.pill;

                const isFirstUnread = firstUnreadId != null && String(m.id) === String(firstUnreadId);
                const searchQ = convSearchOpen ? convSearchQuery.trim() : '';
                const matchesSearch = searchQ ? plainSrc.includes(searchQ) : false;
                // Groupe : affiche le pseudo de l'expéditeur + surligne les mentions urgentes
                const isUrgent = isGroupConv && Array.isArray((m as any).urgent_mentions) && (m as any).urgent_mentions.length > 0;
                return (
                  <React.Fragment key={m.id}>
                    {/* Mention urgente (@tous / @user) : bandeau au-dessus du message */}
                    {isUrgent && (
                      <div className="flex justify-center my-0.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[9px] font-bold uppercase tracking-wide">
                          <BellRing className="w-2.5 h-2.5" />
                          Mention urgente — {((m as any).urgent_mentions || []).join(', ')}
                        </span>
                      </div>
                    )}
                    {/* Groupe : nom de l'expéditeur au-dessus des bulles des autres */}
                    {isGroupConv && !isMe && (
                      <span className="text-[10px] font-bold text-zinc-500 px-1 mb-0.5">
                        @{m.sender_username || 'membre'}
                      </span>
                    )}
                    {/* Séparateur « Non lus » (style WhatsApp) */}
                    {isFirstUnread && (
                      <div className="flex items-center gap-2 py-1" aria-label="Messages non lus">
                        <div className="flex-1 h-px bg-red-500/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                          Non lus
                        </span>
                        <div className="flex-1 h-px bg-red-500/70" />
                      </div>
                    )}
                  <div
                    key={m.id}
                    ref={(el) => {
                      if (el) messageRefs.current.set(String(m.id), el);
                      else messageRefs.current.delete(String(m.id));
                    }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative my-1 group ${matchesSearch ? 'rounded-2xl ring-1 ring-yellow-400/60' : ''} ${highlightedMessageId === String(m.id) ? 'rounded-2xl ring-2 ring-sky-400/70 bg-sky-500/10 px-1' : ''} ${animationsEnabled ? 'animate-messageIn' : ''}`}
                  >
                    {/* Ligne de message avec le bouton d'actions parfaitement aligné */}
                    <div className={`flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Bulle du message */}
                      {isMediaOnly ? (
                        <div
                          className={`vibe-msg-media-bubble relative overflow-hidden shadow-sm ${
                            isMe ? currentShapeConfig.meRadius : currentShapeConfig.partnerRadius
                          }`}
                        >
                          {urls.map((url, i) => {
                            const isVid = url.includes('.mp4') || url.includes('.webm') || url.includes('video');
                            const isImage = /\.(png|jpe?g|webp|gif|svg|bmp)(\?|#|$)/i.test(url);
                            if (isVid) {
                              return <video key={i} src={url} controls className="rounded-2xl max-h-64 w-full object-cover" />;
                            }
                            if (!isImage) {
                              const fileName = (() => {
                                try {
                                  return decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');
                                } catch {
                                  return 'Document';
                                }
                              })();
                              return (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors max-w-[240px]"
                                >
                                  <FileText className="w-6 h-6 shrink-0" />
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-bold truncate">{fileName}</span>
                                    <span className="block text-[10px] opacity-70">Ouvrir le document</span>
                                  </span>
                                </a>
                              );
                            }
                            return <img key={i} src={url} alt="Pièce jointe" className="rounded-2xl max-h-64 w-full object-cover" />;
                          })}
                        </div>
                      ) : (
                        <div
                          style={
                            isMe && currentThemeConfig.id !== 'monochrome'
                              ? {
                                  background: currentThemeConfig.gradient,
                                  border: currentThemeConfig.border,
                                }
                              : undefined
                          }
                          className={`p-3 text-xs leading-relaxed relative shadow-sm min-w-[70px] ${
                            isMe
                              ? `${currentShapeConfig.meRadius} ${
                                  currentThemeConfig.id === 'monochrome'
                                    ? 'vibe-msg-bubble-me-mono'
                                    : currentThemeConfig.textColor === 'light'
                                    ? 'vibe-msg-text-light'
                                    : currentThemeConfig.textColor === 'dark'
                                    ? 'vibe-msg-text-dark'
                                    : 'vibe-msg-text-adaptive'
                                } font-medium`
                              : `${currentShapeConfig.partnerRadius} vibe-msg-bubble-partner`
                          }`}
                        >
                          {/* Attribution d'un message transféré */}
                          {(m as any).forwarded_from?.username && (
                            <p className="text-[10px] font-semibold opacity-70 mb-1.5 flex items-center gap-1">
                              <Forward className="w-3 h-3 shrink-0" />
                              Transféré de @{(m as any).forwarded_from.username}
                            </p>
                          )}

                          {/* Citation du message auquel on répond */}
                          {(m as any).reply_to_content && (
                            <div
                              className={`mb-2 p-2 rounded-xl text-left border-l-4 transition-colors ${
                                isMe
                                  ? currentThemeConfig.id !== 'monochrome'
                                    ? 'vibe-msg-quote-gradient'
                                    : 'vibe-msg-quote-me-mono'
                                  : 'vibe-msg-quote-partner'
                              }`}
                            >
                              <p className="text-[10px] font-bold flex items-center gap-1 opacity-90 truncate">
                                <Reply className="w-3 h-3 shrink-0" />
                                <span>@{(m as any).reply_to_username || 'message'}</span>
                              </p>
                              <p className="text-[10px] opacity-90 truncate max-w-[240px] mt-0.5">
                                {htmlToPlainText((m as any).reply_to_content)}
                              </p>
                            </div>
                          )}

                          {/* Publication du Livre jointe (carte cliquable) */}
                          {(m as DirectMessage).attached_post && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/post/${(m as DirectMessage).attached_post!.id}`);
                              }}
                              className="w-full mb-2 p-2 rounded-xl text-left bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-start gap-2"
                              title="Ouvrir la publication"
                            >
                              <ProfileAvatar
                                src={(m as DirectMessage).attached_post!.avatar_url || undefined}
                                alt={(m as DirectMessage).attached_post!.username}
                                fallbackName={(m as DirectMessage).attached_post!.username}
                                size="xs"
                                className="shrink-0"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[10px] font-bold truncate">
                                  @{(m as DirectMessage).attached_post!.username} · Publication du Livre
                                </span>
                                <span className="block text-[10px] opacity-80 truncate max-w-[240px]">
                                  {(m as DirectMessage).attached_post!.excerpt}
                                </span>
                              </span>
                            </button>
                          )}

                          {nonUrlText && (matchesSearch && searchQ ? (
                            <p className="leading-relaxed break-words">{highlightMatches(nonUrlText, searchQ)}</p>
                          ) : (
                            <RichContent
                              content={richMsg ? richSource : hasMdLinks ? m.content : nonUrlText}
                              className="leading-relaxed"
                            />
                          ))}

                          {urls.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {urls.map((url, i) => {
                                const isVid = url.includes('.mp4') || url.includes('.webm') || url.includes('video');
                                const isImage = /\.(png|jpe?g|webp|gif|svg|bmp)(\?|#|$)/i.test(url);
                                if (isVid) {
                                  return <video key={i} src={url} controls className="rounded-xl max-h-48 w-full object-cover" />;
                                }
                                if (!isImage) {
                                  const fileName = (() => {
                                    try {
                                      return decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');
                                    } catch {
                                      return 'Document';
                                    }
                                  })();
                                  return (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors max-w-[240px]"
                                    >
                                      <FileText className="w-6 h-6 shrink-0" />
                                      <span className="min-w-0">
                                        <span className="block text-[11px] font-bold truncate">{fileName}</span>
                                        <span className="block text-[10px] opacity-70">Ouvrir le document</span>
                                      </span>
                                    </a>
                                  );
                                }
                                return <img key={i} src={url} alt="Pièce jointe" className="rounded-xl max-h-48 w-full object-cover" />;
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bouton d'options (⋮) : centré verticalement, apparaît au survol sans décaler la page */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTranslatePickerFor(null);
                            setActionMenuFor(actionMenuFor === m.id ? null : m.id);
                          }}
                          className="vibe-chat-icon-btn p-1.5 transition-colors"
                          title="Options du message"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Menu d'actions flottant au-dessus du message avec backdrop click-outside */}
                    {actionMenuFor === m.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActionMenuFor(null)}
                        />
                        <div
                          className={`absolute z-40 bottom-full ${
                            isMe ? 'right-0' : 'left-0'
                          } mb-2 p-1.5 rounded-2xl vibe-menu shadow-2xl flex flex-col gap-0.5 animate-fadeIn min-w-[210px]`}
                        >
                          <div className="flex items-center justify-between px-1.5 py-1">
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(m, emoji)}
                                className="p-1 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-base transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-0.5" />

                          {/* Option Modifier le message (limite 60 min) */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(m);
                                setActionMenuFor(null);
                                requestAnimationFrame(() => {
                                  richInputRef.current?.setHTML(m.content);
                                  richInputRef.current?.focus();
                                });
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                            >
                              <Pencil className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Modifier le message
                            </button>
                          )}

                          {/* Option Informations */}
                          <button
                            type="button"
                            onClick={() => {
                              setInfoModalMessage(m);
                              setActionMenuFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Info className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Informations
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyTo(m);
                              setActionMenuFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Reply className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Répondre
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setForwardingMessage(m);
                              setActionMenuFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Forward className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Transférer
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Copier le message
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMessageLink(m)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Link2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Copier le lien du message
                          </button>

                          <button
                            type="button"
                            onClick={() => setTranslatePickerFor(translatePickerFor === String(m.id) ? null : String(m.id))}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            <Languages className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            Traduire
                            <span className="ml-auto text-[9px] text-zinc-400 font-mono">
                              {translateLang || browserToDeepLCode(navigator.language || 'fr-FR')}
                            </span>
                          </button>
                          {translatePickerFor === String(m.id) && (
                            <div className="max-h-44 overflow-y-auto border-t border-zinc-200 dark:border-zinc-800 pt-1 pl-2">
                              {TRANSLATION_LANGUAGES.map((lg) => (
                                <button
                                  key={lg.code}
                                  type="button"
                                  onClick={() => handleTranslateMessage(m, lg.code)}
                                  className="w-full text-left px-3 py-1 rounded-lg text-[10px] text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-800/60 transition-colors"
                                >
                                  {lg.label}
                                </button>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTogglePin(m)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                          >
                            {pinnedMessages.some((p) => String(p.id) === String(m.id)) ? (
                              <><PinOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Désépingler</>
                            ) : (
                              <><Pin className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Épingler</>
                            )}
                          </button>

                          {isMe && !String(m.id).startsWith('temp') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(m)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer pour tout le monde
                            </button>
                          )}

                          {!String(m.id).startsWith('temp') && (
                            <button
                              type="button"
                              onClick={() => handleHideMessage(m)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <X className="w-3.5 h-3.5" /> Supprimer pour moi
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Réactions affichées sous la bulle */}
                    {Array.isArray((m as any).reactions) && (m as any).reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {(m as any).reactions.map((r: { emoji: string; count: number; mine: boolean }) => (
                          <motion.button
                            whileTap={animationsEnabled ? { scale: 0.8 } : undefined}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            key={r.emoji}
                            onClick={() => handleToggleReaction(m, r.emoji)}
                            className={`vibe-chat-reaction-chip px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${animationsEnabled ? 'animate-reactionPop' : ''} ${
                              r.mine ? 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-300' : ''
                            }`}
                          >
                            {r.emoji} {r.count}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Traduction mAI sous la bulle originale */}
                    {translations[m.id] && (
                      <div className="max-w-[85%] sm:max-w-[75%] mt-1 pl-2 border-l-2 border-zinc-300 dark:border-zinc-700">
                        <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
                          {translations[m.id]}
                        </p>
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                          Traduit avec mAI
                        </p>
                      </div>
                    )}
                    {translatingIds.has(String(m.id)) && (
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Traduction…
                      </p>
                    )}
                    {/* Badge envoi programmé */}
                    {(m as any).status === 'scheduled' && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Clock className="w-2.5 h-2.5" />
                        Envoi prévu{(m as any).send_at ? ` le ${formatTime((m as any).send_at)}` : ''}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 px-1 font-mono">
                      <span>{formatTime(m.created_at)}</span>
                      {m.is_edited && (
                        <span className="text-[9px] text-zinc-400 italic" title={m.edited_at ? `Modifié à ${formatTime(m.edited_at)}` : 'Modifié'}>
                          (modifié)
                        </span>
                      )}
                      {isMe && (
                        (m.is_read || (m as any).read_at) ? (
                          <span title="Vu" className="inline-flex items-center gap-0.5 text-sky-400 font-medium">
                            <Eye className="w-3 h-3" />
                            <span className="text-[9px]">Vu</span>
                          </span>
                        ) : (
                          <span title="Envoyé" className="inline-flex items-center gap-0.5 text-zinc-400">
                            <Check className="w-3 h-3" />
                            <span className="text-[9px]">Envoyé</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />

              {/* Bouton flottant « ↓ N non lus » */}
              {showJumpToUnread && firstUnreadId && (
                <button
                  onClick={() => {
                    scrollToMessage(firstUnreadId);
                    setTimeout(() => setShowJumpToUnread(false), 3000);
                  }}
                  className="sticky bottom-3 ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] font-bold shadow-xl hover:bg-zinc-800 transition-colors w-fit"
                >
                  ↓ Non lus
                </button>
              )}
            </div>

            {/* Attached Multi-Media Preview (images / vidéos / documents, 50 Mo / 1 Go selon forfait) */}
            {attachedMediaList.length > 0 && (
              <div className="vibe-chat-bottom-bar p-3 border-t flex items-center gap-2 overflow-x-auto">
                {attachedMediaList.map((media, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-16 h-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800" />
                    ) : media.type === 'document' ? (
                      <div className="w-40 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-2 overflow-hidden">
                        <FileText className="w-5 h-5 shrink-0 text-zinc-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold truncate">{media.fileName || 'Document'}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{formatFileSize(media.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <img src={media.url} alt="Aperçu" className="w-16 h-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800" />
                    )}
                    <button
                      onClick={() => setAttachedMediaList((prev) => prev.filter((_, i) => i !== idx))}
                      className="vibe-chat-remove-media absolute -top-1 -right-1 p-1 rounded-full shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <span className="text-[11px] text-zinc-500 pl-2">
                  {attachedMediaList.length} fichier(s) (max {mediaLimitLabel})
                </span>
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="vibe-chat-bottom-bar p-3 space-y-2 relative">
              {activePartnerBlocked && (
                <p className="text-center text-[11px] text-zinc-500 py-1">
                  Utilisateur bloqué — l'envoi de messages est désactivé.
                </p>
              )}

              {/* Bandeau d'édition de message */}
              {editingMessage && (
                <div className="vibe-chat-banner flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>
                      Modification du message <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">(limite 60 min)</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(null);
                      richInputRef.current?.clear();
                    }}
                    className="vibe-chat-icon-btn p-1 shrink-0"
                    title="Annuler la modification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Aperçu de réponse */}
              {replyTo && !editingMessage && (
                <div className="vibe-chat-banner flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px]">
                  <span className="truncate">
                    Réponse à <strong>@{replyTo.sender_username}</strong> : {htmlToPlainText(replyTo.content).slice(0, 60)}
                  </span>
                  <button type="button" onClick={() => setReplyTo(null)} className="vibe-chat-icon-btn text-zinc-500 shrink-0 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Publication du Livre jointe (chip retirable, envoyée avec le message) */}
              {attachedPost && !editingMessage && (
                <div className="vibe-chat-banner flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => navigate(`/post/${attachedPost.id}`)}
                    className="flex items-center gap-2 min-w-0 text-left"
                    title="Ouvrir la publication"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Publication de <strong>@{attachedPost.username}</strong> : {attachedPost.excerpt.slice(0, 60)}
                    </span>
                  </button>
                  <button type="button" onClick={() => setAttachedPost(null)} className="vibe-chat-icon-btn text-zinc-500 shrink-0 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {customPresetOpen && !isGeneratingSuggestion && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="vibe-chat-banner flex-1 flex items-center gap-2 px-3 py-1.5">
                    <PenLine className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      value={customPresetText}
                      onChange={(e) => setCustomPresetText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerateSuggestion('custom', customPresetText);
                        }
                      }}
                      autoFocus
                      placeholder="Votre consigne pour mAI (ex. : rends-le plus drôle)…"
                      className="flex-1 bg-transparent text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateSuggestion('custom', customPresetText)}
                    disabled={!customPresetText.trim()}
                    className="vibe-chat-send-btn p-1.5 disabled:opacity-40 shrink-0 shadow"
                    title="Appliquer la consigne"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPresetOpen(false)}
                    className="p-1.5 rounded-full text-zinc-500 hover:text-black dark:hover:text-white shrink-0"
                    title="Annuler"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Programmation de l'envoi */}
              {showSchedule && (
                <div className="flex items-center gap-2 px-1 animate-fadeIn">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-black dark:text-white focus:outline-none"
                  />
                  {scheduledAt && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledAt('');
                        setShowSchedule(false);
                      }}
                      className="text-zinc-500 hover:text-black dark:hover:text-white shrink-0"
                      title="Annuler la programmation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {scheduledAt && !showSchedule && (
                <button
                  type="button"
                  onClick={() => setShowSchedule(true)}
                  className="mx-1 w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
                >
                  <Clock className="w-3 h-3" />
                  Envoi prévu le {new Date(scheduledAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </button>
              )}

              {/* Barre de mise en forme AU-DESSUS de la bulle : gras, italique,
                  souligné, barré, lien, @tous + compteur de caractères */}
              {(!editingMessage || messagePlain.length >= 2400) && (
                <div className="flex items-center gap-0.5 px-1 flex-wrap">
                  {!editingMessage && (
                    <>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('bold')} className="vibe-chat-icon-btn p-1.5" title="Gras (ou **texte**)"><Bold className="w-3.5 h-3.5" /></button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('italic')} className="vibe-chat-icon-btn p-1.5" title="Italique (ou *texte*)"><Italic className="w-3.5 h-3.5" /></button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('underline')} className="vibe-chat-icon-btn p-1.5" title="Souligné"><Underline className="w-3.5 h-3.5" /></button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('strikeThrough')} className="vibe-chat-icon-btn p-1.5" title="Barré"><Strikethrough className="w-3.5 h-3.5" /></button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleInsertLink}
                        className="vibe-chat-icon-btn p-1.5"
                        title="Insérer un lien"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      {isGroupConv && (
                        <>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => richInputRef.current?.insertText('@tous ')}
                            className="ml-1 px-2 py-1 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black text-[10px] font-bold"
                            title="Mentionner tout le groupe (urgent)"
                          >
                            @tous
                          </button>
                          {hasUrgentMention && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold animate-pulse">
                              <BellRing className="w-3 h-3" /> Mention urgente
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {messagePlain.length >= messageCharLimit * 0.8 && (
                    <span className={`ml-auto text-[10px] font-mono ${messagePlain.length > messageCharLimit ? 'text-red-500 font-bold' : 'text-zinc-500'}`}>
                      {messagePlain.length}/{messageCharLimit.toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
              )}

              {/* Autocomplétion @mention (groupes) */}
              {isGroupConv && mentionQuery !== null && mentionSuggestions.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMentionQuery(null)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-2xl vibe-menu p-1.5 shadow-2xl animate-fadeIn max-h-48 overflow-y-auto">
                    {mentionSuggestions.map((mm) => (
                      <button
                        type="button"
                        key={mm.user_id}
                        onClick={() => handleInsertMention(mm.username)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      >
                        <ProfileAvatar src={mm.avatar_url} alt={mm.username} fallbackName={mm.username} size="xs" />
                        <span className="truncate flex-1">@{mm.username}</span>
                        {mm.role === 'admin' && <span className="text-[9px] font-bold text-zinc-400">admin</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Livre : commande « / » → action « Joindre une publication » */}
              {isBookConv && toolQuery !== null && !bookPickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setToolQuery(null)} />
                  <ToolAutocomplete
                    trigger="/"
                    query={`/${toolQuery}`}
                    showTools={false}
                    onSelect={() => {}}
                    onClose={() => setToolQuery(null)}
                    specialAction={{
                      label: '/post',
                      subtitle: 'Joindre une publication du Livre',
                      description: 'Sélectionner une Vibe du Livre (carte cliquable)',
                      onSelect: openBookPostPicker,
                    }}
                  />
                </>
              )}

              {/* Livre : sélecteur des publications du Livre */}
              {bookPickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBookPickerOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-full max-w-md rounded-2xl vibe-menu p-2 shadow-2xl animate-fadeIn">
                    <div className="flex items-center gap-2 px-1 pb-2">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex-1 truncate">
                        Publications du Livre
                      </span>
                      <button type="button" onClick={() => setBookPickerOpen(false)} className="vibe-chat-icon-btn p-1 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={bookPickerQuery}
                      onChange={(e) => setBookPickerQuery(e.target.value)}
                      placeholder="Filtrer par contenu ou @auteur…"
                      className="w-full mb-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-black dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
                      {bookPickerLoading ? (
                        <div className="p-4 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
                        </div>
                      ) : filteredBookPickerPosts.length === 0 ? (
                        <div className="p-4 text-center text-[11px] text-zinc-500">
                          Aucune publication dans ce Livre pour le moment.
                        </div>
                      ) : (
                        filteredBookPickerPosts.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setAttachedPost({
                                id: p.id,
                                username: p.username || 'vibe',
                                excerpt: htmlToPlainText(p.content || '').slice(0, 120),
                                avatar_url: p.avatar_url || null,
                              });
                              setBookPickerOpen(false);
                              setBookPickerQuery('');
                            }}
                            className="w-full flex items-start gap-2 px-2 py-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-zinc-900 transition-colors"
                          >
                            <ProfileAvatar src={p.avatar_url} alt={p.username || 'vibe'} fallbackName={p.username || 'vibe'} size="xs" className="shrink-0 mt-0.5" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold truncate">@{p.username}</span>
                                {p.is_pinned && (
                                  <span className="px-1 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[8px] font-bold text-zinc-500 flex items-center gap-0.5 shrink-0">
                                    <Pin className="w-2 h-2" /> épinglé
                                  </span>
                                )}
                              </span>
                              <span className="block text-[10px] opacity-75 truncate">{htmlToPlainText(p.content || '').slice(0, 100)}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAttachFiles}
                  multiple
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  className="hidden"
                />

                {/* Bouton + séparé à gauche avec menu déroulant */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setPlusMenuOpen((prev) => !prev)}
                    className={`vibe-chat-plus-btn w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      plusMenuOpen ? 'rotate-45 shadow-md' : ''
                    }`}
                    title="Ajouter des médias ou options mAI"
                  >
                    <Plus className="w-5 h-5 transition-transform" />
                  </button>

                  {/* Menu déroulant du bouton + */}
                  {plusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2.5 z-50 w-64 rounded-3xl vibe-menu p-2 shadow-2xl animate-fadeIn space-y-1">
                        {/* Importer fichiers / photos */}
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                          disabled={isUploading}
                          className="vibe-chat-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors text-left"
                        >
                          <div className="vibe-chat-modal-card p-2 rounded-xl shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">Importer photos & vidéos</p>
                            <p className="text-[10px] text-zinc-500">Jusqu'à {mediaLimitLabel} de médias au total</p>
                          </div>
                        </button>

                        <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                        {/* Presets mAI (1-1 et groupes) */}
                        <div className="px-3 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-zinc-700 dark:text-white" />
                          <span>Assistant mAI</span>
                        </div>
                        {PRESET_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setPlusMenuOpen(false);
                              handleGenerateSuggestion(opt.key);
                            }}
                            disabled={!messagePlain.trim() && opt.key !== 'custom'}
                            className="vibe-chat-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors text-left disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <span className="text-zinc-500 dark:text-zinc-400">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Bulle de message ronde et séparée du reste avec bouton de dictée à l'intérieur */}
                <div className="vibe-chat-input-pill flex-1 flex items-end px-4 py-1.5 min-w-0">
                  <MessageRichInput
                    ref={richInputRef}
                    placeholder={
                      isListening
                        ? 'Parlez, dictée en cours...'
                        : editingMessage
                        ? 'Modifier votre message...'
                        : 'Écrire un message...'
                    }
                    maxChars={messageCharLimit}
                    disabled={activePartnerBlocked}
                    onChange={handleRichInputChange}
                    onUserInput={notifyTyping}
                    onEnterSend={() => {
                      if (!activePartnerBlocked && !isSending) handleSendMessage();
                    }}
                    className="flex-1 min-w-0 py-1 text-xs max-h-32 overflow-y-auto whitespace-pre-wrap break-words"
                  />

                  {/* Bouton de dictée DANS la bulle de message */}
                  {isSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`p-1.5 rounded-full transition-colors ml-1.5 shrink-0 ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'vibe-chat-icon-btn'
                      }`}
                      title={isListening ? 'Arrêter la dictée' : 'Dicter le message'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Envoi programmé (horloge) : visible si texte ou média, hors groupes */}
                {(messagePlain.trim() || attachedMediaList.length > 0) && !activePartnerBlocked && !editingMessage && !isGroupConv && (
                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      showSchedule || scheduledAt
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                        : 'vibe-chat-icon-btn'
                    }`}
                    title="Programmer l'envoi"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                {/* Bouton d'envoi séparé : flèche allant vers le haut (ArrowUp) */}
                <motion.button
                  type="submit"
                  whileTap={animationsEnabled ? { scale: 0.85 } : undefined}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  disabled={activePartnerBlocked || (!messagePlain.trim() && attachedMediaList.length === 0) || isSending || messagePlain.length > messageCharLimit}
                  className={`vibe-chat-send-btn w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow cursor-pointer ${justSent ? 'just-sent animate-pop' : ''}`}
                  title={editingMessage ? 'Enregistrer la modification' : 'Envoyer le message'}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : justSent ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  )}
                </motion.button>
              </div>
            </form>

            {/* Modale de renommage de conversation */}
            <RenameConversationModal
              open={renameModalOpen}
              initialValue={activeConv?.custom_name || ''}
              fallbackName={activePartner?.display_name || activePartner?.username}
              busy={isModerating}
              onClose={() => setRenameModalOpen(false)}
              onSave={handleRenameConversation}
            />

            {/* Modale de signalement */}
            <ReportConversationModal
              open={reportModalOpen}
              username={activePartner?.username}
              busy={isModerating}
              onClose={() => setReportModalOpen(false)}
              onSubmit={handleReportConversation}
            />

            {/* Modale d'informations et de gestion du groupe */}
            {groupInfoOpen && isGroupConv && groupId && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
                onClick={() => setGroupInfoOpen(false)}
              >
                <div
                  className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-4 animate-scaleUp text-zinc-900 dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <h3 className="text-sm font-bold">Infos du groupe</h3>
                    </div>
                    <button type="button" onClick={() => setGroupInfoOpen(false)} className="vibe-chat-icon-btn p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Photo du groupe */}
                  <div className="flex flex-col items-center gap-2">
                    <ProfileAvatar
                      src={(activeGroupInfo as any)?.group_avatar_url || activeConv?.partner_avatar_url}
                      alt={activeConv?.partner_username || 'Groupe'}
                      fallbackName={activeConv?.partner_display_name || activeConv?.partner_username || 'Groupe'}
                      size="lg"
                    />
                    <input
                      type="file"
                      ref={groupAvatarInputRef}
                      onChange={handleGroupAvatarSelected}
                      accept="image/*"
                      className="hidden"
                    />
                    {groupIsAdmin && (
                      <button
                        type="button"
                        onClick={() => groupAvatarInputRef.current?.click()}
                        disabled={groupAvatarUploading}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-40 flex items-center gap-1"
                      >
                        {groupAvatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                        {groupAvatarUploading ? 'Envoi…' : 'Changer la photo'}
                      </button>
                    )}
                  </div>

                  {/* Nom du groupe */}
                  {groupIsAdmin ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={groupNameDraft}
                        onChange={(e) => setGroupNameDraft(e.target.value)}
                        maxLength={100}
                        placeholder="Nom du groupe"
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none focus:border-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGroupName}
                        disabled={groupSaving || !groupNameDraft.trim()}
                        className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                      >
                        {groupSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-sm font-bold">{activeConv?.partner_display_name || activeConv?.partner_username || 'Groupe'}</p>
                  )}

                  {/* Membres + rôles + administration */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-1">
                      Membres ({groupMembers.length})
                    </p>
                    <div className="max-h-44 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      {groupMembers.map((mm) => (
                        <div key={mm.user_id} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                          <ProfileAvatar src={mm.avatar_url} alt={mm.username} fallbackName={mm.username} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">@{mm.username}</p>
                            {mm.display_name && <p className="truncate text-[10px] text-zinc-500">{mm.display_name}</p>}
                          </div>
                          {mm.role === 'admin' && <span className="text-[9px] font-bold text-zinc-400 shrink-0">admin</span>}
                          {groupIsAdmin && String(mm.user_id) !== String(user?.id) && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTransferAdmin(mm.user_id)}
                                className="text-sky-600 dark:text-sky-400 hover:underline text-[10px] font-semibold"
                                title="Transférer le rôle d'administrateur"
                              >
                                Transférer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(String(mm.user_id))}
                                className="text-red-500 hover:text-red-400"
                                title="Exclure du groupe"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions quitter / supprimer */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-1">
                    {groupIsAdmin ? (
                      <button
                        type="button"
                        onClick={handleDeleteGroup}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer le groupe
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setGroupInfoOpen(false);
                          if (user?.id) handleRemoveMember(String(user.id));
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Quitter le groupe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modale de transfert */}
            {forwardingMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setForwardingMessage(null)}>
                <div className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-4 space-y-3 animate-scaleUp text-zinc-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Transférer le message</h3>
                    <button onClick={() => setForwardingMessage(null)} className="vibe-chat-icon-btn p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 truncate">
                    {forwardingMessage.content.slice(0, 120)}
                  </p>
                  <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    {conversations.length === 0 && (
                      <p className="p-4 text-center text-xs text-zinc-500">Aucune conversation disponible.</p>
                    )}
                    {conversations.map((conv) => (
                      <button
                        key={conv.partner_id}
                        onClick={() => handleForwardTo(conv)}
                        className="vibe-chat-menu-item w-full p-3 flex items-center gap-3 transition-colors text-left"
                      >
                        <ProfileAvatar
                          src={conv.partner_avatar_url}
                          alt={conv.partner_username}
                          fallbackName={conv.partner_username}
                          size="sm"
                          className="border border-zinc-200 dark:border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{conv.partner_display_name || conv.partner_username}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">@{conv.partner_username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modale d'informations sur le message */}
            <MessageInfoModal message={infoModalMessage} onClose={() => setInfoModalMessage(null)} />

            {/* Modale de personnalisation du thème de discussion */}
            {themeModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
                onClick={() => setThemeModalOpen(false)}
              >
                <div
                  className="w-full max-w-md vibe-chat-modal-content rounded-3xl p-5 space-y-4 animate-scaleUp text-zinc-900 dark:text-white max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-zinc-900 dark:text-white" />
                      <h3 className="text-sm font-bold">Personnaliser la discussion</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setThemeModalOpen(false)}
                      className="vibe-chat-icon-btn p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Section 1 : Couleur ou Dégradé des bulles envoyées */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>Bulle des messages envoyés</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(MESSAGE_BUBBLE_THEMES).map((themeOpt) => {
                        const isSelected = messageBubbleTheme === themeOpt.id;
                        return (
                          <button
                            key={themeOpt.id}
                            type="button"
                            onClick={() => setMessageBubbleTheme(themeOpt.id)}
                            className={`vibe-chat-modal-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                              isSelected ? 'selected shadow-md' : ''
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full shrink-0 border border-black/10 dark:border-white/20 shadow-inner"
                              style={{ background: themeOpt.gradient, border: themeOpt.border }}
                            />
                            <span className="text-[11px] font-semibold truncate text-zinc-800 dark:text-zinc-200">
                              {themeOpt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2 : Fond de la zone de messages */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-900">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Fond de la discussion</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(CHAT_BACKGROUND_THEMES).map((bgOpt) => {
                        const isSelected = chatBackgroundTheme === bgOpt.id;
                        return (
                          <button
                            key={bgOpt.id}
                            type="button"
                            onClick={() => setChatBackgroundTheme(bgOpt.id)}
                            className={`vibe-chat-modal-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                              isSelected ? 'selected shadow-md' : ''
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full shrink-0 border border-black/10 dark:border-white/20 ${bgOpt.previewBg}`}
                              style={{ background: bgOpt.style || undefined }}
                            />
                            <span className="text-[11px] font-semibold truncate text-zinc-800 dark:text-zinc-200">
                              {bgOpt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3 : Forme de la bulle */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-900">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Forme de la bulle</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(MESSAGE_BUBBLE_SHAPES) as MessageBubbleShape[]).map((shapeKey) => {
                        const isSelected = messageBubbleShape === shapeKey;
                        const s = MESSAGE_BUBBLE_SHAPES[shapeKey];
                        return (
                          <button
                            key={shapeKey}
                            type="button"
                            onClick={() => setMessageBubbleShape(shapeKey)}
                          className={`vibe-chat-modal-card py-2 px-2 text-center text-[11px] font-semibold transition-all ${
                            isSelected ? 'selected font-bold shadow' : ''
                          }`}
                          >
                            {s.label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setThemeModalOpen(false)}
                      className="vibe-chat-send-btn py-2 px-5 text-xs font-bold transition-colors shadow"
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <Mail className="w-12 h-12 text-zinc-300 dark:text-zinc-800" />
            <h3 className="text-sm font-bold text-black dark:text-white">Sélectionnez une conversation</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
              Communiquez en direct avec les autres membres de la communauté Vibe.
            </p>
          </div>
        )}
      </div>

      {/* Modale : créer un groupe */}
      <CreateGroupModal
        open={groupModalOpen}
        name={groupName}
        onNameChange={setGroupName}
        selected={groupSelected}
        onToggleUser={(u) =>
          setGroupSelected((prev) =>
            prev.some((s) => String(s.id) === String(u.id))
              ? prev.filter((s) => String(s.id) !== String(u.id))
              : [...prev, u]
          )
        }
        busy={isCreatingGroup}
        onClose={() => setGroupModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      {/* Modale : ajouter des membres au groupe (admin) */}
      <AddMembersModal
        open={addMembersOpen}
        selected={addMembersSelected}
        onToggleUser={(u) =>
          setAddMembersSelected((prev) =>
            prev.some((s) => String(s.id) === String(u.id))
              ? prev.filter((s) => String(s.id) !== String(u.id))
              : [...prev, u]
          )
        }
        existingMemberIds={existingGroupMemberIds}
        busy={isCreatingGroup}
        onClose={() => setAddMembersOpen(false)}
        onAdd={handleAddMembers}
      />

      {confirmDialog}
    </div>
  );
};
