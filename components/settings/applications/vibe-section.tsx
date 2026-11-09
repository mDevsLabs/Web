"use client";

import {
  CpuIcon,
  Loader2Icon,
  LockIcon,
  MessageSquareIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  Volume2Icon,
} from "@mdevs/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import { ApiService } from "@/lib/vibe/services/api";
import type { UserSettings } from "@/lib/vibe/types/vibe";

const VIBE_SETTINGS_KEY = "vibe_settings_cache";
const VIBE_CIRCLE_KEY = "vibe_circle_cache";

type VibeSettingsSectionProps = {
  unifiedModel: string;
  setUnifiedModel: (m: string) => void;
  unifiedVoice: string;
  setUnifiedVoice: (v: string) => void;
  availableVoices: Array<{ id: string; name: string }>;
  userPrefData?: {
    defaultChatModel?: string | null;
    defaultAudioVoice?: string | null;
  } | null;
  mutateUserPref: () => Promise<unknown>;
};

export function VibeSettingsSection({
  unifiedModel,
  setUnifiedModel,
  unifiedVoice,
  setUnifiedVoice,
  availableVoices,
  userPrefData,
  mutateUserPref,
}: VibeSettingsSectionProps) {
  const [vibeLoading, setVibeLoading] = useState(true);

  // Fil & Contenu
  const [feedDefaultMode, setFeedDefaultMode] = useState<
    "for_you" | "stream" | "trending"
  >("for_you");
  const [hideReposts, setHideReposts] = useState(false);
  const [blockedKeywords, setBlockedKeywords] = useState("");
  const [contentFilter, setContentFilter] = useState<
    "low" | "medium" | "strict"
  >("medium");
  const [blurSensitive, setBlurSensitive] = useState(true);

  // Confidentialité & Sécurité
  const [allowDms, setAllowDms] = useState<"everyone" | "following" | "nobody">(
    "everyone"
  );
  const [dmAutoTranslate, setDmAutoTranslate] = useState(false);
  const [dmTranslateLang, setDmTranslateLang] = useState("FR");
  const [allowMentions, setAllowMentions] = useState<
    "everyone" | "following" | "nobody"
  >("everyone");
  const [hideVerifiedBadge, setHideVerifiedBadge] = useState(false);

  // IA mAI Vibe
  const [maiAutoApproveTools, setMaiAutoApproveTools] = useState(false);
  const [postsAIGeneratedByDefault, setPostsAIGeneratedByDefault] =
    useState(false);
  const [maiContextPosts, setMaiContextPosts] = useState(false);
  const [maiContextDms, setMaiContextDms] = useState(false);
  const [maiContextBooks, setMaiContextBooks] = useState(false);

  // Cercle privé
  const [defaultVibeAudience, setDefaultVibeAudience] = useState<
    "public" | "followers" | "circle"
  >("public");
  const [circleMembers, setCircleMembers] = useState<
    Array<{ id: string | number; username: string; display_name?: string }>
  >([]);
  const [circleSearchQuery, setCircleSearchQuery] = useState("");
  const [circleSearchResults, setCircleSearchResults] = useState<
    Array<{ id: number; username: string; display_name?: string }>
  >([]);
  const [isSearchingCircle, setIsSearchingCircle] = useState(false);
  const [circleActionLoading, setCircleActionLoading] = useState(false);

  const appliquerReglagesVibe = useCallback(
    (s: Partial<UserSettings>) => {
      setFeedDefaultMode(s.feed_default_mode || "for_you");
      setHideReposts(Boolean(s.hide_reposts));
      setBlockedKeywords(
        Array.isArray(s.blocked_keywords)
          ? s.blocked_keywords.join(", ")
          : s.blocked_keywords || ""
      );
      setAllowDms(s.allow_dms_from || s.allow_dms || "everyone");
      setDmAutoTranslate(Boolean(s.dm_auto_translate));
      setDmTranslateLang(s.dm_translate_lang || "FR");
      setAllowMentions(s.allow_mentions || "everyone");
      setContentFilter(s.content_filter_level || "medium");
      setBlurSensitive(s.blur_sensitive_content ?? true);
      setMaiAutoApproveTools(Boolean(s.mai_auto_approve_tools));
      setPostsAIGeneratedByDefault(Boolean(s.posts_ai_generated_by_default));
      setMaiContextPosts(Boolean(s.mai_context_posts));
      setMaiContextDms(Boolean(s.mai_context_dms));
      setMaiContextBooks(Boolean(s.mai_context_books));
      setHideVerifiedBadge(Boolean(s.hide_verified_badge));
      setDefaultVibeAudience(s.default_vibe_audience || "public");
      if (s.mai_default_model) {
        setUnifiedModel(s.mai_default_model);
      }
      if (s.mai_tts_voice) {
        setUnifiedVoice(s.mai_tts_voice);
      }
    },
    [setUnifiedModel, setUnifiedVoice]
  );

  const {
    data: vibeSettingsData,
    error: vibeSettingsError,
    isLoading: vibeSettingsLoading,
  } = useSWR(VIBE_SETTINGS_KEY, () => ApiService.getSettings(), {
    dedupingInterval: 15_000,
  });

  const { data: vibeCircleData } = useSWR(
    VIBE_CIRCLE_KEY,
    () => ApiService.getCircle(),
    { dedupingInterval: 15_000 }
  );

  useEffect(() => {
    if (vibeSettingsLoading) return;
    if (vibeSettingsError || !vibeSettingsData?.settings) {
      setVibeLoading(false);
      return;
    }
    const s = vibeSettingsData.settings;
    appliquerReglagesVibe(s);
    if (s.mai_default_model && !userPrefData?.defaultChatModel) {
      setUnifiedModel(s.mai_default_model);
    }
    if (s.mai_tts_voice && !userPrefData?.defaultAudioVoice) {
      setUnifiedVoice(s.mai_tts_voice);
    }
    setVibeLoading(false);
  }, [
    appliquerReglagesVibe,
    setUnifiedModel,
    setUnifiedVoice,
    userPrefData,
    vibeSettingsData,
    vibeSettingsError,
    vibeSettingsLoading,
  ]);

  useEffect(() => {
    if (vibeCircleData?.members) {
      setCircleMembers(vibeCircleData.members);
    }
  }, [vibeCircleData]);

  useEffect(() => {
    const q = circleSearchQuery.trim().replace(/^@/, "");
    if (!q) {
      setCircleSearchResults([]);
      setIsSearchingCircle(false);
      return;
    }
    setIsSearchingCircle(true);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiService.searchUsers(q);
        setCircleSearchResults(res?.users || []);
      } catch {
        setCircleSearchResults([]);
      } finally {
        setIsSearchingCircle(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [circleSearchQuery]);

  const instantaneVibe = useMemo(
    () => ({
      allowDms,
      allowMentions,
      blockedKeywords,
      blurSensitive,
      contentFilter,
      defaultVibeAudience,
      dmAutoTranslate,
      dmTranslateLang,
      feedDefaultMode,
      hideReposts,
      hideVerifiedBadge,
      maiAutoApproveTools,
      maiContextBooks,
      maiContextDms,
      maiContextPosts,
      postsAIGeneratedByDefault,
      unifiedModel,
      unifiedVoice,
    }),
    [
      allowDms,
      allowMentions,
      blurSensitive,
      blockedKeywords,
      contentFilter,
      defaultVibeAudience,
      dmAutoTranslate,
      dmTranslateLang,
      feedDefaultMode,
      hideReposts,
      hideVerifiedBadge,
      maiAutoApproveTools,
      maiContextBooks,
      maiContextDms,
      maiContextPosts,
      postsAIGeneratedByDefault,
      unifiedModel,
      unifiedVoice,
    ]
  );

  const appliquerVibe = useCallback(
    (etat: typeof instantaneVibe) => {
      setAllowDms(etat.allowDms);
      setAllowMentions(etat.allowMentions);
      setBlurSensitive(etat.blurSensitive);
      setBlockedKeywords(etat.blockedKeywords);
      setContentFilter(etat.contentFilter);
      setDefaultVibeAudience(etat.defaultVibeAudience);
      setDmAutoTranslate(etat.dmAutoTranslate);
      setDmTranslateLang(etat.dmTranslateLang);
      setFeedDefaultMode(etat.feedDefaultMode);
      setHideReposts(etat.hideReposts);
      setHideVerifiedBadge(etat.hideVerifiedBadge);
      setMaiAutoApproveTools(etat.maiAutoApproveTools);
      setMaiContextBooks(etat.maiContextBooks);
      setMaiContextDms(etat.maiContextDms);
      setMaiContextPosts(etat.maiContextPosts);
      setPostsAIGeneratedByDefault(etat.postsAIGeneratedByDefault);
      setUnifiedModel(etat.unifiedModel);
      setUnifiedVoice(etat.unifiedVoice);
    },
    [setUnifiedModel, setUnifiedVoice]
  );

  const reconcilierVibe = useCallback(async () => {
    try {
      const res = await ApiService.getSettings();
      if (res?.settings) {
        appliquerReglagesVibe(res.settings);
      }
    } catch {
      // Ignorer
    }
    try {
      await mutateUserPref();
    } catch {
      // Ignorer
    }
  }, [appliquerReglagesVibe, mutateUserPref]);

  const ecrireVibe = useCallback(
    async (etat: typeof instantaneVibe) => {
      const motsCles = etat.blockedKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const reponse = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultAudioVoice: etat.unifiedVoice,
          defaultChatModel: etat.unifiedModel,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!reponse.ok) {
        await reconcilierVibe();
        throw new Error(
          "Les préférences mAI n'ont pas pu être enregistrées. L'état confirmé a été relu."
        );
      }
      await mutateUserPref();

      try {
        await ApiService.updateSettings({
          allow_dms: etat.allowDms,
          allow_dms_from: etat.allowDms,
          allow_mentions: etat.allowMentions,
          blocked_keywords: motsCles,
          blur_sensitive_content: etat.blurSensitive,
          content_filter_level: etat.contentFilter,
          default_vibe_audience: etat.defaultVibeAudience,
          dm_auto_translate: etat.dmAutoTranslate,
          dm_translate_lang: etat.dmTranslateLang,
          feed_default_mode: etat.feedDefaultMode,
          hide_reposts: etat.hideReposts,
          hide_verified_badge: etat.hideVerifiedBadge,
          mai_auto_approve_tools: etat.maiAutoApproveTools,
          mai_context_books: etat.maiContextBooks,
          mai_context_dms: etat.maiContextDms,
          mai_context_posts: etat.maiContextPosts,
          mai_default_model: etat.unifiedModel,
          mai_tts_voice: etat.unifiedVoice,
          posts_ai_generated_by_default: etat.postsAIGeneratedByDefault,
        });
      } catch {
        await reconcilierVibe();
        throw new Error(
          "Les préférences mAI ont été enregistrées, mais Vibe ne les a pas acceptées. L'état confirmé a été relu : vérifiez puis réessayez."
        );
      }
    },
    [mutateUserPref, reconcilierVibe]
  );

  useAutosaveSection({
    apply: appliquerVibe,
    enabled: !vibeLoading,
    errorMessage: "Impossible d'enregistrer les paramètres Vibe.",
    successMessage: "Paramètres Vibe enregistrés",
    values: instantaneVibe,
    write: ecrireVibe,
  });

  const handleAddToCircle = async (username: string) => {
    if (!username || circleActionLoading) return;
    setCircleActionLoading(true);
    try {
      await ApiService.addToCircle(username);
      const res = await ApiService.getCircle();
      setCircleMembers(res?.members || []);
      setCircleSearchQuery("");
      setCircleSearchResults([]);
      toast.success(`@${username} ajouté à votre Cercle Privé`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout au cercle.";
      toast.error(msg);
    } finally {
      setCircleActionLoading(false);
    }
  };

  const handleRemoveFromCircle = async (username: string) => {
    try {
      await ApiService.removeFromCircle(username);
      setCircleMembers((prev) => prev.filter((m) => m.username !== username));
      toast.info(`@${username} retiré de votre Cercle Privé.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors du retrait du cercle.";
      toast.error(msg);
    }
  };

  return (
    <section className="flex flex-col gap-6 scroll-mt-24" id="vibe">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SparklesIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Vibe
            </h3>
            <p className="text-xs text-muted-foreground">
              Réseau social autonome & Studio créatif mAI
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Chaque réglage est enregistré dès que vous le modifiez.
        </p>
      </div>

      {vibeLoading ? (
        <div className="surface-card flex items-center justify-center p-8 text-xs text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin mr-2 text-primary" />
          Chargement des réglages Vibe…
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="vibe-ai"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CpuIcon className="size-4 text-primary" />
              <span>Intelligence Artificielle mAI & Voix (Unifiées)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce modèle et cette voix sont partagés avec vos préférences
              globales mAI: modifier ces valeurs ici met à jour le chat mAI et
              le Studio Vibe.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <SparklesIcon className="size-3 text-primary" /> Modèle par
                  défaut
                </label>
                <ModelSelectorCompact
                  onModelChange={(modelId) => setUnifiedModel(modelId)}
                  selectedModelId={unifiedModel}
                />
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  Actif: {unifiedModel}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2Icon className="size-3 text-primary" /> Voix de
                  lecture mAI
                </label>
                <select
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  onChange={(e) => setUnifiedVoice(e.target.value)}
                  value={unifiedVoice}
                >
                  <option value="">Voix système automatique</option>
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground">
                  Utilisée pour les lectures audio dans Vibe et le chat mAI.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/40">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-foreground">
                    Approbation auto des outils
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Exécuter les outils dans Vibe sans confirmation manuelle
                  </p>
                </div>
                <input
                  checked={maiAutoApproveTools}
                  className="size-4 accent-primary cursor-pointer shrink-0"
                  onChange={(e) => setMaiAutoApproveTools(e.target.checked)}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-foreground">
                    Badge IA par défaut
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Activer automatiquement le badge « Créé avec l'IA»
                  </p>
                </div>
                <input
                  checked={postsAIGeneratedByDefault}
                  className="size-4 accent-primary cursor-pointer shrink-0"
                  onChange={(e) =>
                    setPostsAIGeneratedByDefault(e.target.checked)
                  }
                  type="checkbox"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
              <span className="text-xs font-semibold text-foreground">
                Partage de contexte mAI (Opt-in)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Permettre à mAI d'adapter ses suggestions en analysant vos
                contenus Vibe.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <span className="text-xs text-foreground">Publications</span>
                  <input
                    checked={maiContextPosts}
                    className="size-3.5 accent-primary cursor-pointer"
                    onChange={(e) => setMaiContextPosts(e.target.checked)}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <span className="text-xs text-foreground">
                    Messages privés
                  </span>
                  <input
                    checked={maiContextDms}
                    className="size-3.5 accent-primary cursor-pointer"
                    onChange={(e) => setMaiContextDms(e.target.checked)}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <span className="text-xs text-foreground">Vibe Books</span>
                  <input
                    checked={maiContextBooks}
                    className="size-3.5 accent-primary cursor-pointer"
                    onChange={(e) => setMaiContextBooks(e.target.checked)}
                    type="checkbox"
                  />
                </label>
              </div>
            </div>
          </div>

          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="vibe-feed"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <MessageSquareIcon className="size-4 text-primary" />
              <span>Fil d'actualité & Modération</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Mode d'affichage par défaut
                </label>
                <select
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  onChange={(e) =>
                    setFeedDefaultMode(
                      e.target.value as "for_you" | "stream" | "trending"
                    )
                  }
                  value={feedDefaultMode}
                >
                  <option value="for_you">Pour vous (Algorithme mAI)</option>
                  <option value="stream">Flux continu (Chronologique)</option>
                  <option value="trending">Tendances</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Filtrage du contenu
                </label>
                <select
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  onChange={(e) =>
                    setContentFilter(
                      e.target.value as "low" | "medium" | "strict"
                    )
                  }
                  value={contentFilter}
                >
                  <option value="low">Faible (Moins de restrictions)</option>
                  <option value="medium">Moyen (Recommandé)</option>
                  <option value="strict">Strict (Protection maximale)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Mots-clés masqués (séparés par des virgules)
              </label>
              <input
                className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground placeholder:text-muted-foreground"
                onChange={(e) => setBlockedKeywords(e.target.value)}
                placeholder="spoiler, politique, sport…"
                type="text"
                value={blockedKeywords}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  checked={hideReposts}
                  className="size-4 accent-primary"
                  onChange={(e) => setHideReposts(e.target.checked)}
                  type="checkbox"
                />
                Masquer les partages (reposts) dans mon fil
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  checked={blurSensitive}
                  className="size-4 accent-primary"
                  onChange={(e) => setBlurSensitive(e.target.checked)}
                  type="checkbox"
                />
                Flouter les médias sensibles
              </label>
            </div>
          </div>

          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="vibe-privacy"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldIcon className="size-4 text-primary" />
              <span>Confidentialité & Interactions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Messages privés (DMs)
                </label>
                <select
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  onChange={(e) =>
                    setAllowDms(
                      e.target.value as "everyone" | "following" | "nobody"
                    )
                  }
                  value={allowDms}
                >
                  <option value="everyone">Tout le monde</option>
                  <option value="following">
                    Personnes que je suis uniquement
                  </option>
                  <option value="nobody">Personne</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Autoriser les mentions (@vous)
                </label>
                <select
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  onChange={(e) =>
                    setAllowMentions(
                      e.target.value as "everyone" | "following" | "nobody"
                    )
                  }
                  value={allowMentions}
                >
                  <option value="everyone">Tout le monde</option>
                  <option value="following">Mes abonnés uniquement</option>
                  <option value="nobody">Personne</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Traduction automatique des messages
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Traduire les messages reçus dans votre langue préférée
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  checked={dmAutoTranslate}
                  className="size-4 accent-primary cursor-pointer"
                  onChange={(e) => setDmAutoTranslate(e.target.checked)}
                  type="checkbox"
                />
                {dmAutoTranslate && (
                  <select
                    className="field-input text-xs py-1 px-2 rounded-lg border border-border/70 bg-card text-foreground"
                    onChange={(e) => setDmTranslateLang(e.target.value)}
                    value={dmTranslateLang}
                  >
                    <option value="FR">Français</option>
                    <option value="EN-US">Anglais</option>
                    <option value="ES">Espagnol</option>
                    <option value="DE">Allemand</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="vibe-circle"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <LockIcon className="size-4 text-primary" />
                <span>Cercle Privé</span>
              </div>
              <span className="chip text-[11px]">
                {circleMembers.length} membre
                {circleMembers.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Partagez des publications exclusives visibles uniquement par les
              personnes sélectionnées.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Audience par défaut des nouvelles publications
              </label>
              <select
                className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                onChange={(e) =>
                  setDefaultVibeAudience(
                    e.target.value as "public" | "followers" | "circle"
                  )
                }
                value={defaultVibeAudience}
              >
                <option value="public">Publique (Tout le monde)</option>
                <option value="followers">Abonnés uniquement</option>
                <option value="circle">Cercle Privé uniquement</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ajouter un utilisateur au Cercle Privé
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  className="field-input text-xs w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/70 bg-card text-foreground placeholder:text-muted-foreground"
                  onChange={(e) => setCircleSearchQuery(e.target.value)}
                  placeholder="Rechercher par pseudonyme (@pseudo)…"
                  type="text"
                  value={circleSearchQuery}
                />
                {isSearchingCircle && (
                  <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {circleSearchResults.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card p-2 flex flex-col gap-1 shadow-md">
                  {circleSearchResults.slice(0, 5).map((u) => {
                    const alreadyIn = circleMembers.some(
                      (m) => m.username === u.username
                    );
                    return (
                      <div
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        key={u.id}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            {u.username[0]}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {u.display_name || u.username}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                        {alreadyIn ? (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Déjà membre
                          </span>
                        ) : (
                          <button
                            className="rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                            disabled={circleActionLoading}
                            onClick={() => handleAddToCircle(u.username)}
                            type="button"
                          >
                            Ajouter
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {circleMembers.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    Aucun membre dans le cercle privé.
                  </span>
                ) : (
                  circleMembers.map((m) => (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-2.5 py-1 text-xs text-foreground"
                      key={m.username}
                    >
                      <span>@{m.username}</span>
                      <button
                        aria-label={`Retirer @${m.username}`}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        onClick={() => handleRemoveFromCircle(m.username)}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
