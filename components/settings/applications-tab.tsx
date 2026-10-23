"use client";

/**
 * ============================================================================
 * PARAMÈTRES DES APPLICATIONS (components/settings/applications-tab.tsx)
 * ============================================================================
 *
 * Centralisation des réglages des applications satellites mAI (Vibe & Wakies)
 * dans les paramètres globaux mAI.
 *
 * FUSION IA & VOIX:
 * - Le modèle d'IA par défaut et la voix de synthèse vocale pour Vibe sont
 * unifiés directement avec les préférences globales mAI (/api/user/preferences).
 * - Une mise à jour synchronise simultanément les préférences de profil mAI
 * et le miroir SQLite backend Vibe pour assurer une cohérence totale.
 *
 * SECTIONS DISPONIBLES:
 * - Vibe: Réseau social, fil d'actualité, modération, cercle privé, IA mAI.
 * - Wakies: Espaces de travail personnels, quotas, mémoire, modèle et outils.
 */

import {
  BellIcon,
  BotIcon,
  BrainIcon,
  CheckIcon,
  CpuIcon,
  CrosshairIcon,
  LayersIcon,
  Loader2Icon,
  LockIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  Volume2Icon,
  ZapIcon,
} from "@mdevs/icons";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BlacklineSettingsSection } from "@/components/blackline/blackline-settings-section";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { SourceIcon } from "@/components/search/source-icon";
import {
  WakiesCapacityPicker,
  WakiesToolPicker,
} from "@/components/settings/wakies-capability-picker";
import { api as wakiesApi } from "@/components/wakies/api";
import { ModelPicker as WakiesModelPicker } from "@/components/wakies/ModelPicker";
import { useCapabilities } from "@/components/wakies/use-capabilities";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import { useTier } from "@/hooks/use-tier";
import { getTierSearchResultsMax } from "@/lib/plans/tier-limits";
import {
  MAI_SEARCH_LANGUAGE_LABELS,
  MAI_SEARCH_LANGUAGES,
  MAI_SEARCH_RESULT_COUNT_DEFAULT,
  MAI_SEARCH_RESULT_COUNT_MAX,
  MAI_SEARCH_RESULT_COUNT_MIN,
  MAI_SEARCH_SAFETY_LABELS,
  MAI_SEARCH_SAFETY_LEVELS,
  MAI_SEARCH_SOURCE_DESCRIPTIONS,
  MAI_SEARCH_SOURCE_KEYS,
  MAI_SEARCH_SOURCE_LABELS,
  type MaiSearchLanguage,
  type MaiSearchSafetyLevel,
  type MaiSearchSourceKey,
} from "@/lib/search/sources";
import { cn, fetcher } from "@/lib/utils";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import type { SetupStatus, Wakie } from "@/lib/wakies/shared/types";
import { WAKIE_TOOL_CATALOG } from "@/lib/wakies/tool-catalog";

// --- TYPES WAKIES ---
type WakiesAccountSettings = {
  memoryAllowed: boolean;
  name: string;
  onboardingCompleted?: boolean;
  paused: boolean;
  researchAllowed: boolean;
};

type WakiesData = {
  quotas: Record<string, number | null>;
  settings: WakiesAccountSettings;
  setup?: SetupStatus;
  storageBytes: number;
  tier: string;
  wakies: Wakie[];
};

const WAKIES_QUOTA_LABELS: Record<string, string> = {
  conversations: "Conversations",
  memories: "Mémoires",
  pages: "Pages",
  spaces: "Espaces",
  tasks: "Tâches planifiées",
  wakieProfileImages: "Images de fiche",
  wakies: "Wakies",
};

export function ApplicationsTab() {
  // SWR pour préférences globales mAI
  const { data: userPrefData, mutate: mutateUserPref } = useSWR(
    "/api/user/preferences",
    fetcher,
    { dedupingInterval: 15_000 }
  );

  const { data: audioModelsData } = useSWR("/api/models/speech", fetcher, {
    dedupingInterval: 60_000,
  });

  // --- ÉTATS VIBE ---
  const [vibeLoading, setVibeLoading] = useState(true);
  const [vibeSaving, setVibeSaving] = useState(false);

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

  // Notifications Vibe
  //
  // Les préférences de NOTIFICATION Vibe (e-mail, push, j'aime, partages,
  // réponses, messages) vivent dans l'onglet « Notifications» des
  // paramètres mAI: c'est le seul écran qui regroupe les trois
  // applications. Elles ne sont donc PAS modifiées ici — seulement
  // relues au moment d'enregistrer Vibe, pour ne pas les écraser avec
  // `true` par défaut.
  const [hapticsEnabled, setHapticsEnabled] = useState(() =>
    haptics.isEnabled()
  );

  // --- ÉTATS UNIFIÉS MODÈLE & VOIX ---
  const [unifiedModel, setUnifiedModel] = useState<string>("mai-2-mini");
  const [unifiedVoice, setUnifiedVoice] = useState<string>("");

  // --- ÉTATS RECHERCHE mAI SEARCH ---
  const [searchLanguage, setSearchLanguage] = useState<MaiSearchLanguage>("fr");
  const [searchResultCount, setSearchResultCount] = useState<number>(
    MAI_SEARCH_RESULT_COUNT_DEFAULT
  );
  const [searchSafetyLevel, setSearchSafetyLevel] =
    useState<MaiSearchSafetyLevel>("medium");
  const [searchSources, setSearchSources] = useState<MaiSearchSourceKey[]>([
    ...MAI_SEARCH_SOURCE_KEYS,
  ]);
  const [searchSaving, setSearchSaving] = useState(false);

  /**
   * Volume maximal de résultats par source, POUR CE FORFAIT.
   *
   * Le curseur ne propose jamais plus que ce que le compte peut obtenir:
   * proposer 200 à un compte gratuit, qui n'en obtiendra que 50, serait une
   * promesse que le serveur ne tiendrait pas.
   */
  const { normalized: searchTier } = useTier();
  const searchResultsMax = getTierSearchResultsMax(searchTier);

  // --- ÉTATS WAKIES ---
  const [wakiesLoading, setWakiesLoading] = useState(true);
  const [wakiesSaving, setWakiesSaving] = useState(false);
  const [wakiesData, setWakiesData] = useState<WakiesData | null>(null);
  const [wakiesAccount, setWakiesAccount] =
    useState<WakiesAccountSettings | null>(null);
  const [activeWakieId, setActiveWakieId] = useState<string>("");
  const { capabilities: wakiesCapabilities } = useCapabilities(true);

  // Synchronisation du modèle et voix globaux mAI
  useEffect(() => {
    if (userPrefData?.defaultChatModel) {
      setUnifiedModel(userPrefData.defaultChatModel);
    }
    if (userPrefData?.defaultAudioVoice) {
      setUnifiedVoice(userPrefData.defaultAudioVoice);
    }
  }, [userPrefData]);

  // Préférences de recherche mAI Search: elles viennent de la même route
  // `/api/user/preferences` que le modèle et la voix — une seule source
  // pour l'onglet, une seule écriture.
  useEffect(() => {
    if (!userPrefData) {
      return;
    }
    if (userPrefData.searchLanguage) {
      setSearchLanguage(userPrefData.searchLanguage);
    }
    if (typeof userPrefData.searchResultCount === "number") {
      // La valeur enregistrée est bornée par le forfait COURANT: un compte
      // qui a swamé de Max à Free garde 200 en base, et il ne peut plus
      // l'obtenir. L'interface montre ce qu'il aura vraiment.
      setSearchResultCount(
        Math.min(userPrefData.searchResultCount, searchResultsMax)
      );
    }
    if (userPrefData.searchSafetyLevel) {
      setSearchSafetyLevel(userPrefData.searchSafetyLevel);
    }
    if (Array.isArray(userPrefData.searchSources)) {
      setSearchSources(userPrefData.searchSources);
    }
  }, [searchResultsMax, userPrefData]);

  // Liste des voix disponibles pour le modèle audio
  const availableVoices = useMemo(() => {
    const list = audioModelsData?.models || audioModelsData?.data || [];
    const firstWithVoices = list.find(
      (m: any) => Array.isArray(m.voices) && m.voices.length > 0
    );
    return (
      firstWithVoices?.voices || [
        { id: "flux-alexis-fr", name: "Alexis (Français naturel)" },
        { id: "flux-celeste-fr", name: "Céleste (Français chaleureux)" },
        { id: "flux-alexis-en", name: "Alexis (Anglais)" },
        { id: "flux-elena-en", name: "Elena (Anglais doux)" },
      ]
    );
  }, [audioModelsData]);

  // Chargement des paramètres Vibe
  useEffect(() => {
    let active = true;
    ApiService.getSettings()
      .then((res) => {
        if (!active || !res?.settings) return;
        const s = res.settings;
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

        // Si Vibe avait un modèle ou voix défini et qu'aucun n'est encore configuré côté mAI
        if (s.mai_default_model && !userPrefData?.defaultChatModel) {
          setUnifiedModel(s.mai_default_model);
        }
        if (s.mai_tts_voice && !userPrefData?.defaultAudioVoice) {
          setUnifiedVoice(s.mai_tts_voice);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setVibeLoading(false);
      });

    // Chargement du cercle privé
    ApiService.getCircle()
      .then((res) => {
        if (active && res?.members) setCircleMembers(res.members);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userPrefData]);

  // Chargement des données Wakies
  useEffect(() => {
    let active = true;
    wakiesApi<WakiesData>("/settings")
      .then((data) => {
        if (!active || !data) return;
        setWakiesData(data);
        setWakiesAccount(data.settings);
        if (data.wakies?.length > 0) {
          setActiveWakieId(data.wakies[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setWakiesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Recherche d'utilisateurs pour le cercle privé
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

  // --- ACTIONS VIBE ---
  /**
   * Instantané des réglages Vibe.
   *
   * C'est l'unité de comparaison: l'enregistrement automatic ne compare
   * pas les contrôles un par un, il compare l'ensemble. Un réglage oublié
   * dans cette liste ne serait jamais écrit — la liste est donc le seul
   * endroit à tenir à jour.
   */
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

  /** Remet l'interface Vibe dans l'état d'un instantané. */
  const appliquerVibe = useCallback((etat: typeof instantaneVibe) => {
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
  }, []);

  /**
   * Écrit les réglages Vibe.
   *
   * Deux destinations: le modèle et la voix sont partagés avec mAI, donc
   * ils sont aussi écrits dans les préférences de l'hôte. Les préférences
   * de NOTIFICATION ne sont PAS envoyées ici: elles appartiennent à
   * l'onglet « Notifications», et le backend Vibe applique un
   * `CASE WHEN … IS NOT NULL` sur ces colonnes — les omettre conserve les
   * valeurs existantes, les envoyer les écraserait.
   */
  const ecrireVibe = useCallback(
    async (etat: typeof instantaneVibe) => {
      const motsCles = etat.blockedKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultAudioVoice: etat.unifiedVoice,
          defaultChatModel: etat.unifiedModel,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      await mutateUserPref();

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
    },
    [mutateUserPref]
  );

  useAutosaveSection({
    apply: appliquerVibe,
    enabled: !vibeLoading,
    errorMessage: "Impossible d'enregistrer les paramètres Vibe.",
    successMessage: "Paramètres Vibe enregistrés",
    values: instantaneVibe,
    write: ecrireVibe,
  });

  // --- ACTIONS RECHERCHE ---
  /** Instantané des réglages de recherche mAI Search. */
  const instantaneRecherche = useMemo(
    () => ({
      searchLanguage,
      searchResultCount: Math.min(searchResultCount, searchResultsMax),
      searchSafetyLevel,
      searchSources,
    }),
    [
      searchLanguage,
      searchResultCount,
      searchResultsMax,
      searchSafetyLevel,
      searchSources,
    ]
  );

  /** Remet l'interface de recherche dans l'état d'un instantané. */
  const appliquerRecherche = useCallback((etat: typeof instantaneRecherche) => {
    setSearchLanguage(etat.searchLanguage);
    setSearchResultCount(etat.searchResultCount);
    setSearchSafetyLevel(etat.searchSafetyLevel);
    setSearchSources(etat.searchSources);
  }, []);

  useAutosaveSection({
    apply: appliquerRecherche,
    // Tant que les préférences ne sont pas lues, l'interface affiche des
    // valeurs par défaut: les écrire reviendrait à écraser les réglages du
    // compte.
    enabled: Boolean(userPrefData),
    errorMessage: "Impossible d'enregistrer les paramètres de recherche.",
    successMessage: "Paramètres de recherche enregistrés",
    values: instantaneRecherche,
    write: async (etat) => {
      const reponse = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          searchLanguage: etat.searchLanguage,
          // Borné par le forfait AVANT l'envoi: une valeur hors plafond
          // ferait échouer la validation, et donc l'enregistrement des AUTRES
          // réglages de recherche avec elle.
          searchResultCount: etat.searchResultCount,
          searchSafetyLevel: etat.searchSafetyLevel,
          searchSources: etat.searchSources,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!reponse.ok) {
        throw new Error("Erreur lors de l'enregistrement des préférences.");
      }
      await mutateUserPref();
    },
  });

  const toggleSearchSource = (source: MaiSearchSourceKey) => {
    setSearchSources((actuelles) => {
      const restantes = actuelles.filter((item) => item !== source);
      // On ne descend jamais sous une source: une recherche sans aucune
      // source ne remonterait rien, ce qui ressemble à une panne.
      if (restantes.length === 0) {
        return actuelles;
      }
      return actuelles.includes(source) ? restantes : [...actuelles, source];
    });
  };

  const handleAddToCircle = async (username: string) => {
    if (!username || circleActionLoading) return;
    setCircleActionLoading(true);
    try {
      await ApiService.addToCircle(username);
      const res = await ApiService.getCircle();
      setCircleMembers(res?.members || []);
      setCircleSearchQuery("");
      setCircleSearchResults([]);
      toast.success(`@${username} ajouté à votre Cercle Privé `);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'ajout au cercle.");
    } finally {
      setCircleActionLoading(false);
    }
  };

  const handleRemoveFromCircle = async (username: string) => {
    try {
      await ApiService.removeFromCircle(username);
      setCircleMembers((prev) => prev.filter((m) => m.username !== username));
      toast.info(`@${username} retiré de votre Cercle Privé.`);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors du retrait du cercle.");
    }
  };

  // --- ACTIONS WAKIES ---
  const handleSaveWakiesAccount = async (
    patch: Partial<WakiesAccountSettings>
  ) => {
    setWakiesSaving(true);
    try {
      const updated = await wakiesApi<WakiesAccountSettings>(
        "/settings",
        "PATCH",
        patch
      );
      setWakiesAccount((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success("Paramètres Wakies mis à jour ");
    } catch (err: any) {
      toast.error(err?.message || "Impossible de mettre à jour Wakies.");
    } finally {
      setWakiesSaving(false);
    }
  };

  const activeWakie = wakiesData?.wakies.find((w) => w.id === activeWakieId);

  const handleSaveWakieCapabilities = async (
    patch: Partial<
      Pick<
        Wakie,
        "model" | "pluginIds" | "mcpServerIds" | "skillIds" | "toolIds"
      >
    >
  ) => {
    if (!activeWakie) return;
    setWakiesSaving(true);
    try {
      await wakiesApi(`/wakies/${activeWakie.id}`, "PUT", {
        avatar: activeWakie.avatar ?? null,
        instructions: activeWakie.instructions,
        mcpServerIds: patch.mcpServerIds ?? activeWakie.mcpServerIds ?? [],
        memoryAllowed: activeWakie.memoryAllowed,
        model:
          patch.model === undefined ? (activeWakie.model ?? null) : patch.model,
        name: activeWakie.name,
        pluginIds: patch.pluginIds ?? activeWakie.pluginIds ?? [],
        researchAllowed: activeWakie.researchAllowed,
        skillIds: patch.skillIds ?? activeWakie.skillIds ?? [],
        spaceId: activeWakie.spaceId,
        spaceIds: activeWakie.spaceIds,
        toolIds: patch.toolIds ?? activeWakie.toolIds ?? [],
      });
      const refreshed = await wakiesApi<WakiesData>("/settings");
      setWakiesData(refreshed);
      toast.success(`Capacités de ${activeWakie.name} enregistrées `);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la mise à jour du Wakie.");
    } finally {
      setWakiesSaving(false);
    }
  };

  const handleApplyWakieToAll = async () => {
    if (!activeWakie || !wakiesData?.wakies) return;
    if (
      !window.confirm(
        `Appliquer la configuration de « ${activeWakie.name}» à tous vos Wakies?`
      )
    )
      return;

    setWakiesSaving(true);
    try {
      for (const w of wakiesData.wakies) {
        await wakiesApi(`/wakies/${w.id}`, "PUT", {
          avatar: w.avatar ?? null,
          instructions: w.instructions,
          mcpServerIds: activeWakie.mcpServerIds ?? [],
          memoryAllowed: w.memoryAllowed,
          model: activeWakie.model ?? null,
          name: w.name,
          pluginIds: activeWakie.pluginIds ?? [],
          researchAllowed: w.researchAllowed,
          skillIds: activeWakie.skillIds ?? [],
          spaceId: w.spaceId,
          spaceIds: w.spaceIds,
          toolIds: activeWakie.toolIds ?? [],
        });
      }
      const refreshed = await wakiesApi<WakiesData>("/settings");
      setWakiesData(refreshed);
      toast.success("Configuration reproduite sur l'ensemble des Wakies ");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'application générale.");
    } finally {
      setWakiesSaving(false);
    }
  };

  return (
    <div className="py-6 flex flex-col gap-10 max-w-4xl">
      {/* En-tête des applications */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <LayersIcon className="size-4" />
          Applications intégrées
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Paramètres de Vibe, Wakies & Blackline
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Centralisez la configuration de vos applications satellites mAI. Les
          modèles et la voix sont fusionnés avec votre compte principal pour une
          expérience fluide.
        </p>

        {/* Barre de navigation rapide */}
        <div className="flex items-center gap-2 pt-2">
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#vibe"
          >
            <SparklesIcon className="size-3.5 text-primary" />
            Vibe
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#search"
          >
            <SearchIcon className="size-3.5 text-primary" />
            Recherche
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#wakies"
          >
            <BotIcon className="size-3.5 text-primary" />
            Wakies
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#blackline"
          >
            <CrosshairIcon className="size-3.5 text-primary" />
            Blackline
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION VIBE */}
      {/* ========================================================================= */}
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
            {/* 1. IA & Voix (Unifiées avec mAI) */}
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
                {/* Modèle IA par défaut */}
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

                {/* Voix TTS par défaut */}
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
                    {availableVoices.map((v: any) => (
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

              {/* Toggles IA Vibe */}
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

              {/* Contexte mAI (Opt-in) */}
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
                    <span className="text-xs text-foreground">
                      Publications
                    </span>
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

            {/* 2. Fil d'actualité & Contenu */}
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
                    onChange={(e) => setFeedDefaultMode(e.target.value as any)}
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
                    onChange={(e) => setContentFilter(e.target.value as any)}
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

            {/* 3. Confidentialité & Sécurité */}
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
                    onChange={(e) => setAllowDms(e.target.value as any)}
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
                    onChange={(e) => setAllowMentions(e.target.value as any)}
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

            {/* 4. Cercle Privé */}
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
                    setDefaultVibeAudience(e.target.value as any)
                  }
                  value={defaultVibeAudience}
                >
                  <option value="public">Publique (Tout le monde)</option>
                  <option value="followers">Abonnés uniquement</option>
                  <option value="circle">Cercle Privé uniquement</option>
                </select>
              </div>

              {/* Recherche et ajout de membre */}
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

                {/* Liste des membres */}
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

      {/* ========================================================================= */}
      {/* SECTION RECHERCHE mAI SEARCH */}
      {/* ========================================================================= */}
      <section
        className="flex flex-col gap-6 scroll-mt-24 pt-4 border-t border-border/50"
        id="search"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SearchIcon className="size-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Recherche &amp; mAI Search
              </h3>
              <p className="text-xs text-muted-foreground">
                Langue, volume de résultats, sources interrogées et filtre de
                sécurité
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Chaque réglage est enregistré dès que vous le modifiez.
          </p>
        </div>

        <div className="surface-card flex flex-col gap-4 p-5 scroll-mt-24">
          <p className="text-xs text-muted-foreground">
            Ces réglages s'appliquent à toutes vos recherches mAI Search, depuis
            la page de recherche comme depuis les outils d'IA. Le serveur les
            applique: une recherche ne peut pas les contourner.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Langue de recherche */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                htmlFor="search-language"
              >
                Langue
              </label>
              <select
                className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                id="search-language"
                onChange={(e) =>
                  setSearchLanguage(e.target.value as MaiSearchLanguage)
                }
                value={searchLanguage}
              >
                {MAI_SEARCH_LANGUAGES.map((langue) => (
                  <option key={langue} value={langue}>
                    {MAI_SEARCH_LANGUAGE_LABELS[langue]}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-muted-foreground">
                Langue de l'encyclopédie et des recherches.
              </span>
            </div>

            {/* Nombre de résultats */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                  htmlFor="search-count"
                >
                  Résultats par recherche
                </label>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {searchResultCount}
                </span>
              </div>
              {/*
                Un curseur, et non une liste déroulante: la plage va de 1 à
                200, et deux cents options dans un <select> sont illisibles.
                Le curseur est borné par le FORFAIT — la borne n'est jamais
                celle du produit quand le compte ne peut pas l'atteindre.
              */}
              <input
                aria-label="Résultats par recherche"
                className="w-full accent-primary"
                id="search-count"
                max={searchResultsMax}
                min={MAI_SEARCH_RESULT_COUNT_MIN}
                onChange={(e) =>
                  setSearchResultCount(
                    Math.min(
                      searchResultsMax,
                      Number.parseInt(e.target.value, 10) ||
                        MAI_SEARCH_RESULT_COUNT_MIN
                    )
                  )
                }
                step={1}
                type="range"
                value={Math.min(
                  searchResultCount,
                  searchResultsMax,
                  MAI_SEARCH_RESULT_COUNT_MAX
                )}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {[10, 25, 50, 100, 200]
                  .filter((nombre) => nombre <= searchResultsMax)
                  .map((nombre) => (
                    <button
                      className={cn(
                        "chip text-[11px] px-2 py-0.5",
                        searchResultCount === nombre &&
                          "bg-foreground text-background font-medium"
                      )}
                      data-active={
                        searchResultCount === nombre ? "true" : undefined
                      }
                      key={nombre}
                      onClick={() => setSearchResultCount(nombre)}
                      type="button"
                    >
                      {nombre}
                    </button>
                  ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Volume maximal renvoyé par le moteur, PAR SOURCE. Votre forfait
                {` ${searchResultsMax}`} résultats au maximum.
              </span>
            </div>

            {/* Filtre de sécurité */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                htmlFor="search-safety"
              >
                Filtre de sécurité
              </label>
              <select
                className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                id="search-safety"
                onChange={(e) =>
                  setSearchSafetyLevel(e.target.value as MaiSearchSafetyLevel)
                }
                value={searchSafetyLevel}
              >
                {MAI_SEARCH_SAFETY_LEVELS.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {MAI_SEARCH_SAFETY_LABELS[niveau]}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-muted-foreground">
                Retire les résultats manifestement sensibles.
              </span>
            </div>
          </div>

          {/* Sources activées */}
          <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sources interrogées
            </span>
            <div className="flex flex-wrap gap-2">
              {MAI_SEARCH_SOURCE_KEYS.map((source) => {
                const active = searchSources.includes(source);
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      "chip flex items-center gap-1.5 text-xs cursor-pointer",
                      active
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-active={active ? "true" : undefined}
                    key={source}
                    onClick={() => toggleSearchSource(source)}
                    title={MAI_SEARCH_SOURCE_DESCRIPTIONS[source]}
                    type="button"
                  >
                    <SourceIcon className="size-3.5" source={source} />
                    <span>{MAI_SEARCH_SOURCE_LABELS[source]}</span>
                  </button>
                );
              })}
            </div>
            {/*
              La description de la source sélectionnée est affichée sous la
              liste: une pastille seule ne dit pas ce qu'on va obtenir.
              Wikipédia en particulier n'est pas « une source de plus» —
              c'est une encyclopédie, et l'utilisateur doit le savoir avant
              de la laisser répondre.
            */}
            <p className="text-[10px] text-muted-foreground">
              {
                MAI_SEARCH_SOURCE_DESCRIPTIONS[
                  searchSources.includes("wikipedia") ? "wikipedia" : "web"
                ]
              }
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION WAKIES */}
      {/* ========================================================================= */}
      <section
        className="flex flex-col gap-6 scroll-mt-24 pt-4 border-t border-border/50"
        id="wakies"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BotIcon className="size-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Wakies
              </h3>
              <p className="text-xs text-muted-foreground">
                Espaces de travail personnels & Assistants IA
              </p>
            </div>
          </div>
          {wakiesData && (
            <span className="chip text-[11px] font-semibold uppercase">
              Forfait {wakiesData.tier}
            </span>
          )}
        </div>

        {wakiesLoading ? (
          <div className="surface-card flex items-center justify-center p-8 text-xs text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin mr-2 text-primary" />
            Chargement des réglages Wakies…
          </div>
        ) : !wakiesData || !wakiesAccount ? (
          <div className="surface-card p-6 text-xs text-muted-foreground">
            L'atelier Wakies n'est pas encore initialisé ou inaccessible pour ce
            compte.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 1. Général & Confidentialité */}
            <div
              className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
              id="wakies-general"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <BrainIcon className="size-4 text-primary" />
                <span>Atelier & Confidentialité</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Nom de votre atelier Wakies
                </label>
                <input
                  className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                  disabled={wakiesSaving}
                  maxLength={40}
                  onBlur={() => {
                    if (wakiesAccount.name !== wakiesData.settings.name) {
                      void handleSaveWakiesAccount({
                        name: wakiesAccount.name,
                      });
                    }
                  }}
                  onChange={(e) =>
                    setWakiesAccount({ ...wakiesAccount, name: e.target.value })
                  }
                  type="text"
                  value={wakiesAccount.name}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-foreground">
                      Mettre en pause l'atelier
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Désactive temporairement les réponses autonomes
                    </p>
                  </div>
                  <input
                    checked={wakiesAccount.paused}
                    className="size-4 accent-primary cursor-pointer shrink-0"
                    disabled={wakiesSaving}
                    onChange={(e) => {
                      const paused = e.target.checked;
                      setWakiesAccount({ ...wakiesAccount, paused });
                      void handleSaveWakiesAccount({ paused });
                    }}
                    type="checkbox"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-foreground">
                      Recherche web autonome
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Autoriser l'exploration des pages web publiques
                    </p>
                  </div>
                  <input
                    checked={wakiesAccount.researchAllowed}
                    className="size-4 accent-primary cursor-pointer shrink-0"
                    disabled={wakiesSaving}
                    onChange={(e) => {
                      const researchAllowed = e.target.checked;
                      setWakiesAccount({ ...wakiesAccount, researchAllowed });
                      void handleSaveWakiesAccount({ researchAllowed });
                    }}
                    type="checkbox"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer sm:col-span-2">
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-foreground">
                      Mémoires enregistrées
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Permettre aux Wakies d'utiliser les souvenirs et faits
                      mémorisés
                    </p>
                  </div>
                  <input
                    checked={wakiesAccount.memoryAllowed}
                    className="size-4 accent-primary cursor-pointer shrink-0"
                    disabled={wakiesSaving}
                    onChange={(e) => {
                      const memoryAllowed = e.target.checked;
                      setWakiesAccount({ ...wakiesAccount, memoryAllowed });
                      void handleSaveWakiesAccount({ memoryAllowed });
                    }}
                    type="checkbox"
                  />
                </label>
              </div>
            </div>

            {/* 2. Stockage & Quotas */}
            <div
              className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
              id="wakies-quotas"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ZapIcon className="size-4 text-primary" />
                  <span>Stockage & Quotas de l'atelier</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Stockage: {Math.round(wakiesData.storageBytes / 1024 / 1024)}{" "}
                  Mo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(WAKIES_QUOTA_LABELS).map(([cle, label]) => {
                  const quotaVal = wakiesData.quotas[cle];
                  return (
                    <div
                      className="p-3 rounded-xl border border-border/40 bg-muted/10 flex flex-col gap-1"
                      key={cle}
                    >
                      <span className="text-[11px] text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {quotaVal === null ? "Illimité" : (quotaVal ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Configuration des Wakies */}
            <div
              className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
              id="wakies-config"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <BotIcon className="size-4 text-primary" />
                  <span>Configuration des capacités</span>
                </div>
                {wakiesData.wakies.length > 1 && (
                  <button
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    disabled={wakiesSaving}
                    onClick={handleApplyWakieToAll}
                    type="button"
                  >
                    Appliquer à tous les Wakies
                  </button>
                )}
              </div>

              {wakiesData.wakies.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun Wakie configuré. Créez votre premier assistant depuis
                  l'atelier Wakies.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Sélectionner le Wakie à configurer
                    </label>
                    <select
                      className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                      disabled={wakiesSaving}
                      onChange={(e) => setActiveWakieId(e.target.value)}
                      value={activeWakieId}
                    >
                      {wakiesData.wakies.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}{" "}
                          {w.model ? `(${w.model})` : "(Modèle par défaut)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeWakie && (
                    <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Modèle IA dédié pour {activeWakie.name}
                        </label>
                        <WakiesModelPicker
                          bloc
                          onChoisir={(modele) =>
                            void handleSaveWakieCapabilities({ model: modele })
                          }
                          valeur={activeWakie.model ?? ""}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Outils actifs
                        </label>
                        <WakiesToolPicker
                          onChanger={(toolIds) =>
                            void handleSaveWakieCapabilities({ toolIds })
                          }
                          outils={WAKIE_TOOL_CATALOG}
                          valeur={activeWakie.toolIds ?? []}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Compétences & Plugins
                        </label>
                        <WakiesCapacityPicker
                          capabilities={wakiesCapabilities}
                          onChanger={(suiv) =>
                            void handleSaveWakieCapabilities(suiv)
                          }
                          valeur={{
                            mcpServerIds: activeWakie.mcpServerIds ?? [],
                            pluginIds: activeWakie.pluginIds ?? [],
                            skillIds: activeWakie.skillIds ?? [],
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION BLACKLINE */}
      {/* ========================================================================= */}
      {/*
        Les réglages du jeu BLACKLINE sont PARTAGÉS par le compte (table
        `BlacklineSettings`, migration 0064). Ils vivaient dans le
        `localStorage` de l'appareil: changer d'appareil, c'était tout
        recommencer.

        La PROGRESSION du jeu (XP, armes, collection) reste locale: Blackline
        a volontairement retiré la synchronisation en ligne, et ses
        récompenses ne constituent pas une économie serveur.
      */}
      <section
        className="flex flex-col gap-6 scroll-mt-24 border-t border-border/50 pt-4"
        id="blackline"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CrosshairIcon className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                Blackline
              </h3>
              <p className="text-xs text-muted-foreground">
                FPS tactique 3D en solo contre des bots
              </p>
            </div>
          </div>
          <span className="chip text-[11px] font-semibold uppercase">
            PEGI 16
          </span>
        </div>

        <BlacklineSettingsSection />
      </section>
    </div>
  );
}
