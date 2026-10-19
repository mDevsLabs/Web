/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DIRECT MESSAGES (src/pages/MessagesPage.tsx)
 * Private chats with multi-media (50 Mo Free / 1 Go Plus — médias au total), speech & privacy controls
 * ============================================================================
 */

import { MailIcon as Mail } from "@mdevs/icons";
import { Drama, Expand, PenLine, Scissors, Wand2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirmDialog } from "@/components/vibe/common/ConfirmDialog";
import { htmlToPlainText } from "@/components/vibe/common/RichContent";
import { sanitizeRichHtml } from "@/components/vibe/common/richSanitizer";
import {
  AddMembersModal,
  type AttachedMedia,
  type AttachedPostPreview,
  ConversationHeader,
  ConversationList,
  CreateGroupModal,
  dmDraftKey,
  ForwardModal,
  GroupManagementModal,
  MessageComposer,
  MessageInfoModal,
  MessageItem,
  RenameConversationModal,
  ReportConversationModal,
  ThemeModal,
} from "@/components/vibe/messages";
import type { MessageRichInputHandle } from "@/components/vibe/messages/MessageRichInput";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import {
  CHAT_BACKGROUND_THEMES,
  useTheme,
} from "@/lib/vibe/context/ThemeContext";
import { useMotionPrefs } from "@/lib/vibe/hooks/useMotionPrefs";
import { useSpeechRecognition } from "@/lib/vibe/hooks/useSpeechRecognition";
import { ApiService, browserToDeepLCode } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import { RealtimeService } from "@/lib/vibe/services/realtimeService";
import {
  formatMediaLimit,
  getDmCharLimit,
  getMediaBytesLimit,
} from "@/lib/vibe/services/tierLimits";
import type {
  DirectMessage,
  DMConversation,
  VibeBookPost,
} from "@/lib/vibe/types/vibe";
import { toVibeAbsoluteUrl, useNavigate } from "../router";

export const MessagesPage: React.FC<{
  hydration?: import("@/lib/vibe/types/vibe").VibeHydrationSeed<unknown>;
}> = ({ hydration }) => {
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
  const [activePartnerId, setActivePartnerId] = useState<
    string | number | null
  >(null);
  const [activePartner, setActivePartner] = useState<{
    id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  // Texte brut du composeur riche (cap 3 000, mentions, envoi).
  const [messagePlain, setMessagePlain] = useState("");
  const [attachedMediaList, setAttachedMediaList] = useState<AttachedMedia[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const { play: playMotion, animationsEnabled } = useMotionPrefs();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Menu + d'import et options IA
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // Édition de message (limite 60 minutes)
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(
    null
  );

  // Modale Informations de message (date/heure, reçu, lu...)
  const [infoModalMessage, setInfoModalMessage] =
    useState<DirectMessage | null>(null);

  // Modale rapide de thème de discussion
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Interactions par message : réactions, réponse, transfert, copie
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] =
    useState<DirectMessage | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);
  const [customPresetText, setCustomPresetText] = useState("");

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
      return localStorage.getItem("vibe_dm_translate_lang") || "";
    } catch {
      return "";
    }
  });
  const [translatePickerFor, setTranslatePickerFor] = useState<string | null>(
    null
  );
  // Traduction automatique des messages entrants (réglage Paramètres → Messages)
  const [autoTranslateLang, setAutoTranslateLang] = useState<string | null>(
    null
  );
  // Permalien (?conv=<id>&msg=<id>) : scroll + surbrillance temporaire
  const [pendingMsgId, setPendingMsgId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  // Modale de gestion du groupe (photo, nom, membres, administration)
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupAvatarUploading, setGroupAvatarUploading] = useState(false);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  // Mentions @ : autocomplétion dans le composeur de groupe
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  // Livre : commande « / » → sélecteur des publications du Livre (carte jointe)
  const [toolQuery, setToolQuery] = useState<string | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [bookPickerQuery, setBookPickerQuery] = useState("");
  const [bookPickerPosts, setBookPickerPosts] = useState<VibeBookPost[]>([]);
  const [bookPickerLoading, setBookPickerLoading] = useState(false);
  const [attachedPost, setAttachedPost] = useState<{
    id: string;
    username: string;
    excerpt: string;
    avatar_url?: string | null;
  } | null>(null);
  // Messages épinglés (bannière, max 3, temps réel via SSE dm_pin_updated)
  const [pinnedMessages, setPinnedMessages] = useState<DirectMessage[]>([]);
  const [pinsCollapsed, setPinsCollapsed] = useState(false);
  // Envoi programmé (datetime-local + badge)
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  // Recherche dans la conversation (filtre local + API si < 3 résultats)
  const [convSearchOpen, setConvSearchOpen] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState("");
  const [convSearchApiResults, setConvSearchApiResults] = useState<
    DirectMessage[]
  >([]);
  const [convSearchIndex, setConvSearchIndex] = useState(0);
  // Séparateur « Non lus » + bouton flottant ↓
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showJumpToUnread, setShowJumpToUnread] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Conversations de groupe (migration 019)
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSelected, setGroupSelected] = useState<
    Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
    }>
  >([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addMembersSelected, setAddMembersSelected] = useState<
    Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
    }>
  >([]);
  // Détails de groupe frais (is_admin fiable dès l'ouverture du menu ⋮)
  const [activeGroupInfo, setActiveGroupInfo] = useState<{
    is_admin: boolean;
    members: Array<{
      user_id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      role: string;
      joined_at?: string;
    }>;
  } | null>(null);
  // Conversation active dérivée de la liste (nom personnalisé, état de blocage…)
  const activeConv =
    conversations.find(
      (c) => String(c.partner_id) === String(activePartnerId)
    ) || null;

  const isGroupConv =
    Boolean(activeConv?.is_group) ||
    String(activePartnerId || "").startsWith("group:");
  const groupId = isGroupConv
    ? String(activePartnerId).replace(/^group:/, "")
    : null;

  // Conversation de Livre : mêmes mécanismes que les groupes + publications
  // du Livre joignables via la commande « / » (carte cliquable).
  const isBookConv = Boolean(isGroupConv && activeConv?.is_book);
  const bookId = isBookConv ? activeConv?.book_id || null : null;
  const navigate = useNavigate();

  // Le nom/photo affichés se resynchronisent quand la liste des conversations arrive
  // (deep-link, renommage de groupe, nouvel avatar…)
  useEffect(() => {
    if (!activePartnerId || !activeConv) return;
    setActivePartner((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        avatar_url: activeConv.partner_avatar_url || prev.avatar_url,
        display_name: activeConv.partner_display_name || prev.display_name,
        username: activeConv.partner_username || prev.username,
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
  const hasUrgentMention =
    /@[a-zA-Z0-9_]{1,30}/.test(messagePlain) &&
    (/@tous\b/i.test(messagePlain) ||
      (activeConv?.members || []).some((m) =>
        new RegExp(`@${m.username}\\b`, "i").test(messagePlain)
      ));

  // Brouillons DM (localStorage vibe_dm_draft_<partnerId>)
  const [dmDraftKeys, setDmDraftKeys] = useState<string[]>(() => {
    try {
      return Object.keys(localStorage).filter(
        (k) => k.startsWith("vibe_dm_draft_") && localStorage.getItem(k)
      );
    } catch {
      return [];
    }
  });
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePartnerBlocked = Boolean(activeConv?.is_blocked);

  // New conversation user search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      tier?: string;
    }>
  >([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Dernière conversation demandée : ignore les réponses réseau obsolètes
  const lastFetchPartnerRef = useRef<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const richInputRef = useRef<MessageRichInputHandle>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Indicateur de frappe du partenaire (« @x est en train d'écrire… »)
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
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
      const prefix = el.getText().trim() ? " " : "";
      el.insertText(`${prefix}${text}`);
    },
  });

  const [currentTimestamp] = useState(() => Date.now());

  // La liste des conversations est strictement privée et lue en base par la
  // page serveur : premier écran sans `GET /v1/dms/conversations`. Les
  // rechargements suivants (SSE, envois) repassent par l'API, autorité après
  // écriture.
  const conversationsSeedConsumedRef = useRef(false);
  const conversationsSeed = useCallback(() => {
    if (conversationsSeedConsumedRef.current || !hydration?.data) {
      return null;
    }
    if (hydration.as !== null) {
      if (user && String(hydration.as) !== String(user.id ?? "")) {
        return null;
      }
    } else if (user) {
      return null;
    }
    const d = hydration.data as { conversations?: any[] };
    return Array.isArray(d.conversations)
      ? { conversations: d.conversations }
      : null;
  }, [hydration, user]);

  const fetchConversations = useCallback(async () => {
    try {
      const seed = conversationsSeed();
      let res: { conversations: any[] };
      if (seed) {
        conversationsSeedConsumedRef.current = true;
        res = seed;
        ApiService.seedCache("/v1/dms/conversations", seed);
      } else {
        res = await ApiService.getConversations();
      }
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
  }, [activePartnerId, conversationsSeed]);

  const fetchMessages = useCallback(
    async (partnerId: string | number) => {
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
          if (t && typeof t === "object") {
            const langs = Object.keys(t);
            if (langs.length > 0) {
              const last = langs.sort(
                (a, b) => Date.parse(t[a]?.at || 0) - Date.parse(t[b]?.at || 0)
              )[langs.length - 1];
              if (last && t[last]?.text) restored[String(mm.id)] = t[last].text;
            }
          }
        }
        if (Object.keys(restored).length > 0) {
          setTranslations((prev) => ({ ...restored, ...prev }));
        }
        // Premier message non lu (hors messages propres) → séparateur + bouton ↓
        // Groupes : la lecture est suivie par read_by (is_read n'y est jamais posé)
        const isGroupThread = String(partnerId).startsWith("group:");
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
        ApiService.invalidateCache("/dms/conversations");
        ApiService.invalidateCache("/unread_count");
        window.dispatchEvent(new CustomEvent("vibe:unread_updated"));

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
        // Le séparateur « Non lus » disparaît 3 s après le scroll en bas
        setTimeout(() => {
          setShowJumpToUnread(false);
        }, 3000);
      } catch (err: any) {
        setErrorMessage(err.message || "Impossible de charger les messages.");
      }
    },
    [user]
  );

  useEffect(() => {
    fetchConversations();
    // Filet de sécurité : rafraîchissement léger toutes les 60 s.
    // L'instantanéité est assurée par le flux SSE (RealtimeService).
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (activePartnerId) fetchMessages(activePartnerId);
      fetchConversations();
    }, 60_000);
    return () => clearInterval(timer);
  }, [activePartnerId, fetchConversations, fetchMessages]);

  // ── Temps réel (SSE) : nouveaux messages + indicateur de frappe ──
  useEffect(() => {
    const unsubscribe = RealtimeService.on((type, payload) => {
      if (type === "dm_message" && payload) {
        const fromActivePartner =
          activePartnerId !== null &&
          (String(payload.sender_id) === String(activePartnerId) ||
            (isGroupConv &&
              payload.conversation_id &&
              String(payload.conversation_id) === String(groupId)));
        const mine =
          payload.sender_id !== null &&
          user &&
          String(payload.sender_id) === String(user.id);
        if (fromActivePartner && !mine) {
          // Dédupliqué contre l'optimiste/le rafraîchissement par id
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(payload.id)))
              return prev;
            return [...prev, payload as DirectMessage];
          });
          // Marque lu côté serveur + purge les caches DM (rattrapage silencieux)
          ApiService.invalidateCache(`/dms/messages/${activePartnerId}`);
          ApiService.getMessages(activePartnerId).catch(() => {});
          ApiService.invalidateCache("/dms/conversations");
          fetchConversations();
          // Traduction automatique des messages entrants (si activée dans les Paramètres)
          // Les clés serveur sont en minuscules : comparer sans tenir compte de la casse
          const autoTranslateKey = (autoTranslateLang || "").toLowerCase();
          const hasStoredTranslation = autoTranslateKey
            ? Object.keys((payload as any).translations || {}).some(
                (k) => k.toLowerCase() === autoTranslateKey
              )
            : false;
          if (autoTranslateLang && !hasStoredTranslation) {
            const plain = htmlToPlainText(String(payload.content || ""));
            if (plain.trim()) {
              ApiService.translateText(plain, autoTranslateLang)
                .then((tr) => {
                  if (tr?.translation) {
                    setTranslations((prev) => ({
                      ...prev,
                      [payload.id]: tr.translation,
                    }));
                    ApiService.saveMessageTranslation(
                      String(payload.id),
                      autoTranslateLang,
                      tr.translation,
                      (tr as any).detected_language
                    ).catch(() => {});
                  }
                })
                .catch(() => {});
            }
          }
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 60);
        } else if (!mine) {
          // Autre conversation : met à jour la liste (aperçu, tri, badge)
          ApiService.invalidateCache("/dms/");
          fetchConversations();
        }
      } else if (type === "dm_message_edited" && payload) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(payload.id)
              ? {
                  ...m,
                  content: payload.content,
                  edited_at: payload.edited_at || new Date().toISOString(),
                  is_edited: true,
                }
              : m
          )
        );
        fetchConversations();
      } else if (type === "dm_message_deleted" && payload) {
        // « Supprimé pour tout le monde » : retire le message (et son épingle)
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(payload.id))
        );
        setPinnedMessages((prev) =>
          prev.filter((p) => String(p.id) !== String(payload.id))
        );
      } else if (type === "group_updated" && payload) {
        // Ajout/retrait de membre, renommage, transfert d'admin ou suppression du groupe
        ApiService.invalidateCache("/dms/");
        fetchConversations();
        const gid = payload?.conversation_id;
        if (isGroupConv && gid && String(gid) === String(groupId)) {
          if (payload.action === "deleted") {
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
      } else if (type === "dm_typing" && payload) {
        const fromActivePartner =
          activePartnerId !== null &&
          String(payload.user_id) === String(activePartnerId);
        if (!fromActivePartner) return;
        if (typingHideTimeoutRef.current)
          clearTimeout(typingHideTimeoutRef.current);
        if (payload.typing === false) {
          setPartnerTyping(false);
        } else {
          setPartnerTyping(true);
          // Disparaît si aucun nouveau signal n'arrive (l'émetteur throttle à 2,5 s)
          typingHideTimeoutRef.current = setTimeout(
            () => setPartnerTyping(false),
            6000
          );
        }
      }
    });
    return () => {
      unsubscribe();
      if (typingHideTimeoutRef.current)
        clearTimeout(typingHideTimeoutRef.current);
    };
  }, [
    activePartnerId,
    user,
    fetchConversations,
    fetchMessages,
    isGroupConv,
    groupId,
    autoTranslateLang,
  ]);

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
    if (
      (!convMenuOpen && !addMembersOpen && !groupInfoOpen) ||
      !isGroupConv ||
      !groupId
    )
      return;
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
          setAutoTranslateLang(
            s.dm_translate_lang ||
              browserToDeepLCode(navigator.language || "fr-FR")
          );
        }
      })
      .catch(() => {});
  }, []);

  // Brouillon DM : restaure à l'ouverture de la conversation.
  // `editingMessage` n'est lu que comme garde : l'ajouter aux dépendances
  // rejouerait l'effet (et annulerait l'édition) à chaque clic sur « modifier ».
  // biome-ignore lint/correctness/useExhaustiveDependencies: restauration au changement de conversation, par contrat.
  useEffect(() => {
    if (!activePartnerId) return;
    try {
      const saved = localStorage.getItem(dmDraftKey(activePartnerId)) || "";
      if (!editingMessage) {
        setMessageInput(saved);
        richInputRef.current?.setHTML(saved);
      }
    } catch {}
    setScheduledAt("");
    setShowSchedule(false);
    setConvSearchOpen(false);
    setConvSearchQuery("");
    setConvSearchApiResults([]);
    // Les états « réponse » et « édition » ne doivent pas fuir entre conversations
    setReplyTo(null);
    setEditingMessage(null);
    setMentionQuery(null);
    // Livre : pièce jointe + sélecteur de publications réinitialisés
    setToolQuery(null);
    setAttachedPost(null);
    setBookPickerOpen(false);
    setBookPickerQuery("");
  }, [activePartnerId]);

  // Brouillon DM : sauvegarde différée 500 ms après la frappe
  useEffect(() => {
    if (!activePartnerId || editingMessage) return;
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(() => {
      try {
        if (messagePlain.trim()) {
          localStorage.setItem(dmDraftKey(activePartnerId), messageInput);
          setDmDraftKeys((prev) =>
            prev.includes(dmDraftKey(activePartnerId))
              ? prev
              : [...prev, dmDraftKey(activePartnerId)]
          );
        } else {
          localStorage.removeItem(dmDraftKey(activePartnerId));
          setDmDraftKeys((prev) =>
            prev.filter((k) => k !== dmDraftKey(activePartnerId))
          );
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
      if (type !== "dm_pin_updated" || !payload || !activePartnerId) return;
      ApiService.invalidateCache(`/v1/dms/messages/${activePartnerId}`);
      ApiService.getMessages(activePartnerId)
        .then((res) => setPinnedMessages(res.pinned_messages || []))
        .catch(() => {});
    });
    return unsubscribe;
  }, [activePartnerId]);

  // Deep-link : /messages?partner=<id> (recherche globale) ou
  // /messages?conv=<id>&msg=<id> (permalien copié depuis le menu message).
  // La conversation visée est lue UNE fois, au montage : ajouter
  // `activePartnerId`/`fetchMessages` rejouerait le parsing à chaque
  // changement de conversation, alors que l'URL initiale ne change pas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: parsing du deep-link au montage, par contrat.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const partner = params.get("conv") || params.get("partner");
      const msgId = params.get("msg");
      if (partner && !activePartnerId) {
        const pid = partner;
        setActivePartnerId(pid);
        setActivePartner({
          id: pid,
          username: String(pid).startsWith("group:") ? "Groupe" : `user-${pid}`,
        });
        if (msgId) setPendingMsgId(msgId);
        fetchMessages(pid);
      }
    } catch {}
  }, []);

  // Mémoïsé : dépendance de l'effet de permalien, qui ne doit pas se rejouer
  // à chaque rendu.
  const scrollToMessage = useCallback((id: string) => {
    const el = messageRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      haptics.light();
    }
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
      setTimeout(
        () => setHighlightedMessageId((cur) => (cur === id ? null : cur)),
        2500
      );
    }, 120);
  }, [messages, pendingMsgId, scrollToMessage]);

  const handleSelectConversation = (conv: DMConversation) => {
    haptics.light();
    setActivePartnerId(conv.partner_id);
    setActivePartner({
      avatar_url: conv.partner_avatar_url,
      display_name: conv.partner_display_name,
      id: conv.partner_id,
      username: conv.partner_username,
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
      const res = await ApiService.createGroup(
        groupName.trim() || "Nouveau groupe",
        groupSelected.map((u) => u.id)
      );
      setGroupModalOpen(false);
      setGroupName("");
      setGroupSelected([]);
      haptics.success();
      await fetchConversations();
      // Ouvre directement la nouvelle conversation de groupe
      setActivePartnerId(`group:${res.conversation_id}`);
      setActivePartner({
        id: `group:${res.conversation_id}`,
        username: res.name,
      });
      fetchMessages(`group:${res.conversation_id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la création du groupe.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAddMembers = async () => {
    if (!groupId || addMembersSelected.length === 0) return;
    setIsCreatingGroup(true);
    try {
      await ApiService.addGroupMembers(
        groupId,
        addMembersSelected.map((u) => u.id)
      );
      setAddMembersOpen(false);
      setAddMembersSelected([]);
      haptics.success();
      fetchConversations();
      if (activePartnerId) fetchMessages(activePartnerId);
      if (groupId) {
        ApiService.getGroup(groupId)
          .then((res) => res?.group && setActiveGroupInfo(res.group))
          .catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'ajout des membres.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!groupId) return;
    const ok = await confirm({
      confirmLabel: "Retirer",
      message: "Cette personne n'aura plus accès à la conversation de groupe.",
      title: "Retirer ce membre ?",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await ApiService.removeGroupMember(groupId, memberUserId);
      haptics.light();
      fetchConversations();
      if (activePartnerId) fetchMessages(activePartnerId);
      if (groupId) {
        ApiService.getGroup(groupId)
          .then((res) => res?.group && setActiveGroupInfo(res.group))
          .catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du retrait du membre.");
    }
  };

  const { confirm, confirmInput, confirmDialog } = useConfirmDialog();

  // Admin fiable dès l'ouverture du menu (activeConv peut être null au 1er rendu)
  const groupIsAdmin =
    activeGroupInfo?.is_admin ?? Boolean(activeConv?.is_admin);
  const groupMembers = activeGroupInfo?.members ?? (activeConv?.members || []);
  const existingGroupMemberIds = new Set(
    groupMembers.map((mm) => String(mm.user_id))
  );

  // ── Mise en forme du message : gras, italique, souligné, barré, lien ──
  // (les commandes s'appliquent à la sélection du composeur riche)
  const handleToolbarCommand = (
    cmd: "bold" | "italic" | "underline" | "strikeThrough"
  ) => {
    richInputRef.current?.execCommand(cmd);
  };

  const handleInsertLink = async () => {
    const url = await confirmInput({
      confirmLabel: "Insérer",
      input: { maxLength: 500, placeholder: "https://…", type: "url" },
      message: "Saisissez l’URL à insérer dans le message.",
      title: "Insérer un lien",
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
      setErrorMessage(err.message || "Erreur lors du renommage.");
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
      NotificationService.showInAppToast(
        "Signalement transmis",
        "Merci de nous aider à garder Vibe sûr.",
        "success"
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du signalement.");
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
          confirmLabel: "Bloquer",
          message: "Cette personne ne pourra plus vous envoyer de messages.",
          title: `Bloquer @${activePartner?.username} ?`,
          tone: "danger",
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
      setErrorMessage(err.message || "Erreur lors du blocage.");
    } finally {
      setIsModerating(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activePartnerId || isModerating) return;
    const ok = await confirm({
      confirmLabel: "Supprimer",
      message:
        "Cette conversation et tous ses messages seront supprimés définitivement.",
      title: "Supprimer la conversation ?",
      tone: "danger",
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
      setErrorMessage(err.message || "Erreur lors de la suppression.");
    } finally {
      setIsModerating(false);
    }
  };

  const handleDeleteMessage = async (m: DirectMessage) => {
    setActionMenuFor(null);
    const ok = await confirm({
      confirmLabel: "Supprimer",
      message: "Le message sera supprimé pour tout le monde.",
      title: "Supprimer ce message ?",
      tone: "danger",
    });
    if (!ok) return;
    const snapshot = messages;
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    setPinnedMessages((prev) =>
      prev.filter((p) => String(p.id) !== String(m.id))
    );
    try {
      await ApiService.deleteMessage(String(m.id));
    } catch (err: any) {
      setMessages(snapshot);
      setErrorMessage(err.message || "Impossible de supprimer le message.");
    }
  };

  /** Traduction d'un message (langue cible choisie ou langue par défaut), mémorisée côté serveur. */
  const handleTranslateMessage = async (
    m: DirectMessage,
    targetLang?: string
  ) => {
    setActionMenuFor(null);
    setTranslatePickerFor(null);
    if (translations[m.id] && !targetLang) return;
    const target = (
      targetLang ||
      translateLang ||
      browserToDeepLCode(navigator.language || "fr-FR")
    ).toUpperCase();
    if (targetLang) {
      setTranslateLang(target);
      try {
        localStorage.setItem("vibe_dm_translate_lang", target);
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
        ApiService.saveMessageTranslation(
          String(m.id),
          target,
          res.translation,
          (res as any).detected_language
        ).catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Traduction impossible.");
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
    setPinnedMessages((prev) =>
      prev.filter((p) => String(p.id) !== String(m.id))
    );
    try {
      await ApiService.hideMessage(String(m.id));
      haptics.success();
    } catch (err: any) {
      setMessages(snapshot);
      setErrorMessage(err.message || "Impossible de masquer le message.");
    }
  };

  /** Copie le permalien du message (?conv=…&msg=…) dans le presse-papiers. */
  const handleCopyMessageLink = async (m: DirectMessage) => {
    setActionMenuFor(null);
    try {
      const url = toVibeAbsoluteUrl(
        `/messages?conv=${encodeURIComponent(String(activePartnerId))}&msg=${m.id}`
      );
      await navigator.clipboard.writeText(url);
      haptics.success();
      NotificationService.showInAppToast(
        "Copié",
        "Lien du message copié dans le presse-papiers.",
        "success"
      );
    } catch {
      haptics.error();
      NotificationService.showInAppToast(
        "Erreur",
        "Impossible de copier le lien du message.",
        "error"
      );
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
        setPinnedMessages((prev) =>
          prev.filter((p) => String(p.id) !== String(m.id))
        );
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
      setErrorMessage(err?.message || "Marquage impossible.");
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
        setConvSearchApiResults(
          (res.messages || []).filter((m) => !known.has(String(m.id)))
        );
      } catch {
        setConvSearchApiResults([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [convSearchQuery, convSearchOpen, activePartnerId, messages]);

  /** Surlignage des occurrences (découpage React, sans HTML brut). */
  const highlightMatches = (
    content: string,
    query: string
  ): React.ReactNode => {
    if (!query) return content;
    const parts = content.split(query);
    if (parts.length <= 1) return content;
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark className="bg-yellow-400/60 text-inherit rounded-sm px-0.5">
                {query}
              </mark>
            )}
          </span>
        ))}
      </>
    );
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

  const handleStartConversationWith = (u: {
    id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  }) => {
    haptics.light();
    setActivePartnerId(u.id);
    setActivePartner(u);
    setMessages([]);
    setSearchQuery("");
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
      setErrorMessage(
        `La taille totale des médias dépasse la limite de ${mediaLimitLabel} (sélection : ${((currentBytes + newBytes) / (1024 * 1024)).toFixed(1)} Mo).`
      );
      return;
    }

    for (const f of files) {
      if (
        !f.type.startsWith("image/") &&
        !f.type.startsWith("video/") &&
        !f.type.startsWith("application/") &&
        f.type !== "text/plain"
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
          const type: "image" | "video" | "document" = file.type.startsWith(
            "video/"
          )
            ? "video"
            : file.type.startsWith("image/")
              ? "image"
              : "document";
          setAttachedMediaList((prev) => [
            ...prev,
            { fileName: file.name, size: file.size, type, url: res.url },
          ]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l’envoi des fichiers.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          m.id === msgId
            ? {
                ...m,
                content: newHtml,
                edited_at: new Date().toISOString(),
                is_edited: true,
              }
            : m
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
        setErrorMessage(err.message || "Impossible de modifier le message.");
        if (activePartnerId) fetchMessages(activePartnerId);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const safeHtml = sanitizeRichHtml(messageInput);
    const mediaUrls = attachedMediaList.map((m) => m.url).join(" ");
    const textToSend = mediaUrls
      ? `${safeHtml.trim()}${safeHtml.trim() ? "<br>" : ""}${mediaUrls}`.trim()
      : safeHtml.trim();

    if (
      !messagePlain.trim() ||
      !activePartnerId ||
      isSending ||
      activePartnerBlocked
    )
      return;

    // Conversations de groupe : envoi via conversation_id "group:<uuid>"
    if (isGroupConv && groupId) {
      setIsSending(true);
      setErrorMessage(null);
      try {
        await ApiService.sendMessage(
          undefined as unknown as number,
          textToSend,
          replyTo && !String(replyTo.id).startsWith("temp")
            ? String(replyTo.id)
            : undefined,
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
        setErrorMessage(
          err.message || "Impossible d'envoyer le message au groupe."
        );
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
      content: textToSend,
      conversation_id: "temp",
      created_at: new Date().toISOString(),
      id: tempId,
      is_read: false,
      recipient_id: String(activePartnerId),
      sender_id: user ? String(user.id) : "me",
      sender_username: user?.username || "me",
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
      await ApiService.sendMessage(
        activePartnerId,
        textToSend,
        replyTo && !String(replyTo.id).startsWith("temp")
          ? String(replyTo.id)
          : undefined,
        sendAtIso
      );
      setReplyTo(null);
      // Brouillon consommé + programmation réinitialisée
      try {
        localStorage.removeItem(dmDraftKey(activePartnerId));
        setDmDraftKeys((prev) =>
          prev.filter((k) => k !== dmDraftKey(activePartnerId))
        );
      } catch {}
      setScheduledAt("");
      setShowSchedule(false);
      haptics.success();
      playMotion("success");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 1200);
      fetchMessages(activePartnerId);
      fetchConversations();
    } catch (err: any) {
      haptics.error();
      playMotion("error");
      setErrorMessage(err.message || "Impossible d’envoyer le message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleReaction = async (m: DirectMessage, emoji: string) => {
    if (String(m.id).startsWith("temp")) return;
    setActionMenuFor(null);
    // Mise à jour optimiste
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== m.id) return msg;
        const reactions: { emoji: string; count: number; mine: boolean }[] = [
          ...((msg as any).reactions || []),
        ];
        const g = reactions.find((r) => r.emoji === emoji);
        if (g) {
          if (g.mine) {
            g.count -= 1;
            g.mine = false;
            if (g.count <= 0) g.count = 0;
            playMotion("unlike");
          } else {
            g.count += 1;
            g.mine = true;
            playMotion("like");
          }
        } else {
          reactions.push({ count: 1, emoji, mine: true });
          playMotion("like");
        }
        return {
          ...msg,
          reactions: reactions.filter((r) => r.count > 0),
        } as any;
      })
    );
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
      NotificationService.showInAppToast(
        "Copié",
        "Message copié dans le presse-papiers.",
        "success"
      );
    } catch {
      haptics.error();
      NotificationService.showInAppToast(
        "Erreur",
        "Impossible de copier le message.",
        "error"
      );
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
      NotificationService.showInAppToast(
        "Transféré",
        "Le message a été transféré.",
        "success"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err.message || "Erreur lors du transfert.",
        "error"
      );
    }
  };

  // ── Gestion du groupe : photo, nom, administration, suppression ──
  const handleGroupAvatarSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !groupId) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Choisissez un fichier image pour la photo du groupe.");
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
      setErrorMessage(
        err.message || "Impossible de changer la photo du groupe."
      );
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
      setErrorMessage(err.message || "Impossible de renommer le groupe.");
    } finally {
      setGroupSaving(false);
    }
  };

  const handleTransferAdmin = async (targetUserId: string | number) => {
    if (!groupId) return;
    const target = groupMembers.find(
      (mm) => String(mm.user_id) === String(targetUserId)
    );
    const ok = await confirm({
      confirmLabel: "Nommer admin",
      message: `@${target?.username || "ce membre"} deviendra administrateur du groupe. Vous deviendrez simple membre.`,
      title: "Nommer ce membre administrateur ?",
    });
    if (!ok) return;
    try {
      await ApiService.transferGroupAdmin(groupId, targetUserId);
      haptics.success();
      const res = await ApiService.getGroup(groupId);
      if (res?.group) setActiveGroupInfo(res.group);
      fetchConversations();
    } catch (err: any) {
      setErrorMessage(err.message || "Transfert impossible.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    const ok = await confirm({
      confirmLabel: "Supprimer",
      message:
        "Le groupe et tous ses messages seront définitivement supprimés. Cette action est irréversible.",
      title: "Supprimer ce groupe ?",
      tone: "danger",
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
      setErrorMessage(err.message || "Suppression du groupe impossible.");
    }
  };

  // ── Mentions @ : autocomplétion (membres du groupe) ──
  const mentionSuggestions =
    isGroupConv && mentionQuery !== null
      ? (activeConv?.members || [])
          .filter((mm) => String(mm.user_id) !== String(user?.id))
          .filter(
            (mm) =>
              mentionQuery === "" ||
              mm.username.toLowerCase().startsWith(mentionQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  const handleInsertMention = (username: string) => {
    try {
      // Supprime la requête tapée (« @xxx ») puis insère la mention complète
      for (let i = 0; i < (mentionQuery?.length || 0) + 1; i++) {
        document.execCommand("delete", false);
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
        document.execCommand("delete", false);
      }
    } catch {}
    setToolQuery(null);
    setBookPickerOpen(true);
    setBookPickerQuery("");
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
          const plain = htmlToPlainText(p.content || "").toLowerCase();
          return (
            plain.includes(q) ||
            String(p.username || "")
              .toLowerCase()
              .includes(q)
          );
        })
      : bookPickerPosts;
    return list.slice(0, 20);
  })();

  const PRESET_OPTIONS: {
    key: "shorten" | "extend" | "tone" | "improve" | "custom";
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      icon: <Scissors className="w-3.5 h-3.5" />,
      key: "shorten",
      label: "Réduire",
    },
    {
      icon: <Expand className="w-3.5 h-3.5" />,
      key: "extend",
      label: "Allonger",
    },
    {
      icon: <Drama className="w-3.5 h-3.5" />,
      key: "tone",
      label: "Changer le ton",
    },
    {
      icon: <Wand2 className="w-3.5 h-3.5" />,
      key: "improve",
      label: "Améliorer",
    },
    {
      icon: <PenLine className="w-3.5 h-3.5" />,
      key: "custom",
      label: "Personnalisé…",
    },
  ];

  const handleGenerateSuggestion = async (
    preset: "improve" | "shorten" | "extend" | "tone" | "custom" = "improve",
    customPrompt?: string
  ) => {
    if (!activePartnerId || isGeneratingSuggestion) return;
    if (!messagePlain.trim()) {
      setErrorMessage(
        "Veuillez d'abord écrire un texte dans la bulle de message pour que mAI puisse l'améliorer."
      );
      return;
    }
    if (preset === "custom" && !customPrompt?.trim()) {
      setCustomPresetOpen(true);
      setPlusMenuOpen(false);
      return;
    }
    setIsGeneratingSuggestion(true);
    setErrorMessage(null);
    setCustomPresetOpen(false);
    try {
      const res = await ApiService.generateDMReply(
        activePartnerId,
        messagePlain.trim(),
        preset,
        customPrompt?.trim() || undefined
      );
      if (res?.suggestion) {
        const clean = res.suggestion
          .replace(/User Safety:\s*safe\.?/gi, "")
          .replace(/^User Safety:[^\n]*\n*/gi, "")
          .trim();
        if (clean) {
          setMessageInput(clean);
          richInputRef.current?.setHTML(clean);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "mAI n’a pas pu améliorer le message.");
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="vibe-chat-page flex-1 flex min-h-screen border-r pb-16 md:pb-0 select-none"
      data-app-update-blocked={
        isGeneratingSuggestion ||
        isSending ||
        isUploading ||
        groupSaving ||
        groupAvatarUploading ||
        isCreatingGroup
      }
    >
      {/* Colonne gauche : liste des conversations */}
      <ConversationList
        activePartnerId={activePartnerId}
        conversations={conversations}
        dmDraftKeys={dmDraftKeys}
        formatTime={formatTime}
        isLoading={isLoading}
        isSearchingUsers={isSearchingUsers}
        onClearSearch={() => {
          setSearchQuery("");
          setSearchResults([]);
          setIsSearchingUsers(false);
        }}
        onOpenConvMenu={(conv) => {
          handleSelectConversation(conv);
          setConvMenuOpen(true);
        }}
        onOpenGroupModal={() => setGroupModalOpen(true)}
        onSearchUsers={handleSearchUsers}
        onSelectConversation={handleSelectConversation}
        onStartConversationWith={handleStartConversationWith}
        searchQuery={searchQuery}
        searchResults={searchResults}
      />

      {/* Colonne droite : discussion active */}
      <div
        className={`vibe-chat-main flex-1 flex flex-col ${
          activePartnerId ? "flex" : "hidden md:flex"
        }`}
      >
        {activePartner ? (
          <>
            <ConversationHeader
              activeConv={activeConv}
              activePartner={activePartner}
              activePartnerBlocked={activePartnerBlocked}
              bookId={bookId}
              convMenuOpen={convMenuOpen}
              convSearchOpen={convSearchOpen}
              convSearchQuery={convSearchQuery}
              errorMessage={errorMessage}
              groupIsAdmin={groupIsAdmin}
              groupMembers={groupMembers}
              isBookConv={isBookConv}
              isGroupConv={isGroupConv}
              isModerating={isModerating}
              onBack={() => setActivePartnerId(null)}
              onBlockPartner={handleBlockPartner}
              onChangeSearchQuery={(q) => {
                setConvSearchQuery(q);
                setConvSearchIndex(0);
              }}
              onCloseConvMenu={() => setConvMenuOpen(false)}
              onCloseSearch={() => {
                setConvSearchOpen(false);
                setConvSearchQuery("");
              }}
              onDeleteConversation={handleDeleteConversation}
              onMarkUnread={handleMarkUnread}
              onOpenAddMembers={() => setAddMembersOpen(true)}
              onOpenGroupInfo={() => {
                setGroupNameDraft(
                  activeConv?.partner_display_name ||
                    activeConv?.partner_username ||
                    ""
                );
                setGroupInfoOpen(true);
                setConvMenuOpen(false);
              }}
              onOpenRenameModal={() => setRenameModalOpen(true)}
              onOpenReportModal={() => setReportModalOpen(true)}
              onOpenSearch={() => setConvSearchOpen(true)}
              onOpenThemeModal={() => setThemeModalOpen(true)}
              onRemoveMember={(userId) => handleRemoveMember(userId)}
              onScrollToMessage={(id) => {
                setPinsCollapsed(true);
                scrollToMessage(id);
              }}
              onSearchKeyDown={(e) => {
                if (e.key === "Escape") {
                  setConvSearchOpen(false);
                  setConvSearchQuery("");
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setConvSearchIndex((i) => i + 1);
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setConvSearchIndex((i) => Math.max(0, i - 1));
                }
              }}
              onToggleConvMenu={() => setConvMenuOpen(!convMenuOpen)}
              onTogglePinsCollapsed={() => setPinsCollapsed(!pinsCollapsed)}
              onTransferAdmin={(userId) => handleTransferAdmin(userId)}
              partnerTyping={partnerTyping}
              pinnedMessages={pinnedMessages}
              pinsCollapsed={pinsCollapsed}
            />

            {/* Fil de messages */}
            <div
              className="vibe-chat-thread relative flex-1 p-4 space-y-3 overflow-y-auto"
              ref={threadRef}
              style={{
                background:
                  chatBackgroundTheme === "default"
                    ? undefined
                    : CHAT_BACKGROUND_THEMES[chatBackgroundTheme]?.style,
                maxHeight: "calc(100dvh - 140px - var(--vibe-kb-offset, 0px))",
              }}
            >
              {(() => {
                const q = convSearchOpen ? convSearchQuery.trim() : "";
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
                const active =
                  combined[Math.min(convSearchIndex, combined.length - 1)];
                return (
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] shadow-lg w-fit mx-auto">
                    <span>
                      {Math.min(convSearchIndex + 1, combined.length)}/
                      {combined.length} résultat(s)
                    </span>
                    <button
                      className="px-1 font-bold"
                      onClick={() => {
                        const next = Math.max(0, convSearchIndex - 1);
                        setConvSearchIndex(next);
                        scrollToMessage(String(combined[next]?.id));
                      }}
                      title="Résultat précédent (↑)"
                      type="button"
                    >
                      ↑
                    </button>
                    <button
                      className="px-1 font-bold"
                      onClick={() => {
                        const next = Math.min(
                          combined.length - 1,
                          convSearchIndex + 1
                        );
                        setConvSearchIndex(next);
                        scrollToMessage(String(combined[next]?.id));
                      }}
                      title="Résultat suivant (↓)"
                      type="button"
                    >
                      ↓
                    </button>
                    {active && (
                      <button
                        className="underline underline-offset-2"
                        onClick={() => scrollToMessage(String(active.id))}
                        type="button"
                      >
                        Voir
                      </button>
                    )}
                  </div>
                );
              })()}

              {messages.map((m) => (
                <MessageItem
                  actionMenuFor={actionMenuFor}
                  animationsEnabled={animationsEnabled}
                  convSearchOpen={convSearchOpen}
                  convSearchQuery={convSearchQuery}
                  currentTimestamp={currentTimestamp}
                  currentUser={user}
                  firstUnreadId={firstUnreadId}
                  formatTime={formatTime}
                  highlightedMessageId={highlightedMessageId}
                  isGroupConv={isGroupConv}
                  key={m.id}
                  message={m}
                  messageBubbleShape={messageBubbleShape}
                  messageBubbleTheme={messageBubbleTheme}
                  onCloseActionMenu={() => setActionMenuFor(null)}
                  onCopyMessage={handleCopyMessage}
                  onCopyMessageLink={handleCopyMessageLink}
                  onDeleteMessage={handleDeleteMessage}
                  onEditMessage={(msg) => {
                    setEditingMessage(msg);
                    setActionMenuFor(null);
                    requestAnimationFrame(() => {
                      richInputRef.current?.setHTML(msg.content);
                      richInputRef.current?.focus();
                    });
                  }}
                  onForward={(msg) => {
                    setForwardingMessage(msg);
                    setActionMenuFor(null);
                  }}
                  onHideMessage={handleHideMessage}
                  onOpenInfoModal={(msg) => {
                    setInfoModalMessage(msg);
                    setActionMenuFor(null);
                  }}
                  onReplyTo={(msg) => {
                    setReplyTo(msg);
                    setActionMenuFor(null);
                  }}
                  onSetRef={(id, el) => {
                    if (el) messageRefs.current.set(id, el);
                    else messageRefs.current.delete(id);
                  }}
                  onToggleActionMenu={(id) => {
                    setTranslatePickerFor(null);
                    setActionMenuFor(actionMenuFor === id ? null : id);
                  }}
                  onTogglePin={handleTogglePin}
                  onToggleReaction={handleToggleReaction}
                  onToggleTranslatePicker={(id) =>
                    setTranslatePickerFor(translatePickerFor === id ? null : id)
                  }
                  onTranslateMessage={handleTranslateMessage}
                  pinnedMessages={pinnedMessages}
                  translateLang={translateLang}
                  translatePickerFor={translatePickerFor}
                  translatingIds={translatingIds}
                  translations={translations}
                />
              ))}
              <div ref={messagesEndRef} />

              {/* Bouton flottant « ↓ N non lus » */}
              {showJumpToUnread && firstUnreadId && (
                <button
                  className="sticky bottom-3 ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] font-bold shadow-xl hover:bg-zinc-800 transition-colors w-fit"
                  onClick={() => {
                    scrollToMessage(firstUnreadId);
                    setTimeout(() => setShowJumpToUnread(false), 3000);
                  }}
                  type="button"
                >
                  ↓ Non lus
                </button>
              )}
            </div>

            {/* Composeur de message */}
            <MessageComposer
              activePartnerBlocked={activePartnerBlocked}
              animationsEnabled={animationsEnabled}
              attachedMediaList={attachedMediaList}
              attachedPost={attachedPost}
              bookPickerLoading={bookPickerLoading}
              bookPickerOpen={bookPickerOpen}
              bookPickerQuery={bookPickerQuery}
              customPresetOpen={customPresetOpen}
              customPresetText={customPresetText}
              editingMessage={editingMessage}
              fileInputRef={fileInputRef}
              filteredBookPickerPosts={filteredBookPickerPosts}
              hasUrgentMention={hasUrgentMention}
              isBookConv={isBookConv}
              isGeneratingSuggestion={isGeneratingSuggestion}
              isGroupConv={isGroupConv}
              isListening={isListening}
              isSending={isSending}
              isSupported={isSupported}
              isUploading={isUploading}
              justSent={justSent}
              mediaLimitLabel={mediaLimitLabel}
              mentionQuery={mentionQuery}
              mentionSuggestions={mentionSuggestions}
              messageCharLimit={messageCharLimit}
              messagePlain={messagePlain}
              onAttachFiles={handleAttachFiles}
              onCancelAttachedPost={() => setAttachedPost(null)}
              onCancelEditing={() => {
                setEditingMessage(null);
                richInputRef.current?.clear();
              }}
              onCancelReply={() => setReplyTo(null)}
              onChangeBookPickerQuery={(q) => setBookPickerQuery(q)}
              onChangeCustomPresetText={(t) => setCustomPresetText(t)}
              onChangeScheduledAt={(val) => setScheduledAt(val)}
              onClearSchedule={() => {
                setScheduledAt("");
                setShowSchedule(false);
              }}
              onCloseBookPicker={() => setBookPickerOpen(false)}
              onCloseCustomPreset={() => setCustomPresetOpen(false)}
              onCloseMentionQuery={() => setMentionQuery(null)}
              onClosePlusMenu={() => setPlusMenuOpen(false)}
              onCloseToolQuery={() => setToolQuery(null)}
              onGenerateSuggestion={handleGenerateSuggestion}
              onInsertLink={handleInsertLink}
              onInsertMention={handleInsertMention}
              onOpenBookPostPicker={openBookPostPicker}
              onRemoveAttachedMedia={(idx) =>
                setAttachedMediaList((prev) => prev.filter((_, i) => i !== idx))
              }
              onRichInputChange={handleRichInputChange}
              onSelectBookPost={(p) => {
                setAttachedPost({
                  avatar_url: p.avatar_url || null,
                  excerpt: htmlToPlainText(p.content || "").slice(0, 120),
                  id: p.id,
                  username: p.username || "vibe",
                });
                setBookPickerOpen(false);
                setBookPickerQuery("");
              }}
              onSendMessage={handleSendMessage}
              onStartListening={startListening}
              onStopListening={stopListening}
              onTogglePlusMenu={() => setPlusMenuOpen((prev) => !prev)}
              onToggleSchedule={() => setShowSchedule(!showSchedule)}
              onToolbarCommand={handleToolbarCommand}
              onUserInput={notifyTyping}
              plusMenuOpen={plusMenuOpen}
              replyTo={replyTo}
              richInputRef={richInputRef}
              scheduledAt={scheduledAt}
              showSchedule={showSchedule}
              toolQuery={toolQuery}
            />

            {/* Modale de renommage de conversation */}
            <RenameConversationModal
              busy={isModerating}
              fallbackName={
                activePartner?.display_name || activePartner?.username
              }
              initialValue={activeConv?.custom_name || ""}
              onClose={() => setRenameModalOpen(false)}
              onSave={handleRenameConversation}
              open={renameModalOpen}
            />

            {/* Modale de signalement */}
            <ReportConversationModal
              busy={isModerating}
              onClose={() => setReportModalOpen(false)}
              onSubmit={handleReportConversation}
              open={reportModalOpen}
              username={activePartner?.username}
            />

            {/* Modale d'informations et de gestion du groupe */}
            <GroupManagementModal
              activeConv={activeConv}
              activeGroupInfo={activeGroupInfo}
              currentUserId={user?.id}
              groupAvatarInputRef={groupAvatarInputRef}
              groupAvatarUploading={groupAvatarUploading}
              groupId={groupId}
              groupIsAdmin={groupIsAdmin}
              groupMembers={groupMembers}
              groupNameDraft={groupNameDraft}
              groupSaving={groupSaving}
              onAvatarSelected={handleGroupAvatarSelected}
              onChangeGroupNameDraft={(val) => setGroupNameDraft(val)}
              onClose={() => setGroupInfoOpen(false)}
              onDeleteGroup={handleDeleteGroup}
              onRemoveMember={(userId) => handleRemoveMember(userId)}
              onSaveGroupName={handleSaveGroupName}
              onTransferAdmin={(userId) => handleTransferAdmin(userId)}
              open={groupInfoOpen && isGroupConv && Boolean(groupId)}
            />

            {/* Modale de transfert */}
            <ForwardModal
              conversations={conversations}
              message={forwardingMessage}
              onClose={() => setForwardingMessage(null)}
              onForwardTo={handleForwardTo}
            />

            {/* Modale d'informations sur le message */}
            <MessageInfoModal
              message={infoModalMessage}
              onClose={() => setInfoModalMessage(null)}
            />

            {/* Modale de personnalisation du thème de discussion */}
            <ThemeModal
              chatBackgroundTheme={chatBackgroundTheme}
              messageBubbleShape={messageBubbleShape}
              messageBubbleTheme={messageBubbleTheme}
              onChangeChatBackgroundTheme={(bgId) =>
                setChatBackgroundTheme(bgId)
              }
              onChangeMessageBubbleShape={(shape) =>
                setMessageBubbleShape(shape)
              }
              onChangeMessageBubbleTheme={(themeId) =>
                setMessageBubbleTheme(themeId)
              }
              onClose={() => setThemeModalOpen(false)}
              open={themeModalOpen}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <Mail className="w-12 h-12 text-zinc-300 vibe-dark:text-zinc-800" />
            <h3 className="text-sm font-bold text-black vibe-dark:text-white">
              Sélectionnez une conversation
            </h3>
            <p className="text-xs text-zinc-500 vibe-dark:text-zinc-400 max-w-sm">
              Communiquez en direct avec les autres membres de la communauté
              Vibe.
            </p>
          </div>
        )}
      </div>

      {/* Modale : créer un groupe */}
      <CreateGroupModal
        busy={isCreatingGroup}
        name={groupName}
        onClose={() => setGroupModalOpen(false)}
        onCreate={handleCreateGroup}
        onNameChange={setGroupName}
        onToggleUser={(u) =>
          setGroupSelected((prev) =>
            prev.some((s) => String(s.id) === String(u.id))
              ? prev.filter((s) => String(s.id) !== String(u.id))
              : [...prev, u]
          )
        }
        open={groupModalOpen}
        selected={groupSelected}
      />

      {/* Modale : ajouter des membres au groupe (admin) */}
      <AddMembersModal
        busy={isCreatingGroup}
        existingMemberIds={existingGroupMemberIds}
        onAdd={handleAddMembers}
        onClose={() => setAddMembersOpen(false)}
        onToggleUser={(u) =>
          setAddMembersSelected((prev) =>
            prev.some((s) => String(s.id) === String(u.id))
              ? prev.filter((s) => String(s.id) !== String(u.id))
              : [...prev, u]
          )
        }
        open={addMembersOpen}
        selected={addMembersSelected}
      />

      {confirmDialog}
    </div>
  );
};
