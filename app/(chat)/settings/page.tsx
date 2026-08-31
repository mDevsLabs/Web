"use client";

import {
  AlertCircleIcon,
  BellIcon,
  BotIcon,
  CameraIcon,
  CloudIcon,
  ExternalLinkIcon,
  ImageIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  Volume2Icon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemoryCard } from "@/components/settings/memory-card";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { useTier } from "@/hooks/use-tier";
import {
  resolveImagesUsage,
  resolveSpeechUsage,
  useSettings,
} from "@/hooks/use-settings";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { MAI_UPGRADE_URL } from "@/lib/constants";

function formatTokens(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) {
    return "0 Mo";
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) {
    return `${mb.toFixed(1)} Mo`;
  }
  return `${(mb / 1024).toFixed(2)} Go`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) {
    return "Prochainement";
  }
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "long",
      weekday: "long",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const m = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.split("=")[1]) : null;
}
function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as
      | "profile"
      | "usage"
      | "preferences"
      | "notifications") || "profile";
  const [activeTab, setActiveTab] = useState<
    "profile" | "usage" | "preferences" | "notifications"
  >(
    ["profile", "usage", "preferences", "notifications"].includes(initialTab)
      ? (initialTab as any)
      : "profile"
  );

  const handleTabChange = useCallback(
    (tab: "profile" | "usage" | "preferences" | "notifications") => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const t = searchParams.get("tab") as any;
    if (
      t &&
      ["profile", "usage", "preferences", "notifications"].includes(t) &&
      t !== activeTab
    ) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeTab]);

  // Scroll vers ancre usage si tab=usage
  useEffect(() => {
    if (activeTab === "usage") {
      const hash = typeof window === "undefined" ? "" : window.location.hash;
      const targetId = hash ? hash.replace("#", "") : "usage-mAI";
      const el =
        document.getElementById(targetId) ||
        document.getElementById("usage-mAI") ||
        document.getElementById("usage");
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          150
        );
      }
    }
  }, [activeTab]);

  // Données utilisateur — source unique partagée (hook use-settings) avec la
  // page Images et le bandeau de quota du chat : affichage toujours cohérent
  const {
    data: settingsData,
    isLoading,
    mutate: mutateSettings,
  } = useSettings({ revalidateOnFocus: true });

  const profile = settingsData?.user ?? null;
  const aiUsage = settingsData?.aiUsage ?? null;
  const cloudUsage = settingsData?.cloudUsage ?? null;

  // Synchronisation des champs du formulaire une seule fois au premier
  // chargement (les revalidations SWR ne doivent pas écraser la saisie)
  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (!initialSyncDone.current && settingsData?.user) {
      initialSyncDone.current = true;
      const u = settingsData.user;
      setUsername(u.username || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setNewsletter(Boolean(u.newsletter));
      setNotifyLimits(Boolean(u.notify_limits));
    }
  }, [settingsData]);

  // Formulaire profil
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [notifyLimits, setNotifyLimits] = useState(true);

  // États actions
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Modale vérification nouvel email
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Préférences IA (BDD + cookie)
  const [defaultModelId, setDefaultModelId] =
    useState<string>(DEFAULT_CHAT_MODEL);
  const [defaultChatVisibility, setDefaultChatVisibility] = useState<
    "private" | "public"
  >("private");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customTemp, setCustomTemp] = useState(0.7);
  const [customTopP, setCustomTopP] = useState(0.9);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Préférences Outils IA (Génération d'images et Synthèse vocale)
  const [defaultImageModel, setDefaultImageModel] = useState<string>(
    "black-forest-labs/flux-schnell"
  );
  const [defaultImageSize, setDefaultImageSize] = useState<string>("1024x1024");
  const [defaultAudioModel, setDefaultAudioModel] = useState<string>(
    "deepgram/flux-tts:free"
  );
  const [defaultAudioVoice, setDefaultAudioVoice] =
    useState<string>("flux-alexis-en");
  const [defaultAudioSpeed, setDefaultAudioSpeed] = useState<number>(1.0);
  const [isSavingToolsPref, setIsSavingToolsPref] = useState<boolean>(false);

  // Notifications prefs
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifAiResponse, setNotifAiResponse] = useState(true);
  const [notifProject, setNotifProject] = useState(true);
  const [notifMcp, setNotifMcp] = useState(true);
  const [notifMcpAccess, setNotifMcpAccess] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState<"truncate" | "fork">(
    "truncate"
  );
  const [browserPerm, setBrowserPerm] = useState<string>(
    typeof Notification === "undefined" ? "default" : Notification.permission
  );

  const { data: prefModelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000 }
  );
  const prefModels: ChatModel[] = prefModelsData?.models || [];

  const { data: customPrefData, mutate: mutateCustomPref } = useSWR(
    "/api/user/preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000 }
  );

  const { isFree } = useTier();
  const [defaultAgentId, setDefaultAgentId] = useState<string>("none");
  const [isSavingDefaultAgent, setIsSavingDefaultAgent] = useState(false);
  const [agentsUpgradeOpen, setAgentsUpgradeOpen] = useState(false);
  const { data: prefAgentsData } = useSWR(
    !isFree ? "/api/agents" : null,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000 }
  );
  const prefAgents: any[] = Array.isArray(prefAgentsData) ? prefAgentsData : [];

  const handleSaveDefaultAgent = useCallback(
    async (next: string) => {
      if (isFree) {
        return;
      }
      const previous = defaultAgentId;
      setDefaultAgentId(next);
      setIsSavingDefaultAgent(true);
      try {
        const res = await fetch("/api/user/preferences", {
          body: JSON.stringify({
            defaultAgentId: next === "none" ? null : next,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Erreur de sauvegarde de l'agent par défaut");
        }
        toast.success(
          next === "none"
            ? "Agent par défaut désactivé — modèle standard utilisé"
            : "Agent par défaut enregistré — appliqué aux nouvelles discussions"
        );
        await mutateCustomPref();
      } catch (e: any) {
        setDefaultAgentId(previous);
        toast.error(e.message || "Erreur de sauvegarde de l'agent par défaut");
      } finally {
        setIsSavingDefaultAgent(false);
      }
    },
    [defaultAgentId, isFree, mutateCustomPref]
  );

  useEffect(() => {
    if (customPrefData) {
      if (customPrefData.customInstructions !== undefined) {
        setCustomInstructions(customPrefData.customInstructions || "");
      }
      if (customPrefData.defaultChatVisibility === "public") {
        setDefaultChatVisibility("public");
      }
      if (customPrefData.defaultChatModel && !getCookie("chat-model")) {
        setDefaultModelId(customPrefData.defaultChatModel);
      }
      if (customPrefData.defaultAgentId !== undefined) {
        setDefaultAgentId(customPrefData.defaultAgentId || "none");
      }
      if (customPrefData.enabled !== undefined) {
        setCustomEnabled(!!customPrefData.enabled);
      }
      if (customPrefData.temperature !== undefined) {
        setCustomTemp(customPrefData.temperature);
      }
      if (customPrefData.topP !== undefined) {
        setCustomTopP(customPrefData.topP);
      }
      if (customPrefData.defaultImageModel) {
        setDefaultImageModel(customPrefData.defaultImageModel);
      }
      if (customPrefData.defaultImageSize) {
        setDefaultImageSize(customPrefData.defaultImageSize);
      }
      if (customPrefData.defaultAudioModel) {
        setDefaultAudioModel(customPrefData.defaultAudioModel);
      }
      if (customPrefData.defaultAudioVoice) {
        setDefaultAudioVoice(customPrefData.defaultAudioVoice);
      }
      if (customPrefData.defaultAudioSpeed) {
        setDefaultAudioSpeed(customPrefData.defaultAudioSpeed);
      }
    }
  }, [customPrefData]);

  // Notifications prefs fetch
  const { data: notifPrefsData, mutate: mutateNotifPrefs } = useSWR(
    "/api/notifications/preferences",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 10_000 }
  );

  useEffect(() => {
    if (notifPrefsData) {
      if (typeof notifPrefsData.enabled === "boolean") {
        setNotifEnabled(notifPrefsData.enabled);
      }
      if (typeof notifPrefsData.aiResponse === "boolean") {
        setNotifAiResponse(notifPrefsData.aiResponse);
      }
      if (typeof notifPrefsData.projectCreated === "boolean") {
        setNotifProject(notifPrefsData.projectCreated);
      }
      if (typeof notifPrefsData.mcpCreated === "boolean") {
        setNotifMcp(notifPrefsData.mcpCreated);
      }
      if (typeof notifPrefsData.mcpAccessRequest === "boolean") {
        setNotifMcpAccess(notifPrefsData.mcpAccessRequest);
      }
      if (typeof notifPrefsData.news === "boolean") {
        setNotifNews(notifPrefsData.news);
      }
      if (
        notifPrefsData.regenerateMode === "truncate" ||
        notifPrefsData.regenerateMode === "fork"
      ) {
        setRegenerateMode(notifPrefsData.regenerateMode);
      }
    }
  }, [notifPrefsData]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions?.query) {
      return;
    }
    let permStatus: PermissionStatus | null = null;
    const syncPerm = () => setBrowserPerm(Notification.permission);
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((p) => {
        permStatus = p;
        syncPerm();
        p.addEventListener("change", syncPerm);
      })
      .catch(() => {});
    const onFocus = () => {
      if ("Notification" in window) {
        setBrowserPerm(Notification.permission);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      permStatus?.removeEventListener("change", syncPerm);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleRequestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(
        "Les notifications ne sont pas supportées par ce navigateur."
      );
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
      if (perm === "granted") {
        toast.success("Permission accordée ! Vous recevrez les notifications.");
        // auto-enable
        if (!notifEnabled) {
          setNotifEnabled(true);
          // persist
          fetch("/api/notifications/preferences", {
            body: JSON.stringify({ enabled: true, news: true }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          })
            .then(() => mutateNotifPrefs())
            .catch(() => {});
        }
      } else if (perm === "denied") {
        toast.error(
          "Permission refusée. Activez-la dans les paramètres du navigateur."
        );
      }
    } catch {
      toast.error("Impossible de demander la permission.");
    }
  }, [notifEnabled, mutateNotifPrefs]);

  const handleSaveNotifPrefs = useCallback(async () => {
    setIsSavingNotif(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        body: JSON.stringify({
          aiResponse: notifAiResponse,
          enabled: notifEnabled,
          mcpAccessRequest: notifMcpAccess,
          mcpCreated: notifMcp,
          news: notifNews,
          projectCreated: notifProject,
          regenerateMode,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erreur sauvegarde");
      }
      toast.success("Préférences de notifications enregistrées !");
      mutateNotifPrefs();
      if (
        notifEnabled &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        handleRequestNotificationPermission();
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setIsSavingNotif(false);
    }
  }, [
    notifEnabled,
    notifAiResponse,
    notifProject,
    notifMcp,
    notifMcpAccess,
    notifNews,
    regenerateMode,
    mutateNotifPrefs,
    handleRequestNotificationPermission,
  ]);

  const handleSaveRegenerateMode = useCallback(async () => {
    try {
      await fetch("/api/notifications/preferences", {
        body: JSON.stringify({ regenerateMode }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      toast.success("Mode régénération enregistré !");
      mutateNotifPrefs();
    } catch {
      toast.error("Erreur sauvegarde mode régénération");
    }
  }, [regenerateMode, mutateNotifPrefs]);

  useEffect(() => {
    const cModel = getCookie("chat-model");
    if (cModel) {
      setDefaultModelId(cModel);
    }
  }, []);

  const handleSavePreferences = useCallback(async () => {
    setCookie("chat-model", defaultModelId);
    try {
      // Modèle par défaut et visibilité par défaut persistés en BDD
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultChatModel: defaultModelId,
          defaultChatVisibility,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement");
      }
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde des préférences IA.");
      return;
    }
    toast.success("Préférences IA enregistrées !");
  }, [defaultModelId, defaultChatVisibility, mutateCustomPref]);

  const handleSaveToolsPreferences = useCallback(async () => {
    setIsSavingToolsPref(true);
    try {
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          defaultAudioModel,
          defaultAudioSpeed,
          defaultAudioVoice,
          defaultImageModel,
          defaultImageSize,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement");
      }
      toast.success("Préférences d'outils Images & Audio enregistrées !");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde des préférences outils.");
    } finally {
      setIsSavingToolsPref(false);
    }
  }, [
    defaultImageModel,
    defaultImageSize,
    defaultAudioModel,
    defaultAudioVoice,
    defaultAudioSpeed,
    mutateCustomPref,
  ]);

  const handleSaveCustomInstructions = useCallback(async () => {
    setIsSavingCustom(true);
    try {
      const res = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          customInstructions: customInstructions.slice(0, 4000),
          enabled: customEnabled,
          temperature: customTemp,
          topP: customTopP,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur");
      }
      toast.success("Instructions personnalisées enregistrées !");
      mutateCustomPref();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSavingCustom(false);
    }
  }, [
    customInstructions,
    customEnabled,
    customTemp,
    customTopP,
    mutateCustomPref,
  ]);

  // Upload d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/settings", {
        body: formData,
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Erreur lors du téléversement de l'avatar.");
        return;
      }

      toast.success("Photo de profil mise à jour !");
      mutateSettings(
        (current) =>
          current?.user
            ? {
                ...current,
                user: { ...current.user, avatarUrl: data.avatarUrl },
              }
            : current,
        { revalidate: false }
      );
    } catch {
      toast.error("Impossible de mettre à jour l'avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Sauvegarde des modifications du profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSensitiveChange =
      email.trim() !== (profile?.email || "") ||
      phone.trim() !== (profile?.phone || "") ||
      username.trim() !== (profile?.username || "") ||
      (newPassword && newPassword.trim().length > 0);
    if (isSensitiveChange && !currentPassword) {
      toast.error(
        "Votre mot de passe actuel est requis pour modifier e-mail, téléphone, nom ou mot de passe."
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        currentPassword,
        email: email.trim(),
        newsletter,
        notify_limits: notifyLimits,
        phone: phone.trim() || undefined,
        username: username.trim(),
      };

      if (newPassword?.trim()) {
        if (newPassword.length < 6) {
          toast.error(
            "Le nouveau mot de passe doit comporter au moins 6 caractères."
          );
          setIsSaving(false);
          return;
        }
        payload.password = newPassword;
      }

      const res = await fetch("/api/settings", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Erreur lors de la mise à jour du profil.");
        return;
      }

      // Si changement d'email nécessitant validation OTP
      if (data.status === "email_verification_required") {
        setPendingEmail(data.email || email.trim());
        setShowEmailOtpModal(true);
        toast.info(
          "Un code a été envoyé à votre nouvelle adresse e-mail pour validation !"
        );
        return;
      }

      toast.success("Profil mis à jour avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      mutateSettings();
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  // Validation du code OTP pour le nouvel e-mail
  const handleVerifyNewEmail = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length < 4) {
      toast.error("Veuillez saisir le code de vérification.");
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await fetch("/api/settings", {
        body: JSON.stringify({
          action: "verify_new_email",
          code: emailOtpCode.trim(),
          email: pendingEmail,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Code invalide ou expiré.");
        return;
      }

      toast.success("Votre nouvelle adresse e-mail est confirmée !");
      setShowEmailOtpModal(false);
      setEmailOtpCode("");
      mutateSettings();
    } catch {
      toast.error("Impossible de confirmer l'adresse e-mail.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const aiPercent = aiUsage?.limit
    ? Math.min(
        100,
        Math.round(((aiUsage.tokensUsed || 0) / aiUsage.limit) * 100)
      )
    : 0;

  // Même résolution que la page Images : valeurs identiques garanties
  const resolvedImagesUsage = resolveImagesUsage(settingsData);
  const imagesPercent = resolvedImagesUsage.dailyLimit
    ? Math.min(
        100,
        Math.round(
          ((resolvedImagesUsage.usedToday || 0) /
            resolvedImagesUsage.dailyLimit) *
            100
        )
      )
    : 0;

  const resolvedSpeechUsage = resolveSpeechUsage(settingsData);
  const speechPercent = resolvedSpeechUsage.limit
    ? Math.min(
        100,
        Math.round(
          ((resolvedSpeechUsage.tokensUsed || 0) / resolvedSpeechUsage.limit) *
            100
        )
      )
    : 0;

  const cloudPercent = cloudUsage?.bytesLimit
    ? Math.min(
        100,
        Math.round(((cloudUsage.bytesUsed || 0) / cloudUsage.bytesLimit) * 100)
      )
    : 0;

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* En-tête de la page */}
      <div className="pb-6 border-b border-border/50">
        <div className="flex items-start gap-3">
          <PageBackButton />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              <SettingsIcon className="size-4" />
              mAI Account & Preferences
            </div>
            <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
              Paramètres du compte
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Gérez votre profil, vos informations personnelles et visualisez
              votre consommation IA.
            </p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex items-center gap-2 mt-6 flex-wrap">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => handleTabChange("profile")}
          >
            <UserIcon className="size-4" />
            <span>Mon Profil</span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => handleTabChange("preferences")}
          >
            <SparklesIcon className="size-4" />
            <span>Préférences IA</span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "usage"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => handleTabChange("usage")}
          >
            <ZapIcon className="size-4" />
            <span>Consommation & Forfait</span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => handleTabChange("notifications")}
          >
            <BellIcon className="size-4" />
            <span>Notifications</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2Icon className="size-6 animate-spin text-primary" />
          <span className="text-sm">Chargement de vos informations...</span>
        </div>
      ) : activeTab === "profile" ? (
        /* ────────────── SECTION PROFIL ────────────── */
        <div className="py-6 flex flex-col gap-8 max-w-2xl">
          {/* Avatar */}
          <div className="flex items-center gap-5 p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md">
            <div className="relative group">
              <div className="size-20 rounded-full ring-2 ring-border/80 overflow-hidden bg-muted flex items-center justify-center shadow-md">
                {profile?.avatarUrl ? (
                  <Image
                    alt={username}
                    className="size-full object-cover"
                    height={80}
                    src={profile.avatarUrl}
                    unoptimized
                    width={80}
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Changer la photo"
                type="button"
              >
                {isUploadingAvatar ? (
                  <Loader2Icon className="size-6 animate-spin" />
                ) : (
                  <CameraIcon className="size-6" />
                )}
              </button>

              <input
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                ref={fileInputRef}
                type="file"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-base">
                  {username}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  {profile?.tier || "Free"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
              <button
                className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <CameraIcon className="size-3.5" />
                Changer la photo de profil
              </button>
            </div>
          </div>

          {/* Formulaire des informations personnelles */}
          <form className="flex flex-col gap-5" onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="settings-username"
                >
                  Nom d'utilisateur
                </Label>
                <Input
                  className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  id="settings-username"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  value={username}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="settings-email"
                >
                  Adresse e-mail
                </Label>
                <Input
                  className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                  id="settings-email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="settings-phone"
              >
                Numéro de téléphone (optionnel)
              </Label>
              <Input
                className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                id="settings-phone"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                type="tel"
                value={phone}
              />
            </div>

            {/* Changement de mot de passe */}
            <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-primary" />
                Sécurité & Mot de passe
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="settings-current-password"
                  >
                    Mot de passe actuel{" "}
                    <strong className="text-red-500">*</strong>
                  </Label>
                  <Input
                    className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                    id="settings-current-password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Obligatoire pour valider"
                    required
                    type="password"
                    value={currentPassword}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="settings-new-password"
                  >
                    Nouveau mot de passe (optionnel)
                  </Label>
                  <Input
                    className="h-10 rounded-xl border-border/60 bg-muted/30 text-sm"
                    id="settings-new-password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Laisser vide si inchangé"
                    type="password"
                    value={newPassword}
                  />
                </div>
              </div>
            </div>

            {/* Préférences */}
            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
              <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
                <input
                  checked={newsletter}
                  className="rounded border-border size-4 accent-primary"
                  onChange={(e) => setNewsletter(e.target.checked)}
                  type="checkbox"
                />
                <span>Recevoir les actualités et annonces mAI par e-mail</span>
              </label>

              <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
                <input
                  checked={notifyLimits}
                  className="rounded border-border size-4 accent-primary"
                  onChange={(e) => setNotifyLimits(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  M'alerter par e-mail lorsque j'atteins 90% de mes limites de
                  tokens ou stockage
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === "preferences" ? (
        /* ────────────── SECTION PRÉFÉRENCES IA ────────────── */
        <div className="py-6 flex flex-col gap-6 max-w-3xl">
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <SparklesIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Préférences IA
                </h3>
                <p className="text-xs text-muted-foreground">
                  Modèle par défaut (enregistré dans votre compte) et Agents —
                  styles IA personnalisés remplaçant les Modes.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Modèle par défaut
              </Label>
              <ModelSelectorCompact
                capabilities={prefModelsData?.capabilities}
                models={prefModels.length > 0 ? prefModels : undefined}
                onModelChange={setDefaultModelId}
                selectedModelId={defaultModelId}
                variant="block"
              />
              <span className="text-[11px] text-muted-foreground">
                Ce modèle sera pré-sélectionné pour chaque nouvelle
                conversation. Vous pouvez le changer à la volée dans la barre de
                saisie.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Visibilité par défaut des conversations
              </Label>
              <select
                className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                onChange={(e) =>
                  setDefaultChatVisibility(
                    e.target.value === "public" ? "public" : "private"
                  )
                }
                value={defaultChatVisibility}
              >
                <option value="private">Privée (recommandé)</option>
                <option value="public">Publique</option>
              </select>
              <span className="text-[11px] text-muted-foreground">
                Visibilité appliquée aux nouvelles conversations. Vous pourrez
                toujours la modifier par conversation.
              </span>
            </div>

            <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <BotIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Agents IA
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  Nouveau
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Les <strong>Agents</strong> remplacent les Modes IA. Crée
                jusqu'à 10 agents personnalisés (instructions 5000c,
                emoji/icône, modèle par défaut, skills, MCP et fichiers).
                Sélection globale via le menu à côté du modèle ou{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-[10px]">
                  @
                </code>{" "}
                /{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-[10px]">
                  /agents
                </code>
                .
              </p>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-fit"
                href="/agents"
              >
                <BotIcon className="size-3.5" /> Gérer mes agents →
              </Link>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
                onClick={handleSavePreferences}
                type="button"
              >
                Enregistrer les préférences
              </button>
            </div>
          </div>

          {/* Instructions personnalisées */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                <BotIcon className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  Instructions personnalisées
                </h3>
                <p className="text-xs text-muted-foreground">
                  Personnalisez le comportement de mAI — ton, langue, contexte
                  métier. Synchronisé sur tous vos appareils.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  checked={customEnabled}
                  className="size-4 rounded border-border accent-primary"
                  onChange={(e) => setCustomEnabled(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-xs font-medium">Activé</span>
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Qui êtes-vous ? Que doit savoir mAI sur vous ? (max 4000c)
              </Label>
              <textarea
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                maxLength={4000}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Je suis développeur full-stack à Paris. Réponds toujours en français, tutoie, sois concis, privilégie TypeScript avec exemples exécutables. Mon projet principal est mAI Web..."
                rows={5}
                value={customInstructions}
              />
              <span className="text-[11px] text-muted-foreground text-right">
                {customInstructions.length}/4000
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Température ({customTemp})
                </Label>
                <input
                  className="w-full accent-primary"
                  max={2}
                  min={0}
                  onChange={(e) =>
                    setCustomTemp(Number.parseFloat(e.target.value))
                  }
                  step={0.1}
                  type="range"
                  value={customTemp}
                />
                <span className="text-[11px] text-muted-foreground">
                  0 = Précis, 2 = Créatif
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Top P ({customTopP})
                </Label>
                <input
                  className="w-full accent-primary"
                  max={1}
                  min={0}
                  onChange={(e) =>
                    setCustomTopP(Number.parseFloat(e.target.value))
                  }
                  step={0.05}
                  type="range"
                  value={customTopP}
                />
                <span className="text-[11px] text-muted-foreground">
                  Contrôle diversité
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                disabled={isSavingCustom}
                onClick={handleSaveCustomInstructions}
                type="button"
              >
                {isSavingCustom ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                {isSavingCustom
                  ? "Enregistrement..."
                  : "Enregistrer instructions"}
              </button>
            </div>
          </div>

          {/* Agent par défaut */}
          <div
            className={`p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6 ${isFree ? "cursor-pointer" : ""}`}
            onClick={
              isFree
                ? () => {
                    toast.error(
                      "Sélection d'agents réservée aux forfaits Plus, Pro et Max"
                    );
                    setAgentsUpgradeOpen(true);
                  }
                : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                <BotIcon className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  Agent par défaut
                </h3>
                <p className="text-xs text-muted-foreground">
                  Agent activé automatiquement au lancement de chaque nouvelle
                  discussion.
                </p>
              </div>
              {isSavingDefaultAgent && (
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {isFree ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400">
                <LockIcon className="size-4 shrink-0" />
                <span>
                  Réservé aux forfaits Plus, Pro et Max — passez à un forfait
                  supérieur pour choisir un agent par défaut.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Agent activé au lancement d'une nouvelle conversation
                </Label>
                <select
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  disabled={isSavingDefaultAgent}
                  onChange={(e) => handleSaveDefaultAgent(e.target.value)}
                  value={defaultAgentId}
                >
                  <option value="none">Aucun (modèle standard)</option>
                  {prefAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.emoji ? `${a.emoji} ` : ""}
                      {a.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">
                  S'applique au prochain chargement du chat. Modifiable à tout
                  moment via la mention @agent.
                </span>
              </div>
            )}
          </div>
          <UpgradeDialog
            feature="agents"
            onOpenChange={setAgentsUpgradeOpen}
            open={agentsUpgradeOpen}
          />

          {/* Mémoire personnalisée */}
          <MemoryCard />

          {/* Préférences Outils de Génération (Images & Audio) */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Outil Génération d'Images
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configurez le modèle Black Forest / FLUX et la résolution par
                  défaut utilisés par l'outil de génération d'images.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Modèle d'image par défaut
                </Label>
                <select
                  className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => setDefaultImageModel(e.target.value)}
                  value={defaultImageModel}
                >
                  <option value="black-forest-labs/flux-schnell">
                    Black Forest FLUX.1 Schnell (Rapide & Précis)
                  </option>
                  <option value="black-forest-labs/flux-dev">
                    Black Forest FLUX.1 Dev (Haute Qualité)
                  </option>
                  <option value="black-forest-labs/flux-pro">
                    Black Forest FLUX 1.1 Pro (Ultra Réaliste)
                  </option>
                  <option value="dall-e-3">DALL-E 3 (OpenAI)</option>
                  <option value="stable-diffusion-3.5-large">
                    Stable Diffusion 3.5 Large
                  </option>
                  <option value="midjourney/v6">Midjourney v6</option>
                  <option value="recraft-v3">Recraft V3</option>
                  <option value="ideogram-v2">Ideogram V2</option>
                </select>
                <span className="text-[11px] text-muted-foreground">
                  Modèle activé automatiquement quand vous demandez à l'IA
                  d'illustrer ou créer une image.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Format et taille par défaut
                </Label>
                <select
                  className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => setDefaultImageSize(e.target.value)}
                  value={defaultImageSize}
                >
                  <option value="1024x1024">1024x1024 (1:1 Carré)</option>
                  <option value="1344x768">
                    1344x768 (16:9 Paysage / Bureau)
                  </option>
                  <option value="768x1344">
                    768x1344 (9:16 Mobile / Story)
                  </option>
                  <option value="1152x864">1152x864 (4:3 Standard)</option>
                  <option value="864x1152">864x1152 (3:4 Portrait)</option>
                </select>
                <span className="text-[11px] text-muted-foreground">
                  Ratio d'aspect et dimensions par défaut générés.
                </span>
              </div>
            </div>
          </div>

          {/* Préférences Outil Audio & Synthèse Vocale */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <Volume2Icon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Outil Synthèse Vocale & Audio
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configurez le modèle vocal, la voix par défaut et le rythme de
                  lecture audio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Modèle audio par défaut
                </Label>
                <select
                  className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => setDefaultAudioModel(e.target.value)}
                  value={defaultAudioModel}
                >
                  <option value="deepgram/flux-tts:free">
                    Deepgram Flux TTS (Ultra-rapide & Naturel)
                  </option>
                  <option value="tts-1">OpenAI TTS Standard</option>
                  <option value="tts-1-hd">
                    OpenAI TTS HD (Haute Définition)
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Voix par défaut
                </Label>
                <select
                  className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => setDefaultAudioVoice(e.target.value)}
                  value={defaultAudioVoice}
                >
                  <option value="flux-alexis-en">
                    Alexis (Féminin - Naturel & Équilibré)
                  </option>
                  <option value="flux-michael-en">
                    Michael (Masculin - Posé & Professionnel)
                  </option>
                  <option value="flux-stacy-en">
                    Stacy (Féminin - Dynamique & Vivant)
                  </option>
                  <option value="alloy">Alloy (Neutre - Polyvalent)</option>
                  <option value="echo">Echo (Masculin - Rond)</option>
                  <option value="nova">Nova (Féminin - Énergique)</option>
                  <option value="shimmer">Shimmer (Féminin - Doux)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Vitesse de lecture ({defaultAudioSpeed.toFixed(2)}x)
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {defaultAudioSpeed === 1.0
                    ? "Normal"
                    : defaultAudioSpeed < 1.0
                      ? "Plus lent"
                      : "Plus rapide"}
                </span>
              </div>
              <input
                className="w-full accent-emerald-500"
                max={2.0}
                min={0.5}
                onChange={(e) =>
                  setDefaultAudioSpeed(Number.parseFloat(e.target.value))
                }
                step={0.05}
                type="range"
                value={defaultAudioSpeed}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                disabled={isSavingToolsPref}
                onClick={handleSaveToolsPreferences}
                type="button"
              >
                {isSavingToolsPref ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                {isSavingToolsPref
                  ? "Enregistrement..."
                  : "Enregistrer les outils dans votre profil"}
              </button>
            </div>
          </div>

          {/* Mode régénération */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                <SettingsIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Mode régénération des messages
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choisissez le comportement du bouton « Régénérer » sur les
                  messages de l'assistant.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                  regenerateMode === "truncate"
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                }`}
                onClick={() => setRegenerateMode("truncate")}
                type="button"
              >
                <span className="text-sm font-semibold text-foreground">
                  Tronquer
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  Supprime les messages suivants et régénère à partir du message
                  ciblé (historique réécrit).
                </span>
              </button>
              <button
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                  regenerateMode === "fork"
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                }`}
                onClick={() => setRegenerateMode("fork")}
                type="button"
              >
                <span className="text-sm font-semibold text-foreground">
                  Fork (Brancher)
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  Crée une nouvelle conversation branchée, l'historique original
                  reste intact.
                </span>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 cursor-pointer"
                onClick={handleSaveRegenerateMode}
                type="button"
              >
                Enregistrer le mode
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === "notifications" ? (
        /* ────────────── SECTION NOTIFICATIONS ────────────── */
        <div className="py-6 flex flex-col gap-6 max-w-3xl">
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <BellIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Notifications
                </h3>
                <p className="text-xs text-muted-foreground">
                  Gérez l'envoi et la personnalisation de vos notifications.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full border font-medium ${
                    notifEnabled
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border/50"
                  }`}
                >
                  {notifEnabled ? "Activées" : "Désactivées"}
                </span>
              </div>
            </div>

            {/* Demande permission */}
            {browserPerm === "granted" ? (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Permission accordée
                </span>
                <button
                  aria-label="Redemander l'autorisation"
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                  onClick={handleRequestNotificationPermission}
                  title="Redemander l'autorisation"
                  type="button"
                >
                  <RefreshCwIcon className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Permission du navigateur
                    </span>
                    <span className="text-xs text-muted-foreground">
                      État actuel :{" "}
                      <span className="font-mono font-semibold">
                        {browserPerm}
                      </span>{" "}
                      — requise pour les notifications système.
                    </span>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-white px-4 py-2 text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0"
                    onClick={handleRequestNotificationPermission}
                    type="button"
                  >
                    <BellIcon className="size-3.5" />
                    Demander l'autorisation
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  En activant, vous acceptez de recevoir des notifications
                  navigateur et in-app. Consultez{" "}
                  <a
                    className="underline text-primary"
                    href="https://mai-devs.vercel.app"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    mai-devs.vercel.app
                  </a>{" "}
                  pour la politique RGPD.
                </p>
              </div>
            )}

            {/* Toggle global */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  Activer les notifications
                </span>
                <span className="text-xs text-muted-foreground">
                  Maître — désactive tout si off. À l'activation, « Actualités
                  d'mAI » est activé par défaut.
                </span>
              </div>
              <input
                checked={notifEnabled}
                className="size-5 accent-primary"
                onChange={(e) => {
                  const v = e.target.checked;
                  setNotifEnabled(v);
                  if (v) {
                    setNotifNews(true);
                  }
                }}
                type="checkbox"
              />
            </label>

            {/* Granulaires */}
            <div
              className={`flex flex-col gap-3 pt-3 border-t border-border/40 ${
                notifEnabled ? "" : "opacity-50 pointer-events-none"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personnalisation
              </p>
              {[
                {
                  desc: "À chaque réponse de l'IA dans vos conversations",
                  key: "ai",
                  label: "Réponse de l'IA",
                  setter: setNotifAiResponse,
                  value: notifAiResponse,
                },
                {
                  desc: "Lors de la création d'un nouveau dossier/projet",
                  key: "project",
                  label: "Nouveau projet",
                  setter: setNotifProject,
                  value: notifProject,
                },
                {
                  desc: "Lors de l'ajout d'un nouveau serveur MCP",
                  key: "mcp",
                  label: "Nouveau MCP",
                  setter: setNotifMcp,
                  value: notifMcp,
                },
                {
                  desc: "Lors d'une demande d'accès / exécution d'outil MCP (write/execute)",
                  key: "mcpAccess",
                  label: "Demande d'accès MCP",
                  setter: setNotifMcpAccess,
                  value: notifMcpAccess,
                },
                {
                  desc: "Actualités et annonces mAI (via admin, activé par défaut si notifications on)",
                  key: "news",
                  label: "Actualités d'mAI",
                  setter: setNotifNews,
                  value: notifNews,
                },
              ].map((item) => (
                <label
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/30 cursor-pointer"
                  key={item.key}
                >
                  <div className="flex flex-col pr-3">
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                  <input
                    checked={item.value}
                    className="size-4 accent-primary"
                    onChange={(e) => (item.setter as any)(e.target.checked)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                disabled={isSavingNotif}
                onClick={handleSaveNotifPrefs}
                type="button"
              >
                {isSavingNotif ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                {isSavingNotif
                  ? "Enregistrement..."
                  : "Enregistrer les notifications"}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                RGPD & Données
              </p>
              <p>
                Vos préférences et notifications sont sécurisées dans votre
                profil et synchronisées sur vos appareils. Les notifications
                Actualités sont envoyées uniquement aux utilisateurs ayant
                activé l'option. Plus d'infos sur{" "}
                <a
                  className="text-primary underline"
                  href="https://mai-devs.vercel.app"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  mai-devs.vercel.app
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ────────────── SECTION CONSOMMATION & QUOTAS ────────────── */
        <div
          className="py-6 flex flex-col gap-6 max-w-3xl scroll-mt-6"
          id="usage-mAI"
        >
          {/* Forfait actuel */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 sm:p-6">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Forfait Actuel
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-bold text-foreground">
                  mAI {profile?.tier || "Free"}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  Actif
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.tier === "Free"
                  ? `Accès gratuit avec ${formatTokens(aiUsage?.limit || 2_000_000)} tokens hebdomadaires et ${formatBytes(cloudUsage?.bytesLimit || 524_288_000)} de stockage cloud.`
                  : "Forfait premium débloqué avec quotas étendus et modèles avancés."}
              </p>
            </div>

            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md shrink-0"
              href={MAI_UPGRADE_URL}
              target="_blank"
            >
              <SparklesIcon className="size-4" />
              <span>Gérer / Mettre à niveau</span>
              <ExternalLinkIcon className="size-3.5" />
            </Link>
          </div>

          {/* Consommation mAI (Tokens hebdomadaires) */}
          <div
            className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6"
            id="usage"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <BotIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Utilisation de l'IA
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Consommation calculée sur vos invites et réponses générées
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {formatTokens(aiUsage?.tokensUsed || 0)} /{" "}
                  {formatTokens(aiUsage?.limit || 2_000_000)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  tokens ({aiPercent}%)
                </span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  aiPercent > 90
                    ? "bg-red-500"
                    : aiPercent > 75
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600"
                }`}
                style={{ width: `${aiPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Renouvellement hebdomadaire :</span>
              <span className="font-medium text-foreground">
                {formatDate(aiUsage?.resetAt)}
              </span>
            </div>
          </div>

          {/* Consommation Images (Quota journalier) */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20 shrink-0">
                  <ImageIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    Générations d'Images
                  </h3>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Images générées aujourd'hui (quota réinitialisé à minuit
                    UTC)
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-foreground">
                  {resolvedImagesUsage.usedToday} /{" "}
                  {resolvedImagesUsage.dailyLimit}
                </span>
                <span className="text-xs text-muted-foreground block">
                  images ({imagesPercent}%)
                </span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  imagesPercent >= 100
                    ? "bg-red-500"
                    : imagesPercent > 75
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-purple-500 to-pink-600"
                }`}
                style={{ width: `${imagesPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Réinitialisation du quota :</span>
              <span className="font-medium text-foreground">
                {formatDate(resolvedImagesUsage.resetAt)} (Minuit UTC)
              </span>
            </div>
          </div>

          {/* Consommation Synthèse Vocale (Tokens Speech) */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 shrink-0">
                  <Volume2Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    Synthèse Vocale
                  </h3>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Tokens consommés pour l'API Speech et Text-to-Speech
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-foreground">
                  {formatTokens(resolvedSpeechUsage.tokensUsed)} /{" "}
                  {formatTokens(resolvedSpeechUsage.limit)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  tokens ({speechPercent}%)
                </span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  speechPercent >= 100
                    ? "bg-red-500"
                    : speechPercent > 75
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600"
                }`}
                style={{ width: `${speechPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Renouvellement hebdomadaire :</span>
              <span className="font-medium text-foreground">
                {formatDate(resolvedSpeechUsage.resetAt || aiUsage?.resetAt)}
              </span>
            </div>
          </div>

          {/* Consommation Cloud Storage */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                  <CloudIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Stockage Cloud mAI
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Espace utilisé pour vos documents, pièces jointes et médias
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  {formatBytes(cloudUsage?.bytesUsed || 0)} /{" "}
                  {formatBytes(cloudUsage?.bytesLimit || 524_288_000)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  utilisés ({cloudPercent}%)
                </span>
              </div>
            </div>

            {/* Jauge */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  cloudPercent > 90
                    ? "bg-red-500"
                    : cloudPercent > 75
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-blue-500 to-cyan-600"
                }`}
                style={{ width: `${cloudPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Fichiers hébergés :</span>
              <span className="font-medium text-foreground">
                {cloudUsage?.filesCount || 0} fichier(s)
              </span>
            </div>
          </div>

          {/* Encadré d'information pour la mise à niveau */}
          <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                Besoin de plus de tokens ou d'espace de stockage ?
              </p>
              <p>
                Les mises à niveau de forfait (Plus, Pro, Max) et l'activation
                des codes promotionnels s'effectuent directement sur le portail
                officiel{" "}
                <Link
                  className="text-primary font-medium underline inline-flex items-center gap-0.5"
                  href={MAI_UPGRADE_URL}
                  target="_blank"
                >
                  mai-devs.vercel.app
                  <ExternalLinkIcon className="size-3" />
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modale de validation OTP du nouvel e-mail */}
      <AlertDialog onOpenChange={setShowEmailOtpModal} open={showEmailOtpModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <ShieldCheckIcon className="size-4" />
              Changement d'adresse e-mail
            </div>
            <AlertDialogTitle>
              Confirmez votre nouvelle adresse
            </AlertDialogTitle>
            <AlertDialogDescription>
              Un code de confirmation a été envoyé à{" "}
              <strong>{pendingEmail}</strong>. Veuillez le saisir pour finaliser
              la mise à jour de votre profil.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3">
            <Input
              autoFocus
              className="h-11 text-center text-lg font-mono tracking-widest font-bold"
              maxLength={8}
              onChange={(e) => setEmailOtpCode(e.target.value)}
              placeholder="123456"
              type="text"
              value={emailOtpCode}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVerifyingEmail}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground"
              disabled={isVerifyingEmail}
              onClick={handleVerifyNewEmail}
            >
              {isVerifyingEmail
                ? "Vérification..."
                : "Confirmer le nouvel e-mail"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
