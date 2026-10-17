/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SETTINGS PAGE (src/pages/SettingsPage.tsx)
 * Personalize Feeds, Security (2FA), Privacy (DMs, Mentions), Moderation & Data Export
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { SettingsIcon as Settings, BellIcon as Bell, ShieldIcon as Shield, DownloadIcon as Download, CheckIcon as Check, SlidersIcon as Sliders, EyeOffIcon as EyeOff, SparklesIcon as Sparkles, PaletteIcon as Palette, TypeIcon as Type, SunIcon as Sun, MoonIcon as Moon, LaptopIcon as Laptop, BanIcon as Ban, Loader2Icon as Loader2, UsersIcon as Users, Volume2Icon as Volume2, CpuIcon as Cpu, LanguagesIcon as Languages, XIcon as X, SearchIcon as Search, UserPlusIcon as UserPlus, GlobeIcon as Globe, LockIcon as Lock, SmartphoneIcon as Smartphone, FileTextIcon as FileText, GraduationCapIcon as GraduationCap, RotateCcwIcon as RotateCcw, WrenchIcon as Wrench } from "@mdevs/icons";
import { useNavigate } from 'react-router-dom';
import { startFullTour } from '../services/tutorialService';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../services/haptics';
import { getAnimationsEnabled, setAnimationsEnabled } from '../services/animationPrefs';
import {
  useTheme,
  ACCENT_COLORS,
  MESSAGE_BUBBLE_THEMES,
  CHAT_BACKGROUND_THEMES,
  MESSAGE_BUBBLE_SHAPES,
  MessageBubbleTheme,
  ChatBackgroundTheme,
  MessageBubbleShape
} from '../context/ThemeContext';
import { ApiService, TRANSLATION_LANGUAGES, browserToDeepLCode } from '../services/api';
import { NotificationService } from '../services/notificationService';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { InstallAppHint } from '../components/common/InstallAppHint';
import { ChatAppearanceSection } from '../components/settings/ChatAppearanceSection';

/** Encart indiquant l'état réel de la permission notifications de l'appareil */
const DevicePermissionHint: React.FC = () => {
  const [state, setState] = useState<ReturnType<typeof NotificationService.getPermissionState>>(() =>
    NotificationService.getPermissionState()
  );

  if (state === 'granted' || state === 'unsupported') return null;

  return (
    <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
      <p className="text-[11px] text-zinc-400">
        {state === 'denied'
          ? 'Les notifications sont bloquées pour ce site. Modifiez les réglages de votre navigateur pour les réactiver.'
          : "Les notifications ne sont pas encore autorisées sur cet appareil."}
      </p>
      {state === 'default' && (
        <button
          type="button"
          onClick={async () => {
            const res = await NotificationService.requestPermission();
            setState(res);
          }}
          className="shrink-0 py-1.5 px-3 rounded-full bg-white text-black text-[11px] font-bold hover:bg-zinc-200"
        >
          Autoriser
        </button>
      )}
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, restartOnboarding } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    messageBubbleTheme,
    setMessageBubbleTheme,
    chatBackgroundTheme,
    setChatBackgroundTheme,
    messageBubbleShape,
    setMessageBubbleShape,
    scheduledTheme,
    setScheduledTheme,
  } = useTheme();

  // Feed customization
  const [feedDefaultMode, setFeedDefaultMode] = useState<'for_you' | 'stream' | 'trending'>('for_you');
  const [hideReposts, setHideReposts] = useState(false);
  const [blockedKeywords, setBlockedKeywords] = useState('');

  // Security & Privacy
  const [allowDms, setAllowDms] = useState<'everyone' | 'following' | 'nobody'>('everyone');
  // Traduction automatique des messages reçus (DM)
  const [dmAutoTranslate, setDmAutoTranslate] = useState(false);
  const [dmTranslateLang, setDmTranslateLang] = useState('EN-US');
  const [dmsEnabled, setDmsEnabled] = useState(true);
  const [allowMentions, setAllowMentions] = useState<'everyone' | 'following' | 'nobody'>('everyone');

  // Moderation & Notifications
  const [contentFilter, setContentFilter] = useState<'low' | 'medium' | 'strict'>('medium');
  const [blurSensitive, setBlurSensitive] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => haptics.isEnabled());
  const hapticsSupported = haptics.isSupported();
  const [animationsEnabled, setAnimationsEnabledState] = useState(() => getAnimationsEnabled());
  const [maiAutoApproveTools, setMaiAutoApproveTools] = useState(false);
  // Outils mAI disponibles (catalogue lib/tools, importé via GET /v1/mai/tools)
  const [maiCatalog, setMaiCatalog] = useState<Array<{ id: string; name: string; description: string; category: string; sensitive: boolean; slash_command: string }>>([]);
  const [maiEnabledTools, setMaiEnabledTools] = useState<string[]>([]);
  const [maiToolsLoaded, setMaiToolsLoaded] = useState(false);
  // Co-signatures acceptées automatiquement quand je suis désigné co-auteur
  const [collabAutoAccept, setCollabAutoAccept] = useState(false);
  const [postsAIGeneratedByDefault, setPostsAIGeneratedByDefault] = useState(false);
  // mAI : modèle par défaut (toutes les requêtes mAI) + voix de lecture
  const [maiDefaultModel, setMaiDefaultModel] = useState('poolside/laguna-xs-2.1:free');
  const [maiTtsVoice, setMaiTtsVoice] = useState('flux-alexis-en');
  // Langue cible de traduction ('' = langue du navigateur, résolue à l'appel)
  const [uiLanguage, setUiLanguage] = useState('');
  const [models, setModels] = useState<Array<{ id: string; name: string; provider?: string }>>([]);
  const [voices, setVoices] = useState<Array<{ id: string; name: string }>>([]);
  // Cercle Privé (membres autorisés à voir les posts « Cercle Privé »)
  const [circleMembers, setCircleMembers] = useState<Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string }>>([]);
  // Audience par défaut des publications Vibe ('public', 'followers', 'circle')
  const [defaultVibeAudience, setDefaultVibeAudience] = useState<'public' | 'followers' | 'circle'>('public');
  // mAI — personnalisation du contexte (opt-in granulaire)
  const [maiContextPosts, setMaiContextPosts] = useState(false);
  const [maiContextDms, setMaiContextDms] = useState(false);
  const [maiContextBooks, setMaiContextBooks] = useState(false);
  // Coche bleue (badge vérifié) masquée par le propriétaire — comptes Plus/Pro/Max
  const [hideVerifiedBadge, setHideVerifiedBadge] = useState(false);
  // Recherche & sélection des personnes autorisées dans le Cercle Privé
  const [circleSearchQuery, setCircleSearchQuery] = useState('');
  const [circleSearchResults, setCircleSearchResults] = useState<Array<{
    id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
    followers_count?: number;
  }>>([]);
  const [isSearchingCircleUsers, setIsSearchingCircleUsers] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Éligibilité à la coche bleue : compte vérifié ou abonnement Plus/Pro/Max
  const canHideVerifiedBadge = Boolean(
    user?.is_verified || ['plus', 'pro', 'max'].includes((user?.tier || '').toLowerCase().trim())
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await ApiService.getSettings();
        if (res.settings) {
          const s = res.settings;
          setFeedDefaultMode(s.feed_default_mode || 'for_you');
          setHideReposts(s.hide_reposts ?? false);
          setBlockedKeywords(Array.isArray(s.blocked_keywords) ? s.blocked_keywords.join(', ') : (s.blocked_keywords || ''));
          setAllowDms(s.allow_dms || s.allow_dms_from || 'everyone');
          setDmsEnabled(s.dms_enabled ?? true);
          setDmAutoTranslate(Boolean(s.dm_auto_translate));
          setDmTranslateLang(String(s.dm_translate_lang || browserToDeepLCode(navigator.language || 'fr-FR')));
          setAllowMentions(s.allow_mentions || 'everyone');
          setContentFilter(s.content_filter_level || 'medium');
          setBlurSensitive(s.blur_sensitive_content ?? true);
          setEmailNotifs(s.email_notifications ?? true);
          setPushNotifs(s.push_notifications ?? true);
          if (s.mai_auto_approve_tools !== undefined) {
            setMaiAutoApproveTools(Boolean(s.mai_auto_approve_tools));
          }
          if (s.posts_ai_generated_by_default !== undefined) {
            setPostsAIGeneratedByDefault(Boolean(s.posts_ai_generated_by_default));
          }
          if (s.mai_default_model) {
            setMaiDefaultModel(String(s.mai_default_model));
          }
          setMaiTtsVoice(s.mai_tts_voice || 'flux-alexis-en');
          setUiLanguage(String(s.ui_language || ''));
          // Miroir local : PostCard/CommentSection lisent la langue sans re-appel API
          ApiService.setUiLanguageMirror(String(s.ui_language || ''));
          if (s.accent_color && s.accent_color in ACCENT_COLORS) {
            setAccentColor(s.accent_color as any);
          }
          if (s.font_size && ['small', 'medium', 'large'].includes(s.font_size)) {
            setFontSize(s.font_size as any);
          }
          if (s.message_bubble_theme && s.message_bubble_theme in MESSAGE_BUBBLE_THEMES) {
            setMessageBubbleTheme(s.message_bubble_theme as any);
          }
          if (s.chat_background_theme && s.chat_background_theme in CHAT_BACKGROUND_THEMES) {
            setChatBackgroundTheme(s.chat_background_theme as any);
          }
          if (s.message_bubble_shape && s.message_bubble_shape in MESSAGE_BUBBLE_SHAPES) {
            setMessageBubbleShape(s.message_bubble_shape as any);
          }
          if (s.default_vibe_audience && ['public', 'followers', 'circle'].includes(s.default_vibe_audience)) {
            setDefaultVibeAudience(s.default_vibe_audience as any);
          }
          if (s.mai_context_posts !== undefined) setMaiContextPosts(Boolean(s.mai_context_posts));
          if (s.mai_context_dms !== undefined) setMaiContextDms(Boolean(s.mai_context_dms));
          if (s.mai_context_books !== undefined) setMaiContextBooks(Boolean(s.mai_context_books));
          if (s.hide_verified_badge !== undefined) setHideVerifiedBadge(Boolean(s.hide_verified_badge));
          if (s.collab_auto_accept !== undefined) setCollabAutoAccept(Boolean(s.collab_auto_accept));
          // Outils mAI : liste activée (vide/null = tout activé → on coche tout)
          if (Array.isArray(s.mai_enabled_tools) && s.mai_enabled_tools.length > 0) {
            setMaiEnabledTools(s.mai_enabled_tools.map(String));
          }
        }
      } catch {}
    };
    loadSettings();
  }, [setTheme, setAccentColor, setFontSize, setMessageBubbleTheme, setChatBackgroundTheme, setMessageBubbleShape]);

  // Charge le catalogue d'outils mAI depuis l'index (GET /v1/mai/tools)
  useEffect(() => {
    ApiService.getMAITools()
      .then((res) => {
        const tools = (res?.tools || []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          sensitive: Boolean(t.sensitive),
          slash_command: t.slash_command,
        }));
        setMaiCatalog(tools);
        setMaiEnabledTools((prev) => {
          if (prev.length > 0) {
            // Filtre les ids inconnus du catalogue courant
            const valid = new Set(tools.map((t) => t.id));
            return prev.filter((id) => valid.has(id));
          }
          // Aucune sélection enregistrée = tous les outils activés
          return tools.map((t) => t.id);
        });
        setMaiToolsLoaded(true);
      })
      .catch(() => setMaiToolsLoaded(true));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const keywordsArray = blockedKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await ApiService.updateSettings({
        feed_default_mode: feedDefaultMode,
        hide_reposts: hideReposts,
        blocked_keywords: keywordsArray,
        two_factor_auth: true,
        allow_dms: allowDms,
        allow_dms_from: allowDms,
        dms_enabled: dmsEnabled,
        dm_auto_translate: dmAutoTranslate,
        dm_translate_lang: dmTranslateLang,
        allow_mentions: allowMentions,
        content_filter_level: contentFilter,
        blur_sensitive_content: blurSensitive,
        email_notifications: emailNotifs,
        push_notifications: pushNotifs,
        theme_preference: theme,
        accent_color: accentColor,
        font_size: fontSize,
        mai_auto_approve_tools: maiAutoApproveTools,
        posts_ai_generated_by_default: postsAIGeneratedByDefault,
        mai_default_model: maiDefaultModel,
        mai_tts_voice: maiTtsVoice,
        ui_language: uiLanguage,
        message_bubble_theme: messageBubbleTheme,
        chat_background_theme: chatBackgroundTheme,
        message_bubble_shape: messageBubbleShape,
        default_vibe_audience: defaultVibeAudience,
        mai_context_posts: maiContextPosts,
        mai_context_dms: maiContextDms,
        mai_context_books: maiContextBooks,
        hide_verified_badge: hideVerifiedBadge,
        collab_auto_accept: collabAutoAccept,
        mai_enabled_tools: maiEnabledTools,
      });

      // Miroir local immédiat (traduction des posts sans recharger les réglages)
      ApiService.setUiLanguageMirror(uiLanguage);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err.message || 'La sauvegarde des réglages a échoué.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await ApiService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibe-export-${user?.username || 'user'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || "Erreur lors de l'export. Vérifiez votre connexion.", 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Comptes bloqués & masqués (mute) ─────────────────────────────────
  const [blockedAccounts, setBlockedAccounts] = useState<Array<{ id: string; blocked_user_id: string; blocked_username?: string; blocked_display_name?: string; blocked_avatar_url?: string }>>([]);
  const [mutedAccounts, setMutedAccounts] = useState<Array<{ id: string; muted_user_id: string; muted_username?: string; muted_display_name?: string; muted_avatar_url?: string }>>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    Promise.all([
      ApiService.getBlockedUsers().catch(() => ({ blocked: [] })),
      ApiService.getMutedUsers().catch(() => ({ muted: [] })),
    ])
      .then(([blockedRes, mutedRes]) => {
        setBlockedAccounts(blockedRes?.blocked || []);
        setMutedAccounts(mutedRes?.muted || []);
      })
      .finally(() => setIsLoadingAccounts(false));

    // Liste des modèles mAI (API /v1/models) et des voix de lecture (API speech)
    ApiService.getModels().then((res) => setModels(res.models || [])).catch(() => {});
    ApiService.getSpeechVoices().then((res) => setVoices(res.voices || [])).catch(() => {});
    // Membres du Cercle Privé
    ApiService.getCircle().then((res) => setCircleMembers(res.members || [])).catch(() => {});
  }, []);

  // Recherche en direct d'utilisateurs pour le Cercle Privé
  useEffect(() => {
    const q = circleSearchQuery.trim().replace(/^@/, '');
    const timer = setTimeout(async () => {
      if (!q) {
        setCircleSearchResults([]);
        setIsSearchingCircleUsers(false);
        return;
      }
      setIsSearchingCircleUsers(true);
      try {
        const res = await ApiService.searchUsers(q);
        const filtered = (res?.users || []).filter(
          (u) => u.username?.toLowerCase() !== user?.username?.toLowerCase()
        );
        setCircleSearchResults(filtered);
      } catch {
        setCircleSearchResults([]);
      } finally {
        setIsSearchingCircleUsers(false);
      }
    }, q ? 250 : 0);
    return () => clearTimeout(timer);
  }, [circleSearchQuery, user?.username]);

  const handleAddToCircle = async (username: string) => {
    if (!username || addingUsername) return;
    setAddingUsername(username);
    try {
      await ApiService.addToCircle(username);
      const res = await ApiService.getCircle();
      setCircleMembers(res?.members || []);
      setCircleSearchQuery('');
      setCircleSearchResults([]);
      NotificationService.showInAppToast(
        'Cercle Privé 🔒',
        `@${username} a été ajouté à votre cercle privé avec succès.`,
        'success'
      );
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || "Impossible d'ajouter cet utilisateur au cercle.", 'error');
    } finally {
      setAddingUsername(null);
    }
  };

  const handleRemoveFromCircle = async (username: string) => {
    try {
      await ApiService.removeFromCircle(username);
      setCircleMembers((prev) => prev.filter((m) => m.username !== username));
      NotificationService.showInAppToast('Cercle Privé', `@${username} a été retiré de votre cercle.`, 'info');
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'Le retrait du cercle a échoué.', 'error');
    }
  };

  const handleUnblockAccount = async (userId: string, username?: string) => {
    try {
      await ApiService.unblockUser(userId);
      setBlockedAccounts((prev) => prev.filter((b) => b.blocked_user_id !== userId));
      NotificationService.showInAppToast(
        'Compte débloqué',
        `@${username || 'ce compte'} peut de nouveau interagir avec vous.`,
        'info'
      );
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'Le déblocage a échoué.', 'error');
    }
  };

  const handleUnmuteAccount = async (username?: string) => {
    if (!username) return;
    try {
      await ApiService.muteUser(username, false);
      setMutedAccounts((prev) => prev.filter((m) => m.muted_username !== username));
      NotificationService.showInAppToast(
        'Compte réactivé',
        `Les publications de @${username} réapparaissent dans votre fil.`,
        'info'
      );
    } catch (err: any) {
      NotificationService.showInAppToast('Erreur', err?.message || 'La réactivation a échoué.', 'error');
    }
  };

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-white" />
          <span>Paramètres & Personnalisation</span>
        </h1>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-2 animate-fadeIn shadow-lg">
            <Check className="w-4 h-4 text-white" />
            <span>Vos paramètres ont été enregistrés avec succès.</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Row 1: Apparence globale & Langue (Grid 2 cols sur desktop, 1 col sur mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 0: Apparence & Thème d'affichage */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sun className="w-4 h-4 text-white" />
                    <span>Apparence & Thème</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase">Par défaut : Clair</span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Choisissez l’affichage qui vous convient le mieux. Le thème clair est défini par défaut, ou optez pour le thème système ou sombre.
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'light',
                      label: 'Clair',
                      badge: 'Par défaut',
                      icon: Sun,
                      iconColor: 'text-zinc-200',
                      previewBg: 'bg-white border-zinc-200 text-zinc-900',
                    },
                    {
                      id: 'system',
                      label: 'Système',
                      badge: 'Auto OS',
                      icon: Laptop,
                      iconColor: 'text-zinc-200',
                      previewBg: 'bg-gradient-to-r from-white to-zinc-900 border-zinc-500 text-zinc-800',
                    },
                    {
                      id: 'dark',
                      label: 'Sombre',
                      badge: 'Nuit',
                      icon: Moon,
                      iconColor: 'text-zinc-200',
                      previewBg: 'bg-zinc-950 border-zinc-800 text-white',
                    },
                  ].map((item) => {
                    const isSelected = theme === item.id;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id as any)}
                        className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 min-h-[96px] ${
                          isSelected
                            ? 'bg-zinc-900 border-white text-white shadow-lg ring-1 ring-white/30'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="p-1.5 rounded-xl bg-zinc-800/80">
                            <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                          </div>
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-xs text-white">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {item.badge}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thème programmé (bascule automatique) */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                      <Moon className="w-3 h-3 text-zinc-400" /> Thème programmé
                    </p>
                    <p className="text-zinc-500 text-[11px]">
                      Bascule automatique clair/sombre (ex. 22h–7h = sombre). Inactif en mode « Système ».
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduledTheme.enabled}
                    onChange={(e) => setScheduledTheme({ ...scheduledTheme, enabled: e.target.checked })}
                    className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
                  />
                </div>
                {scheduledTheme.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Sombre dès</span>
                      <input
                        type="time"
                        value={scheduledTheme.darkStart}
                        onChange={(e) => setScheduledTheme({ ...scheduledTheme, darkStart: e.target.value || '22:00' })}
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Clair dès</span>
                      <input
                        type="time"
                        value={scheduledTheme.darkEnd}
                        onChange={(e) => setScheduledTheme({ ...scheduledTheme, darkEnd: e.target.value || '07:00' })}
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Taille du texte */}
              <div className="space-y-2 pt-3 border-t border-zinc-900">
                <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-zinc-400" /> Taille du texte
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'small', label: 'Petite', sample: 'text-[11px]' },
                    { id: 'medium', label: 'Moyenne', sample: 'text-xs' },
                    { id: 'large', label: 'Grande', sample: 'text-sm' },
                  ] as const).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id as any)}
                      className={`py-2 px-3 rounded-xl border font-semibold transition-all flex flex-col items-center gap-0.5 ${
                        fontSize === s.id
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className={s.sample}>Aa</span>
                      <span className="text-[10px]">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 0b & 0c: Accent & Langue de traduction */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Palette className="w-4 h-4 text-white" />
                  <span>Personnalisation & Langue</span>
                </div>

                {/* Couleur d'accent */}
                <div className="space-y-2">
                  <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center justify-between">
                    <span>Couleur d'accent</span>
                    <span className="text-zinc-500 font-normal lowercase">{ACCENT_COLORS[accentColor]?.label || accentColor}</span>
                  </label>
                  <p className="text-zinc-500 text-[11px]">Boutons d'action et éléments interactifs clés.</p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {(Object.keys(ACCENT_COLORS) as Array<keyof typeof ACCENT_COLORS>).map((key) => {
                      const c = ACCENT_COLORS[key];
                      const isSelected = accentColor === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setAccentColor(key as any)}
                          title={c.label}
                          className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            isSelected ? 'border-white shadow-lg ring-1 ring-white/50' : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-black stroke-[3] absolute inset-0 m-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Langue de traduction */}
              <div className="space-y-2 pt-3 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Languages className="w-3 h-3 text-zinc-400" /> Langue de traduction
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Auto : {browserToDeepLCode(typeof navigator !== 'undefined' ? navigator.language : '')}
                  </span>
                </div>
                <p className="text-zinc-500 text-[11px]">
                  Langue cible du bouton « Traduire » sur les publications et réponses.
                </p>
                <select
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                >
                  <option value="">Langue du navigateur (automatique)</option>
                  {TRANSLATION_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Personnalisation des discussions & messages (composant dedie) */}
          <ChatAppearanceSection />

          {/* Row 3: Fils d'actualité & Modération (Grid 2 cols sur desktop, 1 col sur mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Personnalisation des Fils */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sliders className="w-4 h-4 text-white" />
                <span>Personnalisation des Fils d’actualité</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase text-[11px]">Fil d'actualité par défaut</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'for_you', label: 'Pour Vous (IA)' },
                      { id: 'stream', label: 'Abonnements' },
                      { id: 'trending', label: 'Tendances' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFeedDefaultMode(mode.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          feedDefaultMode === mode.id
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <div>
                    <span className="font-semibold text-white">Masquer les repartages (reposts)</span>
                    <p className="text-zinc-500 text-[11px]">N'affiche que les publications originales dans votre flux</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hideReposts}
                    onChange={(e) => setHideReposts(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                  <label className="text-zinc-400 font-mono uppercase text-[11px]">Mots-clés & #Hashtags masqués</label>
                  <input
                    type="text"
                    value={blockedKeywords}
                    onChange={(e) => setBlockedKeywords(e.target.value)}
                    placeholder="spoilers, politique, crypto (séparés par des virgules)"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Modération & Contenu */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <EyeOff className="w-4 h-4 text-white" />
                <span>Modération du contenu</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase text-[11px]">Filtre IA de toxicité</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'strict'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setContentFilter(lvl)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          contentFilter === lvl
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lvl === 'low' ? 'Léger' : lvl === 'medium' ? 'Modéré' : 'Strict'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <div>
                    <span className="font-semibold text-white">Flouter les médias sensibles</span>
                    <p className="text-zinc-500 text-[11px]">Affiche un filtre d'avertissement sur les images sensibles</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={blurSensitive}
                    onChange={(e) => setBlurSensitive(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Sécurité & Notifications (Grid 2 cols sur desktop, 1 col sur mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 2: Sécurité & Confidentialité */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Shield className="w-4 h-4 text-white" />
                <span>Sécurité & Confidentialité</span>
              </div>

              <div className="space-y-4 text-xs">
                {/* 2FA — Actif et obligatoire */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Double authentification (2FA)</span>
                      <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full font-bold">ACTIF</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      La 2FA est activée sur votre compte et obligatoire sur Vibe.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                  <label className="text-zinc-400 font-mono uppercase text-[11px]">Qui peut vous envoyer des messages privés (DM)</label>
                  <select
                    value={allowDms}
                    onChange={(e) => setAllowDms(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="everyone">Tout le monde</option>
                    <option value="following">Mes abonnements uniquement</option>
                    <option value="nobody">Personne (DMs désactivés)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-900">
                  <div>
                    <span className="font-semibold text-white">Traduction automatique des messages</span>
                    <p className="text-zinc-500 text-[11px]">
                      Traduit automatiquement les messages privés reçus dans la langue choisie.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dmAutoTranslate}
                    onChange={(e) => setDmAutoTranslate(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer shrink-0"
                  />
                </div>
                {dmAutoTranslate && (
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono uppercase text-[11px]">Langue de la traduction automatique</label>
                    <select
                      value={dmTranslateLang}
                      onChange={(e) => setDmTranslateLang(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
                    >
                      {TRANSLATION_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                  <label className="text-zinc-400 font-mono uppercase text-[11px]">Qui peut vous mentionner (@pseudo)</label>
                  <select
                    value={allowMentions}
                    onChange={(e) => setAllowMentions(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="everyone">Tout le monde</option>
                    <option value="following">Mes abonnements uniquement</option>
                    <option value="nobody">Personne</option>
                  </select>
                </div>

                {/* Co-auteurs : auto-acceptation des co-signatures (sans invitation) */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <div>
                    <span className="font-semibold text-white">Co-auteurs sans invitation</span>
                    <p className="text-zinc-500 text-[11px]">
                      Quand quelqu'un vous désigne co-auteur d'une publication, la co-signature est acceptée automatiquement (simple notification, aucune validation).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={collabAutoAccept}
                    onChange={(e) => setCollabAutoAccept(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>

                {canHideVerifiedBadge && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                    <div>
                      <span className="font-semibold text-white">Masquer la coche bleue</span>
                      <p className="text-zinc-500 text-[11px]">
                        Retire le badge vérifié de votre profil public, même avec un abonnement Plus, Pro ou Max.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hideVerifiedBadge}
                      onChange={(e) => setHideVerifiedBadge(e.target.checked)}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Notifications */}
            <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bell className="w-4 h-4 text-white" />
                <span>Notifications</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">Notifications par e-mail</span>
                    <p className="text-zinc-500 text-[11px]">Réception de résumés d'activités et messages importants</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <div>
                    <span className="font-semibold text-white">Notifications push sur l'appareil</span>
                    <p className="text-zinc-500 text-[11px]">Alertes en direct pour les likes, partages et messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotifs}
                    onChange={(e) => setPushNotifs(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>

                <DevicePermissionHint />

                <InstallAppHint />

                {/* Section Retour Haptique & Vibrations Tactiles */}
                <div className="pt-3 border-t border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Animations & effets visuels</span>
                      </div>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        Burst de likes, particules, spring navigation, transitions. Coupé auto si « Réduire les animations » OS.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={animationsEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAnimationsEnabledState(val);
                        setAnimationsEnabled(val);
                      }}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Vibrations & retour haptique mobile</span>
                      </div>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        {hapticsSupported
                          ? 'Sensations tactiles lors des likes (battement de cœur), publications, signets et navigation'
                          : 'Retour haptique non disponible sur cet appareil.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hapticsEnabled}
                      disabled={!hapticsSupported}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setHapticsEnabled(val);
                        haptics.setEnabled(val);
                        if (val) haptics.like();
                      }}
                      className="w-4 h-4 accent-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>

                  {hapticsEnabled && hapticsSupported && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => haptics.like()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-rose-500 dark:text-rose-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        ❤️ Tester le Like (Heartbeat)
                      </button>
                      <button
                        type="button"
                        onClick={() => haptics.selection()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-500 dark:text-sky-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        📳 Tester la Sélection
                      </button>
                      <button
                        type="button"
                        onClick={() => haptics.success()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-600 dark:text-emerald-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        🚀 Tester le Succès
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Comptes bloqués & masqués (Pleine largeur) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Ban className="w-4 h-4 text-white" />
                <span>Comptes bloqués &amp; masqués</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Modération personnelle</span>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Chargement des listes…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Comptes bloqués */}
                <div className="space-y-2">
                  <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Ban className="w-3 h-3 text-zinc-400" />
                    Bloqués ({blockedAccounts.length}) — contact coupé
                  </p>
                  {blockedAccounts.length === 0 ? (
                    <p className="text-zinc-600 text-[11px]">Aucun compte bloqué.</p>
                  ) : (
                    <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-40 overflow-y-auto">
                      {blockedAccounts.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {b.blocked_display_name || b.blocked_username}
                            </span>
                            <span className="text-zinc-500">@{b.blocked_username}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnblockAccount(b.blocked_user_id, b.blocked_username)}
                            className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-900 hover:text-white transition-colors shrink-0 text-xs"
                          >
                            Débloquer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comptes masqués */}
                <div className="space-y-2">
                  <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <EyeOff className="w-3 h-3 text-zinc-400" />
                    Masqués ({mutedAccounts.length}) — silencieux
                  </p>
                  {mutedAccounts.length === 0 ? (
                    <p className="text-zinc-600 text-[11px]">Aucun compte masqué.</p>
                  ) : (
                    <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-40 overflow-y-auto">
                      {mutedAccounts.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {m.muted_display_name || m.muted_username}
                            </span>
                            <span className="text-zinc-500">@{m.muted_username}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnmuteAccount(m.muted_username)}
                            className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-900 hover:text-white transition-colors shrink-0 text-xs"
                          >
                            Réactiver
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Cercle Privé & Audience par défaut des Vibes (Pleine largeur) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <Users className="w-5 h-5 text-white" />
                  <span>Cercle Privé &amp; Audience par défaut des Vibes</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Définissez l'audience appliquée par défaut à vos publications et composez votre liste de personnes autorisées.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-white" />
                  <span>{circleMembers.length} {circleMembers.length > 1 ? 'personnes autorisées' : 'personne autorisée'}</span>
                </span>
              </div>
            </div>

            {/* 1. Audience par défaut des publications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Audience par défaut dans les Vibes</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Enregistré en table SQL</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                L'audience sélectionnée sera choisie par défaut lors de la rédaction de chaque nouvelle publication Vibe.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  {
                    id: 'public',
                    label: 'Public',
                    icon: Globe,
                    badge: 'Par défaut',
                    description: 'Tout le monde peut voir et interagir avec vos publications sur le fil.',
                  },
                  {
                    id: 'followers',
                    label: 'Abonnés uniquement',
                    icon: Users,
                    badge: null,
                    description: 'Seuls les utilisateurs qui vous suivent ont accès à vos publications.',
                  },
                  {
                    id: 'circle',
                    label: 'Cercle Privé',
                    icon: Lock,
                    badge: `${circleMembers.length} membres`,
                    description: 'Uniquement les membres autorisés de votre cercle privé ci-dessous.',
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = defaultVibeAudience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDefaultVibeAudience(opt.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-zinc-900 border-white ring-1 ring-white/50 text-white shadow-lg shadow-white/5'
                          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-white">{opt.label}</span>
                        </div>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : opt.badge ? (
                          <span className="text-[9px] font-mono uppercase bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded">
                            {opt.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Recherche & Sélection des personnes autorisées pour le Cercle Privé */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Concevoir votre cercle privé</span>
                </label>
                <span className="text-[11px] text-zinc-500">
                  Recherchez et sélectionnez les noms d'utilisateurs autorisés
                </span>
              </div>

              {/* Champ de recherche */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  {isSearchingCircleUsers ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </div>
                <input
                  type="text"
                  value={circleSearchQuery}
                  onChange={(e) => setCircleSearchQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur par @pseudo ou nom complet..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {circleSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCircleSearchQuery('');
                      setCircleSearchResults([]);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Résultats de recherche en direct */}
              {circleSearchQuery.trim().length > 0 && (
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 animate-fadeIn max-h-60 overflow-y-auto">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 px-1 flex items-center justify-between">
                    <span>Résultats pour « {circleSearchQuery} »</span>
                    <span>{circleSearchResults.length} trouvé{circleSearchResults.length > 1 ? 's' : ''}</span>
                  </div>

                  {isSearchingCircleUsers ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Recherche en cours...</span>
                    </div>
                  ) : circleSearchResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      Aucun utilisateur trouvé correspondant à « {circleSearchQuery} ».
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/60">
                      {circleSearchResults.map((u) => {
                        const isAlreadyMember = circleMembers.some(
                          (m) => m.username.toLowerCase() === u.username.toLowerCase()
                        );
                        const isAdding = addingUsername === u.username;
                        return (
                          <div
                            key={u.id}
                            className="flex items-center justify-between gap-3 py-2 px-1 hover:bg-zinc-800/30 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ProfileAvatar
                                src={u.avatar_url}
                                fallbackName={u.display_name || u.username}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-white truncate">
                                    {u.display_name || u.username}
                                  </span>
                                  {u.is_verified && <VerifiedBadge isVerified={true} size="xs" />}
                                </div>
                                <span className="text-[11px] text-zinc-400">@{u.username}</span>
                              </div>
                            </div>

                            {isAlreadyMember ? (
                              <span className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Déjà dans le cercle</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isAdding}
                                onClick={() => handleAddToCircle(u.username)}
                                className="shrink-0 px-3 py-1 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                              >
                                {isAdding ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Ajout...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3 h-3" />
                                    <span>Ajouter au cercle</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Liste des personnes autorisées */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-zinc-400" />
                    <span>Personnes autorisées ({circleMembers.length})</span>
                  </p>
                  {circleMembers.length > 0 && (
                    <span className="text-[10px] text-zinc-500">
                      Ces membres ont un accès exclusif aux Vibes publiées en Cercle Privé
                    </span>
                  )}
                </div>

                {circleMembers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1">
                    <p className="text-zinc-400 text-xs font-medium">Votre cercle privé est actuellement vide.</p>
                    <p className="text-zinc-600 text-[11px]">
                      Recherchez des utilisateurs par leur pseudo ci-dessus pour composer votre cercle de personnes autorisées.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800 max-h-60 overflow-y-auto bg-zinc-900/30">
                    {circleMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-2.5 hover:bg-zinc-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ProfileAvatar
                            src={m.avatar_url}
                            fallbackName={m.display_name || m.username}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white text-xs block truncate">
                              {m.display_name || m.username}
                            </span>
                            <span className="text-zinc-500 text-[11px]">@{m.username}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCircle(m.username)}
                          className="px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 text-xs transition-colors shrink-0 flex items-center gap-1"
                          title={`Retirer @${m.username} du cercle privé`}
                        >
                          <X className="w-3 h-3" />
                          <span>Retirer</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 6: Intelligence Artificielle mAI (Pleine largeur) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-white" />
              <span>Intelligence Artificielle mAI</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <span className="font-semibold text-white">Approbation auto des outils mAI</span>
                    <p className="text-zinc-500 text-[11px]">
                      Exécuter ses requêtes sans confirmation manuelle
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maiAutoApproveTools}
                    onChange={(e) => setMaiAutoApproveTools(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <span className="font-semibold text-white">Posts marqués IA par défaut</span>
                    <p className="text-zinc-500 text-[11px]">
                      Badge « Créé avec l'IA » activé automatiquement
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={postsAIGeneratedByDefault}
                    onChange={(e) => setPostsAIGeneratedByDefault(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
                  />
                </div>
              </div>

              {/* mAI — personnalisation du contexte (opt-in) */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900">
                <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-zinc-400" /> mAI — Personnalisation du contexte
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Autorisez mAI à connaître vos contenus pour des réponses plus personnalisées.
                </p>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-xs text-zinc-300">Mes publications</span>
                  <input
                    type="checkbox"
                    checked={maiContextPosts}
                    onChange={(e) => setMaiContextPosts(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer shrink-0"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-300">Mes messages privés</span>
                    <input
                      type="checkbox"
                      checked={maiContextDms}
                      onChange={(e) => setMaiContextDms(e.target.checked)}
                      className="w-4 h-4 accent-white cursor-pointer shrink-0"
                    />
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/90">
                    ⚠️ Confidentiel : seuls des extraits tronqués sont transmis à mAI, jamais cités verbatim.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-xs text-zinc-300">Mes Vibe Books</span>
                  <input
                    type="checkbox"
                    checked={maiContextBooks}
                    onChange={(e) => setMaiContextBooks(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer shrink-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
                {/* Modèle mAI par défaut */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-zinc-400" />
                    Modèle mAI par défaut
                  </label>
                  {models.length > 0 ? (
                    <select
                      value={maiDefaultModel}
                      onChange={(e) => setMaiDefaultModel(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.provider ? ` — ${m.provider}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Chargement des modèles…</span>
                    </div>
                  )}
                  <p className="text-zinc-600 text-[10px] font-mono truncate">{maiDefaultModel}</p>
                </div>

                {/* Voix de lecture mAI */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3 text-zinc-400" />
                    Voix de lecture mAI
                  </label>
                  {voices.length > 0 ? (
                    <select
                      value={maiTtsVoice}
                      onChange={(e) => setMaiTtsVoice(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || v.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Chargement des voix…</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Outils mAI disponibles (catalogue lib/tools/index.json) */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                    <Wrench className="w-3 h-3 text-zinc-400" /> Outils disponibles pour mAI
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setMaiEnabledTools((prev) =>
                        prev.length === maiCatalog.length ? [] : maiCatalog.map((t) => t.id)
                      )
                    }
                    className="text-[10px] font-bold text-zinc-400 hover:text-white underline underline-offset-2"
                  >
                    {maiEnabledTools.length === maiCatalog.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
                <p className="text-zinc-500 text-[11px]">
                  Choisissez les outils que mAI peut utiliser en votre nom. Les outils sensibles restent soumis à l'approbation ci-dessus.
                </p>
                {!maiToolsLoaded ? (
                  <div className="flex items-center gap-2 text-zinc-500 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Chargement du catalogue…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {maiCatalog.map((tool) => {
                      const checked = maiEnabledTools.includes(tool.id);
                      return (
                        <label
                          key={tool.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                            checked ? 'bg-zinc-900 border-zinc-600' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setMaiEnabledTools((prev) =>
                                prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id]
                              )
                            }
                            className="w-4 h-4 accent-white cursor-pointer mt-0.5 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white">{tool.name}</span>
                              {tool.sensitive && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">sensible</span>
                              )}
                            </span>
                            <span className="block text-[10px] text-zinc-500 font-mono">{tool.slash_command}</span>
                            <span className="block text-[11px] text-zinc-400 line-clamp-2">{tool.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-zinc-600 text-[10px]">
                  {maiEnabledTools.length}/{maiCatalog.length} outils activés
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-8 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-40"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </form>

        {/* Section Aide & Tutoriel — rejoue l'intro ou la visite guidée */}
        <div data-tour="settings-tutorial" className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <GraduationCap className="w-4 h-4 text-white" />
            <span>Aide & Tutoriel</span>
          </div>

          <p className="text-xs text-zinc-400">
            Revoyez la visite guidée des pages (Accueil, Explorer, Profil, Statistiques…) ou l'intro de départ en 3 étapes (intérêts, comptes, premier post).
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startFullTour(navigate)}
              className="py-2.5 px-5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refaire le tutoriel</span>
            </button>
            <button
              type="button"
              onClick={restartOnboarding}
              className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Revoir l'intro (3 étapes)</span>
            </button>
          </div>
        </div>

        {/* Section Données & Compte */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Download className="w-4 h-4 text-white" />
            <span>Données personnelles & Export</span>
          </div>

          <p className="text-xs text-zinc-400">
            Téléchargez une archive complète de vos publications, messages et paramètres au format JSON.
          </p>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportation...' : 'Télécharger mes données (JSON)'}</span>
          </button>
        </div>

        {/* Footer légal & version — sync package.json */}
        {/* APP_VERSION: 0.9.0 (sync package.json) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          <div className="text-[11px] text-zinc-500">
            <p className="font-mono">Vibe v0.9.0</p>
            <p>© 2026 mAI Devs — Tous droits réservés</p>
          </div>
          <a
            href="https://mai-devs.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Conditions d'utilisation (CGU)
          </a>
        </div>
      </div>
    </div>
  );
};
