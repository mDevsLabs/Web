/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SETTINGS PAGE (src/pages/SettingsPage.tsx)
 * Personalize Feeds, Security (2FA), Privacy (DMs, Mentions), Moderation & Data Export
 * ============================================================================
 */

import { CheckIcon as Check, SettingsIcon as Settings } from "@mdevs/icons";
import type React from "react";
import { useEffect, useState } from "react";
import {
  AppearanceSettingsSection,
  BlockedAccountsSection,
  ChatAppearanceSection,
  CircleAudienceSection,
  FeedSettingsSection,
  MaiSettingsSection,
  ModerationSettingsSection,
  NotificationsHapticsSection,
  PrivacySecuritySettingsSection,
  TutorialDataSection,
} from "@/components/vibe/settings";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import {
  ACCENT_COLORS,
  CHAT_BACKGROUND_THEMES,
  MESSAGE_BUBBLE_SHAPES,
  MESSAGE_BUBBLE_THEMES,
  useTheme,
} from "@/lib/vibe/context/ThemeContext";
import { getAnimationsEnabled } from "@/lib/vibe/services/animationPrefs";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";

export const SettingsPage: React.FC<{
  hydration?: import("@/lib/vibe/types/vibe").VibeHydrationSeed<unknown>;
}> = ({ hydration }) => {
  const { user, restartOnboarding } = useAuth();
  const {
    theme,
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
  } = useTheme();

  // Feed customization
  const [feedDefaultMode, setFeedDefaultMode] = useState<
    "for_you" | "stream" | "trending"
  >("for_you");
  const [hideReposts, setHideReposts] = useState(false);
  const [blockedKeywords, setBlockedKeywords] = useState("");

  // Security & Privacy
  const [allowDms, setAllowDms] = useState<"everyone" | "following" | "nobody">(
    "everyone"
  );
  const [dmAutoTranslate, setDmAutoTranslate] = useState(false);
  const [dmTranslateLang, setDmTranslateLang] = useState("EN-US");
  const [dmsEnabled, setDmsEnabled] = useState(true);
  const [allowMentions, setAllowMentions] = useState<
    "everyone" | "following" | "nobody"
  >("everyone");

  // Moderation & Notifications
  const [contentFilter, setContentFilter] = useState<
    "low" | "medium" | "strict"
  >("medium");
  const [blurSensitive, setBlurSensitive] = useState(true);
  // Les préférences de NOTIFICATION (e-mail, push) ne sont plus gérées ici:
  // elles appartiennent à l'onglet « Notifications» des paramètres mAI, qui
  // regroupe mAI, Vibe et Wakies. Les laisser ici créerait deux endroits
  // pour la même décision.
  const [hapticsEnabled, setHapticsEnabled] = useState(() =>
    haptics.isEnabled()
  );
  const hapticsSupported = haptics.isSupported();
  const [animationsEnabled, setAnimationsEnabledState] = useState(() =>
    getAnimationsEnabled()
  );
  const [maiAutoApproveTools, setMaiAutoApproveTools] = useState(false);
  const [maiCatalog, setMaiCatalog] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      sensitive: boolean;
      slash_command: string;
    }>
  >([]);
  const [maiEnabledTools, setMaiEnabledTools] = useState<string[]>([]);
  const [maiToolsLoaded, setMaiToolsLoaded] = useState(false);
  const [collabAutoAccept, setCollabAutoAccept] = useState(false);
  const [postsAIGeneratedByDefault, setPostsAIGeneratedByDefault] =
    useState(false);
  const [maiDefaultModel, setMaiDefaultModel] = useState(
    "poolside/laguna-xs-2.1:free"
  );
  const [maiTtsVoice, setMaiTtsVoice] = useState("flux-alexis-en");
  const [uiLanguage, setUiLanguage] = useState("");
  const [models, setModels] = useState<
    Array<{ id: string; name: string; provider?: string }>
  >([]);
  const [voices, setVoices] = useState<Array<{ id: string; name: string }>>([]);

  // Cercle Privé
  const [circleMembers, setCircleMembers] = useState<
    Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
    }>
  >([]);
  const [defaultVibeAudience, setDefaultVibeAudience] = useState<
    "public" | "followers" | "circle"
  >("public");
  const [maiContextPosts, setMaiContextPosts] = useState(false);
  const [maiContextDms, setMaiContextDms] = useState(false);
  const [maiContextBooks, setMaiContextBooks] = useState(false);
  const [hideVerifiedBadge, setHideVerifiedBadge] = useState(false);

  // Recherche d'utilisateurs Cercle Privé
  const [circleSearchQuery, setCircleSearchQuery] = useState("");
  const [circleSearchResults, setCircleSearchResults] = useState<
    Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
    }>
  >([]);
  const [isSearchingCircleUsers, setIsSearchingCircleUsers] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Éligibilité à la coche bleue
  const canHideVerifiedBadge = Boolean(
    user?.is_verified ||
      ["plus", "pro", "max"].includes((user?.tier || "").toLowerCase().trim())
  );

  // Chargement des réglages
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const d = hydration?.data as { settings?: Record<string, any> } | null;
        const seedOk =
!!d?.settings &&
          (hydration!.as === null
?!user
:!user || String(hydration!.as) === String(user.id?? ""));
        const res = seedOk? d!: await ApiService.getSettings();
        if (res.settings) {
          const s = res.settings;
          setFeedDefaultMode(s.feed_default_mode || "for_you");
          setHideReposts(s.hide_reposts?? false);
          setBlockedKeywords(
            Array.isArray(s.blocked_keywords)
? s.blocked_keywords.join(", ")
: s.blocked_keywords || ""
          );
          setAllowDms(s.allow_dms_from || s.allow_dms || "everyone");
          setDmAutoTranslate(Boolean(s.dm_auto_translate));
          setDmTranslateLang(s.dm_translate_lang || "EN-US");
          setDmsEnabled(s.dms_enabled!== false);
          setAllowMentions(s.allow_mentions || "everyone");
          setContentFilter(s.content_filter_level || "medium");
          setBlurSensitive(s.blur_sensitive_content?? true);
          setMaiAutoApproveTools(s.mai_auto_approve_tools?? false);
          setPostsAIGeneratedByDefault(
            s.posts_ai_generated_by_default?? false
          );
          if (s.mai_default_model) {
            setMaiDefaultModel(String(s.mai_default_model));
          }
          setMaiTtsVoice(s.mai_tts_voice || "flux-alexis-en");
          setUiLanguage(String(s.ui_language || ""));
          ApiService.setUiLanguageMirror(String(s.ui_language || ""));
          if (s.accent_color && s.accent_color in ACCENT_COLORS) {
            setAccentColor(s.accent_color as any);
          }
          if (
            s.font_size &&
            ["small", "medium", "large"].includes(s.font_size)
          ) {
            setFontSize(s.font_size as any);
          }
          if (
            s.message_bubble_theme &&
            s.message_bubble_theme in MESSAGE_BUBBLE_THEMES
          ) {
            setMessageBubbleTheme(s.message_bubble_theme as any);
          }
          if (
            s.chat_background_theme &&
            s.chat_background_theme in CHAT_BACKGROUND_THEMES
          ) {
            setChatBackgroundTheme(s.chat_background_theme as any);
          }
          if (
            s.message_bubble_shape &&
            s.message_bubble_shape in MESSAGE_BUBBLE_SHAPES
          ) {
            setMessageBubbleShape(s.message_bubble_shape as any);
          }
          if (
            s.default_vibe_audience &&
            ["public", "followers", "circle"].includes(s.default_vibe_audience)
          ) {
            setDefaultVibeAudience(s.default_vibe_audience as any);
          }
          if (s.mai_context_posts!== undefined)
            setMaiContextPosts(Boolean(s.mai_context_posts));
          if (s.mai_context_dms!== undefined)
            setMaiContextDms(Boolean(s.mai_context_dms));
          if (s.mai_context_books!== undefined)
            setMaiContextBooks(Boolean(s.mai_context_books));
          if (s.hide_verified_badge!== undefined)
            setHideVerifiedBadge(Boolean(s.hide_verified_badge));
          if (s.collab_auto_accept!== undefined)
            setCollabAutoAccept(Boolean(s.collab_auto_accept));
          if (
            Array.isArray(s.mai_enabled_tools) &&
            s.mai_enabled_tools.length > 0
          ) {
            setMaiEnabledTools(s.mai_enabled_tools.map(String));
          }
        }
      } catch {}
    };
    loadSettings();
  }, [
    setAccentColor,
    setFontSize,
    setMessageBubbleTheme,
    setChatBackgroundTheme,
    setMessageBubbleShape,
    hydration?.as,
    hydration?.data,
    user,
  ]);

  // Charge le catalogue d'outils mAI
  useEffect(() => {
    ApiService.getMAITools()
.then((res) => {
        const tools = (res?.tools || []).map((t) => ({
          category: t.category,
          description: t.description,
          id: t.id,
          name: t.name,
          sensitive: Boolean(t.sensitive),
          slash_command: t.slash_command,
        }));
        setMaiCatalog(tools);
        setMaiEnabledTools((prev) => {
          if (prev.length > 0) {
            const valid = new Set(tools.map((t) => t.id));
            return prev.filter((id) => valid.has(id));
          }
          return tools.map((t) => t.id);
        });
        setMaiToolsLoaded(true);
      })
.catch(() => setMaiToolsLoaded(true));
  }, []);

  // Comptes bloqués & masqués
  const [blockedAccounts, setBlockedAccounts] = useState<
    Array<{
      id: string;
      blocked_user_id: string;
      blocked_username?: string;
      blocked_display_name?: string;
      blocked_avatar_url?: string;
    }>
  >([]);
  const [mutedAccounts, setMutedAccounts] = useState<
    Array<{
      id: string;
      muted_user_id: string;
      muted_username?: string;
      muted_display_name?: string;
      muted_avatar_url?: string;
    }>
  >([]);
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

    ApiService.getModels()
.then((res) => setModels(res.models || []))
.catch(() => {});
    ApiService.getSpeechVoices()
.then((res) => setVoices(res.voices || []))
.catch(() => {});
  }, []);

  // Membres du Cercle Privé
  useEffect(() => {
    if (!user) return;
    const seedData = hydration?.data as {
      circle?: { members: any[] };
      settings?: Record<string, any>;
    } | null;
    const seedViewerOk =
      hydration?.as === null || String(hydration?.as) === String(user.id?? "");
    if (seedData?.circle?.members && seedViewerOk) {
      setCircleMembers(seedData.circle.members);
      return;
    }
    ApiService.getCircle()
.then((res) => setCircleMembers(res.members || []))
.catch(() => {});
  }, [hydration?.as, hydration?.data, user]);

  // Recherche en direct Cercle Privé
  useEffect(() => {
    const q = circleSearchQuery.trim().replace(/^@/, "");
    const timer = setTimeout(
      async () => {
        if (!q) {
          setCircleSearchResults([]);
          setIsSearchingCircleUsers(false);
          return;
        }
        setIsSearchingCircleUsers(true);
        try {
          const res = await ApiService.searchUsers(q);
          const filtered = (res?.users || []).filter(
            (u) => u.username?.toLowerCase()!== user?.username?.toLowerCase()
          );
          setCircleSearchResults(filtered);
        } catch {
          setCircleSearchResults([]);
        } finally {
          setIsSearchingCircleUsers(false);
        }
      },
      q? 250: 0
    );
    return () => clearTimeout(timer);
  }, [circleSearchQuery, user?.username]);

  const handleAddToCircle = async (username: string) => {
    if (!username || addingUsername) return;
    setAddingUsername(username);
    try {
      await ApiService.addToCircle(username);
      const res = await ApiService.getCircle();
      setCircleMembers(res?.members || []);
      setCircleSearchQuery("");
      setCircleSearchResults([]);
      NotificationService.showInAppToast(
        "Cercle Privé ",
        `@${username} a été ajouté à votre cercle privé avec succès.`,
        "success"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Impossible d'ajouter cet utilisateur au cercle.",
        "error"
      );
    } finally {
      setAddingUsername(null);
    }
  };

  const handleRemoveFromCircle = async (username: string) => {
    try {
      await ApiService.removeFromCircle(username);
      setCircleMembers((prev) => prev.filter((m) => m.username!== username));
      NotificationService.showInAppToast(
        "Cercle Privé",
        `@${username} a été retiré de votre cercle.`,
        "info"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Le retrait du cercle a échoué.",
        "error"
      );
    }
  };

  const handleUnblockAccount = async (userId: string, username?: string) => {
    try {
      await ApiService.unblockUser(userId);
      setBlockedAccounts((prev) =>
        prev.filter((b) => b.blocked_user_id!== userId)
      );
      NotificationService.showInAppToast(
        "Compte débloqué",
        `@${username || "ce compte"} peut de nouveau interagir avec vous.`,
        "info"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Le déblocage a échoué.",
        "error"
      );
    }
  };

  const handleUnmuteAccount = async (username?: string) => {
    if (!username) return;
    try {
      await ApiService.muteUser(username, false);
      setMutedAccounts((prev) =>
        prev.filter((m) => m.muted_username!== username)
      );
      NotificationService.showInAppToast(
        "Compte réactivé",
        `Les publications de @${username} réapparaissent dans votre fil.`,
        "info"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "La réactivation a échoué.",
        "error"
      );
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const keywordsArray = blockedKeywords
.split(",")
.map((k) => k.trim())
.filter(Boolean);

      await ApiService.updateSettings({
        accent_color: accentColor,
        allow_dms: allowDms,
        allow_dms_from: allowDms,
        allow_mentions: allowMentions,
        blocked_keywords: keywordsArray,
        blur_sensitive_content: blurSensitive,
        chat_background_theme: chatBackgroundTheme,
        collab_auto_accept: collabAutoAccept,
        content_filter_level: contentFilter,
        default_vibe_audience: defaultVibeAudience,
        dm_auto_translate: dmAutoTranslate,
        dm_translate_lang: dmTranslateLang,
        dms_enabled: dmsEnabled,
        feed_default_mode: feedDefaultMode,
        font_size: fontSize,
        hide_reposts: hideReposts,
        hide_verified_badge: hideVerifiedBadge,
        mai_auto_approve_tools: maiAutoApproveTools,
        mai_context_books: maiContextBooks,
        mai_context_dms: maiContextDms,
        mai_context_posts: maiContextPosts,
        mai_default_model: maiDefaultModel,
        mai_enabled_tools: maiEnabledTools,
        mai_tts_voice: maiTtsVoice,
        message_bubble_shape: messageBubbleShape,
        message_bubble_theme: messageBubbleTheme,
        posts_ai_generated_by_default: postsAIGeneratedByDefault,
        theme_preference: theme,
        two_factor_auth: true,
        ui_language: uiLanguage,
      });

      ApiService.setUiLanguageMirror(uiLanguage);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err.message || "La sauvegarde des réglages a échoué.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await ApiService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibe-export-${user?.username || "user"}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Erreur",
        err?.message || "Erreur lors de l'export. Vérifiez votre connexion.",
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-white" />
          <span>Paramètres &amp; Personnalisation</span>
        </h1>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-2 animate-fadeIn shadow-lg">
            <Check className="w-4 h-4 text-white" />
            <span>Vos paramètres ont été enregistrés avec succès.</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSaveSettings}>
          {/* Row 1: Apparence globale & Langue */}
          <AppearanceSettingsSection
            setUiLanguage={setUiLanguage}
            uiLanguage={uiLanguage}
          />

          {/* Row 2: Personnalisation des discussions & messages */}
          <ChatAppearanceSection />

          {/* Row 3: Fils d'actualité & Modération */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeedSettingsSection
              blockedKeywords={blockedKeywords}
              feedDefaultMode={feedDefaultMode}
              hideReposts={hideReposts}
              setBlockedKeywords={setBlockedKeywords}
              setFeedDefaultMode={setFeedDefaultMode}
              setHideReposts={setHideReposts}
            />
            <ModerationSettingsSection
              blurSensitive={blurSensitive}
              contentFilter={contentFilter}
              setBlurSensitive={setBlurSensitive}
              setContentFilter={setContentFilter}
            />
          </div>

          {/* Row 4: Sécurité & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrivacySecuritySettingsSection
              allowDms={allowDms}
              allowMentions={allowMentions}
              canHideVerifiedBadge={canHideVerifiedBadge}
              collabAutoAccept={collabAutoAccept}
              dmAutoTranslate={dmAutoTranslate}
              dmTranslateLang={dmTranslateLang}
              hideVerifiedBadge={hideVerifiedBadge}
              setAllowDms={setAllowDms}
              setAllowMentions={setAllowMentions}
              setCollabAutoAccept={setCollabAutoAccept}
              setDmAutoTranslate={setDmAutoTranslate}
              setDmTranslateLang={setDmTranslateLang}
              setHideVerifiedBadge={setHideVerifiedBadge}
            />
            <NotificationsHapticsSection
              animationsEnabled={animationsEnabled}
              hapticsEnabled={hapticsEnabled}
              hapticsSupported={hapticsSupported}
              setAnimationsEnabledState={setAnimationsEnabledState}
              setHapticsEnabled={setHapticsEnabled}
            />
          </div>

          {/* Row 5: Comptes bloqués & masqués */}
          <BlockedAccountsSection
            blockedAccounts={blockedAccounts}
            isLoadingAccounts={isLoadingAccounts}
            mutedAccounts={mutedAccounts}
            onUnblockAccount={handleUnblockAccount}
            onUnmuteAccount={handleUnmuteAccount}
          />

          {/* Row 6: Cercle Privé & Audience */}
          <CircleAudienceSection
            addingUsername={addingUsername}
            circleMembers={circleMembers}
            circleSearchQuery={circleSearchQuery}
            circleSearchResults={circleSearchResults}
            defaultVibeAudience={defaultVibeAudience}
            isSearchingCircleUsers={isSearchingCircleUsers}
            onAddToCircle={handleAddToCircle}
            onRemoveFromCircle={handleRemoveFromCircle}
            setCircleSearchQuery={setCircleSearchQuery}
            setCircleSearchResults={setCircleSearchResults}
            setDefaultVibeAudience={setDefaultVibeAudience}
          />

          {/* Row 7: Intelligence Artificielle mAI */}
          <MaiSettingsSection
            maiAutoApproveTools={maiAutoApproveTools}
            maiCatalog={maiCatalog}
            maiContextBooks={maiContextBooks}
            maiContextDms={maiContextDms}
            maiContextPosts={maiContextPosts}
            maiDefaultModel={maiDefaultModel}
            maiEnabledTools={maiEnabledTools}
            maiToolsLoaded={maiToolsLoaded}
            maiTtsVoice={maiTtsVoice}
            models={models}
            postsAIGeneratedByDefault={postsAIGeneratedByDefault}
            setMaiAutoApproveTools={setMaiAutoApproveTools}
            setMaiContextBooks={setMaiContextBooks}
            setMaiContextDms={setMaiContextDms}
            setMaiContextPosts={setMaiContextPosts}
            setMaiDefaultModel={setMaiDefaultModel}
            setMaiEnabledTools={setMaiEnabledTools}
            setMaiTtsVoice={setMaiTtsVoice}
            setPostsAIGeneratedByDefault={setPostsAIGeneratedByDefault}
            voices={voices}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="py-3 px-8 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-40"
              disabled={isSaving}
              type="submit"
            >
              {isSaving? "Enregistrement...": "Enregistrer les paramètres"}
            </button>
          </div>
        </form>

        {/* Tutoriel, Données & CGU */}
        <TutorialDataSection
          isExporting={isExporting}
          onExportData={handleExportData}
          onRestartOnboarding={restartOnboarding}
        />
      </div>
    </div>
  );
};
